# Epic 16: Spam Prevention & Security Hardening

> **Session Recovery Document** — If session resets, read this + AGENTS.md + SRS.md to continue.
> **Target:** Kathmandu Metropolitan City (KMC) — single municipality MVP

---

## Status: 🔴 Not Started
**Target:** Jul 18 — Jul 28

---

## Session Recovery Instructions

If your AI session resets mid-implementation:

1. **Read this file** (Epic16.md) — find the first `[ ]` unchecked item
2. **Read SRS.md** — section FR-16.x for functional requirements of that item
3. **Run to check current state:**
   ```bash
   git status
   git diff --stat
   git log --oneline -5
   ```
4. **Read the last file you were editing** — pick up where you left off
5. **Run tests after every layer:**
   ```bash
   php artisan test --filter=Epic16
   # or specific:
   php artisan test --filter=SpamLog
   php artisan test --filter=Turnstile
   ```

---

## What

Nine-layer spam prevention and security hardening system for the anonymous complaint submission workflow:

1. **Adaptive Rate Limiting** — Redis sliding window instead of static throttle
2. **Anonymous UUID Cookie** — Long-lived browser identifier (survives restart)
3. **Privacy-Preserving IP** — SHA256 hash instead of raw IP storage
4. **Adaptive CAPTCHA** — Cloudflare Turnstile (free), shown only when suspicious
5. **Rule-Based Spam Detection** — Wire dead-code AbuseDetectionService + add rules
6. **Trust Scoring** — 0.0-1.0 score from behavioral signals
7. **Human Moderation Fix** — CRITICAL: hidden_at filters, comment approval queue
8. **Spam Audit Logging** — Track all detection events
9. **Trust → Priority Escalation** — Auto-adjust priority based on trust

---

## Why

The current system has **critical gaps** discovered in the audit:

- **AbuseDetectionService is dead code** — fully implemented but never called in any controller
- **hidden_at filters are missing** — moderators "hide" content but it remains fully public
- **Comments auto-approved** — no moderation, spam comments go live instantly
- **No CAPTCHA** — only a honeypot field (bots that skip hidden fields get through)
- **Raw IP stored permanently** — privacy risk, no hashing
- **Session-based tracking** — lost when browser closes, no persistent anonymous ID
- **Static rate limits** — IP-only, no per-user adaptation

Without these layers, the system is vulnerable to:
- Bot-driven spam floods
- Professional complainants (Hello Sarkar's known problem)
- Privacy complaints (raw IP storage)
- Comment spam/harassment
- Brute force attacks on admin login

---

## How

### A. Adaptive Rate Limiting (Redis Sliding Window)

**Step 1: Register Named Rate Limiters**

In `app/Providers/AppServiceProvider.php::boot()`, add:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('issues:submit', function (Request $request) {
        $key = $request->ip() . '|' . ($request->cookie('_auid') ?? '');
        return Limit::perMinute(3)->by($key);
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
}
```

**Step 2: Apply Middleware in Routes**

In `routes/web.php`, replace the existing `throttle:3,1` etc. with named limiters:

```php
// Before (old):
Route::post('/issues', [IssueController::class, 'store'])->middleware('throttle:3,1');

// After (new):
Route::post('/issues', [IssueController::class, 'store'])->middleware('throttle:issues:submit');
```

Update all rate-limited routes to use the named limiters.

**Step 3: Adaptive Penalty**

Extend the rate limiter with penalty escalation. In `AppServiceProvider`:

```php
RateLimiter::for('issues:submit', function (Request $request) {
    $key = $request->ip() . '|' . ($request->cookie('_auid') ?? '');
    $attempts = RateLimiter::attempts($key);
    
    // Adaptive: each burst doubles the cooldown
    $penalty = 1;
    if ($attempts > 3) {
        $penalty = 2; // 2 minute window instead of 1
    }
    if ($attempts > 6) {
        $penalty = 5; // 5 minute window
    }
    
    return Limit::perMinutes($penalty, 3)->by($key);
});
```

**Step 4: Friendly Error Response**

When rate limited, return Inertia render (not raw JSON) so user sees a friendly message:

The throttle middleware already handles this gracefully with Inertia — it shows a 429 error page. To customize:

```php
// In AppServiceProvider:
RateLimiter::for('issues:submit', function (Request $request) {
    // ...
})->response(function (Request $request, array $headers) {
    return back()->with('error', 'Too many submissions. Please wait a moment and try again.');
});
```

**Step 5: Log Rate Limit Hits**

In the rate limiter response callback, log the event:
```php
\App\Models\SpamLog::create([
    'event_type' => 'rate_limit_hit',
    'uuid' => $request->cookie('_auid'),
    'ip_hash' => \App\Services\IpAnonymizer::hash($request->ip()),
    'metadata' => ['endpoint' => $request->path(), 'attempts' => RateLimiter::attempts($key)],
]);
```

---

### B. Anonymous UUID Cookie

**Step 1: Create Middleware**

Create `app/Http/Middleware/SetAnonymousUuid.php`:

```php
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
            cookie()->queue($cookieName, $uuid, 365 * 24 * 60); // 365 days
            // Make available for this request too
            $request->cookies->set($cookieName, $uuid);
        }

        return $next($request);
    }
}
```

**Step 2: Register Middleware**

In `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\SetAnonymousUuid::class,
    ]);
})
```

**Step 3: Migration** — Add `anonymous_uuid` to issues and upvotes

Create migration `database/migrations/2026_07_11_001001_add_anonymous_uuid_to_issues.php`:
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('anonymous_uuid', 36)->nullable()->after('reporter_ip');
    $table->index('anonymous_uuid');
});
```

