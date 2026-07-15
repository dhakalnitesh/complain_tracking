<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\Organization;
use App\Services\BsDateService;
use App\Services\IssueService;
use Illuminate\Http\Request;
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

    public function store(Request $request, IssueService $issueService)
    {
        $result = $issueService->createIssue($request);

        if (!empty($result['honeypot'])) {
            return redirect()->route('dashboard');
        }

        if (!empty($result['captcha_error'])) {
            return back()->withErrors(['captcha' => 'Security check failed. Please try again.']);
        }

        if (!empty($result['merged'])) {
            return redirect()->route('issues.show-reference', [
                'reference_code' => $result['merged_into']->reference_code,
            ])->with('info', 'Your complaint was similar to an existing report. It has been combined for better tracking.');
        }

        $issue = $result['issue'];
        $duplicates = $result['duplicates'] ?? [];

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
            ->visible()
            ->with([
                'location', 'organization', 'category',
                'dailyProgress' => fn($q) => $q->with('user')->latest(),
                'assignedUser',
                'events' => fn($q) => $q->public()->latest()->limit(20),
                'comments' => fn($q) => $q->visible()->approved()->public()->root()->latest()->with(['user', 'replies.user']),
            ])
            ->first();

        if (!$issue) {
            return redirect()->route('status.check')->with('error', 'No issue found with reference code: ' . $referenceCode);
        }

        if ($issue->status === 'merged' && $issue->duplicate_of_id) {
            $parent = Issue::find($issue->duplicate_of_id);
            if ($parent) {
                return redirect()->route('issues.show-reference', ['reference_code' => $parent->reference_code])
                    ->with('info', 'This complaint was combined with ' . $parent->reference_code);
            }
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
                'bs_created_at' => BsDateService::toBsString($issue->created_at, 'datetime_en'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
                'video_path' => $issue->video_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
                'has_video' => !is_null($issue->video_path),
                'resolution_summary' => $issue->resolution_summary,
                'resolved_by_name' => $issue->resolvedBy?->name,
                'daily_progress' => $issue->dailyProgress->map(fn($p) => [
                    'id' => $p->id,
                    'notes' => $p->notes,
                    'photos' => $p->photos,
                    'user_name' => $p->user?->name,
                    'created_at' => $p->created_at->toISOString(),
                    'bs_created_at' => BsDateService::toBsString($p->created_at, 'datetime_en'),
                ]),
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                    'bs_created_at' => BsDateService::toBsString($e->created_at, 'datetime_en'),
                ]),
                'comments' => $issue->comments->map(fn($c) => [
                    'id' => $c->id,
                    'body' => $c->body,
                    'author' => $c->authorName(),
                    'parent_id' => $c->parent_id,
                    'created_at' => $c->created_at->toISOString(),
                    'bs_created_at' => BsDateService::toBsString($c->created_at, 'datetime_en'),
                    'replies' => $c->replies->map(fn($r) => [
                        'id' => $r->id,
                        'body' => $r->body,
                        'author' => $r->authorName(),
                        'created_at' => $r->created_at->toISOString(),
                        'bs_created_at' => BsDateService::toBsString($r->created_at, 'datetime_en'),
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
            $issue = Issue::with([
                    'location', 'organization', 'assignedUser', 'resolvedBy',
                    'dailyProgress' => fn($q) => $q->with('user')->latest(),
                    'events' => function ($q) {
                        $q->public()->latest()->limit(20);
                    },
                ])
                ->visible()
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
                'bs_created_at' => \App\Services\BsDateService::toBsString($issue->created_at, 'datetime_en'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
                'video_path' => $issue->video_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
                'has_video' => !is_null($issue->video_path),
                'resolution_summary' => $issue->resolution_summary,
                'resolved_by_name' => $issue->resolvedBy?->name,
                'daily_progress' => $issue->dailyProgress->map(fn($p) => [
                    'id' => $p->id,
                    'notes' => $p->notes,
                    'photos' => $p->photos,
                    'user_name' => $p->user?->name,
                    'created_at' => $p->created_at->toISOString(),
                    'bs_created_at' => \App\Services\BsDateService::toBsString($p->created_at, 'datetime_en'),
                ]),
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                    'bs_created_at' => \App\Services\BsDateService::toBsString($e->created_at, 'datetime_en'),
                ]),
            ] : null,
            'error' => $error,
        ]);
    }
}
