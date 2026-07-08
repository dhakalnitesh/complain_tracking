<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @routes
    @inertiaHead
</head>
<body class="bg-gray-50 antialiased">
    @php
        $__reverb = config('broadcasting.connections.reverb');
        $__broadcast = [
            'enabled' => config('broadcasting.default') === 'reverb',
            'key' => $__reverb['key'] ?? null,
            'host' => $__reverb['options']['host'] ?? 'localhost',
            'port' => $__reverb['options']['port'] ?? 8080,
            'scheme' => $__reverb['options']['scheme'] ?? 'http',
        ];
    @endphp
    <script id="broadcast-data" type="application/json">{!! json_encode($__broadcast) !!}</script>
    @inertia
</body>
</html>
