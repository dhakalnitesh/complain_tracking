<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Services\CommentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function show(Issue $issue)
    {
        $issue->load(['location', 'organization', 'events' => function ($q) {
            $q->latest()->limit(20);
        }]);

        $user = Auth::user();
        $isAssigned = $issue->assigned_user_id === $user->id;
        $isAdmin = $user->isSuperAdmin();
        $isSameOrg = $issue->organization_id === $user->organization_id;

        if (!$isAssigned && !$isAdmin && !$isSameOrg) {
            return redirect()->route('dashboard')->with('error', 'You are not assigned to this issue.');
        }

        if (!$isAdmin && !$isSameOrg) {
            return redirect()->route('dashboard')->with('error', 'You do not have access to this issue.');
        }

        return Inertia::render('Staff/Issues/Show', [
            'issue' => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'assigned_to' => $issue->assigned_to,
                'reporter_name' => $issue->is_anonymous ? 'Anonymous' : $issue->reporter_name,
                'created_at' => $issue->created_at->toISOString(),
                'bs_created_at' => \App\Services\BsDateService::toBsString($issue->created_at, 'short'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
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
            ],
        ]);
    }

    public function comment(Request $request, Issue $issue, CommentService $commentService)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:2000',
            'is_public' => 'boolean',
        ]);

        $commentService->addComment($issue, $validated['comment'], $request->boolean('is_public', true));

        return redirect()->back()->with('success', 'Comment added successfully.');
    }
}
