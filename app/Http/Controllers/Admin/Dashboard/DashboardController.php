<?php

namespace App\Http\Controllers\Admin\Dashboard;

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
            'total_issues' => Issue::visible()->count(),
            'open_issues' => Issue::visible()->where('status', '!=', 'resolved')->count(),
            'resolved_issues' => Issue::visible()->where('status', 'resolved')->count(),
            'escalated_issues' => Issue::visible()->where('status', '!=', 'resolved')
                ->where('created_at', '<', now()->subHours(24))->count(),
            'total_organizations' => Organization::count(),
            'total_users' => User::count(),
        ];

        $recentIssues = Issue::visible()->with(['location', 'organization'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'reference_code' => $i->reference_code,
                'title' => $i->title,
                'category' => $i->category,
                'priority' => $i->priority,
                'location' => $i->location?->name,
                'organization' => $i->organization?->name,
                'description' => $i->description,
                'status' => $i->status,
                'created_at' => $i->created_at->toISOString(),
                'bs_created_at' => \App\Services\BsDateService::toBsString($i->created_at, 'short'),
            ]);

        $categoryStats = Issue::visible()->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $issuesOverTime = Issue::visible()->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $avgResolution = Issue::visible()->whereNotNull('resolved_at')
            ->selectRaw('AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours')
            ->value('avg_hours');

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => $stats,
            'recent_issues' => $recentIssues,
            'category_stats' => $categoryStats,
            'issues_over_time' => $issuesOverTime,
            'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
        ]);
    }
}
