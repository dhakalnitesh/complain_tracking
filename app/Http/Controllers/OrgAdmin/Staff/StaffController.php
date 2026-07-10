<?php

namespace App\Http\Controllers\OrgAdmin\Staff;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StaffController extends Controller
{
    private function getOrg(Request $request): ?Organization
    {
        $user = $request->user();
        if ($user->isSuperAdmin()) {
            return $request->org_id
                ? Organization::findOrFail($request->org_id)
                : null;
        }
        return $user->organization;
    }

    public function index(Request $request)
    {
        $org = $this->getOrg($request);
        if (!$org) abort(403);

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

        return Inertia::render('OrgAdmin/Staff/Index', [
            'organization' => $org,
            'staff' => $staff,
            'departments' => $departments,
        ]);
    }

    public function store(Request $request)
    {
        $org = $this->getOrg($request);
        if (!$org) abort(403);

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
