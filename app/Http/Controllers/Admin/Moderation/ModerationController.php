<?php

namespace App\Http\Controllers\Admin\Moderation;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use App\Models\Issue;
use App\Models\Comment;
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
}
