<?php

namespace App\Http\Middleware;

use App\Services\TurnstileService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdaptiveCaptcha
{
    public function __construct(private TurnstileService $turnstile) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET')) {
            $showCaptcha = $this->turnstile->shouldShowCaptcha($request);

            if ($showCaptcha) {
                \Inertia\Inertia::share('captcha_required', true);
                \Inertia\Inertia::share('turnstile_site_key', config('turnstile.site_key'));
            }

            return $next($request);
        }

        if ($this->turnstile->shouldShowCaptcha($request)) {
            $token = $request->input('cf-turnstile-response');

            if (!$token || !$this->turnstile->verify($token)) {
                $this->turnstile->incrementSuspicion($request, 0.2);

                return back()->withErrors([
                    'captcha' => 'Please complete the security check.',
                ])->withInput();
            }

            $this->turnstile->resetSuspicion($request);
        }

        return $next($request);
    }
}
