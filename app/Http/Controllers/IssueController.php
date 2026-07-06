<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function create(Request $request)
    {
        $organization = null;
        if ($request->org) {
            $organization = Organization::where('slug', $request->org)->where('is_active', true)->first();
        }

        $locations = Location::orderBy('name')->get(['id', 'name', 'parent_id', 'organization_id']);
        $organizations = Organization::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Submit', [
            'locations' => $locations,
            'organizations' => $organizations,
            'selected_organization' => $organization,
            'categories' => [
                'Canteen/Food',
                'Toilet/Sanitation',
                'Furniture/Equipment',
                'Projector/Board',
                'Library',
                'Class Scheduling',
                'Exam Concern',
                'Admin/Account Delay',
                'Cleanliness',
                'Electricity/Water',
                'Safety/Security',
                'Harassment',
                'Other',
            ],
            'priorities' => [
                'low' => 'Low',
                'medium' => 'Medium',
                'high' => 'High',
                'critical' => 'Critical',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'category' => 'required|string',
            'priority' => 'required|in:low,medium,high,critical',
            'location_id' => [
                'required',
                Rule::exists('locations', 'id')->where(function ($q) use ($request) {
                    $q->where('organization_id', $request->organization_id);
                }),
            ],
            'description' => 'required|string|min:10|max:5000',
            'reporter_name' => 'nullable|string|max:255',
            'reporter_phone' => 'nullable|string|max:20',
            'reporter_email' => 'nullable|email|max:255',
            'is_anonymous' => 'boolean',
            'photo' => 'nullable|image|max:5120',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('issue-photos', 'public');
        }

        $issue = Issue::create([
            'organization_id' => $validated['organization_id'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'location_id' => $validated['location_id'],
            'description' => $validated['description'],
            'reporter_name' => $validated['reporter_name'] ?? null,
            'reporter_phone' => $validated['reporter_phone'] ?? null,
            'reporter_email' => $validated['reporter_email'] ?? null,
            'is_anonymous' => $request->boolean('is_anonymous', true),
            'photo_path' => $photoPath,
        ]);

        $referenceCode = Issue::generateReferenceCode($validated['organization_id']);
        $issue->update(['reference_code' => $referenceCode]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'type' => 'created',
            'description' => 'Issue submitted successfully.',
            'metadata' => [
                'priority' => $validated['priority'],
                'category' => $validated['category'],
                'is_anonymous' => $issue->is_anonymous,
            ],
        ]);

        return redirect()->route('issues.show-reference', [
            'reference_code' => $issue->reference_code,
        ]);
    }

    public function showReference($referenceCode)
    {
        $issue = Issue::where('reference_code', $referenceCode)
            ->with(['location', 'organization', 'events' => function ($q) {
                $q->latest()->limit(10);
            }])
            ->first();

        if (!$issue) {
            return redirect()->route('status.check')->with('error', 'No issue found with reference code: ' . $referenceCode);
        }

        return Inertia::render('Reference', [
            'issue' => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'is_anonymous' => $issue->is_anonymous,
                'created_at' => $issue->created_at->toISOString(),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path ? \Illuminate\Support\Facades\Storage::url($issue->photo_path) : null,
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'created_at' => $e->created_at->toISOString(),
                ]),
            ],
        ]);
    }

    public function submitFeedback(Request $request, Issue $issue)
    {
        if ($issue->rating) {
            return back()->with('error', 'You have already submitted feedback for this issue.');
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback_comment' => 'nullable|string|max:1000',
        ]);

        $issue->update([
            'rating' => $validated['rating'],
            'feedback_comment' => $validated['feedback_comment'] ?? null,
            'feedback_at' => now(),
        ]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'type' => 'feedback',
            'description' => "Feedback submitted with rating {$validated['rating']}/5.",
            'metadata' => ['rating' => $validated['rating']],
        ]);

        return back()->with('success', 'Thank you for your feedback!');
    }

    public function trackStatus(Request $request)
    {
        $issue = null;
        $error = null;

        if ($request->filled('code')) {
            $issue = Issue::with(['location', 'organization'])
                ->where('reference_code', strtoupper($request->code))
                ->first();

            if (!$issue) {
                $error = 'No issue found with this reference code. Please check and try again.';
            }
        }

        return Inertia::render('StatusCheck', [
            'issue' => $issue ? [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'assigned_to' => $issue->assigned_to,
                'created_at' => $issue->created_at->toISOString(),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'rating' => $issue->rating,
                'feedback_comment' => $issue->feedback_comment,
                'photo_path' => $issue->photo_path ? Storage::url($issue->photo_path) : null,
            ] : null,
            'error' => $error,
        ]);
    }
}
