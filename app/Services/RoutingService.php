<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Department;
use App\Models\Issue;

class RoutingService
{
    private static array $categoryDepartmentMap = [
        'Road/Infrastructure' => ['road', 'infrastructure'],
        'Water Supply' => ['water', 'supply'],
        'Garbage/Waste' => ['environment', 'sanitation', 'waste'],
        'Electricity/Water' => ['electricity', 'water', 'supply'],
        'Cleanliness' => ['sanitation', 'environment', 'cleanliness'],
        'Safety/Security' => ['safety', 'security', 'police'],
        'Health/Medical' => ['health', 'medical'],
        'Education' => ['education'],
        'Toilet/Sanitation' => ['sanitation'],
        'Harassment' => ['safety', 'admin'],
        'Other' => ['admin'],
    ];

    public static function autoRoute(Issue $issue): ?Department
    {
        $orgId = $issue->organization_id;
        if (!$orgId) return null;

        $categoryName = $issue->relationLoaded('category') && $issue->category
            ? $issue->category->name
            : ($issue->getAttributes()['category'] ?? null);

        $keywords = self::$categoryDepartmentMap[$categoryName] ?? ['admin'];

        $departments = Department::where('organization_id', $orgId)
            ->active()
            ->get();

        $best = null;
        $bestScore = 0;

        foreach ($departments as $dept) {
            $score = 0;
            $deptLower = strtolower($dept->name);
            foreach ($keywords as $kw) {
                if (str_contains($deptLower, $kw)) {
                    $score++;
                }
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $dept;
            }
        }

        if ($best) {
            $issue->update(['department_id' => $best->id]);
        }

        return $best;
    }
}
