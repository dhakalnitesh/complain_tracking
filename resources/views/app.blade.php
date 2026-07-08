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
    <script id="broadcast-data" type="application/json">@json(config('broadcasting'))</script>
    @inertia
</body>
</html>
