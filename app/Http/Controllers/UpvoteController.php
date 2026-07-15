<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Upvote;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UpvoteController extends Controller
{
    public function toggle(Issue $issue, Request $request)
    {
        if ($issue->hidden_at) {
            return $request->wantsJson()
                ? response()->json(['error' => 'Issue not found.'], 404)
                : redirect()->back()->with('error', 'Issue not found.');
        }

        $userId = auth()->id();
        $sessionId = $userId ? null : session()->getId();
        $uuid = $request->cookie('_auid');

        $result = Upvote::toggle($issue->id, $userId, $sessionId, $uuid);

        Cache::forget("upvote_count_{$issue->id}");

        $upvoteCount = $issue->upvotes()->count();
        if ($upvoteCount === 20 || $upvoteCount === 50) {
            $trustService = app(\App\Services\TrustService::class);
            $newPriority = $trustService->getEffectivePriority($issue);

            if ($newPriority !== $issue->priority) {
                $oldPriority = $issue->priority;
                $issue->update(['priority' => $newPriority]);

                IssueEvent::create([
                    'issue_id' => $issue->id,
                    'type' => 'priority_changed',
                    'description' => "Priority auto-escalated from {$oldPriority} to {$newPriority} (community support).",
                    'metadata' => ['from' => $oldPriority, 'to' => $newPriority, 'reason' => 'upvote_milestone'],
                    'is_public' => true,
                ]);
            }
        }

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return back();
    }

    public function upvoters(Issue $issue)
    {
        abort_if($issue->hidden_at, 404);

        $upvoters = $issue->upvotes()
            ->with('user')
            ->latest()
            ->get()
            ->map(fn($upvote) => $upvote->user
                ? ['id' => $upvote->user->id, 'name' => $upvote->user->name, 'email' => $upvote->user->email]
                : ['id' => null, 'name' => null, 'email' => 'Anonymous']
            );

        return response()->json(['data' => $upvoters]);
    }
}
