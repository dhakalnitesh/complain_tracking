<?php

namespace App\Http\Controllers;

use App\Events\IssueStatusChanged;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
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

    public function dashboard(Request $request)
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

        $query = Issue::with(['location', 'organization', 'assignedUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int) $request->get('per_page', 50), 100);
        $issues = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($issue) => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'category_id' => $issue->category_id,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'organization_id' => $issue->organization_id,
                'description' => $issue->description,
                'status' => $issue->status,
                'assigned_to' => $issue->assigned_to,
                'assigned_user_id' => $issue->assigned_user_id,
                'assigned_user_name' => $issue->assignedUser?->name,
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
            ->get()
            ->map(fn($i) => $i->created_at->diffInHours($i->resolved_at))
            ->average();

        $staffUsers = User::staff()
            ->with('organization')
            ->orderBy('name')
            ->get(['id', 'name', 'organization_id']);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'issues' => $issues,
            'category_stats' => $categoryStats,
            'org_stats' => $orgStats,
            'issues_over_time' => $issuesOverTime,
            'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
            'staff_users' => $staffUsers,
            'filters' => $request->only(['status', 'priority', 'organization_id', 'search', 'per_page']),
        ]);
    }

    public function updateStatus(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'status' => 'required|in:received,in_progress,resolved',
        ]);

        if ($validated['status'] === $issue->status) {
            return redirect()->route('admin.dashboard')->with('error', 'Issue is already in this status.');
        }

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
            'is_public' => true,
        ]);

        broadcast(new IssueStatusChanged($issue, $oldStatus));

        return redirect()->route('admin.dashboard')->with('success', 'Issue status updated successfully.');
    }

    public function staff()
    {
        $organizations = Organization::withCount('issues')->orderBy('name')->get();

        $staff = User::staff()
            ->with('organization')
            ->orderBy('name')
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization_id' => $user->organization_id,
                'organization_name' => $user->organization?->name,
                'issues_count' => Issue::where('assigned_user_id', $user->id)->count(),
                'created_at' => $user->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/Staff', [
            'staff' => $staff,
            'organizations' => $organizations,
        ]);
    }

    public function createStaff()
    {
        return Inertia::render('Admin/StaffCreate', [
            'organizations' => Organization::orderBy('name')->get(),
        ]);
    }

    public function storeStaff(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'organization_id' => 'required|exists:organizations,id',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'organization_id' => $validated['organization_id'],
            'is_staff' => true,
        ]);

        return redirect()->route('admin.staff')->with('success', 'Staff member created successfully.');
    }

    public function destroyStaff(User $user)
    {
        if (!$user->is_staff) {
            return back()->with('error', 'Cannot delete non-staff user.');
        }

        Issue::where('assigned_user_id', $user->id)->update(['assigned_user_id' => null]);
        $user->delete();

        return redirect()->route('admin.staff')->with('success', 'Staff member removed.');
    }

    public function staffIssues(User $user)
    {
        if (!$user->is_staff) {
            return redirect()->route('admin.staff')->with('error', 'User is not a staff member.');
        }

        $issues = Issue::with(['location', 'organization'])
            ->where('assigned_user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($issue) => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'created_at' => $issue->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/StaffIssues', [
            'staff' => ['id' => $user->id, 'name' => $user->name],
            'issues' => $issues,
        ]);
    }

    public function assignIssue(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|string|max:255',
            'assigned_user_id' => [
                'nullable',
                Rule::exists('users', 'id')->where(function ($q) {
                    $q->where('is_staff', true);
                }),
            ],
        ]);

        $issue->update([
            'assigned_to' => $validated['assigned_to'],
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
        ]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => Auth::id(),
            'type' => 'assigned',
            'description' => "Issue assigned to {$validated['assigned_to']}.",
            'metadata' => [
                'assigned_to' => $validated['assigned_to'],
                'assigned_user_id' => $validated['assigned_user_id'],
            ],
            'is_public' => true,
        ]);

        return redirect()->route('admin.dashboard')->with('success', "Issue assigned to {$validated['assigned_to']}.");
    }

    public function showIssue(Issue $issue)
    {
        $issue->load(['location', 'organization', 'category', 'assignedUser', 'events' => function ($q) {
            $q->latest()->limit(50);
        }]);

        return Inertia::render('Admin/IssueDetail', [
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
                'assigned_user_name' => $issue->assignedUser?->name,
                'reporter_name' => $issue->is_anonymous ? 'Anonymous' : $issue->reporter_name,
                'reporter_phone' => $issue->is_anonymous ? null : $issue->reporter_phone,
                'reporter_email' => $issue->is_anonymous ? null : $issue->reporter_email,
                'is_anonymous' => $issue->is_anonymous,
                'sms_opt_in' => $issue->sms_opt_in,
                'is_escalated' => $issue->isEscalated(),
                'is_sla_breached' => $issue->isSlaBreached(),
                'created_at' => $issue->created_at->toISOString(),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path ? route('issues.photo', $issue->reference_code) : null,
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                ]),
            ],
        ]);
    }
}
