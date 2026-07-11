<?php

return [
    'site_key' => env('TURNSTILE_SITE_KEY', ''),
    'secret_key' => env('TURNSTILE_SECRET_KEY', ''),
    'always_show' => env('TURNSTILE_ALWAYS_SHOW', false),
];
