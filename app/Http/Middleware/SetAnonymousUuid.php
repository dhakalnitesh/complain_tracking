<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Ramsey\Uuid\Uuid;
use Symfony\Component\HttpFoundation\Response;

class SetAnonymousUuid
{
    public function handle(Request $request, Closure $next): Response
    {
        $cookieName = '_auid';

        if (!$request->hasCookie($cookieName)) {
            $uuid = Uuid::uuid4()->toString();
            cookie()->queue($cookieName, $uuid, 365 * 24 * 60);
            $request->cookies->set($cookieName, $uuid);
        }

        return $next($request);
    }
}
