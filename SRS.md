# Software Requirements Specification (SRS)
## Nagarik Sarokar — Complaint Management System

**Version:** 1.0
**Date:** July 11, 2026
**Prepared for:** KMC (Kathmandu Metropolitan City) Deployment
**Document Standard:** IEEE 830-1998

---

## Session Recovery
_If your session with the AI resets, read this first:_

1. **Last known state:** Epic 15 and Epic 16 are in planning/design phase. SRS is complete.
2. **Run these commands to recover:**
   ```bash
   git status
   git log --oneline -5
   git diff --stat
   ```
3. **Check existing files:**
   - `SRS.md` — This requirements document
   - `Epic15.md` — Epic 15 implementation plan
   - `Epic16.md` — Epic 16 implementation plan
   - `AGENTS.md` — Full project context
   - `FridayTask.md` — Overall execution tracking
4. **Continue from:** Read the epic file that was in progress, pick up from the first unchecked item.

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the **Nagarik Sarokar** Complaint Management System, specifically for two new feature sets:
- **Epic 15:** Title field for complaints, social proof display in feed, priority override workflow
- **Epic 16:** Nine-layer spam prevention and security hardening system

The intended audience includes developers implementing these features, QA engineers writing tests, and project stakeholders reviewing scope.

### 1.2 Scope
The system is a web-based complaint management platform built with Laravel 13 + React 19 + Inertia 3 + Tailwind 4. It allows citizens to submit complaints anonymously or with identity, track them via reference codes, and view a public feed of all complaints. Administrators and staff manage complaints through role-based dashboards.

This SRS covers:
- Adding a `title` field to complaints (currently only `description` exists)
- Displaying upvoter names as social proof in the public feed ("Himal + 5 others")
- Priority override workflow: user-selected vs admin-verified priority
- Nine-layer spam prevention: adaptive rate limiting, anonymous UUID, IP hashing, CAPTCHA, rule-based spam detection, trust scoring, moderation fixes, audit logging, priority escalation from trust

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| **Issue / Complaint** | A citizen-submitted report of a problem (pothole, water leak, etc.) |
| **Reference Code** | Unique alphanumeric code (e.g., `KTM-0042`) used to track a complaint |
| **Upvote** | A "Me Too" action — citizens endorse a complaint without creating a duplicate |
| **SLA** | Service Level Agreement — time limit to respond based on priority |
| **Trust Score** | A calculated numeric value indicating how trustworthy a submission/session is |
| **UUID Cookie** | A browser-stored unique identifier for anonymous user tracking |
| **Turnstile** | Cloudflare's free CAPTCHA replacement (privacy-first, no data collection) |
| **hidden_at** | A timestamp column; content with `hidden_at` set is hidden from public view |
| **Honeypot** | A hidden form field that bots fill in but humans don't see |
| **Jaccard Similarity** | A text comparison metric: `|intersection| / |union|` of word sets |

### 1.4 References
| Reference | Source |
|-----------|--------|
| AGENTS.md | Project context, architecture decisions, completed epics |
| FridayTask.md | Overall execution plan and status tracking |
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications |
| Laravel 13 Docs | https://laravel.com/docs/ |
| Cloudflare Turnstile | https://developers.cloudflare.com/turnstile/ |

### 1.5 Overview
Section 2 describes the overall system context and user roles. Section 3 details all functional and non-functional requirements. Section 4 provides use case models.

---

## 2. Overall Description

### 2.1 Product Perspective
The Nagarik Sarokar system is composed of:
- **Public-facing pages:** Dashboard, Submit Complaint, Feed, Track Status, Reference Page
- **Admin dashboard:** Issue management, organizations, staff, moderation, analytics
- **Staff interface:** Issue detail, comments, assignment
- **API endpoints:** Upvote toggle, comments CRUD, stats, public feed

Epic 15 and 16 extend the existing system — they do not replace any existing functionality. All new features are backward-compatible.

### 2.2 Product Functions (Summary)

| Function | Epic | Description |
|----------|------|-------------|
| Title Field | 15 | Add `title` column to issues, display on feed/cards/detail |
| Social Proof | 15 | Show upvoter names on complaint cards |
| Priority Override | 15 | Separate `user_priority` from `admin_priority`, admin verification workflow |
| Auto-Merge Duplicates | 15 | Automatically merge high-similarity complaints, same ref code |
| Adaptive Rate Limiting | 16 | Redis sliding window per IP/UUID |
| UUID Cookie | 16 | Long-lived anonymous user identifier |
| IP Hashing | 16 | SHA256 hash + salt instead of raw IP storage |
| CAPTCHA | 16 | Cloudflare Turnstile on submission form |
| Spam Detection | 16 | Wire + extend AbuseDetectionService with rules |
| Trust Scoring | 16 | Calculated score from multiple signals |
| Moderation Fix | 16 | Filter `hidden_at` on all queries, comment approval queue |
| Audit Logging | 16 | Track all spam/moderation events |
| Trust→Priority Escalation | 16 | Auto-bump priority for high-trust reports |

