# Friday Task — Nagarik Sarokar Epic Execution Plan

> **Session Recovery Document** — If session resets, read this + AGENTS.md to continue.
> **Target:** Kathmandu Metropolitan City (KMC) — single municipality MVP
> **Timeline:** 3 months (Jul 10 — Oct 10, 2026)

---

## Epic 7: UI/UX Transformation — Modern Social Feed & Citizen Feed

**Status:** ✅ Completed (Jul 10, 2026)
**Commits:** `0f82b1f`
**Target:** Jul 10 — Jul 14

### What
Transform the current landing page into a modern, Facebook/Reddit-inspired social feed. Citizens see complaint cards with photos, descriptions, status badges, upvote counts, and BS dates in an infinite-scroll feed. The system must feel modern, not like a government portal.

### Why
- User's #1 complaint: "The UI and the sense of the system" is wrong
- Current Dashboard is a static landing page — no engagement, no transparency
- Citizens need to see what others are complaining about (creates community pressure)
- Photo display makes complaints more credible and engaging
- Mobile-first design reaches Nepal's 65% mobile audience

### How

#### A. BS Date Conversion Service (PHP)
- Create `app/Services/BsDateService.php` — Nepali Bikram Sambat ↔ Gregorian converter
- Uses lookup table approach (no external library needed, pure PHP)
- Functions: `toBs(Carbon $date): array`, `toBsString(Carbon $date): string`, `fromBs(int $year, int $month, int $day): Carbon`
- BS date format: `२०८३-०३-२७ (२०८३ साल असार २७ गते)` with time: `१०:३० बजे`

#### B. BS Date Utility (JavaScript)
- Create `resources/js/utils/bsDate.js` — client-side BS date formatter
- Same lookup table as PHP version
- Functions: `toBsString(isoDate, format)`, `toBsFull(isoDate)`
- Formats: short (`२०८३-०३-२७`), full (`२०८३ साल असार २७ गते`), with time (`२०८३-०३-२७, १०:३० बजे`)

#### C. Timezone Fix
- Change `config/app.php` timezone from `UTC` to `Asia/Kathmandu`
- All timestamps stored in UTC but displayed in Nepal time
- Carbon instances automatically use correct timezone

#### D. FeedController (Backend)
- Create `app/Http/Controllers/FeedController.php`
- `index()` — Paginated public feed with complaint cards, filters (category, status, ward, date range), paginated (20 per page), eager loads (location, organization, category, events count), upvote count, comment count
- Returns Inertia render of `Feed` page

#### E. ComplaintCard Component (Frontend)
- Create `resources/js/Components/ComplaintCard.jsx`
- Photo display (responsive image with lazy loading, aspect-ratio, lightbox on click)
- Description preview (line-clamp-3 with expand)
- Status badge + Priority badge
- Upvote button with count
- Comment count
- BS date with time: "२०८१ असार १५, १०:३० बजे"
- Reference code link
- Organization name
- Hover effects, smooth transitions
- Mobile: full-width cards, Tablet: 2-col grid, Desktop: 3-col grid

#### F. Feed Page (Frontend)
- Create `resources/js/Pages/Feed.jsx`
- Header with filter bar (category, status, ward, sort by newest/popular)
- Grid of ComplaintCards
- Infinite scroll pagination (IntersectionObserver)
- Loading skeleton placeholders
- SOS floating button (mobile) + inline (desktop)
- Empty state with illustration

#### G. FeedFilters Component
- Create `resources/js/Components/FeedFilters.jsx`
- Category dropdown (SearchSelect)
- Status pills (All, Received, In Progress, Resolved)
- Ward/location dropdown
- Sort by: Latest, Most Upvoted, Trending
- Reset filters button

#### H. Layout Update
- Add "Feed" (/feed) nav link between Home and Submit
- Nepali default language (reverse current — set `np` as default)
- Add feed translations to en.js and np.js

#### I. Model Updates
- Add `upvotes_count` virtual column to Issue (or create upvotes table later)
- Add `comments_count` to Issue

