<?php

namespace App\Services;

use App\Models\Issue;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class TrustService
{
    private const CACHE_PREFIX = 'trust:';
    private const CACHE_TTL = 2592000;

    public function getScore(?User $user, ?string $uuid): float
    {
        if ($user) {
            return Cache::remember(self::CACHE_PREFIX . 'user:' . $user->id, self::CACHE_TTL, function () use ($user) {
                return $this->calculateUserScore($user);
            });
        }

        if ($uuid) {
            return Cache::get(self::CACHE_PREFIX . 'uuid:' . $uuid, 0.5);
        }

        return 0.5;
    }

    public function adjustScore(?User $user, ?string $uuid, float $delta): void
    {
        if ($user) {
            $current = $this->getScore($user, null);
            $new = max(0.0, min(1.0, $current + $delta));
            Cache::put(self::CACHE_PREFIX . 'user:' . $user->id, $new, self::CACHE_TTL);

            \App\Models\SpamLog::create([
                'event_type' => 'trust_score_changed',
                'uuid' => null,
                'ip_hash' => null,
                'spam_score' => $new,
                'metadata' => ['delta' => $delta, 'user_id' => $user->id],
            ]);
            return;
        }

        if ($uuid) {
            $current = Cache::get(self::CACHE_PREFIX . 'uuid:' . $uuid, 0.5);
            $new = max(0.0, min(1.0, $current + $delta));
            Cache::put(self::CACHE_PREFIX . 'uuid:' . $uuid, $new, self::CACHE_TTL);

            \App\Models\SpamLog::create([
                'event_type' => 'trust_score_changed',
                'uuid' => $uuid,
                'spam_score' => $new,
                'metadata' => ['delta' => $delta],
            ]);
        }
    }

    private function calculateUserScore(User $user): float
    {
        $score = 0.7;

        $submissions = Issue::where('organization_id', $user->organization_id)
            ->where('reporter_email', $user->email)
            ->count();
        $score += min($submissions * 0.1, 0.2);

        if ($user->email_verified_at) {
            $score += 0.1;
        }

        $spamHits = Issue::where('reporter_email', $user->email)
            ->where('spam_score', '>', 0.7)
            ->count();
        $score -= $spamHits * 0.2;

        return max(0.0, min(1.0, $score));
    }

    public function getEffectivePriority(Issue $issue): string
    {
        $priority = $issue->user_priority ?? $issue->priority;
        $levels = ['low' => 0, 'medium' => 1, 'high' => 2, 'critical' => 3];
        $level = $levels[$priority] ?? 1;

        $trustScore = $this->getScore(
            null,
            $issue->anonymous_uuid
        );

        if ($trustScore > 0.8) {
            return $priority;
        }

        if ($trustScore < 0.3 && $level > 1) {
            return 'medium';
        }

        $upvoteCount = $issue->upvotes()->count();
        if ($upvoteCount >= 50) {
            $level = min($level + 2, 3);
        } elseif ($upvoteCount >= 20) {
            $level = min($level + 1, 3);
        }

        $mergedCount = Issue::where('duplicate_of_id', $issue->id)->count();
        if ($mergedCount >= 5) {
            $level = min($level + 1, 3);
        }

        $reverse = ['low', 'medium', 'high', 'critical'];
        return $reverse[$level];
    }
}