### 2.3 User Characteristics

| Role | Description | Affected by Epic |
|------|-------------|------------------|
| **Anonymous Citizen** | Submits complaints without login. Tracked by session/UUID. | 15 (title, upvote names), 16 (captcha, rate limit) |
| **Registered Citizen** | Has an account. Can submit comments, upvote, track complaints. | 15 (social proof — their name shown), 16 (higher trust score) |
| **Staff** | Can view assigned issues, add comments/updates. | 15 (priority verification), 16 (moderation queue) |
| **Organization Admin** | Manages staff, departments, issues for their org. | 15 (priority verification), 16 (moderation) |
| **Super Admin** | Full system access. Manages all orgs, users, settings. | 15 (override priority), 16 (moderation, spam config) |

### 2.4 Constraints
1. **Zero additional cost** — all services must be free (Turnstile, Redis via Laravel, no AI APIs)
2. **Backward compatibility** — existing API responses must not break (add fields, don't remove)
3. **Session resilience** — if dev session resets, documents must allow seamless continuation
4. **Mobile-first** — all UI changes must work on 320px+ screens
5. **Nepali language support** — all new labels need `en.js` and `np.js` translations

### 2.5 Assumptions
1. Redis is already installed and configured (used for cache + broadcast)
2. `.env` has `QUEUE_CONNECTION=database` set (async processing)
3. Inertia is the frontend rendering engine (no separate API/SPA)
4. The `upvotes` table already exists with `user_id`, `session_id`, `issue_id`
5. The `hidden_at` column already exists on `issues` and `comments` tables

---

## 3. Specific Requirements

### 3.1 Functional Requirements — Epic 15: Submission Improvements & Social Trust

#### FR-15.1: Title Field
**ID:** FR-15.1
**Priority:** High
**Description:** Every complaint must have a short title in addition to the full description.

**Requirements:**
- FR-15.1.1: Migration to add `title` column to `issues` table (string, max 255, nullable initially)
- FR-15.1.2: Add `title` to Issue model `$fillable` and validation rules
- FR-15.1.3: Add title input field to Step 1 of Submit.jsx form (between priority and location)
- FR-15.1.4: Title must be required, max 200 characters
- FR-15.1.5: Display title on ComplaintCard (replacing description preview as primary text)
- FR-15.1.6: Display title on Reference page, StatusCheck, Admin issue list/detail
- FR-15.1.7: Title must be included in API responses (feed, reference, admin)
- FR-15.1.8: Translations for title label in `en.js` and `np.js`
- FR-15.1.9: Title shown in "Review Summary" step of submission form

**Acceptance Criteria:**
- Citizen can type a title during submission
- Title appears on the complaint card in the feed (bold, prominent)
- Title appears on the reference page
- Title is searchable in admin filters
- Existing complaints without a title show `(No title)` or first 50 chars of description

#### FR-15.2: Social Proof — Upvoter Names in Feed
**ID:** FR-15.2
**Priority:** Medium
**Description:** The public feed must show who upvoted each complaint, displaying real names of authenticated users and a count of anonymous upvotes.

**Requirements:**
- FR-15.2.1: When loading feed issues, eager-load upvotes with user relationship
- FR-15.2.2: For each issue, collect:
  - Up to 2 names of authenticated users who upvoted (from `upvotes.user.name`)
  - Total count of anonymous upvotes (upvotes with only `session_id`, no `user_id`)
  - Total upvote count
- FR-15.2.3: Format social proof string based on rules:
  - 0 upvotes: show nothing (or "Be the first to upvote")
  - All authenticated + ≤2 names: `"Ram, Shyam"` (no count suffix)
  - All anonymous: `"5 people"` (just count, no names)
  - Mixed with 1 named: `"Himal + 4 others"`
  - Mixed with 2 named: `"Ram, Shyam + 3 others"`
- FR-15.2.4: Show social proof on ComplaintCard below the upvote button
- FR-15.2.5: Show social proof on Admin issue list
- FR-15.2.6: Clicking named users links to their profile (future)
- FR-15.2.7: Cache the social proof data (5 min TTL, invalidate on upvote toggle)

**Acceptance Criteria:**
- ComplaintCard shows `"Ram, Shyam + 3 others"` when 2 named + 3 anonymous upvoted
- ComplaintCard shows `"5 people"` when all 5 upvoters are anonymous
- ComplaintCard shows `"Himal + 4 others"` when 1 named + 4 anonymous
- Data refreshes when new upvote toggled
- Empty state: no text shown when 0 upvotes

#### FR-15.3: Priority Override Workflow
**ID:** FR-15.3
**Priority:** High
**Description:** Separate the user's self-selected priority from the admin-verified priority. Admin/staff can review and confirm or override priority.

**Requirements:**
- FR-15.3.1: Migration to add columns to `issues` table:
  - `user_priority` (enum: low/medium/high/critical) — what the citizen selected
  - `admin_priority` (enum: low/medium/high/critical, nullable) — what admin set
  - `priority_reviewed_at` (datetime, nullable) — when admin last reviewed
  - `priority_reviewed_by` (FK→users, nullable) — who reviewed
- FR-15.3.2: Rename existing `priority` column logic: on submission, set both `user_priority` and `priority` to user's selection
- FR-15.3.3: In Feed display, show `admin_priority` if set, otherwise fall back to `priority`
- FR-15.3.4: In Admin issue detail, show both values with a visual indicator:
  - `User said: Critical` / `Admin: Medium` (with warning icon if mismatch)
- FR-15.3.5: Admin/Staff can update `admin_priority` via a dropdown on issue detail page
- FR-15.3.6: When admin changes `admin_priority`, set `priority = admin_priority`, `priority_reviewed_at = now()`, `priority_reviewed_by = auth()->id()`
- FR-15.3.7: Admin dashboard sort/filter uses `priority` (which reflects admin override)
- FR-15.3.8: IssueEvent created when admin overrides priority: `"Priority changed from Critical to Medium by Admin"`

**Acceptance Criteria:**
- New issues show `user_priority = priority = citizen's selection`
- Admin dashboard filters work on admin-confirmed priority
- Warning badge shows when `user_priority !== priority`
- IssueEvent logged on every override
- SLA engine uses `priority` (which is admin-confirmed)

#### FR-15.4: Duplicate Auto-Merge
**ID:** FR-15.4
**Priority:** Medium
**Description:** When a new complaint is highly similar to an existing one, automatically merge it so all content consolidates on the parent issue.

**Requirements:**
- FR-15.4.1: After complaint submission, if `DuplicateDetectionService` finds a match with similarity > 0.5:
  - Create the new issue (normal flow, submitter has a record)
  - Immediately auto-merge: set `status = 'merged'`, `duplicate_of_id = parent->id`
  - Assign the parent's reference code to the new issue's `display_reference_code` or redirect to parent's ref page
- FR-15.4.2: IssueEvent on child: `"Combined with similar report {PARENT_REF}"`
- FR-15.4.3: IssueEvent on parent: `"Another citizen also reported this issue"`
- FR-15.4.4: Parent issue shows `"X others also reported this"` (count = merged child issues)
- FR-15.4.5: Create `issue_media` table (id, issue_id, path, type (photo/video), submitted_by_session nullable, created_at) to consolidate photos/videos from merged issues
- FR-15.4.6: On merge, copy child's media records to `issue_media` linked to parent
- FR-15.4.7: Feed shows `"Ram, Shyam + 2 others reported this"` for parent issues with merged children
- FR-15.4.8: When a merged issue's reference code is accessed, redirect to parent's reference page

**Acceptance Criteria:**
- High-similarity complaint auto-merges within same request
- Citizen sees parent's reference code and a "combined" message
- Parent shows merged count in feed
- Old merged reference code redirects to parent
- Photos/videos from both issues visible on parent page

---

### 3.2 Functional Requirements — Epic 16: Spam Prevention & Security

#### FR-16.1: Adaptive Rate Limiting (Redis Sliding Window)
**ID:** FR-16.1
**Priority:** High
**Description:** Replace static Laravel `throttle` middleware with adaptive rate limiting using Redis sliding window, based on both IP and UUID.

**Requirements:**
- FR-16.1.1: Create named rate limiters in `AppServiceProvider::boot()` using `RateLimiter::for()`:
  - `issues:submit` — 3 per minute per IP+UUID combo
  - `status:check` — 10 per minute per IP
  - `issues:feedback` — 5 per minute per IP
  - `comments:store` — 10 per minute per IP+session
  - `admin:login` — 5 per minute per IP
  - `feed:view` — 60 per minute per IP
- FR-16.1.2: Use `Cache::store('redis')` for rate limiter storage
- FR-16.1.3: Apply named limiters via middleware in routes/web.php:
  ```php
  Route::post('/issues', [IssueController::class, 'store'])
      ->middleware('throttle:issues:submit');
  ```
- FR-16.1.4: Rate limit exceeded response: return Inertia render with error (not JSON) — user sees friendly message
- FR-16.1.5: Log rate limit hits to `spam_logs` for admin monitoring
- FR-16.1.6: Penality escalation: if user hits rate limit 3+ times in 1 hour, double the cooldown (adaptive)

**Acceptance Criteria:**
- Submitting >3 complaints in 1 minute from same IP+UUID returns rate limit error
- Admin login brute force blocked after 5 attempts
- Feed scraping limited to 60 req/min
- Rate limit hits are logged in spam_logs table

#### FR-16.2: Anonymous UUID Cookie
**ID:** FR-16.2
**Priority:** Medium
**Description:** Set a long-lived UUID cookie for anonymous user identification that survives browser restarts (unlike session cookies).

**Requirements:**
- FR-16.2.1: Create middleware `SetAnonymousUuid` that:
  - Checks for `_auid` cookie (anonymous user ID)
  - If missing, generates UUID v4, sets cookie with 365-day expiry, path=/, httponly, samesite=lax
  - If present, uses existing value
- FR-16.2.2: Register middleware in `bootstrap/app.php` (web middleware group, after StartSession)
- FR-16.2.3: Add `anonymous_uuid` column to `issues` table (string, nullable, indexed)
- FR-16.2.4: Add `anonymous_uuid` to upvotes (nullable, along with session_id)
- FR-16.2.5: Use UUID instead of session ID for rate limiting (more persistent)
- FR-16.2.6: Use UUID for anonymous trust scoring

**Acceptance Criteria:**
- First visit sets `_auid` cookie with UUID
- Cookie persists across browser restarts (365 days)
- UUID is stored with new issues (in addition to IP)
- UUID is used for anonymous upvote tracking alongside session_id

#### FR-16.3: Privacy-Preserving IP Hashing
**ID:** FR-16.3
**Priority:** Medium
**Description:** Hash IP addresses before storage to protect user privacy while still enabling abuse detection.

**Requirements:**
- FR-16.3.1: Create `IpAnonymizer` service:
  ```php
  class IpAnonymizer {
      public static function hash(string $ip, string $salt = null): string {
          $salt = $salt ?? config('app.key');
          return hash('sha256', $ip . $salt);
      }
  }
  ```
- FR-16.3.2: Add `reporter_ip_hash` column to `issues` table (string, 64 chars, indexed)
- FR-16.3.3: On submission, store hashed IP (not raw) in `reporter_ip_hash`
- FR-16.3.4: Keep `reporter_ip` for 24 hours only (temporary debugging), then nullify
- FR-16.3.5: Create Artisan command `php artisan issues:anonymize-ips` to nullify old raw IPs
- FR-16.3.6: Update AbuseDetectionService to use hashed IP instead of raw

**Acceptance Criteria:**
- New issues store SHA256 hash of IP
- Raw IP is nullified after 24 hours (via cron)
- Abuse detection still works on hashed IP
- No privacy risk from leaked `reporter_ip` column

#### FR-16.4: Adaptive CAPTCHA (Cloudflare Turnstile)
**ID:** FR-16.4
**Priority:** High
**Description:** Add Cloudflare Turnstile CAPTCHA to the submission form, shown only when suspicious behavior is detected.

**Requirements:**
- FR-16.4.1: Register for Cloudflare Turnstile (free, no credit card required)
- FR-16.4.2: Add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to `.env`
- FR-16.4.3: Create `config/turnstile.php` with site key, secret key, and whether to always show
- FR-16.4.4: Create `app/Services/TurnstileService.php` with methods:
  - `shouldShowCaptcha(Request $request): bool` — returns true if suspicious (rapid submission, low trust score, VPN detected)
  - `verify(string $token): bool` — calls Cloudflare API to validate token
- FR-16.4.5: Create middleware `AdaptiveCaptcha` that:
  - Checks `TurnstileService::shouldShowCaptcha()`
  - If true, adds `captcha_required = true` to Inertia shared props
  - Validates captcha on form submission
- FR-16.4.6: Frontend: Add Turnstile widget component that renders only when `captcha_required` is true
- FR-16.4.7: Backend validation rule: if captcha was required, validate the turnstile token
- FR-16.4.8: On captcha failure: return error, increment suspicion score
- FR-16.4.9: Cache Turnstile verification results for 2 minutes (avoid hitting Cloudflare API repeatedly)

**Acceptance Criteria:**
- First-time visitor: no CAPTCHA shown (smooth UX)
- After 3+ rapid submissions: CAPTCHA appears
- Valid CAPTCHA: submission proceeds
- Invalid CAPTCHA: error message shown, no submission
- Turnstile verification is cached (doesn't hit API on every request)

#### FR-16.5: Rule-Based Spam Detection (Wire AbuseDetectionService)
**ID:** FR-16.5
**Priority:** High
**Description:** Wire the existing (dead code) `AbuseDetectionService` into the submission flow and extend with additional rules.

**Requirements:**
- FR-16.5.1: Call `AbuseDetectionService::check()` in `IssueController::store()` before creating the issue
- FR-16.5.2: Add new detection rules to `AbuseDetectionService`:
  - **URL detection:** Check description for URLs (`http://`, `https://`, `www.`) — flag if >3 URLs
  - **Repetitive text:** Check for repeated characters (`aaaaaa`), repeated words (`buy buy buy`) — flag if detected
  - **ALL CAPS:** If >60% of description is uppercase — flag (likely spam/shouting)
  - **Phone number scraping:** Check if description contains >2 phone numbers — flag
  - **Excessive emoji/unicode:** Check for >5 emoji characters — flag
- FR-16.5.3: Return spam score (0.0 to 1.0) instead of boolean flag:
  ```php
  return [
      'spam_score' => $score,      // 0.0 (clean) to 1.0 (definitely spam)
      'is_spam' => $score > 0.7,   // auto-flag as spam
      'reasons' => $reasons,       // array of human-readable reasons
  ];
  ```
- FR-16.5.4: If `spam_score > 0.7`: set `hidden_at = now()` on the issue (quarantine from public)
- FR-16.5.5: If `spam_score > 0.5`: show CAPTCHA on next submission from this UUID
- FR-16.5.6: If `spam_score > 0.3`: log to spam_logs for admin review
- FR-16.5.7: Add `spam_score` column to issues table (float, nullable)
- FR-16.5.8: Pass spam score and reasons to IssueEvent metadata

**Acceptance Criteria:**
- Issue with 0 URLs, normal text: spam_score ≈ 0 (no action)
- Issue with 5 URLs and "BUY NOW!!!": spam_score > 0.7, hidden from public
- AbuseDetectionService is no longer dead code
- Spam score stored on Issue record
- Admin can see spam score and reasons in issue detail

#### FR-16.6: Trust Scoring System
**ID:** FR-16.6
**Priority:** Medium
**Description:** Assign a trust score to each anonymous user (by UUID) and registered user, adjusting based on behavior.

**Requirements:**
- FR-16.6.1: Create `app/Services/TrustService.php` with:
  - `getScore(?User $user, ?string $uuid): float` — returns 0.0 to 1.0
  - `adjustScore(?User $user, ?string $uuid, float $delta): void` — adjust up/down
- FR-16.6.2: Trust score calculation signals:
  - **Base score:** 0.5 for anonymous, 0.7 for registered users
  - **+0.1** per successfully submitted complaint (max +0.2)
  - **+0.1** per CAPTCHA passed (max +0.2)
  - **+0.2** for email verification (registered users)
  - **+0.1** for verified phone (registered users)
  - **-0.2** per spam detection hit (no floor)
  - **-0.1** per rate limit hit (no floor)
  - **-0.3** per honeypot trigger (no floor)
- FR-16.6.3: Store trust score in Redis (key: `trust:{uuid}` or `trust:user:{id}`)
  - TTL: 30 days of inactivity, extend on each activity
- FR-16.6.4: Use trust score to:
  - **High trust (>0.8):** Skip CAPTCHA, auto-approve comments, priority boost
  - **Medium trust (0.4-0.8):** Normal flow
  - **Low trust (<0.4):** Always show CAPTCHA, higher rate limit sensitivity, manual comment approval
  - **Very low (<0.2):** Shadowban (show success but hide from public)
- FR-16.6.5: Add `trust_score` to admin issue detail for context

**Acceptance Criteria:**
- New anonymous user starts at 0.5
- After 2 successful submissions + CAPTCHA pass: 0.8+
- After 3 spam hits: drops below 0.2 (shadowban)
- Trust score persists across sessions (UUID-based)
- Admin can view trust score on user/issue detail

#### FR-16.7: Human Moderation Fix
**ID:** FR-16.7
**Priority:** **CRITICAL**
**Description:** Fix the broken moderation system — `hidden_at` is never filtered in queries, and comments are auto-approved with no moderation.

**Requirements:**
- FR-16.7.1: Add `moderation_status` column to issues table (enum: `approved`, `pending`, `rejected`, default `approved`)
- FR-16.7.2: Create global scope or helper method `scopeVisible($query)` on Issue model:
  ```php
  public function scopeVisible($query) {
      return $query->whereNull('hidden_at');
  }
  ```
- FR-16.7.3: Add `->visible()` to ALL public-facing queries:
  - FeedController::index (line 17)
  - IssueController::showReference (line 146)
  - IssueController::trackStatus (line 240)
  - Admin/Dashboard/DashboardController::index (line 16)
  - Admin/Issues/IssueController::index (line 22)
  - StatsController (all endpoints)
- FR-16.7.4: Add `->visible()` to Comment queries:
  - CommentController::index (line 14)
  - Feed, Reference, Admin comment displays
- FR-16.7.5: Admin and Staff should see hidden content (admin queries don't use `visible()` scope)
- FR-16.7.6: For comments: remove hardcoded `is_approved = true` in CommentController::store (line 48)
  - Set `is_approved = auth()->check() ? true : false`
  - Anonymous user comments require admin approval
  - Staff and authenticated users get auto-approved
- FR-16.7.7: Add comment moderation queue to admin panel:
  - `GET /admin/moderation/comments` — list unapproved comments
  - `POST /admin/moderation/comments/{comment}/approve` — approve
  - `POST /admin/moderation/comments/{comment}/hide` — hide
- FR-16.7.8: Sync existing admin moderation page (Admin/Moderation/Index.jsx) to read hidden_at properly

**Acceptance Criteria:**
- Public feed does NOT show issues with `hidden_at` set
- Reference page does NOT show hidden issues (404 or "not found")
- Status check does NOT show hidden issues
- Admin dashboard shows ALL issues (including hidden)
- Comments from anonymous users require approval
- Comments from registered/staff users are auto-approved
- Admin moderation queue shows pending comments

#### FR-16.8: Spam Audit Logging
**ID:** FR-16.8
**Priority:** Medium
**Description:** Log all spam-related events for monitoring and investigation.

**Requirements:**
- FR-16.8.1: Create `spam_logs` table migration:
  ```php
  Schema::create('spam_logs', function (Blueprint $table) {
      $table->id();
      $table->string('event_type');         // honeypot_trigger, rate_limit_hit, spam_detected, captcha_fail, etc.
      $table->nullableMorphs('loggable');   // link to issue/comment if applicable
      $table->string('uuid', 36)->nullable(); // anonymous user UUID
      $table->string('ip_hash', 64)->nullable(); // hashed IP
      $table->float('spam_score')->nullable();
      $table->json('metadata')->nullable();  // reasons, request data (safe fields only)
      $table->timestamps();
  });
  ```
- FR-16.8.2: Create `App\Models\SpamLog` model with fillable and casts
- FR-16.8.3: Log events from:
  - Honeypot trigger (`event_type: honeypot_trigger`)
  - Rate limit hit (`event_type: rate_limit_hit`)
  - Spam detection (`event_type: spam_detected`)
  - CAPTCHA fail (`event_type: captcha_fail`)
  - Trust score change (`event_type: trust_score_changed`)
  - Moderation action (`event_type: moderation_hide`, `moderation_approve`)
- FR-16.8.4: Admin page to view spam logs: `GET /admin/spam-logs` (paginated, filterable)

**Acceptance Criteria:**
- Honeypot triggers are logged with UUID and IP hash
- Rate limit hits are logged
- Spam detection events include score and reasons
- Trust score changes are logged
- Admin can view and filter spam logs

#### FR-16.9: Trust → Priority Escalation
**ID:** FR-16.9
**Priority:** Medium
**Description:** Automatically escalate complaint priority based on submitter trust score and community signals.

**Requirements:**
- FR-16.9.1: Extend `TrustService` with method `getEffectivePriority(Issue $issue): string`
  - Starts with `user_priority`
  - If trust_score > 0.8: bump one level (medium→high, high→critical, critical stays)
  - If trust_score < 0.3: cap at medium (never trust low-trust user's high/critical)
  - If parent issue with 5+ merged duplicates: bump one level (community confirmed)
  - If 20+ upvotes: bump one level
- FR-16.9.2: When creating issue, set `priority` = `getEffectivePriority()` result
- FR-16.9.3: When an issue gets upvote milestones (10, 25, 50), re-evaluate priority
- FR-16.9.4: Log priority escalation in IssueEvent

**Acceptance Criteria:**
- High-trust user's "critical" complaint stays critical
- Low-trust user's "critical" complaint capped at medium
- Issue with 20+ upvotes auto-escalates one level
- IssueEvent logged for each escalation

---

### 3.3 Non-Functional Requirements

#### NFR-1: Performance
- NFR-1.1: Feed page must load in <500ms (with Redis caching)
- NFR-1.2: Submission form must respond in <200ms (CAPTCHA verification async)
- NFR-1.3: Rate limiting must add <5ms overhead
- NFR-1.4: Spam detection must complete in <100ms
- NFR-1.5: All database queries must use indexes (no full table scans)

#### NFR-2: Security
- NFR-2.1: Raw IP addresses must not persist beyond 24 hours
- NFR-2.2: No PII (personally identifiable information) in logs
- NFR-2.3: Turnstile secret key must never be exposed client-side
- NFR-2.4: Rate limiting must apply to all write endpoints
- NFR-2.5: Honeypot field must remain invisible to screen readers (`aria-hidden`)

#### NFR-3: Usability
- NFR-3.1: CAPTCHA must be shown only when necessary (adaptive)
- NFR-3.2: Spam-filtered complaints must show success to submitter (shadowban)
- NFR-3.3: All new features must have Nepali translations
- NFR-3.4: Title field must have character count displayed

#### NFR-4: Reliability
- NFR-4.1: Rate limiter must use atomic Redis operations (no race conditions)
- NFR-4.2: Trust scores must survive Redis restart (persist to DB periodically)
- NFR-4.3: CAPTCHA verification must have timeout fallback (if Cloudflare down, allow submission)

#### NFR-5: Maintainability
- NFR-5.1: Spam detection rules must be configurable (easy to add/remove rules)
- NFR-5.2: Trust score formula must be documented and adjustable
- NFR-5.3: All new services must have unit tests

---

## 4. Database Schema Changes

### 4.1 Epic 15 Migrations

**Migration 1: `add_title_and_priority_fields_to_issues`**
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('title', 255)->nullable()->after('id');
    $table->string('user_priority', 20)->nullable()->after('priority');
    $table->string('admin_priority', 20)->nullable()->after('user_priority');
    $table->timestamp('priority_reviewed_at')->nullable()->after('admin_priority');
    $table->foreignId('priority_reviewed_by')->nullable()->constrained('users')->after('priority_reviewed_at');
});
```

**Migration 2: `create_issue_media_table`**
```php
Schema::create('issue_media', function (Blueprint $table) {
    $table->id();
    $table->foreignId('issue_id')->constrained()->cascadeOnDelete();
    $table->string('path');
    $table->string('type', 10); // 'photo' or 'video'
    $table->string('submitted_by_session', 100)->nullable();
    $table->timestamps();
});
```

### 4.2 Epic 16 Migrations

**Migration 3: `add_anonymous_uuid_to_issues`**
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('anonymous_uuid', 36)->nullable()->after('reporter_ip');
    $table->index('anonymous_uuid');
});
```

**Migration 4: `add_anonymous_uuid_to_upvotes`**
```php
Schema::table('upvotes', function (Blueprint $table) {
    $table->string('anonymous_uuid', 36)->nullable()->after('session_id');
});
```

**Migration 5: `add_ip_hash_and_spam_score_to_issues`**
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('reporter_ip_hash', 64)->nullable()->after('reporter_ip');
    $table->float('spam_score')->nullable()->after('hidden_at');
    $table->index('reporter_ip_hash');
});
```

**Migration 6: `add_moderation_status_to_issues`**
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('moderation_status', 20)->default('approved')->after('hidden_at');
    // values: approved, pending, rejected
});
```