Create migration `database/migrations/2026_07_11_001002_add_anonymous_uuid_to_upvotes.php`:
```php
Schema::table('upvotes', function (Blueprint $table) {
    $table->string('anonymous_uuid', 36)->nullable()->after('session_id');
});
```

**Step 4: Store UUID on Submission**

In `IssueController::store()`, add to the Issue::create array:
```php
'anonymous_uuid' => $request->cookie('_auid'),
```

In `UpvoteController::toggle()`, add:
```php
$uuid = request()->cookie('_auid');
// When creating upvote:
'anonymous_uuid' => $uuid,
```

**Step 5: Use UUID for Rate Limiting**

Already done in Step A — the rate limiter uses `$request->cookie('_auid')`.

---

### C. Privacy-Preserving IP Hashing

**Step 1: Create IpAnonymizer Service**

Create `app/Services/IpAnonymizer.php`:

```php
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
```

**Step 2: Migration** — Add `reporter_ip_hash`

Create migration `database/migrations/2026_07_11_001003_add_ip_hash_to_issues.php`:
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('reporter_ip_hash', 64)->nullable()->after('reporter_ip');
    $table->index('reporter_ip_hash');
});
```

**Step 3: Store Hash on Submission**

In `IssueController::store()`, add:
```php
'reporter_ip_hash' => \App\Services\IpAnonymizer::hash($request->ip()),
```

**Step 4: Create Anonymization Command**

Create `app/Console/Commands/AnonymizeIps.php`:

```php
<?php

namespace App\Console\Commands;

use App\Models\Issue;
use App\Services\IpAnonymizer;
use Illuminate\Console\Command;

class AnonymizeIps extends Command
{
    protected $signature = 'issues:anonymize-ips';
    protected $description = 'Nullify raw IP addresses older than 24 hours';

    public function handle(): int
    {
        $count = Issue::whereNotNull('reporter_ip')
            ->where('created_at', '<', now()->subHours(24))
            ->update(['reporter_ip' => null]);

        $this->info("Anonymized {$count} IP addresses.");
        return Command::SUCCESS;
    }
}
```

Register in `AppServiceProvider::boot()`:
```php
$this->commands([
    \App\Console\Commands\AnonymizeIps::class,
]);
```

**Step 5: Update AbuseDetectionService to Use Hash**

In `AbuseDetectionService::check()`, change IP parameter to use hash:
```php
// Instead of raw IP, pass the hash already computed
public static function check(string $phone, ?string $description = null, ?string $ipHash = null): array
{
    // ...
    if ($ipHash) {
        $ipCount = Issue::where('reporter_ip_hash', $ipHash)
            ->where('created_at', '>=', now()->subDay())
            ->count();
        if ($ipCount > 10) {
            $reasons[] = 'High volume of complaints from this location';
            $flagged = true;
        }
    }
}
```

---

### D. Adaptive CAPTCHA (Cloudflare Turnstile)

**Step 1: Configuration**

Create `config/turnstile.php`:
```php
<?php

return [
    'site_key' => env('TURNSTILE_SITE_KEY', ''),
    'secret_key' => env('TURNSTILE_SECRET_KEY', ''),
    'always_show' => env('TURNSTILE_ALWAYS_SHOW', false),
];
```

Add to `.env`:
```
TURNSTILE_SITE_KEY=1x00000000000000000000AA  # Test key for development
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # Test key
```

> **Note:** These test keys always pass. Replace with real keys from https://dash.cloudflare.com/turnstile before production.

**Step 2: Create TurnstileService**

Create `app/Services/TurnstileService.php`:

```php
<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TurnstileService
{
    public function shouldShowCaptcha(Request $request): bool
    {
        if (config('turnstile.always_show')) {
            return true;
        }

        $uuid = $request->cookie('_auid');

        if (!$uuid) {
            return false; // First visit, no data yet
        }

        $suspicionScore = Cache::get("suspicion:{$uuid}", 0);

        // Show CAPTCHA if suspicion score > threshold
        return $suspicionScore > 0.3;
    }

    public function verify(string $token): bool
    {
        // Cache to avoid hitting API repeatedly for same token
        $cacheKey = 'turnstile:' . md5($token);

        return Cache::remember($cacheKey, 120, function () use ($token) {
            $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => config('turnstile.secret_key'),
                'response' => $token,
            ]);

            return $response->json('success', false);
        });
    }

    public function incrementSuspicion(Request $request, float $amount = 0.1): void
    {
        $uuid = $request->cookie('_auid');
        if (!$uuid) return;

        $current = Cache::get("suspicion:{$uuid}", 0);
        Cache::put("suspicion:{$uuid}", min($current + $amount, 1.0), now()->addDay());
    }

    public function resetSuspicion(Request $request): void
    {
        $uuid = $request->cookie('_auid');
        if ($uuid) {
            Cache::forget("suspicion:{$uuid}");
        }
    }
}
```

**Step 3: Create Middleware**

Create `app/Http/Middleware/AdaptiveCaptcha.php`:

```php
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
            // On GET request, determine if captcha should be shown
            $showCaptcha = $this->turnstile->shouldShowCaptcha($request);
            
            // Share with Inertia
            if ($showCaptcha) {
                \Inertia\Inertia::share('captcha_required', true);
                \Inertia\Inertia::share('turnstile_site_key', config('turnstile.site_key'));
            }
            
            return $next($request);
        }

        // On POST (submission), validate captcha if needed
        if ($this->turnstile->shouldShowCaptcha($request)) {
            $token = $request->input('cf-turnstile-response');
            
            if (!$token || !$this->turnstile->verify($token)) {
                $this->turnstile->incrementSuspicion($request, 0.2);
                
                return back()->withErrors([
                    'captcha' => 'Please complete the security check.',
                ])->withInput();
            }
            
            // Successful captcha = lower suspicion
            $this->turnstile->resetSuspicion($request);
        }

        return $next($request);
    }
}
```

**Step 4: Register Middleware**

In `bootstrap/app.php`:
```php
$middleware->web(append: [
    \App\Http\Middleware\AdaptiveCaptcha::class,
]);
```

Apply to submission route specifically (better than global):
Actually, apply it only to the submission route:

```php
Route::post('/issues', [IssueController::class, 'store'])
    ->middleware(['throttle:issues:submit', \App\Http\Middleware\AdaptiveCaptcha::class]);
