<?php

namespace App\Http\Controllers\Admin\Moderation;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Flag;
use App\Models\Issue;
use App\Models\SpamLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModerationController extends Controller
{
    public function index()
    {
        $flags = Flag::with('flaggable')
            ->pending()
            ->latest()
            ->paginate(50);

        return Inertia::render('Admin/Moderation/Index', [
            'flags' => $flags,
        ]);
    }

    public function dismiss(Flag $flag)
    {
        $flag->update(['status' => 'dismissed']);
        return back()->with('success', 'Flag dismissed.');
    }

    public function hide(Flag $flag)
    {
        $flaggable = $flag->flaggable;

        if ($flaggable instanceof Issue) {
            $flaggable->update(['hidden_at' => now()]);
        } elseif ($flaggable instanceof Comment) {
            $flaggable->update(['hidden_at' => now()]);
        }

        $flag->update(['status' => 'reviewed']);
        return back()->with('success', 'Content hidden.');
    }

    public function deleteContent(Flag $flag)
    {
        $flaggable = $flag->flaggable;

        if ($flaggable instanceof Issue) {
            $flaggable->delete();
        } elseif ($flaggable instanceof Comment) {
            $flaggable->delete();
        }

        $flag->update(['status' => 'reviewed']);
        return back()->with('success', 'Content deleted.');
    }

    public function pendingComments()
    {
        $comments = Comment::with(['issue', 'user'])
            ->where('is_approved', false)
            ->whereNull('hidden_at')
            ->latest()
            ->paginate(50);

        return Inertia::render('Admin/Moderation/Comments', [
            'comments' => $comments,
        ]);
    }

    public function approveComment(Comment $comment)
    {
        $comment->update(['is_approved' => true]);
        return back()->with('success', 'Comment approved.');
    }

    public function hideComment(Comment $comment)
    {
        $comment->update(['hidden_at' => now()]);
        return back()->with('success', 'Comment hidden.');
    }

    public function spamLogs(Request $request)
    {
        $query = SpamLog::latest();

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->event_type);
        }

        $logs = $query->paginate(50);

        return Inertia::render('Admin/Moderation/SpamLogs', [
            'logs' => $logs,
            'event_types' => SpamLog::distinct('event_type')->pluck('event_type'),
        ]);
    }
}