**Migration 7: `create_spam_logs_table`**
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

---

## 5. Use Case Models

### UC-1: Citizen Submits Complaint (with Title + CAPTCHA)
1. Citizen navigates to Submit page
2. Fills title (new), category, location, description
3. If suspicious behavior detected → CAPTCHA shown
4. Submits complaint
5. Spam detection runs → if spam_score > 0.7, hidden from public
6. Duplicate check runs → if high similarity, auto-merge into parent
7. Trust score adjusted based on result
8. Citizen sees reference code (own or parent's if merged)

### UC-2: Citizen Views Feed (with Social Proof)
1. Citizen opens Feed page
2. Complaint cards show title, description preview, photo, badges
3. Below upvote button: `"Himal + 4 others"` or `"5 people"`
4. Citizen can upvote → social proof updates in real-time
5. Click card → reference page with full details

### UC-3: Admin Verifies Priority
1. Admin opens issue detail
2. Sees: `User priority: Critical` / `Admin priority: Medium` (warning icon)
3. Dropdown to set admin_priority
4. Confirms → priority updated, IssueEvent logged
5. SLA engine now uses confirmed priority

### UC-4: Admin Moderates Content
1. Admin opens moderation queue
2. Sees flagged/complaints with spam_score, reasons
3. Can: Hide (set hidden_at), Dismiss, Delete
4. Hidden content disappears from public feed immediately
5. Comment moderation: approve or reject pending comments

### UC-5: System Detects Spam
1. Anonymous user submits complaint with 8 URLs and "BUY NOW CHEAP"
2. Honeypot check passes (bot missed it)
3. Rate limiter: within limit
4. SpamDetectionService runs:
   - URL detection: 8 URLs → score +0.3
   - ALL CAPS: 70% uppercase → score +0.2
   - Repetitive text: detected → score +0.2
   - Total: 0.7 → is_spam = true
5. Issue created with `hidden_at` set, `spam_score = 0.7`
6. Trust score decreased
7. SpamLog entry created
8. Submit sees success (shadowban)
9. Admin sees issue in moderation queue with spam score and reasons

---

## 6. File Creation and Modification Summary

### Files to Create

| File | Epic | Purpose |
|------|------|---------|
| `app/Services/IpAnonymizer.php` | 16 | IP hashing utility |
| `app/Services/TurnstileService.php` | 16 | CAPTCHA verification + adaptive logic |
| `app/Services/TrustService.php` | 16 | Trust score calculation |
| `app/Models/SpamLog.php` | 16 | Spam log model |
| `app/Models/IssueMedia.php` | 15 | Issue media model |
| `app/Http/Middleware/SetAnonymousUuid.php` | 16 | UUID cookie middleware |
| `app/Http/Middleware/AdaptiveCaptcha.php` | 16 | Adaptive CAPTCHA middleware |
| `app/Console/Commands/AnonymizeIps.php` | 16 | Nullify old raw IPs |
| `config/turnstile.php` | 16 | Turnstile configuration |
| `resources/js/Components/UI/TurnstileWidget.jsx` | 16 | CAPTCHA widget component |
| `resources/js/Pages/Admin/Moderation/Comments.jsx` | 16 | Comment moderation page |
| `resources/js/Pages/Admin/SpamLogs.jsx` | 16 | Spam log viewer page |

### Files to Modify

| File | Epic | Changes |
|------|------|---------|
| `app/Models/Issue.php` | 15, 16 | Add fillable: title, user_priority, admin_priority, priority_reviewed_at, priority_reviewed_by, anonymous_uuid, reporter_ip_hash, spam_score, moderation_status. Add relations: media. Add scopeVisible. |
| `app/Models/Upvote.php` | 15, 16 | Add anonymous_uuid fillable. Relation to user for name display. |
| `app/Models/Comment.php` | 16 | Remove hardcoded is_approved = true logic |
| `app/Http/Controllers/IssueController.php` | 15, 16 | Title validation, call AbuseDetectionService, auto-merge, UUID storage, IP hashing, store spam_score |
| `app/Http/Controllers/FeedController.php` | 15, 16 | Include title, social proof data, filter hidden_at |
| `app/Http/Controllers/Admin/Issues/IssueController.php` | 15, 16 | Priority override UI, show spam_score, hide filter for admin |
| `app/Http/Controllers/Admin/Dashboard/DashboardController.php` | 16 | Filter hidden_at |
| `app/Http/Controllers/CommentController.php` | 16 | Conditional is_approved, filter hidden_at |
| `app/Services/AbuseDetectionService.php` | 16 | Add URL, caps, repetitive text rules. Return spam_score. |
| `app/Services/DuplicateDetectionService.php` | 15 | Add Nepali stop words |
| `app/Services/MergeService.php` | 15 | Handle issue_media during merge |
| `app/Providers/AppServiceProvider.php` | 16 | Register named rate limiters |
| `bootstrap/app.php` | 16 | Register middleware |
| `routes/web.php` | 15, 16 | Apply new middleware, moderation comment routes, spam log routes |
| `resources/js/Pages/Public/Submit.jsx` | 15, 16 | Title field, CAPTCHA widget |
| `resources/js/Components/Feed/ComplaintCard.jsx` | 15 | Show title, social proof text |
| `resources/js/Pages/Admin/Issues/Show.jsx` | 15, 16 | Priority override dropdown, spam score display |
| `resources/js/lang/en.js` | 15, 16 | New translations |
| `resources/js/lang/np.js` | 15, 16 | New translations |
| `database/seeders/DatabaseSeeder.php` | 15 | Update for title field |

---

## 7. Session Recovery (Dev)

If your AI session resets mid-implementation:

1. **Check what was done:**
   ```bash
   git log --oneline -10
   git diff --cached --stat
   git diff --stat
   ```

2. **Check which epic file:**
   - Open `Epic15.md` or `Epic16.md`
   - Find the first `[ ]` unchecked item
   - That's your next task

3. **Read the relevant section in THIS document (SRS.md)** for the functional requirements of that task

4. **Continue from the file you were editing:**
   - Read the last few methods you wrote
   - Check if tests exist for them
   - Proceed to the next item

5. **Run tests after every 2-3 changes:**
   ```bash
   php artisan test --filter=Epic15
   # or
   php artisan test --filter=Spam
   ```