```

But the middleware also needs to run on GET for `shouldShowCaptcha`. Better approach: apply to both GET and POST of the submit flow:

```php
Route::get('/issues/create', [IssueController::class, 'create'])->middleware(\App\Http\Middleware\AdaptiveCaptcha::class);
Route::post('/issues', [IssueController::class, 'store'])->middleware(['throttle:issues:submit', \App\Http\Middleware\AdaptiveCaptcha::class]);
```

**Step 5: Frontend Widget**

Create `resources/js/Components/UI/TurnstileWidget.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function TurnstileWidget() {
  const { captcha_required, turnstile_site_key } = usePage().props;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!captcha_required || !turnstile_site_key || !containerRef.current) return;

    // Load Turnstile script if not loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Render widget
    const widgetId = window.turnstile?.render(containerRef.current, {
      sitekey: turnstile_site_key,
      theme: 'light',
    });

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [captcha_required, turnstile_site_key]);

  if (!captcha_required) return null;

  return (
    <div className="mt-4">
      <div ref={containerRef} />
      <p className="text-xs text-gray-400 mt-1">Security check required</p>
    </div>
  );
}
```

**Step 6: Integrate into Submit Form**

In `resources/js/Pages/Public/Submit.jsx`, add the widget in the review/submit step (around line 469, before the submit button):

```jsx
<TurnstileWidget />
```

**Step 7: Validation Rule**

In `IssueController::store()`, add CAPTCHA validation:

```php
$turnstileService = app(TurnstileService::class);
if ($turnstileService->shouldShowCaptcha($request)) {
    $request->validate([
        'cf-turnstile-response' => 'required|string',
    ]);
    if (!$turnstileService->verify($request->input('cf-turnstile-response'))) {
        return back()->withErrors(['captcha' => 'Security check failed. Please try again.']);
    }
}
```

---

### E. Rule-Based Spam Detection (Wire AbuseDetectionService)

**Step 1: Extend AbuseDetectionService**

Rewrite `app/Services/AbuseDetectionService.php`:

```php
<?php

namespace App\Services;

use App\Models\Issue;

