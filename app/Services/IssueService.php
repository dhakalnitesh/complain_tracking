<?php

namespace App\Services;

use App\Events\IssueCreated;
use App\Models\Category;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\SpamLog;
use App\Services\AbuseDetectionService;
use App\Services\DuplicateDetectionService;
use App\Services\IpAnonymizer;
use App\Services\MergeService;
use App\Services\NotificationService;
use App\Services\RoutingService;
use App\Services\TrustService;
use App\Services\TurnstileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class IssueService
{
    public function __construct(
        private TurnstileService $turnstileService,
        private TrustService $trustService,
        private MergeService $mergeService,
        private NotificationService $notificationService,
        private RoutingService $routingService,
    ) {}

    public function createIssue(Request $request): array
    {
        if ($request->filled('website')) {
            SpamLog::create([
                'event_type' => 'honeypot_trigger',
                'uuid' => $request->cookie('_auid'),
                'ip_hash' => IpAnonymizer::hash($request->ip()),
                'metadata' => ['user_agent' => $request->userAgent()],
            ]);

            $this->trustService->adjustScore(null, $request->cookie('_auid'), -0.3);

            return ['honeypot' => true];
        }

        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'category_id' => 'required|exists:categories,id',
            'priority' => 'required|in:low,medium,high,critical',
            'title' => 'required|string|max:200',
            'location_id' => [
                'required',
                Rule::exists('locations', 'id')->where(function ($q) use ($request) {
                    $q->where('organization_id', $request->organization_id);
                }),
            ],
            'description' => 'required|string|min:10|max:5000',
            'reporter_name' => 'nullable|string|max:255',
            'reporter_phone' => ['nullable', 'string', 'max:20', 'regex:/^9[876]\d{8}$/'],
            'reporter_email' => 'nullable|email|max:255',
            'is_anonymous' => 'boolean',
            'sms_opt_in' => 'boolean',
            'photo' => 'nullable|image|max:5120',
            'video' => 'nullable|mimes:mp4,webm,ogg,avi,mov|max:51200',
        ]);

        if ($this->turnstileService->shouldShowCaptcha($request)) {
            $request->validate([
                'cf-turnstile-response' => 'required|string',
            ]);
            if (!$this->turnstileService->verify($request->input('cf-turnstile-response'))) {
                return ['captcha_error' => true];
            }
        }

        $category = Category::findOrFail($validated['category_id']);

        $spamResult = AbuseDetectionService::check(
            description: $validated['description'],
            phone: $validated['reporter_phone'] ?? null,
            ipHash: IpAnonymizer::hash($request->ip()),
            uuid: $request->cookie('_auid'),
        );

        $duplicates = DuplicateDetectionService::findDuplicates(
            $validated['description'],
            $validated['organization_id']
        );

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('issue-photos', 'public');
        }

        $videoPath = null;
        if ($request->hasFile('video')) {
            $videoPath = $request->file('video')->store('issue-videos', 'public');
        }

        $userPriority = $validated['priority'];

        $issue = DB::transaction(function () use ($validated, $category, $photoPath, $videoPath, $request, $spamResult, $userPriority) {
            $issue = Issue::create([
                'organization_id' => $validated['organization_id'],
                'category' => $category->name,
                'category_id' => $category->id,
                'priority' => $userPriority,
                'user_priority' => $userPriority,
                'location_id' => $validated['location_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'reporter_name' => $validated['reporter_name'] ?? null,
                'reporter_phone' => $validated['reporter_phone'] ?? null,
                'reporter_email' => $validated['reporter_email'] ?? null,
                'reporter_ip' => $request->ip(),
                'reporter_ip_hash' => IpAnonymizer::hash($request->ip()),
                'anonymous_uuid' => $request->cookie('_auid'),
                'is_anonymous' => $request->boolean('is_anonymous', true),
                'sms_opt_in' => $request->boolean('sms_opt_in', false),
                'spam_score' => $spamResult['spam_score'],
                'hidden_at' => $spamResult['is_spam'] ? now() : null,
                'moderation_status' => $spamResult['is_spam'] ? 'pending' : 'approved',
                'photo_path' => $photoPath,
                'video_path' => $videoPath,
            ]);

            if ($spamResult['is_spam']) {
                $this->turnstileService->incrementSuspicion($request, 0.3);
                SpamLog::create([
                    'event_type' => 'spam_detected',
                    'loggable_type' => Issue::class,
                    'loggable_id' => $issue->id,
                    'uuid' => $request->cookie('_auid'),
                    'ip_hash' => IpAnonymizer::hash($request->ip()),
                    'spam_score' => $spamResult['spam_score'],
                    'metadata' => ['reasons' => $spamResult['reasons']],
                ]);
            }

            if ($photoPath) {
                $issue->media()->create(['path' => $photoPath, 'type' => 'photo']);
            }
            if ($videoPath) {
                $issue->media()->create(['path' => $videoPath, 'type' => 'video']);
            }

            $referenceCode = Issue::generateReferenceCode($validated['organization_id']);
            $issue->update(['reference_code' => $referenceCode]);

            IssueEvent::create([
                'issue_id' => $issue->id,
                'type' => 'created',
                'description' => 'Issue submitted successfully.',
                'metadata' => [
                    'priority' => $validated['priority'],
                    'category' => $category->name,
                    'is_anonymous' => $issue->is_anonymous,
                ],
                'is_public' => true,
            ]);

            if ($spamResult['is_spam']) {
                $this->trustService->adjustScore(auth()->user(), $request->cookie('_auid'), -0.2);
            } else {
                $this->trustService->adjustScore(auth()->user(), $request->cookie('_auid'), 0.05);
            }

            $effectivePriority = $this->trustService->getEffectivePriority($issue);
            if ($effectivePriority !== $issue->priority) {
                $issue->update(['priority' => $effectivePriority]);
            }

            return $issue;
        });

        $bestDuplicate = !empty($duplicates) ? $duplicates[0] : null;
        if ($bestDuplicate && $bestDuplicate['similarity'] > 0.5) {
            $parentIssue = Issue::find($bestDuplicate['id']);
            if ($parentIssue && $parentIssue->status !== 'merged') {
                $this->mergeService->autoMerge($issue, $parentIssue);

                if (config('broadcasting.default') !== 'log') {
                    broadcast(new IssueCreated($issue));
                }

                return [
                    'merged' => true,
                    'merged_into' => $parentIssue,
                    'issue' => $issue,
                ];
            }
        }

        if (config('broadcasting.default') !== 'log') {
            broadcast(new IssueCreated($issue));
        }

        if ($issue->reporter_email || ($issue->sms_opt_in && $issue->reporter_phone)) {
            $this->notificationService->sendIssueCreated($issue, $issue->events()->latest()->first());
        }

        $this->routingService->autoRoute($issue);

        return [
            'issue' => $issue,
            'duplicates' => $duplicates,
            'merged' => false,
        ];
    }
}
