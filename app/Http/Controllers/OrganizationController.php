<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function index()
    {
        $organizations = Organization::withCount(['issues', 'users'])
            ->orderBy('name')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'name' => $o->name,
                'slug' => $o->slug,
                'type' => $o->type,
                'address' => $o->address,
                'is_active' => $o->is_active,
                'issues_count' => $o->issues_count,
                'users_count' => $o->users_count,
                'created_at' => $o->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/Organizations/Index', [
            'organizations' => $organizations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:educational,municipality,government,hospital',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string|max:2000',
        ]);

        $org = Organization::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'type' => $validated['type'],
            'address' => $validated['address'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'website' => $validated['website'],
            'description' => $validated['description'],
        ]);

        // Create default locations for the organization
        $defaultLocations = ['Main Campus', 'Building A', 'Building B', 'Administration'];
        foreach ($defaultLocations as $loc) {
            Location::create(['name' => $loc, 'organization_id' => $org->id]);
        }

        return redirect()->route('admin.organizations')
            ->with('success', 'Organization created successfully.');
    }

    public function toggleActive(Organization $organization)
    {
        $organization->update(['is_active' => !$organization->is_active]);
        return redirect()->route('admin.organizations');
    }
}
