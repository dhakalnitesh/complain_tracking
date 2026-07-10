<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Issue;
use App\Models\Location;
use App\Models\Organization;
use App\Services\BsDateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $organizations = Organization::where('is_active', true)
            ->withCount(['issues' => function ($q) {
                $q->where('status', '!=', 'resolved');
            }])
            ->orderBy('name')
            ->get();

        $stats = [
            'total_issues' => Issue::count(),
            'open_issues' => Issue::where('status', '!=', 'resolved')->count(),
            'resolved_today' => Issue::whereDate('resolved_at', today())->count(),
            'avg_resolution_time' => $this->getAvgResolutionTime(),
        ];

        $recentIssues = Issue::with(['location', 'organization', 'category'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($i) => $this->formatIssue($i));

        $categoryStats = Category::active()->sorted()
            ->withCount('issues')
            ->get()
            ->map(fn($c) => [
                'name' => $c->name,
                'total' => $c->issues_count,
            ]);

        $issuesOverTime = Issue::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Dashboard', [
            'organizations' => $organizations,
            'stats' => $stats,
            'recent_issues' => $recentIssues,
            'category_stats' => $categoryStats,
            'issues_over_time' => $issuesOverTime,
        ]);
    }

    public function organizationDashboard(Organization $organization)
    {
        $locations = Location::where('organization_id', $organization->id)
            ->withCount(['issues' => function ($q) {
                $q->where('status', '!=', 'resolved');
            }])
            ->orderBy('name')
            ->get();

        $stats = [
            'total_issues' => Issue::where('organization_id', $organization->id)->count(),
            'open_issues' => Issue::where('organization_id', $organization->id)->where('status', '!=', 'resolved')->count(),
            'resolved_today' => Issue::where('organization_id', $organization->id)->whereDate('resolved_at', today())->count(),
            'escalated' => Issue::where('organization_id', $organization->id)->where('status', '!=', 'resolved')
                ->where('created_at', '<', now()->subHours(24))->count(),
        ];

        $recentIssues = Issue::with('location')
            ->where('organization_id', $organization->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($i) => $this->formatIssue($i));

        $categoryStats = Issue::where('organization_id', $organization->id)
            ->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $priorityStats = Issue::where('organization_id', $organization->id)
            ->selectRaw('priority, COUNT(*) as total')
            ->groupBy('priority')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('Org/Dashboard', [
            'organization' => $organization,
            'locations' => $locations,
            'stats' => $stats,
            'recent_issues' => $recentIssues,
            'category_stats' => $categoryStats,
            'priority_stats' => $priorityStats,
        ]);
    }

    private function getAvgResolutionTime(): ?string
    {
        $avg = Issue::whereNotNull('resolved_at')
            ->get()
            ->map(fn($i) => $i->created_at->diffInHours($i->resolved_at))
            ->average();

        return $avg ? round($avg, 1) . ' hrs' : null;
    }

    private function formatIssue($issue): array
    {
        return [
            'id' => $issue->id,
            'reference_code' => $issue->reference_code,
            'category' => $issue->category,
            'category_name' => $issue->category?->name ?? $issue->category,
            'category_id' => $issue->category_id,
            'priority' => $issue->priority,
            'location' => $issue->location?->name,
            'organization' => $issue->organization?->name,
            'description' => $issue->description,
            'status' => $issue->status,
            'is_anonymous' => $issue->is_anonymous,
            'created_at' => $issue->created_at->toISOString(),
            'bs_created_at' => BsDateService::toBsString($issue->created_at, 'short'),
            'resolved_at' => $issue->resolved_at?->toISOString(),
            'bs_date' => BsDateService::toBsString($issue->created_at, 'datetime'),
            'bs_date_short' => BsDateService::toBsString($issue->created_at, 'short'),
            'upvotes_count' => $issue->upvotes()?->count() ?? 0,
            'comments_count' => $issue->comments()?->count() ?? 0,
        ];
    }
}
