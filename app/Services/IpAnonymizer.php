<?php

namespace App\Services;

class IpAnonymizer
{
    public static function hash(string $ip, ?string $salt = null): string
    {
        $salt = $salt ?? config('app.key');
        return hash('sha256', $ip . $salt);
    }

    public static function isPrivate(string $ip): bool
    {
        $private = ['10.', '172.16.', '172.17.', '172.18.', '172.19.',
                     '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                     '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                     '172.30.', '172.31.', '192.168.', '127.'];
        foreach ($private as $prefix) {
            if (str_starts_with($ip, $prefix)) return true;
        }
        return false;
    }
}
