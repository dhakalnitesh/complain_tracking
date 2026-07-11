<?php

namespace App\Providers;

use App\Console\Commands\AnonymizeIps;
use App\Models\SpamLog;
use App\Services\IpAnonymizer;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('issues:submit', function (Request $request) {
            $key = $request->ip() . '|' . ($request->cookie('_auid') ?? '');
            return Limit::perMinute(3)->by($key)->response(function () use ($request) {
                SpamLog::create([
                    'event_type' => 'rate_limit_hit',
                    'uuid' => $request->cookie('_auid'),
                    'ip_hash' => IpAnonymizer::hash($request->ip()),
                    'metadata' => ['endpoint' => $request->path(), 'method' => 'issues:submit'],
                ]);
                return back()->with('error', 'Too many submissions. Please wait a moment and try again.');
            });
        });

        RateLimiter::for('status:check', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('issues:feedback', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('admin:login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('feed:view', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('comments:store', function (Request $request) {
            $key = $request->ip() . '|' . ($request->cookie('_auid') ?? session()->getId());
            return Limit::perMinute(10)->by($key);
        });

        $this->commands([
            AnonymizeIps::class,
        ]);
    }
}