class AbuseDetectionService
{
    public static function check(
        string $description,
        ?string $phone = null,
        ?string $ipHash = null,
        ?string $uuid = null
    ): array {
        $score = 0.0;
        $reasons = [];

        // Rule 1: Phone frequency (existing)
        if ($phone) {
            $recentCount = Issue::where('reporter_phone', $phone)
                ->where('created_at', '>=', now()->subDay())
                ->count();
            if ($recentCount > 10) {
                $score += 0.3;
                $reasons[] = 'High volume from this phone number';
            } elseif ($recentCount > 5) {
                $score += 0.1;
                $reasons[] = 'Moderate volume from this phone number';
            }
        }

        // Rule 2: IP frequency (existing, now uses hash)
        if ($ipHash) {
            $ipCount = Issue::where('reporter_ip_hash', $ipHash)
                ->where('created_at', '>=', now()->subDay())
                ->count();
            if ($ipCount > 10) {
                $score += 0.3;
                $reasons[] = 'High volume from this location';
            } elseif ($ipCount > 5) {
                $score += 0.1;
            }
        }

        // Rule 3: URL detection (new)
        preg_match_all('/https?:\/\/[^\s]+|www\.[^\s]+/i', $description, $urls);
        $urlCount = count($urls[0]);
        if ($urlCount > 5) {
            $score += 0.4;
            $reasons[] = "Contains {$urlCount} URLs";
        } elseif ($urlCount > 2) {
            $score += 0.2;
            $reasons[] = "Contains {$urlCount} URLs";
        }

        // Rule 4: ALL CAPS detection (new)
        $letters = preg_replace('/[^a-zA-Z]/', '', $description);
        $upperLetters = preg_replace('/[^A-Z]/', '', $description);
        if (strlen($letters) > 20 && (strlen($upperLetters) / strlen($letters)) > 0.6) {
            $score += 0.25;
            $reasons[] = 'Excessive use of CAPS';
        }

        // Rule 5: Repetitive text (new)
        // Detect repeated words like "buy buy buy" or "cheap cheap cheap"
        $words = str_word_count($description, 1);
        $wordFreq = array_count_values(array_map('strtolower', $words));
        $maxFreq = max($wordFreq);
        if ($maxFreq > 5) {
            $score += 0.2;
            $reasons[] = 'Repetitive text detected';
        }

        // Rule 6: Phone number scraping (new)
        preg_match_all('/9[876]\d{8}/', $description, $phones);
        if (count($phones[0]) > 2) {
            $score += 0.3;
            $reasons[] = 'Contains multiple phone numbers';
        }

        // Rule 7: Excessive emoji/special chars (new)
        $emojiCount = preg_match_all('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}]/u', $description);
        if ($emojiCount > 5) {
            $score += 0.15;
            $reasons[] = 'Excessive emoji characters';
        }

        // Rule 8: Very short + high priority (suspicious pattern)
        if (strlen($description) < 30 && isset($words['priority']) && $words['priority'] === 'critical') {
            $score += 0.15;
            $reasons[] = 'Short description with critical priority';
        }

        return [
            'spam_score' => min($score, 1.0),
            'is_spam' => $score > 0.7,
            'reasons' => $reasons,
        ];
    }
}
```

**Step 2: Wire into IssueController::store()**

In `app/Http/Controllers/IssueController.php::store()`, after validation and before `Issue::create()`:

```php
// Spam detection
$spamResult = AbuseDetectionService::check(
    description: $validated['description'],
    phone: $validated['reporter_phone'] ?? null,
    ipHash: \App\Services\IpAnonymizer::hash($request->ip()),
    uuid: $request->cookie('_auid'),
);
```

Then modify the Issue::create call to include:
```php
'spam_score' => $spamResult['spam_score'],
'hidden_at' => $spamResult['is_spam'] ? now() : null,
'moderation_status' => $spamResult['is_spam'] ? 'pending' : 'approved',
```

Log the result:
```php
\App\Models\SpamLog::create([
    'event_type' => 'spam_detected',
    'loggable_type' => Issue::class,
    'loggable_id' => $issue->id,
    'uuid' => $request->cookie('_auid'),
    'ip_hash' => \App\Services\IpAnonymizer::hash($request->ip()),
    'spam_score' => $spamResult['spam_score'],
    'metadata' => ['reasons' => $spamResult['reasons']],
]);
```

If spam detected, increment suspicion for CAPTCHA:
```php
if ($spamResult['spam_score'] > 0.5) {
    app(TurnstileService::class)->incrementSuspicion($request, 0.3);
}
```

---

### F. Trust Scoring System

**Step 1: Create TrustService**

Create `app/Services/TrustService.php`:

```php
<?php

namespace App\Services;

use App\Models\Issue;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class TrustService
{
    private const CACHE_PREFIX = 'trust:';
    private const CACHE_TTL = 2592000; // 30 days

    public function getScore(?User $user, ?string $uuid): float
    {
        if ($user) {
            return Cache::remember(self::CACHE_PREFIX . 'user:' . $user->id, self::CACHE_TTL, function () use ($user) {
                return $this->calculateUserScore($user);
            });
        }

        if ($uuid) {
            return Cache::get(self::CACHE_PREFIX . 'uuid:' . $uuid, 0.5);
        }

        return 0.5; // Default for unknown
    }

    public function adjustScore(?User $user, ?string $uuid, float $delta): void
    {
        if ($user) {
            $current = $this->getScore($user, null);
            $new = max(0.0, min(1.0, $current + $delta));
            Cache::put(self::CACHE_PREFIX . 'user:' . $user->id, $new, self::CACHE_TTL);

            // Log trust change
            \App\Models\SpamLog::create([
                'event_type' => 'trust_score_changed',
                'uuid' => null,
                'ip_hash' => null,
                'spam_score' => $new,
                'metadata' => ['delta' => $delta, 'user_id' => $user->id],
            ]);
            return;
        }

        if ($uuid) {
            $current = Cache::get(self::CACHE_PREFIX . 'uuid:' . $uuid, 0.5);
            $new = max(0.0, min(1.0, $current + $delta));
            Cache::put(self::CACHE_PREFIX . 'uuid:' . $uuid, $new, self::CACHE_TTL);

            \App\Models\SpamLog::create([
                'event_type' => 'trust_score_changed',
                'uuid' => $uuid,
                'spam_score' => $new,
                'metadata' => ['delta' => $delta],
            ]);
        }
    }

    private function calculateUserScore(User $user): float
    {
        $score = 0.7; // Base for registered users

        // +0.1 per successful submission (max +0.2)
        $submissions = Issue::where('organization_id', $user->organization_id)
            ->where('reporter_email', $user->email)
            ->count();
        $score += min($submissions * 0.1, 0.2);

        // +0.1 if email verified
        if ($user->email_verified_at) {
            $score += 0.1;
        }

        // -0.2 per spam hit (from issues linked to this user)
        $spamHits = Issue::where('reporter_email', $user->email)
            ->where('spam_score', '>', 0.7)
            ->count();
        $score -= $spamHits * 0.2;

        return max(0.0, min(1.0, $score));
    }
}
```

**Step 2: Wire Trust Scoring into Submission**

In `IssueController::store()`, after spam detection:

```php
$trustService = app(TrustService::class);