#### J. Photo Display Enhancement
- Add image lightbox modal component
- Photo gallery grid for multiple photos
- Lazy loading with blur placeholder

### Database Changes
- None in this epic (upvotes/comments tables come in Epic 9)
- Add `photo_path` display enhancement only

### Files to Create
1. `app/Services/BsDateService.php`
2. `resources/js/utils/bsDate.js`
3. `app/Http/Controllers/FeedController.php`
4. `resources/js/Pages/Feed.jsx`
5. `resources/js/Components/ComplaintCard.jsx`
6. `resources/js/Components/FeedFilters.jsx`
7. `resources/js/Components/PhotoLightbox.jsx`

### Files to Modify
1. `config/app.php` — timezone to `Asia/Kathmandu`
2. `routes/web.php` — add GET /feed route
3. `resources/js/Components/Layout.jsx` — add Feed nav link
4. `resources/js/lang/en.js` — add feed translations
5. `resources/js/lang/np.js` — add feed translations
6. `resources/js/Context/LanguageContext.jsx` — default to `np`
7. `resources/js/app.jsx` — register new pages

### Tests
- Unit: BsDateService conversion accurate for known dates
- Feature: Feed page loads with paginated issues
- Feature: ComplaintCard renders photo, description, badges

### Commit
`feat(feed): complete Epic 7 — modern social feed with BS dates, photo display, infinite scroll, mobile-first UI`

---

## Epic 8: Upvoting, Citizen Comments & Social Features

**Status:** ✅ Completed (Jul 10, 2026)
**Commits:** `c520d29`
**Target:** Jul 10 — Jul 16

### What
Implement upvoting/"Me Too" system and citizen commenting on complaints. Citizens can upvote complaints (reducing duplicates), comment publicly on complaints, and follow issues.

### Why
- FixMyStreet's #1 feature: upvoting creates community pressure and surfaces important issues
- Citizens want to say "Me too" instead of filing duplicate complaints
- Public comments increase transparency and trust between citizens and government
- Comment threads enable citizen-official-citizen dialogue
- Reduces duplicate complaints by allowing citizens to join existing complaints

### How

#### A. Upvotes Table Migration
- `create_upvotes_table.php`
- Columns: `id`, `user_id` (nullable FK → users, for registered), `session_id` (nullable string, for anonymous), `issue_id` (FK → issues, cascade delete), `created_at`
- Unique composite: `user_id + issue_id` when user_id is not null
- Unique composite: `session_id + issue_id` when user_id is null
- Index on `issue_id` for efficient count queries

#### B. Comments Table Migration
- `create_comments_table.php`
- Columns: `id`, `issue_id` (FK → issues, cascade), `user_id` (nullable FK → users), `session_id` (nullable string), `parent_id` (nullable FK → comments, self-referencing for threading), `body` (text), `is_public` (boolean, default true), `is_approved` (boolean, default false for moderation), `created_at`, `updated_at`
- Indexes: `issue_id`, `parent_id`
- Staff/super admin can moderate (approve/delete/hide comments)

#### C. Upvote Model
- `app/Models/Upvote.php`
- Fillable: `user_id, session_id, issue_id`
- Relations: `belongsTo(Issue)`, `belongsTo(User)`
- Helper methods: `hasUpvoted(Issue $issue, ?User $user, ?string $sessionId): bool`
- Scopes: `scopeBySession($sessionId)`, `scopeByUser($userId)`

#### D. Comment Model
- `app/Models/Comment.php`
- Fillable: `issue_id, user_id, session_id, parent_id, body, is_public, is_approved`
- Relations: `belongsTo(Issue)`, `belongsTo(User)`, `belongsTo(Comment, 'parent_id')` (parent), `hasMany(Comment, 'parent_id')` (replies)
- Scopes: `scopeApproved()`, `scopePublic()`

