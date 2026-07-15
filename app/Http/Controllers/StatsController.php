<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Issue;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function overview()
    {
        try {
            return response()->json([
                'total_issues' => Issue::visible()->count(),
                'open_issues' => Issue::visible()->where('status', '!=', 'resolved')->count(),
                'resolved_issues' => Issue::visible()->where('status', 'resolved')->count(),
                'escalated_issues' => Issue::visible()->where('status', '!=', 'resolved')
                    ->where('created_at', '<', now()->subHours(24))->count(),
                'total_organizations' => Organization::count(),
                'avg_resolution_hours' => round(
                    Issue::visible()->whereNotNull('resolved_at')
                        ->selectRaw(DB::connection()->getDriverName() === 'mysql'
                            ? 'AVG(TIMESTAMPDIFF(SECOND, created_at, resolved_at) / 3600.0) AS avg_hours'
                            : 'AVG((strftime(\'%s\', resolved_at) - strftime(\'%s\', created_at)) / 3600.0) AS avg_hours')
                        ->value('avg_hours') ?? 0, 2),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch overview stats', 'message' => $e->getMessage()], 500);
        }
    }

    public function categoryBreakdown()
    {
        try {
            $categories = Category::withCount('issues')
                ->orderByDesc('issues_count')
                ->get(['id', 'name', 'issues_count'])
                ->filter(fn($c) => $c->issues_count > 0)
                ->values();

            return response()->json($categories);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch category breakdown', 'message' => $e->getMessage()], 500);
        }
    }

    public function issuesOverTime()
    {
        try {
            return response()->json(
                Issue::visible()->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                    ->where('created_at', '>=', now()->subDays(30))
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
            );
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch trends', 'message' => $e->getMessage()], 500);
        }
    }
}