// Adjust trust based on spam result
if ($spamResult['is_spam']) {
    $trustService->adjustScore(auth()->user(), $request->cookie('_auid'), -0.2);
} else {
    $trustService->adjustScore(auth()->user(), $request->cookie('_auid'), 0.05);
}
```

**Step 3: Use Trust Score in AbuseDetection**

In `AbuseDetectionService::check()`, optionally factor in trust:
- Could lower threshold for low-trust users
- Could skip checks entirely for high-trust users

Add parameter and logic:
```php
public static function check(
    string $description,
    ?string $phone = null,
    ?string $ipHash = null,
    ?string $uuid = null,
    ?float $trustScore = null
): array {
    // ...
    // If high trust, reduce sensitivity
    $multiplier = 1.0;
    if ($trustScore !== null) {
        if ($trustScore > 0.8) $multiplier = 0.5;
        if ($trustScore < 0.3) $multiplier = 1.5;
    }
    // Apply multiplier to final score
    $score = min($score * $multiplier, 1.0);
}
```

---

### G. Human Moderation Fix (CRITICAL)

**Step 1: Create `scopeVisible` on Issue Model**

In `app/Models/Issue.php`, add:
```php
public function scopeVisible($query)
{
    return $query->whereNull('hidden_at');
}
```

**Step 2: Add `->visible()` to ALL Public Queries**

Search every controller for issue queries and add `->visible()`:

**FeedController::index()** (line 17):
```php
$query = Issue::with(['location', 'organization', 'category'])
    ->visible()  // <-- ADD THIS
    ->whereNull('deleted_at');
```

**IssueController::showReference()** (line 146):
```php
$issue = Issue::where('reference_code', $referenceCode)
    ->visible()  // <-- ADD THIS
    ->with([...])
    ->first();

if (!$issue || $issue->hidden_at) {  // <-- also check here
    return redirect()->route('status.check')->with('error', '...');
}
```

**IssueController::trackStatus()** (line 240):
```php
$issue = Issue::with([...])
    ->visible()  // <-- ADD THIS
    ->where('reference_code', strtoupper($request->code))
    ->first();
```

**Admin/Dashboard/DashboardController.php** — Keep admin queries WITHOUT `visible()` so admins see everything. Only public-facing queries get the filter.

BUT the dashboard stats (total_issues count, open_issues) should probably count only visible issues for public stats. For admin stats, count all. The correct approach:

- Stats shown to public: count only visible
- Stats shown to admin: count all

**Admin/Issues/IssueController.php** — Don't add `visible()` here (admin sees everything).

**CommentController::index()** (line 14):
```php
$comments = Comment::with(['user', 'replies.user'])
    ->where('issue_id', $issue->id)
    ->visible()  // <-- ADD THIS (create scopeVisible on Comment too)
    ->approved()
    ->public()
    ->root()
    ->latest()
    ->paginate(20);
```

**Step 3: Add `scopeVisible` to Comment Model**

In `app/Models/Comment.php`:
```php
public function scopeVisible($query)
{
    return $query->whereNull('hidden_at');
}
```

**Step 4: Fix Comment Auto-Approval**

In `CommentController::store()` (line 48), change:
```php
// Before (broken):
'is_approved' => true,

// After (fixed):
'is_approved' => auth()->check(), // Authenticated users auto-approved, anonymous need approval
```

**Step 5: Add Comment Moderation Page**

Create `resources/js/Pages/Admin/Moderation/Comments.jsx` — a simple list of unapproved comments with approve/hide buttons.

In `app/Http/Controllers/Admin/Moderation/ModerationController.php`, add methods:
```php
public function pendingComments()
{
    $comments = Comment::with(['issue', 'user'])
        ->where('is_approved', false)
        ->whereNull('hidden_at')
        ->latest()
        ->paginate(50);
    
    return Inertia::render('Admin/Moderation/Comments', [
        'comments' => $comments,
    ]);
}

public function approveComment(Comment $comment)
{
    $comment->update(['is_approved' => true]);
    return back()->with('success', 'Comment approved.');
}

public function hideComment(Comment $comment)
{
    $comment->update(['hidden_at' => now()]);
    return back()->with('success', 'Comment hidden.');
}
```

Add routes:
```php
Route::get('/admin/moderation/comments', [Admin\Moderation\ModerationController::class, 'pendingComments']);
Route::post('/admin/moderation/comments/{comment}/approve', [Admin\Moderation\ModerationController::class, 'approveComment']);
Route::post('/admin/moderation/comments/{comment}/hide', [Admin\Moderation\ModerationController::class, 'hideComment']);
```

**Step 6: Migration** — Add `moderation_status` to issues

Create migration `database/migrations/2026_07_11_001004_add_moderation_status_to_issues.php`:
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('moderation_status', 20)->default('approved')->after('hidden_at');
    // values: approved, pending, rejected
});
```