#### E. API Controllers (Inertia-friendly, not pure API)
- UpvoteController: `toggle(Issue $issue, Request $request)` — adds or removes upvote
  - Uses `session_id` from `session()->getId()` for anonymous users
  - Returns JSON `{upvoted: bool, count: int}` for dynamic UI update
- CommentController: `index(Issue $issue)` — paginated comments with replies
  - `store(Issue $issue, Request $request)` — add comment (validates body min:1 max:2000)
  - `update(Request $request, Comment $comment)` — edit own comment within 5 min
  - `destroy(Comment $comment)` — delete own comment
  - `report(Comment $comment, Request $request)` — report inappropriate

#### F. Frontend Components
- **UpvoteButton.jsx** — Heart/thumbs-up icon, animated counter, optimistic toggle
  - Shows filled/unfilled state based on `has_upvoted` prop
  - Sends POST to toggle endpoint via Inertia visit or axios
  - Animated number transition on count change
- **CommentSection.jsx** — Threaded comment display with reply nesting
  - List of comments with author info, timestamp (BS date), body
  - Reply button to show nested CommentForm
  - Report button on each comment
  - Load more replies if nested
- **CommentForm.jsx** — Textarea + submit button with character count
  - For new comments and replies
  - Shows "Reply to @user" indicator when in reply mode
  - Cancel reply button

#### G. Duplicate Detection
- Before complaint submission, check recent issues for description similarity
- Simple approach: tokenize description, compare word overlap with recent issues (last 30 days, same org)
- If >60% word overlap, show warning with link to existing issue
- Store `duplicate_of_id` (nullable FK → issues) for future merging
- `AddDuplicateOfToIssues` migration: `duplicate_of_id` bigint unsigned nullable FK

#### H. Issue Model Updates
- `upvotes()`: HasMany relation to Upvote
- `comments()`: HasMany relation to Comment
- `upvotesCount()`: attribute for count
- `commentsCount()`: attribute for count
- `isUpvotedBy(?User $user, ?string $sessionId): bool`
- `duplicate()`: BelongsTo relation to self (duplicate_of_id)

### Database Changes
1. `database/migrations/2026_07_10_000001_create_upvotes_table.php`
2. `database/migrations/2026_07_10_000002_create_comments_table.php`
3. `database/migrations/2026_07_10_000003_add_duplicate_of_to_issues.php`
4. Add composite indexes for upvote uniqueness

### Files to Create
1. `app/Models/Upvote.php`
2. `app/Models/Comment.php`
3. `app/Http/Controllers/UpvoteController.php`
4. `app/Http/Controllers/CommentController.php`
5. `app/Services/DuplicateDetectionService.php`
6. `resources/js/Components/UpvoteButton.jsx`
7. `resources/js/Components/CommentSection.jsx`
8. `resources/js/Components/CommentForm.jsx`
9. `database/factories/CommentFactory.php`
10. `database/factories/UpvoteFactory.php`

### Files to Modify
1. `app/Models/Issue.php` — add relationships, isUpvotedBy, upvotes_comments counts
2. `routes/web.php` — upvote/comment routes
3. `app/Http/Controllers/FeedController.php` — include upvote/comment data in feed
4. `app/Http/Controllers/IssueController.php` — duplicate detection on store
5. `resources/js/Components/ComplaintCard.jsx` — wire upvote/comment display
6. `resources/js/Pages/Feed.jsx` — pass upvote data
7. `app/Http/Controllers/IssueController.php` — showReference includes comments
8. `database/seeders/DatabaseSeeder.php` — seed comments + upvotes

### Tests
- Unit: Upvote toggles correctly (add/remove)
- Unit: Comment belongs to issue and user
- Feature: Citizen can upvote without account (session-based)
- Feature: Citizen can comment on public complaint
- Feature: Duplicate detection flags similar descriptions
- Feature: Upvote count increments on feed page
- Feature: Comment appears in reference page

### Details & Requirements

#### Upvote Business Logic
- One upvote per user/session per issue (toggle)
- Upvote count is cached (5 min TTL, invalidated on toggle)
- Upvotes are anonymous (no public list of who upvoted)
- Feed sorted by "Most Upvoted" uses upvote count

