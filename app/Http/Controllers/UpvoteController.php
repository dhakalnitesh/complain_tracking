<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Upvote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UpvoteController extends Controller
{
    public function toggle(Issue $issue, Request $request)
    {
        $userId = auth()->id();
        $sessionId = $userId ? null : session()->getId();

        $result = Upvote::toggle($issue->id, $userId, $sessionId);

        Cache::forget("upvote_count_{$issue->id}");

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return back();
    }
}