---

### H. Spam Audit Logging

**Step 1: Migration** — Create `spam_logs` table

Create migration `database/migrations/2026_07_11_001005_create_spam_logs_table.php`:
```php
Schema::create('spam_logs', function (Blueprint $table) {
    $table->id();
    $table->string('event_type');
    $table->nullableMorphs('loggable');
    $table->string('uuid', 36)->nullable();
    $table->string('ip_hash', 64)->nullable();
    $table->float('spam_score')->nullable();
    $table->json('metadata')->nullable();
    $table->timestamps();
    $table->index('event_type');
    $table->index('created_at');
});
```

**Step 2: Model**

Create `app/Models/SpamLog.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpamLog extends Model
{
    protected $fillable = [
        'event_type',
        'loggable_type',
        'loggable_id',
        'uuid',
        'ip_hash',
        'spam_score',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'spam_score' => 'float',
        ];
    }

    public function loggable()
    {
        return $this->morphTo();
    }
}
```

**Step 3: Log Honeypot Triggers**

In `IssueController::store()` (around line 49-51), add logging:
```php
if ($request->filled('website')) {
    \App\Models\SpamLog::create([
        'event_type' => 'honeypot_trigger',
        'uuid' => $request->cookie('_auid'),
        'ip_hash' => \App\Services\IpAnonymizer::hash($request->ip()),
        'metadata' => ['user_agent' => $request->userAgent()],
    ]);
    
    // Decrease trust for this UUID
    app(TrustService::class)->adjustScore(null, $request->cookie('_auid'), -0.3);
    
    return redirect()->route('dashboard');
}
```

**Step 4: Admin View for Spam Logs**

Add to `Admin/Moderation/ModerationController.php`:
```php
public function spamLogs(Request $request)
{
    $query = SpamLog::latest();
    
    if ($request->filled('event_type')) {
        $query->where('event_type', $request->event_type);
    }
    
    $logs = $query->paginate(50);
    
    return Inertia::render('Admin/Moderation/SpamLogs', [
        'logs' => $logs,
        'event_types' => SpamLog::distinct('event_type')->pluck('event_type'),
    ]);
}
```

Route:
```php
Route::get('/admin/spam-logs', [Admin\Moderation\ModerationController::class, 'spamLogs']);
```

---

### I. Trust → Priority Escalation

**Step 1: Extend TrustService**

Add to `app/Services/TrustService.php`:

```php
public function getEffectivePriority(Issue $issue): string
{
    $priority = $issue->user_priority ?? $issue->priority;
    $levels = ['low' => 0, 'medium' => 1, 'high' => 2, 'critical' => 3];
    $level = $levels[$priority] ?? 1;

    // Get trust score of submitter
    $trustScore = $this->getScore(
        $issue->assignedUser, // This doesn't work for submitter
        $issue->anonymous_uuid
    );

    // High trust: can keep their selected priority
    if ($trustScore > 0.8) {
        // No change, trust their judgement
        return $priority;
    }

    // Low trust: cap at medium
    if ($trustScore < 0.3 && $level > 1) {
        return 'medium';
    }

    // Upvote escalation: 20+ upvotes = bump one level
    $upvoteCount = $issue->upvotes()->count();
    if ($upvoteCount >= 50) {
        $level = min($level + 2, 3);
    } elseif ($upvoteCount >= 20) {
        $level = min($level + 1, 3);
    }

    // Merged duplicates escalation: 5+ merged = bump one level
    $mergedCount = Issue::where('duplicate_of_id', $issue->id)->count();
    if ($mergedCount >= 5) {
        $level = min($level + 1, 3);
    }

    $reverse = ['low', 'medium', 'high', 'critical'];
    return $reverse[$level];
}
```

**Step 2: Wire into Issue Creation**

In `IssueController::store()`, after issue creation and spam detection:

```php
$trustService = app(TrustService::class);
$effectivePriority = $trustService->getEffectivePriority($issue);

$issue->update([
    'priority' => $effectivePriority,
]);
```

**Step 3: Wire into Upvote Milestones**

When an upvote is toggled and count hits a milestone (20, 50), re-evaluate priority:

In `UpvoteController::toggle()`:
```php
$issue = Issue::find($issueId);
$upvoteCount = $issue->upvotes()->count();

if ($upvoteCount === 20 || $upvoteCount === 50) {
    $trustService = app(TrustService::class);
    $newPriority = $trustService->getEffectivePriority($issue);
    
    if ($newPriority !== $issue->priority) {
        $oldPriority = $issue->priority;
        $issue->update(['priority' => $newPriority]);
        
        IssueEvent::create([
            'issue_id' => $issue->id,
            'type' => 'priority_changed',
            'description' => "Priority auto-escalated from {$oldPriority} to {$newPriority} (community support).",
            'metadata' => ['from' => $oldPriority, 'to' => $newPriority, 'reason' => 'upvote_milestone'],
            'is_public' => true,
        ]);
    }
}
```

---

## Database Changes (Epic 16)

1. `database/migrations/2026_07_11_001001_add_anonymous_uuid_to_issues.php`
2. `database/migrations/2026_07_11_001002_add_anonymous_uuid_to_upvotes.php`
3. `database/migrations/2026_07_11_001003_add_ip_hash_to_issues.php`
4. `database/migrations/2026_07_11_001004_add_moderation_status_to_issues.php`
5. `database/migrations/2026_07_11_001005_create_spam_logs_table.php`

