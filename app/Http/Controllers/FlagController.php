<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Flag;
use App\Models\Issue;
use Illuminate\Http\Request;

class FlagController extends Controller
{
    public function flagIssue(Request $request, Issue $issue)
    {
        abort_if($issue->hidden_at, 404);

        $validated = $request->validate([
            'reason' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
        ]);

        Flag::create([
            'flaggable_type' => Issue::class,
            'flaggable_id' => $issue->id,
            'user_id' => auth()->id(),
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Issue reported. Thank you for helping keep our community safe.');
    }

    public function flagComment(Request $request, Comment $comment)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
        ]);

        Flag::create([
            'flaggable_type' => Comment::class,
            'flaggable_id' => $comment->id,
            'user_id' => auth()->id(),
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Comment reported. Thank you for helping keep our community safe.');
    }
}
