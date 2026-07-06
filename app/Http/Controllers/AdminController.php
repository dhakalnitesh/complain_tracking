<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!Auth::check() || !Auth::user()->isSuperAdmin()) {
                return redirect()->route('admin.login');
            }
            return $next($request);
        })->except(['showLogin', 'login']);
    }

    public function showLogin()
    {
        if (Auth::check() && Auth::user()->isSuperAdmin()) {
            return redirect()->route('admin.dashboard');
        }
        return Inertia::render('Admin/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            if (!$user->isSuperAdmin()) {
                Auth::logout();
                return back()->withErrors(['email' => 'Unauthorized access.']);
            }
            $request->session()->regenerate();
            return redirect()->intended(route('admin.dashboard'));
        }

        return back()->withErrors(['email' => 'Invalid credentials.']);
    }

    public function dashboard()
    {
        $stats = [
            'total_issues' => Issue::count(),
            'open_issues' => Issue::where('status', '!=', 'resolved')->count(),
            'resolved_issues' => Issue::where('status', 'resolved')->count(),
            'escalated_issues' => Issue::where('status', '!=', 'resolved')
                ->where('created_at', '<', now()->subHours(24))->count(),
            'total_organizations' => Organization::count(),
            'total_users' => User::count(),
        ];

        $issues = Issue::with(['location', 'organization'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($issue) => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'is_escalated' => $issue->status !== 'resolved' && $issue->created_at->lt(now()->subHours(24)),
                'is_sla_breached' => $issue->isSlaBreached(),
                'created_at' => $issue->created_at->toISOString(),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
            ]);

        $categoryStats = Issue::selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $orgStats = Organization::withCount('issues')
            ->orderByDesc('issues_count')
            ->get()
            ->map(fn($o) => [
                'name' => $o->name,
                'total' => $o->issues_count,
            ]);

        $issuesOverTime = Issue::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $avgResolution = Issue::whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg')
            ->value('avg');

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'issues' => $issues,
            'category_stats' => $categoryStats,
            'org_stats' => $orgStats,
            'issues_over_time' => $issuesOverTime,
            'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
        ]);
    }

    public function updateStatus(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'status' => 'required|in:received,in_progress,resolved',
        ]);

        $oldStatus = $issue->status;
        $issue->status = $validated['status'];

        if ($validated['status'] === 'resolved') {
            $issue->resolved_at = now();
        } elseif ($oldStatus === 'resolved') {
            $issue->resolved_at = null;
        }

        $issue->save();

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => Auth::id(),
            'type' => 'status_changed',
            'description' => "Status changed from {$oldStatus} to {$validated['status']}.",
            'metadata' => ['from' => $oldStatus, 'to' => $validated['status']],
        ]);

        return redirect()->route('admin.dashboard');
    }

    public function assignIssue(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|string|max:255',
        ]);

        $issue->update(['assigned_to' => $validated['assigned_to']]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => Auth::id(),
            'type' => 'assigned',
            'description' => "Issue assigned to {$validated['assigned_to']}.",
            'metadata' => ['assigned_to' => $validated['assigned_to']],
        ]);

        return redirect()->route('admin.dashboard');
    }
}