---

## Files to Create

1. `app/Http/Middleware/SetAnonymousUuid.php`
2. `app/Http/Middleware/AdaptiveCaptcha.php`
3. `app/Services/IpAnonymizer.php`
4. `app/Services/TurnstileService.php`
5. `app/Services/TrustService.php`
6. `app/Models/SpamLog.php`
7. `app/Console/Commands/AnonymizeIps.php`
8. `config/turnstile.php`
9. `resources/js/Components/UI/TurnstileWidget.jsx`
10. `resources/js/Pages/Admin/Moderation/Comments.jsx`
11. `resources/js/Pages/Admin/Moderation/SpamLogs.jsx`
12. `database/migrations/2026_07_11_001001_add_anonymous_uuid_to_issues.php`
13. `database/migrations/2026_07_11_001002_add_anonymous_uuid_to_upvotes.php`
14. `database/migrations/2026_07_11_001003_add_ip_hash_to_issues.php`
15. `database/migrations/2026_07_11_001004_add_moderation_status_to_issues.php`
16. `database/migrations/2026_07_11_001005_create_spam_logs_table.php`

---

## Files to Modify

1. `app/Providers/AppServiceProvider.php` — Named rate limiters, schedule AnonymizeIps command
2. `bootstrap/app.php` — Register middleware (SetAnonymousUuid, AdaptiveCaptcha)
3. `app/Models/Issue.php` — Add scopeVisible, add fillable (anonymous_uuid, reporter_ip_hash, spam_score, moderation_status)
4. `app/Models/Comment.php` — Add scopeVisible
5. `app/Models/Upvote.php` — Add anonymous_uuid fillable
6. `app/Http/Controllers/IssueController.php` — Wire AbuseDetectionService, spam score storage, UUID storage, IP hashing, trust score adjustment, priority escalation, log honeypot, log spam events, CAPTCHA validation
7. `app/Http/Controllers/FeedController.php` — Add `->visible()` to query
8. `app/Http/Controllers/CommentController.php` — Add `->visible()`, conditional is_approved
9. `app/Http/Controllers/UpvoteController.php` — Store UUID, milestone priority escalation
10. `app/Http/Controllers/Admin/Moderation/ModerationController.php` — Add comment moderation methods, spam log viewer
11. `app/Services/AbuseDetectionService.php` — Full rewrite with 8 rules, spam_score return
12. `routes/web.php` — Apply named rate limiters, new moderation routes, spam log routes
13. `routes/web.php` — Apply AdaptiveCaptcha middleware to submit routes
14. `resources/js/Pages/Public/Submit.jsx` — Add TurnstileWidget component
15. `.env` — Add TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
16. `resources/js/Pages/Admin/Moderation/Index.jsx` — Link to comment moderation
17. `resources/js/lang/en.js` — New labels
18. `resources/js/lang/np.js` — New labels

---

## Tests

### Unit Tests

| Test | File | What it tests |
|------|------|---------------|
| IpAnonymizer produces consistent hash | `tests/Unit/IpAnonymizerTest.php` | Same IP + salt = same hash |
| IpAnonymizer produces different hash for different IPs | `tests/Unit/IpAnonymizerTest.php` | Different IP = different hash |
| IpAnonymizer::isPrivate returns true for 192.168.* | `tests/Unit/IpAnonymizerTest.php` | Private IP detection |
| TurnstileService::shouldShowCaptcha default false | `tests/Unit/TurnstileServiceTest.php` | No suspicion = no captcha |
| TurnstileService::incrementSuspicion works | `tests/Unit/TurnstileServiceTest.php` | After increment, shouldShowCaptcha returns true |
| AbuseDetectionService score for clean text | `tests/Unit/AbuseDetectionServiceTest.php` | Normal complaint = score < 0.3 |
| AbuseDetectionService detects URLs | `tests/Unit/AbuseDetectionServiceTest.php` | 10 URLs = score > 0.7 |
| AbuseDetectionService detects ALL CAPS | `tests/Unit/AbuseDetectionServiceTest.php` | >60% caps = score increase |
| AbuseDetectionService detects phone scraping | `tests/Unit/AbuseDetectionServiceTest.php` | 5 phone numbers = score > 0.5 |
| TrustService::getScore default for new UUID | `tests/Unit/TrustServiceTest.php` | Returns 0.5 |
| TrustService::adjustScore increases | `tests/Unit/TrustServiceTest.php` | +0.1 increases score |
| TrustService::adjustScore respects bounds | `tests/Unit/TrustServiceTest.php` | Cannot go below 0 or above 1 |
| SpamLog has fillable attributes | `tests/Unit/SpamLogTest.php` | Model casts and fillable work |
| Issue scopeVisible returns only non-hidden | `tests/Unit/IssueTest.php` | hidden issues excluded |
| TrustService::getEffectivePriority caps low-trust | `tests/Unit/TrustServiceTest.php` | Low-trust user's "critical" → "medium" |

### Feature Tests

