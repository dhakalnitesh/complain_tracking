<?php

namespace App\Http\Controllers\Admin\Export;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function csv(Request $request)
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
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('assigned_user_id')) {
            $query->where('assigned_user_id', $request->assigned_user_id);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $issues = $query->orderBy('created_at', 'desc')->get();

        $filename = 'issues-export-' . now()->format('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($issues) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Reference Code', 'Status', 'Priority', 'Category', 'Organization',
                'Location', 'Assigned To', 'Reporter Name', 'Reporter Phone',
                'Reporter Email', 'Description', 'Submitted At', 'Resolved At',
                'Rating', 'SMS Opt-in',
            ]);

            foreach ($issues as $issue) {
                $sanitize = fn($v) => preg_match('/^[=\-+@]/', $v) ? "'" . $v : ($v ?? '');

                fputcsv($handle, [
                    $sanitize($issue->reference_code),
                    $issue->status,
                    $issue->priority,
                    $sanitize($issue->category),
                    $sanitize($issue->organization?->name ?? ''),
                    $sanitize($issue->location?->name ?? ''),
                    $sanitize($issue->assignedUser?->name ?? $issue->assigned_to ?? ''),
                    $sanitize($issue->is_anonymous ? 'Anonymous' : ($issue->reporter_name ?? '')),
                    $issue->is_anonymous ? '' : ($sanitize($issue->reporter_phone ?? '')),
                    $issue->is_anonymous ? '' : ($sanitize($issue->reporter_email ?? '')),
                    $sanitize($issue->description),
                    $issue->created_at->toISOString(),
                    $issue->resolved_at?->toISOString() ?? '',
                    $sanitize($issue->rating ?? ''),
                    $issue->sms_opt_in ? 'Yes' : 'No',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
