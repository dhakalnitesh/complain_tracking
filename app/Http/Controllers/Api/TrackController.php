<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Services\BsDateService;
use Illuminate\Http\Request;

class TrackController extends Controller
{
    public function show($referenceCode)
    {
        $issue = Issue::visible()->with(['location', 'organization', 'events' => function ($q) {
            $q->public()->latest()->limit(20);
        }])
        ->where('reference_code', strtoupper($referenceCode))
        ->first();

        if (!$issue) {
            return response()->json(['error' => 'No issue found with this reference code.'], 404);
        }

        return response()->json([
            'id' => $issue->id,
            'reference_code' => $issue->reference_code,
            'category' => $issue->category,
            'priority' => $issue->priority,
            'location' => $issue->location?->name,
            'organization' => $issue->organization?->name,
            'description' => $issue->description,
            'status' => $issue->status,
            'assigned_to' => $issue->assigned_to,
            'created_at' => $issue->created_at->toISOString(),
            'resolved_at' => $issue->resolved_at?->toISOString(),
            'rating' => $issue->rating,
            'photo_path' => $issue->photo_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
            'video_path' => $issue->video_path && $issue->reference_code ? route('issues.photo', $issue->reference_code) : null,
            'has_video' => !is_null($issue->video_path),
            'bs_date' => BsDateService::toBsString($issue->created_at, 'datetime'),
            'bs_date_short' => BsDateService::toBsString($issue->created_at, 'short'),
            'events' => $issue->events->map(fn($e) => [
                'id' => $e->id,
                'type' => $e->type,
                'description' => $e->description,
                'is_public' => $e->is_public,
                'created_at' => $e->created_at->toISOString(),
                'bs_date' => BsDateService::toBsString($e->created_at, 'datetime'),
            ]),
        ]);
    }
}
