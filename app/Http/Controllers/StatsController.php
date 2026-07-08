<?php

namespace App\Http\Controllers;

use App\Models\Issue;
use App\Models\Organization;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function overview()
    {
        return response()->json([
            'total_issues' => Issue::count(),
            'open_issues' => Issue::where('status', '!=', 'resolved')->count(),
            'resolved_issues' => Issue::where('status', 'resolved')->count(),
            'escalated_issues' => Issue::where('status', '!=', 'resolved')
                ->where('created_at', '<', now()->subHours(24))->count(),
            'total_organizations' => Organization::count(),
            'avg_resolution_hours' => Issue::whereNotNull('resolved_at')
                ->get()
                ->map(fn($i) => $i->created_at->diffInHours($i->resolved_at))
                ->average(),
        ]);
    }

    public function categoryBreakdown()
    {
        return response()->json(
            Issue::selectRaw('category, COUNT(*) as total')
                ->groupBy('category')
                ->orderByDesc('total')
                ->get()
        );
    }

    public function issuesOverTime()
    {
        return response()->json(
            Issue::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
        );
    }
}
