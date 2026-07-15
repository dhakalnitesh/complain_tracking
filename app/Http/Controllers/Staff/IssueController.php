<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\DailyProgress;
use App\Models\ExtensionRequest;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Services\BsDateService;
use App\Services\CommentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class IssueController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Issue::with(['location', 'organization', 'category'])
            ->where('assigned_user_id', $user->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = min((int) $request->get('per_page', 25), 100);
        $issues = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($issue) => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'deadline_at' => $issue->deadline_at?->toISOString(),
                'extension_deadline_at' => $issue->extension_deadline_at?->toISOString(),
                'created_at' => $issue->created_at->toISOString(),
                'bs_created_at' => BsDateService::toBsString($issue->created_at, 'short'),
            ]);

        return Inertia::render('Staff/Issues/Index', [
            'issues' => $issues,
            'filters' => $request->only(['status', 'priority', 'search', 'per_page']),
        ]);
    }

    public function show(Issue $issue)
    {
        $issue->load([
            'location',
            'organization',
            'dailyProgress' => function ($q) {
                $q->with('user')->latest();
            },
            'extensionRequests' => function ($q) {
                $q->with('user')->latest();
            },
            'events' => function ($q) {
                $q->latest()->limit(20);
            },
        ]);

        $user = Auth::user();
        $isAssigned = $issue->assigned_user_id === $user->id;
        $isAdmin = $user->isSuperAdmin();
        $isSameOrg = $issue->organization_id === $user->organization_id;

        if (!$isAssigned && !$isAdmin && !$isSameOrg) {
            return redirect()->route('staff.issues.index')->with('error', 'You are not assigned to this issue.');
        }

        $deadline = $issue->deadline_at ?? $issue->extension_deadline_at;

        return Inertia::render('Staff/Issues/Show', [
            'issue' => [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'title' => $issue->title,
                'category' => $issue->category,
                'priority' => $issue->priority,
                'location' => $issue->location?->name,
                'organization' => $issue->organization?->name,
                'description' => $issue->description,
                'status' => $issue->status,
                'assigned_to' => $issue->assigned_to,
                'reporter_name' => $issue->is_anonymous ? 'Anonymous' : $issue->reporter_name,
                'created_at' => $issue->created_at->toISOString(),
                'bs_created_at' => BsDateService::toBsString($issue->created_at, 'short'),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'deadline_at' => $issue->deadline_at?->toISOString(),
                'extension_deadline_at' => $issue->extension_deadline_at?->toISOString(),
                'resolution_summary' => $issue->resolution_summary,
                'photo_path' => $issue->photo_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
                'video_path' => $issue->video_path && $issue->reference_code ? route('issues.video', $issue->reference_code) : null,
                'has_video' => !is_null($issue->video_path),
                'events' => $issue->events->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'description' => $e->description,
                    'is_public' => $e->is_public,
                    'created_at' => $e->created_at->toISOString(),
                    'bs_created_at' => BsDateService::toBsString($e->created_at, 'short'),
                ]),
                'daily_progress' => $issue->dailyProgress->map(fn($p) => [
                    'id' => $p->id,
                    'notes' => $p->notes,
                    'photos' => $p->photos,
                    'user_name' => $p->user?->name,
                    'user_id' => $p->user_id,
                    'created_at' => $p->created_at->toISOString(),
                    'bs_created_at' => BsDateService::toBsString($p->created_at, 'short'),
                ]),
                'extension_requests' => $issue->extensionRequests->map(fn($er) => [
                    'id' => $er->id,
                    'reason' => $er->reason,
                    'requested_deadline' => $er->requested_deadline?->toISOString(),
                    'status' => $er->status,
                    'admin_note' => $er->admin_note,
                    'user_name' => $er->user?->name,
                    'created_at' => $er->created_at->toISOString(),
                    'bs_created_at' => BsDateService::toBsString($er->created_at, 'short'),
                ]),
            ],
        ]);
    }

    public function comment(Request $request, Issue $issue, CommentService $commentService)
    {
        $user = Auth::user();
        $isAssigned = $issue->assigned_user_id === $user->id;
        $isSameOrg = $issue->organization_id === $user->organization_id;
        if (!$isAssigned && !$user->isSuperAdmin() && !$isSameOrg) {
            return redirect()->back()->with('error', 'You are not assigned to this issue.');
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:2000',
            'is_public' => 'boolean',
        ]);

        $commentService->addComment($issue, $validated['comment'], $request->boolean('is_public', true));

        return redirect()->back()->with('success', 'Comment added successfully.');
    }

    public function storeProgress(Request $request, Issue $issue)
    {
        $user = Auth::user();
        $isAssigned = $issue->assigned_user_id === $user->id;
        if (!$isAssigned && !$user->isSuperAdmin()) {
            return redirect()->back()->with('error', 'You are not assigned to this issue.');
        }

        $validated = $request->validate([
            'notes' => 'required|string|max:5000',
            'photos.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('progress-photos/' . $issue->reference_code, 'public');
                $photoPaths[] = $path;
            }
        }

        DailyProgress::create([
            'issue_id' => $issue->id,
            'user_id' => $user->id,
            'notes' => $validated['notes'],
            'photos' => count($photoPaths) > 0 ? $photoPaths : null,
        ]);

        IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => $user->id,
            'type' => 'progress',
            'description' => "Daily progress update by {$user->name}.",
            'is_public' => true,
        ]);

        return redirect()->back()->with('success', 'Progress updated successfully.');
    }

    public function requestExtension(Request $request, Issue $issue)
    {
        $user = Auth::user();
        $isAssigned = $issue->assigned_user_id === $user->id;
        if (!$isAssigned && !$user->isSuperAdmin()) {
            return redirect()->back()->with('error', 'You are not assigned to this issue.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:2000',
            'requested_days' => 'required|integer|min:1|max:365',
        ]);

        $requestedDeadline = $validated['requested_days'];
        if ($issue->extension_deadline_at) {
            $baseDeadline = $issue->extension_deadline_at;
        } elseif ($issue->deadline_at) {
            $baseDeadline = $issue->deadline_at;
        } else {
            $baseDeadline = now();
        }
        $newDeadline = $baseDeadline->copy()->addDays((int) $validated['requested_days']);

        ExtensionRequest::create([
            'issue_id' => $issue->id,
            'user_id' => $user->id,
            'reason' => $validated['reason'],
            'requested_deadline' => $newDeadline,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Extension request submitted. Awaiting admin approval.');
    }

    public function resolve(Request $request, Issue $issue)
    {
        $user = Auth::user();
        $isAssigned = $issue->assigned_user_id === $user->id;
        if (!$isAssigned && !$user->isSuperAdmin()) {
            return redirect()->back()->with('error', 'You are not assigned to this issue.');
        }

        $validated = $request->validate([
            'resolution_summary' => 'required|string|max:5000',
            'proof_photos.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        $proofPaths = [];
        if ($request->hasFile('proof_photos')) {
            foreach ($request->file('proof_photos') as $photo) {
                $path = $photo->store('resolution-proof/' . $issue->reference_code, 'public');
                $proofPaths[] = $path;
            }
        }

        $issue->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolution_summary' => $validated['resolution_summary'],
            'resolved_by' => $user->id,
        ]);

        if (count($proofPaths) > 0) {
            DailyProgress::create([
                'issue_id' => $issue->id,
                'user_id' => $user->id,
                'notes' => "Resolution proof:\n\n{$validated['resolution_summary']}",
                'photos' => $proofPaths,
            ]);
        }

        $event = IssueEvent::create([
            'issue_id' => $issue->id,
            'user_id' => $user->id,
            'type' => 'resolved',
            'description' => "Issue resolved by {$user->name}. Summary: {$validated['resolution_summary']}",
            'metadata' => [
                'resolved_by' => $user->id,
                'resolved_by_name' => $user->name,
                'resolution_summary' => $validated['resolution_summary'],
            ],
            'is_public' => true,
        ]);

        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->sendStatusChange($issue, $event);

        return redirect()->back()->with('success', 'Issue marked as resolved with summary.');
    }
}