#### Comment Business Logic
- Comments require session (trackable) — fully anonymous not allowed
- Comments are auto-approved for registered users
- Comments from session-only users require admin approval
- Staff/super admin can approve/delete/hide any comment
- Reports are queued in moderation queue (Epic 11)

#### Duplicate Detection Logic
- Compare against issues from same org, last 30 days
- Tokenize: lowercase, remove punctuation, split by whitespace
- Calculate Jaccard similarity: |A ∩ B| / |A ∪ B|
- If similarity > 0.6 and description length > 20 chars, flag as potential duplicate
- Show max 3 similar issues
- User can still submit (not forced), just warned

### Commit
`feat(social): complete Epic 8 — upvoting, citizen comments, duplicate detection`

---

## Epic 8: Upvoting, Citizen Comments & Social Features

**Status:** 🔴 Not Started
**Target:** Jul 14 — Jul 20

### What
Implement upvoting/"Me Too" system and citizen commenting on complaints. Citizens can upvote complaints (reducing duplicates), comment publicly, and follow issues.

### Why
- FixMyStreet's #1 feature: upvoting creates community pressure and surfaces important issues
- Citizens want to say "Me too" instead of filing duplicate complaints
- Public comments increase transparency and trust
- Comment threads enable citizen-official-citizen dialogue

### How

#### A. Upvotes Table Migration
- `create_upvotes_table.php`
- Columns: `id`, `user_id` (nullable FK → users, for registered), `session_id` (nullable string, for anonymous), `issue_id` (FK → issues, cascade), `created_at`
- Unique composite: `user_id + issue_id` or `session_id + issue_id`
- Index on `issue_id` for count queries

#### B. Comment Threads System
- `create_comments_table.php` or extend issue_events with `parent_id`
- Option A: New `comments` table (cleaner, more flexible)
  - `id`, `issue_id` (FK), `user_id` (nullable FK), `session_id` (nullable), `parent_id` (nullable FK → comments), `body` (text), `is_public` (bool), `created_at`
- Super admin/staff can moderate comments (hide/delete)

#### C. API Endpoints
- `POST /api/issues/{issue}/upvote` — Toggle upvote
- `GET /api/issues/{issue}/comments` — List comments (paginated)
- `POST /api/issues/{issue}/comments` — Add comment
- `DELETE /api/comments/{comment}` — Delete own comment
- `POST /api/comments/{comment}/report` — Report inappropriate comment

#### D. Frontend
- UpvoteButton component (heart/arrow, animated counter, toggle state)
- CommentSection component (threaded display, reply, report)
- CommentForm component (textarea, submit)
- Activity on ComplaintCard: upvote count, comment count, click to expand

#### E. Duplicate Detection
- Before submit, check `description` similarity against recent issues
- Show "This looks similar to issue #KMC-0042" with link
- Store `duplicate_of_id` nullable FK → issues (for merging later)

### Database Changes
1. `create_upvotes_table.php`
2. `create_comments_table.php`
3. `add_duplicate_of_id_to_issues.php`

### Files to Create
1. `app/Models/Upvote.php`
2. `app/Models/Comment.php`
3. `app/Http/Controllers/Api/UpvoteController.php`
4. `app/Http/Controllers/Api/CommentController.php`
5. `app/Http/Controllers/Api/DuplicateController.php`
6. `resources/js/Components/UpvoteButton.jsx`
7. `resources/js/Components/CommentSection.jsx`
8. `resources/js/Components/CommentForm.jsx`

### Files to Modify
1. `app/Models/Issue.php` — upvotes relationship, comments relationship, `isUpvotedBy()` method
2. `routes/api.php` — new API routes
3. `app/Http/Controllers/FeedController.php` — include upvote/comment data
4. `app/Http/Controllers/IssueController.php` — duplicate detection on store
5. `resources/js/Components/ComplaintCard.jsx` — wire upvote/comment

