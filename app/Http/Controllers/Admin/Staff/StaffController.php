<?php

namespace App\Http\Controllers\Admin\Staff;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function index(Request $request)
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

    public function create()
    {
        return redirect()->route('admin.staff');
    }

    public function store(Request $request)
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

    public function edit(User $user)
    {
        if (!$user->is_staff) {
            return redirect()->route('admin.staff')->with('error', 'User is not a staff member.');
        }

        return redirect()->route('admin.staff');
    }

    public function update(Request $request, User $user)
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
                Storage::disk('public')->delete($user->identity_document_front);
            }
            $data['identity_document_front'] = $request->file('identity_document_front')->store('identity-documents', 'public');
        }

        if ($request->hasFile('identity_document_back')) {
            if ($user->identity_document_back) {
                Storage::disk('public')->delete($user->identity_document_back);
            }
            $data['identity_document_back'] = $request->file('identity_document_back')->store('identity-documents', 'public');
        }

        $user->update($data);

        return redirect()->route('admin.staff')->with('success', 'Staff member updated successfully.');
    }

    public function destroy(User $user)
    {
        if (!$user->is_staff) {
            return back()->with('error', 'Cannot delete non-staff user.');
        }

        if ($user->identity_document_front) {
            Storage::disk('public')->delete($user->identity_document_front);
        }
        if ($user->identity_document_back) {
            Storage::disk('public')->delete($user->identity_document_back);
        }

        Issue::where('assigned_user_id', $user->id)->update(['assigned_user_id' => null]);
        $user->delete();

        return redirect()->route('admin.staff')->with('success', 'Staff member removed.');
    }

    public function issues(User $user)
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

        return Inertia::render('Admin/Staff/Issues', [
            'staff' => ['id' => $user->id, 'name' => $user->name],
            'issues' => $issues,
        ]);
    }
}
