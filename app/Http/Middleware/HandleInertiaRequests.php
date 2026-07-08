<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'is_admin' => $request->user()->is_admin,
                    'is_staff' => $request->user()->is_staff,
                    'organization_id' => $request->user()->organization_id,
                    'organization' => $request->user()->organization?->only(['id', 'name', 'slug']),
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'broadcasting' => [
                'enabled' => config('broadcasting.default') === 'reverb',
                'key' => config('broadcasting.connections.reverb.key'),
                'host' => config('broadcasting.connections.reverb.options.host', 'localhost'),
                'port' => config('broadcasting.connections.reverb.options.port', 8080),
                'scheme' => config('broadcasting.connections.reverb.options.scheme', 'http'),
            ],
        ];
    }
}
