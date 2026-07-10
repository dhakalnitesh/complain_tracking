<?php

namespace App\Http\Controllers;

use App\Events\IssueStatusChanged;
use App\Models\Category;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Organization;
use App\Models\User;
use App\Services\NotificationService;
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

        $recentIssues = Issue::with(['location', 'organization'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'reference_code' => $i->reference_code,
                'category' => $i->category,
                'priority' => $i->priority,
                'location' => $i->location?->name,
                'organization' => $i->organization?->name,
                'description' => $i->description,
                'status' => $i->status,
                'created_at' => $i->created_at->toISOString(),
                'bs_created_at' => \App\Services\BsDateService::toBsString($i->created_at, 'short'),
            ]);

        $categoryStats = Issue::selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $issuesOverTime = Issue::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $avgResolution = Issue::whereNotNull('resolved_at')
            ->get()
            ->map(fn($i) => $i->created_at->diffInHours($i->resolved_at))
            ->average();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recent_issues' => $recentIssues,
            'category_stats' => $categoryStats,
            'issues_over_time' => $issuesOverTime,
            'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
        ]);
    }

    public function updateStatus(Request $request, Issue $issue, NotificationService $notificationService)
    {
        $validated = $request->validate([
            'status' => 'required|in:received,in_progress,resolved',
        ]);

        if ($validated['status'] === $issue->status) {
            return redirect()->back()->with('error', 'Issue is already in this status.');
        }

        $oldStatus = $issue->status;
        $issue->status = $validated['status'];

        if ($validated['status'] === 'resolved') {
            $issue->resolved_at = now();
        } elseif ($oldStatus === 'resolved') {
            $issue->resolved_at = null;
        }

        $issue->save();

        $reason = $request->input('reason');
        $description = "Status changed from {$oldStatus} to {$validated['status']}.";
        if ($reason) {
            $description .= " Reason: {$reason}";
        }

        $event = IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => Auth::id(),
            'type' => 'status_changed',
            'description' => $description,
            'metadata' => ['from' => $oldStatus, 'to' => $validated['status'], 'reason' => $reason],
            'is_public' => true,
        ]);

        $notificationService->sendStatusChange($issue, $event);

        broadcast(new IssueStatusChanged($issue, $oldStatus));

        return redirect()->back()->with('success', 'Issue status updated successfully.');
    }

    public function staff(Request $request)
    {
        $organizations = Organization::withCount('issues')->orderBy('name')->get();

        $query = User::staff()->with('organization');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        }

        $perPage = min((int) $request->input('per_page', 25), 100);

        $staff = $query->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organization_id' => $user->organization_id,
                'organization_name' => $user->organization?->name,
                'identity_type' => $user->identity_type,
                'identity_number' => $user->identity_number,
                'phone' => $user->phone,
                'address' => $user->address,
                'identity_document_front_url' => $user->identity_document_front_url,
                'identity_document_back_url' => $user->identity_document_back_url,
                'issues_count' => Issue::where('assigned_user_id', $user->id)->count(),
                'created_at' => $user->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/Staff/Index', [
            'staff' => $staff,
            'organizations' => $organizations,
            'filters' => $request->only(['search', 'organization_id', 'per_page']),
        ]);
    }

    public function createStaff()
    {
        return redirect()->route('admin.staff');
    }

    public function storeStaff(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'organization_id' => 'required|exists:organizations,id',
            'identity_type' => 'required|in:citizenship,passport,voter_id',
            'identity_number' => 'required|string|max:50',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'identity_document_front' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'identity_document_back' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $frontPath = $request->hasFile('identity_document_front')
            ? $request->file('identity_document_front')->store('identity-documents', 'public')
            : null;

        $backPath = $request->hasFile('identity_document_back')
            ? $request->file('identity_document_back')->store('identity-documents', 'public')
            : null;

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'organization_id' => $validated['organization_id'],
            'is_staff' => true,
            'identity_type' => $validated['identity_type'],
            'identity_number' => $validated['identity_number'],
            'identity_document_front' => $frontPath,
            'identity_document_back' => $backPath,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return redirect()->route('admin.staff')->with('success', 'Staff member created successfully.');
    }

    public function editStaff(User $user)
    {
        if (!$user->is_staff) {
            return redirect()->route('admin.staff')->with('error', 'User is not a staff member.');
        }

        return redirect()->route('admin.staff');
    }

    public function updateStaff(Request $request, User $user)
    {
        if (!$user->is_staff) {
            return back()->with('error', 'User is not a staff member.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'organization_id' => 'required|exists:organizations,id',
            'identity_type' => 'required|in:citizenship,passport,voter_id',
            'identity_number' => 'required|string|max:50',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'identity_document_front' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'identity_document_back' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'organization_id' => $validated['organization_id'],
            'identity_type' => $validated['identity_type'],
            'identity_number' => $validated['identity_number'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('identity_document_front')) {
            if ($user->identity_document_front) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->identity_document_front);
            }
            $data['identity_document_front'] = $request->file('identity_document_front')->store('identity-documents', 'public');
        }

        if ($request->hasFile('identity_document_back')) {
            if ($user->identity_document_back) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->identity_document_back);
            }
            $data['identity_document_back'] = $request->file('identity_document_back')->store('identity-documents', 'public');
        }

        $user->update($data);

        return redirect()->route('admin.staff')->with('success', 'Staff member updated successfully.');
    }

    public function destroyStaff(User $user)
    {
        if (!$user->is_staff) {
            return back()->with('error', 'Cannot delete non-staff user.');
        }

        if ($user->identity_document_front) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->identity_document_front);
        }
        if ($user->identity_document_back) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->identity_document_back);
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
                    'bs_created_at' => \App\Services\BsDateService::toBsString($issue->created_at, 'short'),
                ]);

        return Inertia::render('Admin/Staff/StaffIssues', [
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

        return redirect()->back()->with('success', "Issue assigned to {$validated['assigned_to']}.");
    }

    public function exportCsv(Request $request)
    {
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
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('assigned_user_id')) {
            $query->where('assigned_user_id', $request->assigned_user_id);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $issues = $query->orderBy('created_at', 'desc')->get();

        $filename = 'issues-export-' . now()->format('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($issues) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Reference Code', 'Status', 'Priority', 'Category', 'Organization',
                'Location', 'Assigned To', 'Reporter Name', 'Reporter Phone',
                'Reporter Email', 'Description', 'Submitted At', 'Resolved At',
                'Rating', 'SMS Opt-in',
            ]);

            foreach ($issues as $issue) {
                $sanitize = fn($v) => preg_match('/^[=\-+@]/', $v) ? "'" . $v : ($v ?? '');

                fputcsv($handle, [
                    $sanitize($issue->reference_code),
                    $issue->status,
                    $issue->priority,
                    $sanitize($issue->category),
                    $sanitize($issue->organization?->name ?? ''),
                    $sanitize($issue->location?->name ?? ''),
                    $sanitize($issue->assignedUser?->name ?? $issue->assigned_to ?? ''),
                    $sanitize($issue->is_anonymous ? 'Anonymous' : ($issue->reporter_name ?? '')),
                    $issue->is_anonymous ? '' : ($sanitize($issue->reporter_phone ?? '')),
                    $issue->is_anonymous ? '' : ($sanitize($issue->reporter_email ?? '')),
                    $sanitize($issue->description),
                    $issue->created_at->toISOString(),
                    $issue->resolved_at?->toISOString() ?? '',
                    $sanitize($issue->rating ?? ''),
                    $issue->sms_opt_in ? 'Yes' : 'No',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function showIssue(Issue $issue)
    {
        $issue->load(['location', 'organization', 'category', 'assignedUser', 'events' => function ($q) {
            $q->latest()->limit(50);
        }]);

        $staffUsers = User::staff()
            ->with('organization')
            ->orderBy('name')
            ->get(['id', 'name', 'organization_id']);

        return Inertia::render('Admin/IssueDetail', [
            'issue' => [
                'id' => $issue->id,
                'organization_id' => $issue->organization_id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'assigned_to' => $issue->assigned_to,
                'assigned_user_id' => $issue->assigned_user_id,
                'assigned_user_name' => $issue->assignedUser?->name,
                'reporter_name' => $issue->is_anonymous ? 'Anonymous' : $issue->reporter_name,
                'reporter_phone' => $issue->is_anonymous ? null : $issue->reporter_phone,
                'reporter_email' => $issue->is_anonymous ? null : $issue->reporter_email,
                'is_anonymous' => $issue->is_anonymous,
                'sms_opt_in' => $issue->sms_opt_in,
                'is_escalated' => $issue->isEscalated(),
                'is_sla_breached' => $issue->isSlaBreached(),
                'created_at' => $issue->created_at->toISOString(),
                'bs_created_at' => \App\Services\BsDateService::toBsString($issue->created_at, 'short'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'bs_resolved_at' => $issue->resolved_at ? \App\Services\BsDateService::toBsString($issue->resolved_at, 'short') : null,
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path ? route('issues.photo', $issue->reference_code) : null,
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                    'bs_created_at' => \App\Services\BsDateService::toBsString($e->created_at, 'short'),
                ]),
            ],
            'staff_users' => $staffUsers,
        ]);
    }
}