| Test | File | What it tests |
|------|------|---------------|
| Anonymous UUID set on first visit | `tests/Feature/AnonymousUuidTest.php` | Cookie present after first page load |
| UUID persists across requests | `tests/Feature/AnonymousUuidTest.php` | Same UUID returned on second request |
| UUID stored with new issue | `tests/Feature/AnonymousUuidTest.php` | Issue.anonymous_uuid matches cookie |
| Rate limiter blocks >3 submissions/min | `tests/Feature/RateLimitingTest.php` | 4th request returns 429 |
| Rate limiter uses UUID + IP combo | `tests/Feature/RateLimitingTest.php` | Different UUID bypasses IP limit |
| CAPTCHA shown when suspicion high | `tests/Feature/CaptchaTest.php` | captcha_required = true in props |
| CAPTCHA validated on submission | `tests/Feature/CaptchaTest.php` | Missing token returns validation error |
| Spam complaint hidden from feed | `tests/Feature/SpamDetectionTest.php` | Spam score > 0.7 → not in feed |
| Spam complaint visible in admin | `tests/Feature/SpamDetectionTest.php` | Admin dashboard shows it |
| Clean submission visible in feed | `tests/Feature/SpamDetectionTest.php` | Spam score < 0.3 → in feed |
| Comment moderation: anonymous needs approval | `tests/Feature/CommentModerationTest.php` | is_approved = false for anonymous |
| Comment moderation: user auto-approved | `tests/Feature/CommentModerationTest.php` | is_approved = true for logged-in |
| Honeypot trigger logged | `tests/Feature/SpamLoggingTest.php` | SpamLog entry created |
| Hidden issue returns 404 for public | `tests/Feature/ModerationVisibilityTest.php` | Reference page returns redirect |
| Trust score adjusted after spam hit | `tests/Feature/TrustScoreTest.php` | Score decreases by 0.2 |
| Priority auto-escalated on 20 upvotes | `tests/Feature/PriorityEscalationTest.php` | Priority bumps after milestone |
| IP hash stored instead of raw | `tests/Feature/IpAnonymizationTest.php` | reporter_ip_hash is 64-char hex |
| Raw IP nullified after 24h | `tests/Feature/IpAnonymizationTest.php` | Artisan command clears old IPs |

---

## Implementation Order (Step-by-Step)

Follow this exact order. Each layer builds on the previous.

### Phase 1: Foundation (Layers A, B, C)

1. **Create IpAnonymizer** — Simple service, no deps
2. **Migration** — Add `reporter_ip_hash` to issues
3. **Controller** — Start hashing IP on submission
4. **Create SetAnonymousUuid middleware** — Register in bootstrap/app.php
5. **Migration** — Add `anonymous_uuid` to issues and upvotes
6. **Controller** — Store UUID on submission and upvote
7. **Register named rate limiters** — In AppServiceProvider
8. **Update routes** — Apply named limiters to all endpoints
9. **Create AnonymizeIps command** — Register in AppServiceProvider
10. **Run tests:** `php artisan test --filter=IpAnonymizer --filter=AnonymousUuid --filter=RateLimiting`

### Phase 2: CAPTCHA + Spam Detection (Layers D, E)

11. **Create config/turnstile.php** — Add .env entries
12. **Create TurnstileService** — verify + shouldShowCaptcha + suspicion management
13. **Create AdaptiveCaptcha middleware** — Register for submit routes
14. **Create TurnstileWidget.jsx** — Frontend component
15. **Integrate into Submit.jsx** — Add widget to form
16. **Rewrite AbuseDetectionService** — 8 rules, spam_score return
17. **Wire into IssueController::store** — Call before issue creation
18. **Store spam_score on issue** — Set hidden_at if spam
19. **Run tests:** `php artisan test --filter=Turnstile --filter=SpamDetection`

### Phase 3: Trust + Moderation Fix (Layers F, G)

20. **Create TrustService** — Score calculation, Redis-backed
21. **Wire into submission** — Adjust trust on submit
22. **Migration** — Add moderation_status to issues
23. **Add scopeVisible to Issue model**
24. **Add scopeVisible to Comment model**
25. **Add ->visible() to ALL public queries** — Feed, Reference, StatusCheck, CommentController
26. **Fix CommentController::store** — Conditional is_approved
27. **Create comment moderation pages** — Admin/Moderation/Comments.jsx
28. **Run tests:** `php artisan test --filter=Trust --filter=ModerationVisibility --filter=CommentModeration`

### Phase 4: Audit + Priority Escalation (Layers H, I)

29. **Migration** — Create spam_logs table
30. **Create SpamLog model**
31. **Log honeypot triggers** — In IssueController::store
32. **Log rate limit hits** — In rate limiter response callback
33. **Log spam detection** — In IssueController::store
34. **Create admin spam log viewer** — SpamLogs.jsx page
35. **Add getEffectivePriority to TrustService** — Priority escalation logic
36. **Wire into Issue creation** — Set effective priority
37. **Wire into UpvoteController** — Re-evaluate on milestone
38. **Run full test suite:** `php artisan test`
39. **Run all tests:** `php artisan test --filter=Epic16`

---

## Commit

```bash
git add -A && git commit -m "add adaptive rate limiting, anonymous UUID, IP hashing, CAPTCHA, spam detection, trust scoring, moderation fixes, audit logging, and priority escalation"
```
