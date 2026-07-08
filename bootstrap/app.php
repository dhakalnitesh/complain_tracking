<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => function (Request $request, $next) {
                if (!Auth::check() || !Auth::user()->isSuperAdmin()) {
                    if ($request->expectsJson()) {
                        return response()->json(['message' => 'Unauthorized.'], 403);
                    }
                    return redirect()->route('admin.login');
                }
                return $next($request);
            },
            'staff' => function (Request $request, $next) {
                if (!Auth::check()) {
                    return redirect()->route('login');
                }
                $user = Auth::user();
                if (!$user->is_staff && !$user->isSuperAdmin()) {
                    abort(403, 'Staff access required.');
                }
                return $next($request);
            },
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