### Tests
- Unit: Upvote toggles correctly (add/remove)
- Feature: Citizen can upvote without account (session-based)
- Feature: Citizen can comment on public complaint
- Feature: Duplicate detection shows similar issues

### Commit
`feat(social): complete Epic 8 — upvoting, citizen comments, duplicate detection`

---

## Epic 9: Multi-Tenant Org-Admin & Department Hierarchy

**Status:** ✅ Completed (Jul 10, 2026)
**Commits:** `be249de`
**Target:** Jul 20 — Jul 27

### What
Implement proper multi-tenant scoping so org admins see only their org's data. Add department/sub-department hierarchy under organizations. Auto-routing of complaints based on category + ward.

### Why
- Current system: super admin sees everything, org admin concept exists but is unused
- KMC has 32 wards, each with different responsibilities
- Complaints must auto-route to the correct ward/department
- Staff need proper scoping: ward-level staff see only their ward

### How

#### A. Departments Table
- `create_departments_table.php`
- Columns: `id`, `organization_id` (FK), `name`, `slug`, `description`, `parent_id` (nullable self FK), `is_active`, `sort_order`
- KMC departments: Ward Office, Environment, Roads, Water, Sanitation, Education, Health, etc.

#### B. Staff-Department Assignment
- `create_department_user_table.php` (pivot)
- Columns: `department_id`, `user_id`
- Staff can belong to multiple departments
- Staff can only see issues routed to their departments

#### C. Issue-Department Assignment
- Add `department_id` (nullable FK) to issues
- Auto-assign based on category → department mapping
- `create_category_department_table.php` (mapping)

#### D. Org-Admin Middleware
- Create `org.admin` middleware in bootstrap/app.php
- Org admin can: manage staff, manage departments, view all issues in org
- Org admin CANNOT: see other orgs, manage super admin settings

#### E. Org-Admin Dashboard
- Create `resources/js/Pages/OrgAdmin/Dashboard.jsx`
- Scope all queries to `organization_id`
- Staff management, department management, issue assignment

#### F. Auto-Routing Service
- Create `app/Services/RoutingService.php`
- On issue creation: match category + ward → department
- If no match: route to org admin for manual assignment

### Files to Create
1. `app/Models/Department.php`
2. `app/Http/Middleware/OrgAdmin.php`
3. `app/Http/Controllers/OrgAdminController.php`
4. `app/Services/RoutingService.php`
5. `resources/js/Pages/OrgAdmin/Dashboard.jsx`
6. `resources/js/Pages/OrgAdmin/Departments.jsx`

### Files to Modify
1. `bootstrap/app.php` — register org.admin middleware
2. `routes/web.php` — org admin routes
3. `app/Models/User.php` — departments relationship
4. `app/Models/Issue.php` — department relationship
5. `app/Http/Controllers/IssueController.php` — auto-routing after store
6. `database/seeders/DatabaseSeeder.php` — department seed data for KMC

### Commit
`feat(tenant): complete Epic 9 — multi-tenant org-admin, departments, auto-routing`

---

## Epic 10: Smart Workflow Engine — SLA, Escalation, Transfer

**Status:** ✅ Completed (Jul 10, 2026)
**Commits:** `b52406a`
**Target:** Jul 27 — Aug 3

### What
Priority-based SLA enforcement, automatic escalation when SLA breached, complaint transfer between orgs/departments, complaint merging.

### Why
- Current: 48h hardcoded SLA for ALL complaints — critical issues need faster response
- No escalation means complaints can sit forever (Hello Sarkar: 15% stuck in "Seen")
- Transfer needed when complaint is misdirected to wrong org
- Merging needed when duplicate complaints are filed

### How

#### A. Priority-Based SLA
| Priority | SLA Target | Auto-Escalate After |
|----------|-----------|---------------------|
| Critical | 4 hours | 2 hours (no response) |
| High | 24 hours | 12 hours |
| Medium | 72 hours | 48 hours |
| Low | 7 days | 5 days |

