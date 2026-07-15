<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Issue;
use App\Services\BsDateService;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Issue $issue, Request $request)
    {
        abort_if($issue->hidden_at, 404);

        $comments = Comment::with(['user', 'replies.user'])
            ->where('issue_id', $issue->id)
            ->visible()
            ->approved()
            ->public()
            ->root()
            ->latest()
            ->paginate(20)
            ->through(fn($comment) => $this->formatComment($comment));

        return response()->json($comments);
    }

    public function store(Issue $issue, Request $request)
    {
        abort_if($issue->hidden_at, 404);

        $validated = $request->validate([
            'body' => 'required|string|min:1|max:2000',
            'parent_id' => [
                'nullable',
                'exists:comments,id',
                function ($attribute, $value, $fail) use ($issue) {
                    if ($value && !Comment::where('id', $value)->where('issue_id', $issue->id)->exists()) {
                        $fail('The parent comment must belong to the same issue.');
                    }
                },
            ],
        ]);

        $comment = Comment::create([
            'issue_id' => $issue->id,
            'user_id' => auth()->id(),
            'session_id' => auth()->id() ? null : session()->getId(),
            'parent_id' => $validated['parent_id'] ?? null,
            'body' => $validated['body'],
            'is_public' => true,
            'is_approved' => auth()->check(),
        ]);

        if ($request->wantsJson()) {
            return response()->json($this->formatComment($comment->load(['user'])));
        }

        return back()->with('success', 'Comment added successfully.');
    }

    public function destroy(Comment $comment, Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            $comment->delete();
            return back()->with('success', 'Comment deleted.');
        }

        if ($comment->user_id !== $user->id) {
            abort(403);
        }

        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }

    private function formatComment($comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'author' => $comment->authorName(),
            'author_id' => $comment->user_id,
            'parent_id' => $comment->parent_id,
            'is_approved' => $comment->is_approved,
            'created_at' => $comment->created_at->toISOString(),
            'bs_date' => BsDateService::toBsString($comment->created_at, 'datetime'),
            'replies' => $comment->relationLoaded('replies')
                ? $comment->replies->map(fn($r) => $this->formatComment($r))
                : [],
        ];
    }
}
