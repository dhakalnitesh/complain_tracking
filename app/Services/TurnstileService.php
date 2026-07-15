<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TurnstileService
{
    public function shouldShowCaptcha(Request $request): bool
    {
        if (config('turnstile.always_show')) {
            return true;
        }

        $uuid = $request->cookie('_auid');

        if (!$uuid) {
            return false;
        }

        $suspicionScore = Cache::get('suspicion:' . $uuid, 0);

        return $suspicionScore > 0.3;
    }

    public function verify(string $token): bool
    {
        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => config('turnstile.secret_key'),
            'response' => $token,
        ]);

        return $response->json('success', false);
    }

    public function incrementSuspicion(Request $request, float $amount = 0.1): void
    {
        $uuid = $request->cookie('_auid');
        if (!$uuid) return;

        Cache::add("suspicion:{$uuid}", 0, now()->addDay());
        $newScore = min(Cache::increment("suspicion:{$uuid}", $amount), 1.0);
        Cache::put("suspicion:{$uuid}", $newScore, now()->addDay());
    }

    public function resetSuspicion(Request $request): void
    {
        $uuid = $request->cookie('_auid');
        if ($uuid) {
            Cache::forget("suspicion:{$uuid}");
        }
    }
}
