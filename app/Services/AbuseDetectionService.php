<?php

namespace App\Services;

use App\Models\Flag;
use App\Models\Issue;

class AbuseDetectionService
{
    public static function check(string $phone, ?string $description = null, ?string $ip = null): array
    {
        $reasons = [];
        $flagged = false;

        $recentCount = Issue::where('reporter_phone', $phone)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        if ($recentCount > 10) {
            $reasons[] = 'High volume of complaints from this phone number';
            $flagged = true;
        }

        if ($description) {
            $duplicate = Issue::where('description', $description)
                ->where('created_at', '>=', now()->subDay())
                ->where('id', '!=', 0)
                ->first();

            if ($duplicate) {
                $reasons[] = 'Identical description submitted within 24 hours';
                $flagged = true;
            }
        }

        if ($ip) {
            $ipCount = Issue::where('created_at', '>=', now()->subDay())
                ->get()
                ->filter(fn($issue) => request()->ip() === $ip)
                ->count();

            if ($ipCount > 10) {
                $reasons[] = 'High volume of complaints from this IP address';
                $flagged = true;
            }
        }

        return [
            'flagged' => $flagged,
            'reasons' => $reasons,
        ];
    }
}