- Store SLA values in `config/sla.php`
- `Issue::slaDeadline()` — now priority-aware
- `Issue::isSlaBreached()` — check against priority SLA

#### B. Escalation Engine
- Create `app/Services/EscalationService.php`
- Artisan command: `php artisan issues:escalate` — runs every 15 min via scheduler
- When SLA breached: auto-assign to department supervisor → org admin → super admin
- Escalation creates IssueEvent with escalation_level metadata
- Notification sent to escalated assignee

#### C. Transfer Workflow
- `POST /admin/issues/{issue}/transfer` — Transfer to another org/department
- Creates IssueEvent with transfer details
- Old org can add transfer note
- New org receives notification

#### D. Complaint Merging
- `POST /admin/issues/{issue}/merge/{parent}` — Merge into parent issue
- All events, comments, upvotes moved to parent
- Merged issue gets status `merged` (new status)
- Reference code redirects to parent

#### E. New Status: `merged`
- Add to enum/validation: `received`, `in_progress`, `resolved`, `merged`
- Update StatusBadge to show merged state

### Files to Create
1. `config/sla.php`
2. `app/Services/EscalationService.php`
3. `app/Console/Commands/EscalateIssues.php`
4. `app/Services/TransferService.php`
5. `app/Services/MergeService.php`

### Files to Modify
1. `app/Models/Issue.php` — priority-aware SLA, merged status
2. `app/Http/Controllers/AdminController.php` — transfer, merge endpoints
3. `routes/web.php` — new routes
4. `resources/js/Components/Badge.jsx` — merged status
5. `resources/js/Pages/Admin/Dashboard.jsx` — escalation indicators, merge UI

### Commit
`feat(workflow): complete Epic 10 — SLA engine, escalation, transfer, merge`

---

## Epic 11: Moderation & Quality Control

**Status:** 🔴 Not Started
**Target:** Aug 3 — Aug 8

### What
Community flagging system, admin moderation queue, abuse detection (professional complainants), content filtering.

### Why
- Hello Sarkar's known problem: "professional complainants" flooding the system
- Spam/fake complaints erode trust in the platform
- Comments need moderation — hate speech, harassment, misinformation

### How

#### A. Flagging System
- `create_flags_table.php`
- Columns: `id`, `flaggable_type`, `flaggable_id`, `user_id` (nullable), `reason` (string), `description` (text), `status` (enum: pending, reviewed, dismissed), `created_at`
- Polymorphic: can flag issues, comments, photos
- Button on every complaint card and comment: "Report"

#### B. Moderation Queue
- Admin page: `/admin/moderation`
- List of flagged content with status, counter, preview
- Actions: Hide, Dismiss Flag, Delete Content, Ban User
- Bulk actions

#### C. Abuse Detection Service
- Create `app/Services/AbuseDetectionService.php`
- Rate check: >10 complaints/day from same phone/IP → auto-flag
- Content check: profanity filter, phone number scraping detection
- Duplicate check: identical description within 24h

#### D. Content Moderation Actions
- Hide issue (not delete — preserve audit trail)
- Hide comment
- Ban reporter (by phone number)
- Shadow ban (user sees success but complaint hidden from public)

### Files to Create
1. `app/Models/Flag.php`
2. `app/Services/AbuseDetectionService.php`
3. `app/Http/Controllers/Admin/ModerationController.php`
4. `resources/js/Pages/Admin/Moderation.jsx`
5. `resources/js/Components/ReportButton.jsx`

### Files to Modify
1. `app/Http/Controllers/IssueController.php` — run abuse detection on store
2. `app/Http/Controllers/Api/CommentController.php` — run abuse detection
3. `routes/web.php` — moderation routes
4. `resources/js/Components/ComplaintCard.jsx` — report button
5. `resources/js/Components/CommentSection.jsx` — report button

### Commit
`feat(moderation): complete Epic 11 — flagging system, moderation queue, abuse detection`

---

## Epic 12: Analytics, Reports & Open Data

