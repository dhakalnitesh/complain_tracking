<?php

namespace App\Http\Controllers;

use App\Events\IssueCreated;
use App\Models\Category;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\Organization;
use App\Services\BsDateService;
use App\Services\DuplicateDetectionService;
use App\Services\NotificationService;
use App\Services\RoutingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function create(Request $request)
    {
        $organization = null;
        if ($request->org) {
            $organization = Organization::where('slug', $request->org)->where('is_active', true)->first();
        }

        $locations = Location::orderBy('name')->get(['id', 'name', 'parent_id', 'organization_id']);
        $organizations = Organization::where('is_active', true)->orderBy('name')->get();
        $categories = Category::active()->sorted()->get(['id', 'name']);

        return Inertia::render('Public/Submit', [
            'locations' => $locations,
            'organizations' => $organizations,
            'selected_organization' => $organization,
            'categories' => $categories,
            'priorities' => [
                'low' => 'Low',
                'medium' => 'Medium',
                'high' => 'High',
                'critical' => 'Critical',
            ],
        ]);
    }

    public function store(Request $request)
    {
        if ($request->filled('website')) {
            return redirect()->route('dashboard');
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

        $category = Category::findOrFail($validated['category_id']);

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

        $issue = Issue::create([
            'organization_id' => $validated['organization_id'],
            'category' => $category->name,
            'category_id' => $category->id,
            'priority' => $validated['priority'],
            'location_id' => $validated['location_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'reporter_name' => $validated['reporter_name'] ?? null,
            'reporter_phone' => $validated['reporter_phone'] ?? null,
            'reporter_email' => $validated['reporter_email'] ?? null,
            'reporter_ip' => $request->ip(),
            'is_anonymous' => $request->boolean('is_anonymous', true),
            'sms_opt_in' => $request->boolean('sms_opt_in', false),
            'photo_path' => $photoPath,
            'video_path' => $videoPath,
        ]);

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

        if (config('broadcasting.default') !== 'log') {
            broadcast(new IssueCreated($issue));
        }

        if ($issue->reporter_email) {
            app(NotificationService::class)->sendIssueCreated($issue, $issue->events()->latest()->first());
        }

        RoutingService::autoRoute($issue);

        $redirect = redirect()->route('issues.show-reference', [
            'reference_code' => $issue->reference_code,
        ]);

        if (!empty($duplicates)) {
            $redirect->with('warning', 'Similar issues found: ' . collect($duplicates)->pluck('reference_code')->implode(', '));
            $redirect->with('duplicates', $duplicates);
        }

        return $redirect;
    }

    public function showReference($referenceCode)
    {
        $issue = Issue::where('reference_code', $referenceCode)
            ->with([
                'location', 'organization', 'category',
                'events' => fn($q) => $q->public()->latest()->limit(10),
                'comments' => fn($q) => $q->approved()->public()->root()->latest()->with(['user', 'replies.user']),
            ])
            ->first();

        if (!$issue) {
            return redirect()->route('status.check')->with('error', 'No issue found with reference code: ' . $referenceCode);
        }

        return Inertia::render('Public/Reference', [
            'issue' => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'category_name' => $issue->category?->name ?? $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'is_anonymous' => $issue->is_anonymous,
                'created_at' => $issue->created_at->toISOString(),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path ? route('issues.photo', $issue->reference_code) : null,
                'video_path' => $issue->video_path ? route('issues.photo', $issue->reference_code) : null,
                'has_video' => !is_null($issue->video_path),
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                    'bs_date' => BsDateService::toBsString($e->created_at, 'datetime'),
                ]),
                'comments' => $issue->comments->map(fn($c) => [
                    'id' => $c->id,
                    'body' => $c->body,
                    'author' => $c->authorName(),
                    'parent_id' => $c->parent_id,
                    'created_at' => $c->created_at->toISOString(),
                    'bs_date' => BsDateService::toBsString($c->created_at, 'datetime'),
                    'replies' => $c->replies->map(fn($r) => [
                        'id' => $r->id,
                        'body' => $r->body,
                        'author' => $r->authorName(),
                        'created_at' => $r->created_at->toISOString(),
                        'bs_date' => BsDateService::toBsString($r->created_at, 'datetime'),
                    ]),
                ]),
                'upvotes_count' => $issue->upvotesCount(),
                'comments_count' => $issue->commentsCount(),
            ],
        ]);
    }

    public function submitFeedback(Request $request, Issue $issue)
    {
        if ($issue->rating) {
            return back()->with('error', 'You have already submitted feedback for this issue.');
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback_comment' => 'nullable|string|max:1000',
        ]);

        $issue->update([
            'rating' => $validated['rating'],
            'feedback_comment' => $validated['feedback_comment'] ?? null,
            'feedback_at' => now(),
        ]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'type' => 'feedback',
            'description' => "Feedback submitted with rating {$validated['rating']}/5.",
            'metadata' => ['rating' => $validated['rating']],
            'is_public' => true,
        ]);

        return back()->with('success', 'Thank you for your feedback!');
    }

    public function trackStatus(Request $request)
    {
        $issue = null;
        $error = null;

        if ($request->filled('code')) {
            $issue = Issue::with(['location', 'organization', 'events' => function ($q) {
                    $q->public()->latest()->limit(20);
                }])
                ->where('reference_code', strtoupper($request->code))
                ->first();

            if (!$issue) {
                $error = 'No issue found with this reference code. Please check and try again.';
            }
        }

        return Inertia::render('Public/StatusCheck', [
            'issue' => $issue ? [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'assigned_to' => $issue->assigned_to,
                'created_at' => $issue->created_at->toISOString(),
                'bs_created_at' => \App\Services\BsDateService::toBsString($issue->created_at, 'short'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path ? route('issues.photo', $issue->reference_code) : null,
                'video_path' => $issue->video_path ? route('issues.photo', $issue->reference_code) : null,
                'has_video' => !is_null($issue->video_path),
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                    'bs_created_at' => \App\Services\BsDateService::toBsString($e->created_at, 'short'),
                ]),
            ] : null,
            'error' => $error,
        ]);
    }
}
