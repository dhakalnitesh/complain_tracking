<?php

namespace App\Http\Controllers\OrgAdmin\Departments;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Organization;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
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

        return Inertia::render('OrgAdmin/Departments/Index', [
            'organization' => $org,
            'departments' => $departments,
        ]);
    }

    public function store(Request $request)
    {
        $org = $this->getOrg($request);
        if (!$org) abort(403);

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
}
