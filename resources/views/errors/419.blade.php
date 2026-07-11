<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>419 - Session Expired</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; color: #1e293b; }
    .card { text-align: center; padding: 2rem; }
    h1 { font-size: 5rem; font-weight: 800; color: #6366f1; line-height: 1; }
    p { margin: 1rem 0 1.5rem; font-size: 1.125rem; color: #64748b; }
    a { display: inline-block; padding: .75rem 1.5rem; background: #6366f1; color: #fff; border-radius: .5rem; text-decoration: none; font-weight: 600; }
    a:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>419</h1>
    <p>Session expired. Please refresh and try again.</p>
    <a href="/">Go Home</a>
  </div>
</body>
</html>
