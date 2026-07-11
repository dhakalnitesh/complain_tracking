<?php

namespace App\Http\Controllers\Admin\Issues;

use App\Events\IssueStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Organization;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function index(Request $request)
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
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
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

        $perPage = min((int) $request->get('per_page', 50), 100);
        $issues = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($issue) => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'title' => $issue->title,
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
                'bs_created_at' => \App\Services\BsDateService::toBsString($issue->created_at, 'short'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'bs_resolved_at' => $issue->resolved_at ? \App\Services\BsDateService::toBsString($issue->resolved_at, 'short') : null,
                'rating' => $issue->rating,
            ]);

        $staffUsers = User::staff()
            ->with('organization')
            ->orderBy('name')
            ->get(['id', 'name', 'organization_id']);

        $organizations = Organization::orderBy('name')->get(['id', 'name']);
        $categories = Category::active()->sorted()->get(['id', 'name']);

        return Inertia::render('Admin/Issues/Index', [
            'issues' => $issues,
            'staff_users' => $staffUsers,
            'organizations' => $organizations,
            'categories' => $categories,
            'filters' => $request->only(['status', 'priority', 'organization_id', 'search', 'per_page', 'date_from', 'date_to', 'assigned_user_id']),
        ]);
    }

    public function show(Issue $issue)
    {
        $issue->load(['location', 'organization', 'category', 'assignedUser', 'events' => function ($q) {
            $q->latest()->limit(50);
        }]);

        $staffUsers = User::staff()
            ->with('organization')
            ->orderBy('name')
            ->get(['id', 'name', 'organization_id']);

        return Inertia::render('Admin/Issues/Show', [
            'issue' => [
                'id' => $issue->id,
                'organization_id' => $issue->organization_id,
                'reference_code' => $issue->reference_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'priority' => $issue->effectivePriority(),
                'user_priority' => $issue->user_priority,
                'admin_priority' => $issue->admin_priority,
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
                'video_path' => $issue->video_path ? route('issues.photo', $issue->reference_code) : null,
                'has_video' => !is_null($issue->video_path),
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

    public function updateStatus(Request $request, Issue $issue, NotificationService $notificationService)
    {
        $validated = $request->validate([
            'status' => 'required|in:received,in_progress,resolved',
        ]);

        if ($validated['status'] === $issue->status) {
            return redirect()->back()->with('error', 'Issue is already in this status.');
        }

        $allowedTransitions = [
            'received' => ['in_progress', 'resolved'],
            'in_progress' => ['received', 'resolved'],
            'resolved' => ['in_progress'],
        ];

        $allowed = $allowedTransitions[$issue->status] ?? [];
        if (!in_array($validated['status'], $allowed, true)) {
            return redirect()->back()->with('error', "Cannot change status from {$issue->status} to {$validated['status']}.");
        }

        $oldStatus = $issue->status;
        $issue->status = $validated['status'];

        if ($validated['status'] === 'resolved') {
            $issue->resolved_at = now();
        } elseif ($oldStatus === 'resolved') {
            $issue->resolved_at = null;
        }

        $issue->save();

        $reason = $request->validate(['reason' => 'nullable|string|max:500'])['reason'] ?? null;
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

        if (config('broadcasting.default') !== 'log') {
            broadcast(new IssueStatusChanged($issue, $oldStatus));
        }

        return redirect()->back()->with('success', 'Issue status updated successfully.');
    }

    public function updatePriority(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'admin_priority' => 'required|in:low,medium,high,critical',
        ]);

        $oldPriority = $issue->effectivePriority();
        $issue->update([
            'admin_priority' => $validated['admin_priority'],
            'priority' => $validated['admin_priority'],
            'priority_reviewed_at' => now(),
            'priority_reviewed_by' => Auth::id(),
        ]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => Auth::id(),
            'type' => 'priority_changed',
            'description' => "Priority changed from {$oldPriority} to {$validated['admin_priority']} by admin.",
            'metadata' => [
                'from' => $oldPriority,
                'to' => $validated['admin_priority'],
                'user_priority' => $issue->user_priority,
            ],
            'is_public' => true,
        ]);

        return redirect()->back()->with('success', 'Priority updated successfully.');
    }

    public function assign(Request $request, Issue $issue)
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

}