**Status:** 🔴 Not Started
**Target:** Aug 8 — Aug 15

### What
Public analytics dashboard, CSV/PDF reporting, SLA compliance reports, complaint heatmap, open API for researchers.

### Why
- Citizens need to see how well their municipality responds
- Government needs data-driven decision making
- Open data enables transparency and academic research
- Heatmap shows problem areas (FixMyStreet's best feature)

### How

#### A. Public Analytics Dashboard
- `/analytics` — public page with charts
- Total complaints, resolution rate, avg time by priority
- Category breakdown, ward breakdown
- SLA compliance % (what % resolved within SLA)
- Weekly/monthly trends
- Top 10 wards with most complaints

#### B. SLA Compliance Report
- Admin only: SLA compliance by org, department, staff member
- Export as CSV/PDF
- Trend over time: are we improving?

#### C. Complaint Heatmap
- Using Leaflet.js or Mapbox
- Pin complaints on map by ward
- Color-coded by status (red=open, green=resolved, amber=in progress)
- Cluster markers for zoom levels
- Filter by category, status, date range

#### D. Open API
- `GET /api/v1/issues` — public issue list (paginated, without PII)
- `GET /api/v1/stats` — public stats
- `GET /api/v1/issues/{id}` — single issue details (public only)
- Rate limited, API key optional for higher limits
- JSON:API format

#### E. Report Generation
- Weekly auto-generated PDF report emailed to org admin
- Monthly summary with trends
- Export filtered issue list as CSV/Excel/PDF

### Files to Create
1. `app/Http/Controllers/AnalyticsController.php`
2. `resources/js/Pages/Analytics.jsx`
3. `resources/js/Components/ComplaintMap.jsx`
4. `app/Http/Controllers/Api/V1/IssueController.php`
5. `app/Services/ReportService.php`
6. `app/Console/Commands/GenerateReports.php`

### Files to Modify
1. `routes/web.php` — analytics route
2. `routes/api.php` — v1 API routes
3. `app/Providers/AppServiceProvider.php` — schedule report generation
4. `resources/js/Components/Layout.jsx` — analytics nav link

### Commit
`feat(analytics): complete Epic 12 — analytics dashboard, heatmap, open API, reports`

---

## Epic 13: Production Hardening & Critical Bug Fixes

**Status:** 🔴 Not Started
**Target:** Aug 15 — Aug 22

### What
Fix all critical bugs identified in Phase 1 audit, add Redis caching, optimize queries, fix channel authorization, harden security.

### Why
- System must be production-ready for KMC deployment
- Current bugs: XSS vector in pagination, channel data leakage, avg resolution memory crash
- Performance: dashboard queries hit DB on every page load

### How

#### A. Critical Bug Fixes
1. Fix channel authorization — scope broadcasts by organization_id (private channels)
2. Replace `dangerouslySetInnerHTML` on pagination links with safe rendering
3. Wire `config/notifications.php` into `SendNotificationJob`
4. Fix avg resolution time query — use DB aggregation instead of collection
5. Add eager loading for `category` relationship in all controllers

#### B. Redis Caching
- Switch cache driver to `redis`
- Cache dashboard stats (5-min TTL)
- Cache category breakdown
- Cache feed queries
- Cache analytics page
- Invalidate cache on issue create/update

#### C. Query Optimization
- Add composite indexes: `(organization_id, status, created_at)`, `(category_id, organization_id)`, `(status, priority)`
- Replace `->get()->map()` with `->pluck()` or DB raw queries
- Eager load relationships consistently
- Use `chunk()` for large data exports

#### D. Security Hardening
- Rate limit admin login (`throttle:5,1`)
- Add CSRF protection to all state-changing endpoints
- Enable session encryption
- Fix Reverb `allowed_origins` from `['*']` to specific domains
- Add email verification middleware to sensitive routes
- Add password reset functionality

#### E. Password Reset & Email Verification
- Add password reset routes, controllers, views
- Add email verification routes
- Update User model with `MustVerifyEmail`

### Files to Create
1. `app/Http/Controllers/Auth/PasswordResetController.php`
2. `app/Http/Controllers/Auth/EmailVerificationController.php`
3. `resources/views/emails/*.blade.php` — email templates

### Files to Modify
1. `routes/web.php` — auth routes
2. `config/cache.php` — redis driver
3. `config/reverb.php` — allowed origins
4. `config/session.php` — encryption
5. `app/Jobs/SendNotificationJob.php` — read config
6. `routes/channels.php` — org-scoped channels
7. `app/Http/Controllers/AdminController.php` — rate limit, query fix
8. `app/Http/Controllers/DashboardController.php` — cache layer
9. `app/Models/User.php` — MustVerifyEmail
10. Many more individual files

### Commit
`feat(harden): complete Epic 13 — production hardening, caching, bug fixes, security`

---

## Epic 14: PWA & Mobile Experience

**Status:** 🔴 Not Started
**Target:** Aug 22 — Aug 28

### What
Progressive Web App with offline support, install prompt, push notifications, service worker.

### Why
- 65% of Nepal's web traffic is mobile
- No app store needed — PWA installs directly from browser
- Offline capability for rural areas with poor connectivity
- Push notifications keep citizens engaged without SMS costs

### How

#### A. Service Worker
- Register service worker for caching static assets
- Cache API responses for offline viewing
- Background sync for queued complaints

#### B. Manifest & Install
- Web manifest with icons, splash screen, theme color
- Beforeinstallprompt event handling
- "Add to Home Screen" prompt

#### C. Push Notifications
- Browser push notification subscription
- Send push on status change, comment response, escalation
- VAPID keys for web push

#### D. Offline Complaint Queue
- Queue complaints in IndexedDB when offline
- Sync when back online
- Show queue status on submission form

### Files to Create
1. `public/sw.js`
2. `public/manifest.json`
3. `resources/js/serviceWorkerRegistration.js`
4. `app/Http/Controllers/Api/PushSubscriptionController.php`

### Files to Modify
1. `resources/js/app.jsx` — register SW
2. `resources/js/Pages/Submit.jsx` — offline queue
3. `vite.config.js` — SW build config

### Commit
`feat(pwa): complete Epic 14 — PWA, offline support, push notifications`

---

## Epic 15: WhatsApp/Messenger Integration (Optional)

**Status:** 🔴 Not Started
**Target:** Aug 28 — Sep 5

### What
WhatsApp chatbot integration for complaint submission and tracking (no Facebook integration — user explicitly declined Facebook).

### Why
- WhatsApp is the #2 most used app in Nepal after Facebook
- OneService Singapore model: submit complaints via WhatsApp chat
- Lowers barrier: citizens don't need to visit a website
- Automated status checks: "Send your reference code to check status"

### How
- WhatsApp Business API integration
- Webhook receiver for incoming messages
- Conversation flow: File complaint → Ask category → Ask location → Ask description → Confirm
- Status check: "Reply with your reference code"

### Note
This is deferred until production deployment and user feedback confirms demand.

---

## Execution Log

| Date | Epic | Status | Notes |
|------|------|--------|-------|
| Jul 10, 2026 | Epic 7 | ✅ Completed | BS Date service, Feed page, ComplaintCard, filters, 66 tests |
| Jul 10, 2026 | Epic 8 | ✅ Completed | Upvotes, Comments, Duplicate Detection — 80 tests all passing |
| Jul 10, 2026 | Epic 9 | ✅ Completed | Multi-Tenant, Departments, Auto-Routing — 16 tests |
| Jul 10, 2026 | Epic 10 | ✅ Completed | SLA, Escalation, Transfer, Merge — 101 total tests |

---

## Recovery Instructions

If session is interrupted:
1. Read this file (FridayTask.md) for the current epic
2. Read AGENTS.md for full project context
3. Find the last commit message to know what was done
4. Run `git status` and `git diff` to see current changes
5. Continue from the last incomplete epic
