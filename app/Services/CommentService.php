<?php

namespace App\Services;

use App\Events\IssueCommentAdded;
use App\Models\Issue;
use App\Models\IssueEvent;
use Illuminate\Support\Facades\Auth;

class CommentService
{
    public function addComment(Issue $issue, string $comment, bool $isPublic): IssueEvent
    {
        $event = $issue->events()->create([
            'user_id' => Auth::id(),
            'type' => 'commented',
            'description' => $comment,
            'is_public' => $isPublic,
        ]);

        broadcast(new IssueCommentAdded($event));

        return $event;
    }
}
