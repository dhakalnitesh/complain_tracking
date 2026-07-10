<?php

namespace App\Http\Controllers\OrgAdmin\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Issue;
use App\Models\Organization;
use App\Models\User;
use App\Services\BsDateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $org = $user->isSuperAdmin()
            ? ($request->org_id ? Organization::findOrFail($request->org_id) : null)
            : $user->organization;

        if (!$org) abort(403);

        $stats = [
            'total_issues' => Issue::where('organization_id', $org->id)->count(),
            'open_issues' => Issue::where('organization_id', $org->id)->where('status', '!=', 'resolved')->count(),
            'resolved_today' => Issue::where('organization_id', $org->id)->whereDate('resolved_at', today())->count(),
            'staff_count' => User::where('organization_id', $org->id)->where('is_staff', true)->count(),
            'department_count' => Department::where('organization_id', $org->id)->count(),
        ];

        $recentIssues = Issue::with(['location', 'department'])
            ->where('organization_id', $org->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'reference_code' => $i->reference_code,
                'description' => $i->description,
                'status' => $i->status,
                'priority' => $i->priority,
                'location' => $i->location?->name,
                'department' => $i->department?->name,
                'created_at' => $i->created_at->toISOString(),
                'bs_date' => BsDateService::toBsString($i->created_at, 'datetime'),
            ]);

        return Inertia::render('OrgAdmin/Dashboard/Index', [
            'organization' => $org,
            'stats' => $stats,
            'recent_issues' => $recentIssues,
        ]);
    }
}
