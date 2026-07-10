<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use App\Services\BsDateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrgAdminController extends Controller
{
    private function getOrg(Request $request): Organization
    {
        $user = $request->user();
        if ($user->isSuperAdmin() && $request->org_id) {
            return Organization::findOrFail($request->org_id);
        }
        return $user->organization;
    }

    public function dashboard(Request $request)
    {
        $org = $this->getOrg($request);
        if (!$org) abort(403);

        $stats = [
            'total_issues' => Issue::where('organization_id', $org->id)->count(),
            'open_issues' => Issue::where('organization_id', $org->id)->where('status', '!=', 'resolved')->count(),
            'resolved_today' => Issue::where('organization_id', $org->id)->whereDate('resolved_at', today())->count(),
            'staff_count' => User::where('organization_id', $org->id)->where('is_staff', true)->count(),
            'department_count' => Department::where('organization_id', $org->id)->count(),
        ];

        $recentIssues = Issue::with(['location', 'department'])
            ->where('organization_id', $org->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'reference_code' => $i->reference_code,
                'description' => $i->description,
                'status' => $i->status,
                'priority' => $i->priority,
                'location' => $i->location?->name,
                'department' => $i->department?->name,
                'created_at' => $i->created_at->toISOString(),
                'bs_date' => BsDateService::toBsString($i->created_at, 'datetime'),
            ]);

        return Inertia::render('OrgAdmin/Dashboard', [
            'organization' => $org,
            'stats' => $stats,
            'recent_issues' => $recentIssues,
        ]);
    }

    public function departments(Request $request)
    {
        $org = $this->getOrg($request);
        $departments = Department::with(['users', 'children'])
            ->where('organization_id', $org->id)
            ->sorted()
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'slug' => $d->slug,
                'description' => $d->description,
                'parent_id' => $d->parent_id,
                'is_active' => $d->is_active,
                'sort_order' => $d->sort_order,
                'users_count' => $d->users->count(),
                'children_count' => $d->children->count(),
            ]);

        return Inertia::render('OrgAdmin/Departments', [
            'organization' => $org,
            'departments' => $departments,
        ]);
    }

    public function storeDepartment(Request $request)
    {
        $org = $this->getOrg($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:departments,id',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        Department::create([
            'organization_id' => $org->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return back()->with('success', 'Department created.');
    }

    public function staff(Request $request)
    {
        $org = $this->getOrg($request);

        $staff = User::where('organization_id', $org->id)
            ->where('is_staff', true)
            ->with('departments')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'departments' => $u->departments->pluck('name'),
                'issues_count' => Issue::where('assigned_user_id', $u->id)->count(),
            ]);

        $departments = Department::where('organization_id', $org->id)->active()->sorted()->get(['id', 'name']);

        return Inertia::render('OrgAdmin/Staff', [
            'organization' => $org,
            'staff' => $staff,
            'departments' => $departments,
        ]);
    }

    public function storeStaff(Request $request)
    {
        $org = $this->getOrg($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'password' => 'required|string|min:8|confirmed',
            'department_ids' => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'organization_id' => $org->id,
            'is_staff' => true,
            'is_admin' => false,
        ]);

        if (!empty($validated['department_ids'])) {
            $user->departments()->attach($validated['department_ids']);
        }

        return back()->with('success', 'Staff created.');
    }
}
