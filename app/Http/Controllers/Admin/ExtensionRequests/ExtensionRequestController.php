<?php

namespace App\Http\Controllers\Admin\ExtensionRequests;

use App\Http\Controllers\Controller;
use App\Models\ExtensionRequest;
use App\Models\Issue;
use App\Models\IssueEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExtensionRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = ExtensionRequest::with(['issue', 'user'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = min((int) $request->get('per_page', 25), 100);
        $extensionRequests = $query->paginate($perPage)
            ->through(fn($er) => [
                'id' => $er->id,
                'issue_id' => $er->issue_id,
                'issue_reference' => $er->issue?->reference_code,
                'issue_title' => $er->issue?->title,
                'user_name' => $er->user?->name,
                'reason' => $er->reason,
                'original_deadline' => $er->issue?->deadline_at?->toISOString(),
                'extension_deadline' => $er->issue?->extension_deadline_at?->toISOString(),
                'requested_deadline' => $er->requested_deadline?->toISOString(),
                'status' => $er->status,
                'admin_note' => $er->admin_note,
                'created_at' => $er->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/ExtensionRequests/Index', [
            'extension_requests' => $extensionRequests,
            'filters' => $request->only(['status', 'per_page']),
        ]);
    }

    public function review(Request $request, ExtensionRequest $extensionRequest)
    {
        $validated = $request->validate([
            'action' => 'required|in:approved,rejected',
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $extensionRequest->update([
            'status' => $validated['action'],
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_by' => Auth::id(),
        ]);

        $issue = $extensionRequest->issue;

        if ($validated['action'] === 'approved') {
            $issue->update([
                'extension_deadline_at' => $extensionRequest->requested_deadline,
            ]);

            IssueEvent::create([
                'issue_id' => $issue->id,
                'user_id' => Auth::id(),
                'type' => 'extension_approved',
                'description' => "Extension approved. New deadline: {$extensionRequest->requested_deadline->toDateTimeString()}.",
                'metadata' => [
                    'extension_request_id' => $extensionRequest->id,
                    'requested_deadline' => $extensionRequest->requested_deadline->toISOString(),
                ],
                'is_public' => true,
            ]);
        } else {
            IssueEvent::create([
                'issue_id' => $issue->id,
                'user_id' => Auth::id(),
                'type' => 'extension_rejected',
                'description' => "Extension request rejected." . ($validated['admin_note'] ? " Note: {$validated['admin_note']}" : ''),
                'is_public' => true,
            ]);
        }

        return redirect()->back()->with('success', 'Extension request ' . $validated['action'] . ' successfully.');
    }
}
