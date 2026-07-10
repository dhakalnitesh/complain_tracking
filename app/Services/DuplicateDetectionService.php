<?php

namespace App\Services;

use App\Models\Issue;

class DuplicateDetectionService
{
    public static function findDuplicates(string $description, int $organizationId, int $excludeId = 0): array
    {
        $tokens = self::tokenize($description);

        if (count($tokens) < 5) {
            return [];
        }

        $recentIssues = Issue::where('organization_id', $organizationId)
            ->where('id', '!=', $excludeId)
            ->where('created_at', '>=', now()->subDays(30))
            ->get(['id', 'reference_code', 'description', 'status']);

        $results = [];

        foreach ($recentIssues as $issue) {
            $issueTokens = self::tokenize($issue->description);
            $similarity = self::jaccardSimilarity($tokens, $issueTokens);

            if ($similarity > 0.3) {
                $results[] = [
                    'id' => $issue->id,
                    'reference_code' => $issue->reference_code,
                    'status' => $issue->status,
                    'similarity' => round($similarity, 2),
                ];
            }
        }

        usort($results, fn($a, $b) => $b['similarity'] <=> $a['similarity']);

        return array_slice($results, 0, 3);
    }

    private static function stem(string $word): string
    {
        $word = rtrim($word, 's');
        if (str_ends_with($word, 'ing')) {
            $word = substr($word, 0, -3);
        } elseif (str_ends_with($word, 'ed')) {
            $word = substr($word, 0, -2);
        } elseif (str_ends_with($word, 'ly')) {
            $word = substr($word, 0, -2);
        } elseif (str_ends_with($word, 'es')) {
            $word = substr($word, 0, -2);
        }
        return $word;
    }

    private const STOP_WORDS = [
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them',
        'than', 'that', 'this', 'very', 'just', 'also', 'well', 'each', 'any',
        'will', 'with', 'from', 'they', 'been', 'into', 'over', 'such',
        'that', 'this', 'these', 'those', 'what', 'which', 'when', 'where',
        'how', 'who', 'whom', 'whose',
    ];

    private static function tokenize(string $text): array
    {
        $text = mb_strtolower($text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', '', $text);
        $words = preg_split('/\s+/', $text);
        return array_values(array_filter(array_map(fn($w) => self::stem($w), $words), fn($w) =>
            mb_strlen($w) > 2 && !in_array($w, self::STOP_WORDS)
        ));
    }

    private static function jaccardSimilarity(array $a, array $b): float
    {
        $intersection = array_intersect($a, $b);
        $union = array_unique(array_merge($a, $b));

        if (count($union) === 0) {
            return 0;
        }

        return count($intersection) / count($union);
    }
}
