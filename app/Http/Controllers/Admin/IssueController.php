<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
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

        $staffUsers = User::staff()
            ->with('organization')
            ->orderBy('name')
            ->get(['id', 'name', 'organization_id']);

        $organizations = Organization::orderBy('name')->get(['id', 'name']);
        $categories = Category::active()->sorted()->get(['id', 'name']);

        return Inertia::render('Admin/Issues', [
            'issues' => $issues,
            'staff_users' => $staffUsers,
            'organizations' => $organizations,
            'categories' => $categories,
            'filters' => $request->only(['status', 'priority', 'organization_id', 'search', 'per_page', 'date_from', 'date_to', 'assigned_user_id']),
        ]);
    }
}
