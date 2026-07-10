<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_issues' => Issue::count(),
            'open_issues' => Issue::where('status', '!=', 'resolved')->count(),
            'resolved_issues' => Issue::where('status', 'resolved')->count(),
            'escalated_issues' => Issue::where('status', '!=', 'resolved')
                ->where('created_at', '<', now()->subHours(24))->count(),
            'total_organizations' => Organization::count(),
            'total_users' => User::count(),
        ];

        $recentIssues = Issue::with(['location', 'organization'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'reference_code' => $i->reference_code,
                'category' => $i->category,
                'priority' => $i->priority,
                'location' => $i->location?->name,
                'organization' => $i->organization?->name,
                'description' => $i->description,
                'status' => $i->status,
                'created_at' => $i->created_at->toISOString(),
                'bs_created_at' => \App\Services\BsDateService::toBsString($i->created_at, 'short'),
            ]);

        $categoryStats = Issue::selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $issuesOverTime = Issue::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $avgResolution = Issue::whereNotNull('resolved_at')
            ->get()
            ->map(fn($i) => $i->created_at->diffInHours($i->resolved_at))
            ->average();

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => $stats,
            'recent_issues' => $recentIssues,
            'category_stats' => $categoryStats,
            'issues_over_time' => $issuesOverTime,
            'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
        ]);
    }
}
