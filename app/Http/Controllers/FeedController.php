<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Issue;
use App\Models\Location;
use App\Services\BsDateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeedController extends Controller
{
    public function index(Request $request)
    {
        $query = Issue::with(['location', 'organization', 'category'])
            ->whereNull('deleted_at');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        }

        $sort = $request->get('sort', 'latest');
        $query->when($sort === 'oldest', fn($q) => $q->oldest())
            ->when($sort === 'latest', fn($q) => $q->latest());

        $perPage = min((int) $request->get('per_page', 20), 50);

        $issues = $query->paginate($perPage)->through(function ($issue) {
            return [
                'id' => $issue->id,
                'reference_code' => $issue->reference_code,
                'category' => $issue->category,
                'category_name' => $issue->category?->name ?? $issue->category,
                'priority' => $issue->priority,
                'status' => $issue->status,
                'description' => $issue->description,
                'location' => $issue->location?->name,
                'location_id' => $issue->location_id,
                'organization' => $issue->organization?->name,
                'organization_id' => $issue->organization_id,
                'is_anonymous' => $issue->is_anonymous,
                'photo_path' => $issue->photo_path ? route('issues.photo', $issue->reference_code) : null,
                'has_photo' => !is_null($issue->photo_path),
                'created_at' => $issue->created_at->toISOString(),
                'resolved_at' => $issue->resolved_at?->toISOString(),
                'bs_date' => BsDateService::toBsString($issue->created_at, 'datetime'),
                'bs_date_short' => BsDateService::toBsString($issue->created_at, 'short'),
            ];
        });

        $categories = Category::active()->sorted()->get(['id', 'name']);
        $locations = Location::whereHas('issues')->orderBy('name')->get(['id', 'name', 'organization_id']);

        return Inertia::render('Feed', [
            'issues' => $issues,
            'filters' => $request->only(['category_id', 'status', 'location_id', 'organization_id', 'sort']),
            'categories' => $categories,
            'locations' => $locations,
        ]);
    }
}
