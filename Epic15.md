# Epic 15: Submission Improvements & Social Trust

> **Session Recovery Document** — If session resets, read this + AGENTS.md + SRS.md to continue.
> **Target:** Kathmandu Metropolitan City (KMC) — single municipality MVP

---

## Status: 🔴 Not Started
**Target:** Jul 11 — Jul 18

---

## Session Recovery Instructions

If your AI session resets mid-implementation:

1. **Read this file** (Epic15.md) — find the first `[ ]` unchecked item
2. **Read SRS.md** — section FR-15.x for functional requirements of that item
3. **Run to check current state:**
   ```bash
   git status
   git diff --stat
   git log --oneline -5
   ```
4. **Read the last file you were editing** — pick up where you left off
5. **Run tests after every major change:**
   ```bash
   php artisan test --filter=Epic15
   ```

---

## What

Four related improvements to the citizen submission and feed experience:

1. **Title Field** — Add a short title to every complaint (currently only `description` exists)
2. **Social Proof** — Show upvoter names in the feed (`"Himal + 4 others"`) to build trust
3. **Priority Override** — Separate user-selected priority from admin-verified priority
4. **Duplicate Auto-Merge** — Automatically merge highly similar complaints so content consolidates on one issue

---

## Why

- **Title Field:** Currently citizens type a wall of text as `description`. There's no headline. The feed shows raw text snippets. A title gives every complaint a clear, scannable headline — like a news article. This is how FixMyStreet, Reddit, and every social platform works.
- **Social Proof:** A complaint with `"Himal + 4 others"` is more credible than `"6 upvotes"`. Named supporters prove real people stand behind the issue. This builds trust and community pressure.
- **Priority Override:** Citizens always select "Critical" if given the choice. This breaks SLA enforcement and clogs the admin dashboard. Admin needs a way to verify and correct priority without losing the citizen's original input.
- **Duplicate Auto-Merge:** When the same pothole gets 5 reports, all evidence (photos, videos) should consolidate. The citizen gets a reference code either way — no confusion. The parent issue shows `"3 others also reported this"` for social proof.

---

## How

### A. Title Field

**Step 1: Migration** — Add `title` column to issues table

Create file `database/migrations/2026_07_11_000001_add_title_to_issues.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->string('title', 255)->nullable()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};
```

**Step 2: Model Update** — Add `title` to fillable

In `app/Models/Issue.php`, add `'title'` to the `$fillable` array (around line 17-43).

**Step 3: Validation** — In `app/Http/Controllers/IssueController.php`, add title validation in `store()`:

After line 53 (the `$validated` block), add:
```php
'title' => 'required|string|max:200',
```

**Step 4: Store Title** — In the Issue::create call (around line 90), add:
```php
'title' => $validated['title'],
```

**Step 5: Frontend — Submit.jsx** — Add title input to Step 1

In `resources/js/Pages/Public/Submit.jsx`:
- Add `title: ''` to the `useForm` initial data (line 19-33)
- In Step 0 (issue details), add a title input field after location (around line 276):
```jsx
<div>
  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
    {t('submit.title_label')} *
  </label>
  <input type="text" value={data.title}
    onChange={e => setData('title', e.target.value)}
    className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow hover:shadow-sm"
    placeholder={lang === 'np' ? 'छोटो शीर्षक लेख्नुहोस्' : 'Enter a short title'}
    maxLength={200}
  />
</div>
```

- Update `canProceed()` to include title:
```jsx
if (step === 0) return data.organization_id && data.category_id && data.priority
    && data.location_id && data.title;
```

- Update Review Summary to show title.

**Step 6: Display Title Everywhere**

- **ComplaintCard.jsx** (line 80-86): Replace `issue.description` with `issue.title` as the primary text. Keep description as secondary line-clamp.
```jsx
<p className="text-sm font-semibold text-gray-900 mb-1">{issue.title}</p>
<p className="text-xs text-gray-600 line-clamp-2">{issue.description}</p>
```

- **Reference.jsx** (Public/Reference): Show title as `<h1>`, description as paragraph below
- **StatusCheck.jsx** (Public/StatusCheck): Show title in the issue detail card
- **Admin/Issues/Index.jsx**: Add title column to table
- **Admin/Issues/Show.jsx**: Show title prominently

**Step 7: Translations**

In `resources/js/lang/en.js`, add:
```js
'submit.title_label': 'Title',
'submit.title_placeholder': 'Enter a short title (e.g., "Broken water pipe at New Road")',
```

In `resources/js/lang/np.js`, add:
```js
'submit.title_label': 'शीर्षक',
'submit.title_placeholder': 'छोटो शीर्षक लेख्नुहोस् (जस्तै: "न्यू रोडमा फुटेको पाइप")',
```

---

### B. Social Proof — Upvoter Names in Feed

**Step 1: FeedController Update** — Add upvoter names to paginated response

In `app/Http/Controllers/FeedController.php`, in the `index()` method:

After loading issues with `withCount(['upvotes', 'comments'])` (line 45), add eager load for upvotes with users:
```php
$query->with(['upvotes' => function ($q) {
    $q->with('user:id,name')->latest()->limit(50); // load enough for name extraction
}]);
```

In the `through()` callback (line 47), add social proof data:
```php
// Extract upvoter names
$namedUpvoters = $issue->upvotes->filter(fn($u) => $u->user_id !== null)->pluck('user.name')->unique()->take(2)->values();
$anonymousCount = $issue->upvotes->filter(fn($u) => $u->user_id === null)->count();
$totalUpvotes = $issue->upvotes->count();

// Build social proof string
$socialProof = null;
if ($totalUpvotes > 0) {
    if ($namedUpvoters->count() === $totalUpvotes && $namedUpvoters->count() <= 2) {
        $socialProof = $namedUpvoters->implode(', ');
    } elseif ($namedUpvoters->count() === 0) {
        $socialProof = $totalUpvotes . ($lang === 'np' ? ' जना' : ' people');
    } elseif ($namedUpvoters->count() === 1) {
        $socialProof = $namedUpvoters[0] . ' + ' . ($totalUpvotes - 1) . ' ' . (lang === 'np' ? 'अरू' : 'others');
    } else {
        $socialProof = $namedUpvoters->implode(', ') . ' + ' . ($totalUpvotes - $namedUpvoters->count()) . ' ' . (lang === 'np' ? 'अरू' : 'others');
    }
}
```

But wait — this eager loads ALL upvotes for every issue in the paginated result, which could be heavy. Better approach: use a subquery or load a limited set.

**Optimized approach:**
```php
$query->with(['upvotes.user:id,name']);
// And load only the last 10 upvotes per issue (enough for name extraction)
```

Actually the cleanest approach is to keep `withCount` and add a separate query for names. But that's N+1 queries. Let's use a single subquery approach:

```php
// In the paginate()->through() callback:
$userUpvoteNames = \App\Models\Upvote::where('issue_id', $issue->id)
    ->whereNotNull('user_id')
    ->with('user:id,name')
    ->take(2)
    ->get()
    ->pluck('user.name')
    ->toArray();

$anonymousUpvoteCount = \App\Models\Upvote::where('issue_id', $issue->id)
    ->whereNull('user_id')
    ->count();
```

This is still N queries. Better: use `with()` on the paginator with a limited eager load.

Actually, for a social feed with 20 items, loading all upvotes for 20 issues is fine. An issue rarely has 1000+ upvotes immediately. Let's keep it simple:

```php
// Add to the query builder before paginate():
$query->with(['upvotes' => fn($q) => $q->with('user:id,name')->latest()->limit(10)]);
```

Then in `through()`:
```php
$named = $issue->upvotes->filter(fn($u) => $u->user)->pluck('user.name')->unique()->take(2)->values();
$anon = $issue->upvotes->filter(fn($u) => !$u->user)->count();
$total = $issue->upvotes_count ?? $issue->upvotes->count();
```

**Step 2: ComplaintCard.jsx** — Show social proof text

Add below the UpvoteButton (around line 109):
```jsx
{issue.social_proof && (
  <span className="text-[10px] sm:text-xs text-gray-400 ml-1">
    {issue.social_proof}
  </span>
)}
```

And in the `through()` mapping in FeedController, add `'social_proof' => $socialProof` to the returned array.

**Step 3: Admin Issue List** — Show social proof

In `Admin/Issues/IssueController.php::index()`, add the same social proof computation to the `through()` callback.

**Step 4: Cache Invalidation**

In `UpvoteController::toggle()` (line 19), after cache forget for upvote count, also invalidate feed cache if you cache feed pages.

---

### C. Priority Override Workflow

**Step 1: Migration** — Add priority override fields

Create `database/migrations/2026_07_11_000002_add_priority_override_to_issues.php`:
```php
Schema::table('issues', function (Blueprint $table) {
    $table->string('user_priority', 20)->nullable()->after('priority');
    $table->string('admin_priority', 20)->nullable()->after('user_priority');
    $table->timestamp('priority_reviewed_at')->nullable()->after('admin_priority');
    $table->foreignId('priority_reviewed_by')->nullable()->constrained('users')->after('priority_reviewed_at');
});
```

Backfill: set `user_priority = priority` for all existing issues:
```php
DB::table('issues')->whereNull('user_priority')->update(['user_priority' => DB::raw('priority')]);
```

**Step 2: Model Update** — Add fillable fields

In `app/Models/Issue.php`, add to `$fillable`:
```php
'user_priority',
'admin_priority',
'priority_reviewed_at',
'priority_reviewed_by',
```

**Step 3: Submission Logic** — When creating an issue (IssueController::store):

At line 90-105 (`Issue::create`), change priority storage:
```php
'priority' => $validated['priority'],
'user_priority' => $validated['priority'],
```

**Step 4: Display Priority** — Helper method to get effective priority:

In Issue model:
```php
public function effectivePriority(): string
{
    return $this->admin_priority ?? $this->priority;
}
```

**Step 5: Admin Issue Detail** — Show both priorities + override dropdown

In `Admin/Issues/IssueController.php::show()` (line 93-144), include both values in the response:
```php
'priority' => $issue->effectivePriority(),
'user_priority' => $issue->user_priority,
'admin_priority' => $issue->admin_priority,
'priority_reviewed_at' => $issue->priority_reviewed_at?->toISOString(),
```

In `resources/js/Pages/Admin/Issues/Show.jsx`, add a priority override section:
```jsx
<div className="bg-white rounded-xl border p-4">
  <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority Verification</h3>
  
  {/* Show both */}
  <div className="flex items-center gap-4 mb-3">
    <div>
      <span className="text-xs text-gray-500">User reported:</span>
      <PriorityBadge priority={issue.user_priority} />
    </div>
    {issue.admin_priority && (
      <div>
        <span className="text-xs text-gray-500">Admin verified:</span>
        <PriorityBadge priority={issue.admin_priority} />
      </div>
    )}
    {issue.user_priority !== issue.admin_priority && issue.admin_priority && (
      <span className="text-xs text-amber-600 flex items-center gap-1">
        ⚠️ Mismatch — needs review
      </span>
    )}
  </div>
  
  {/* Override dropdown */}
  <select onChange={e => setAdminPriority(e.target.value)} value={issue.admin_priority || issue.user_priority}
    className="rounded-lg border-gray-200 text-sm">
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
    <option value="critical">Critical</option>
  </select>
  <button onClick={handlePriorityOverride}
    className="ml-2 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg">
    Confirm Priority
  </button>
</div>
```

**Step 6: Backend Endpoint** — Update `Admin/Issues/IssueController.php` with priority override method:

```php
public function updatePriority(Request $request, Issue $issue)
{
    $validated = $request->validate([
        'admin_priority' => 'required|in:low,medium,high,critical',
    ]);

    $oldPriority = $issue->effectivePriority();
    $issue->update([
        'admin_priority' => $validated['admin_priority'],
        'priority' => $validated['admin_priority'],
        'priority_reviewed_at' => now(),
        'priority_reviewed_by' => Auth::id(),
    ]);

    IssueEvent::create([
        'issue_id' => $issue->id,
        'user_id' => Auth::id(),
        'type' => 'priority_changed',
        'description' => "Priority changed from {$oldPriority} to {$validated['admin_priority']} by admin.",
        'metadata' => [
            'from' => $oldPriority,
            'to' => $validated['admin_priority'],
            'user_priority' => $issue->user_priority,
        ],
        'is_public' => true,
    ]);

    return redirect()->back()->with('success', 'Priority updated successfully.');
}
```

Add route in `routes/web.php`:
```php
Route::post('/admin/issues/{issue}/priority', [\App\Http\Controllers\Admin\Issues\IssueController::class, 'updatePriority'])
    ->middleware(['auth', 'admin']);
```

**Step 7: Admin Dashboard** — Filter by effective priority

In `Admin/Issues/IssueController.php::index()` (line 27-28), update priority filter to use effective priority:
```php
if ($request->filled('priority')) {
    // priority column reflects admin override (set in updatePriority)
    $query->where('priority', $request->priority);
}
```

**Step 8: SLA Engine** — Ensure it uses `priority` column (it already does via `slaDeadline()` method)

---

### D. Duplicate Auto-Merge with Social Proof

**Step 1: Migration** — Create `issue_media` table

Create `database/migrations/2026_07_11_000003_create_issue_media_table.php`:
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

**Step 2: Model** — Create `app/Models/IssueMedia.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssueMedia extends Model
{
    protected $fillable = [
        'issue_id',
        'path',
        'type',
        'submitted_by_session',
    ];

    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }
}
```

**Step 3: Issue Model** — Add relationship:
```php
public function media(): HasMany
{
    return $this->hasMany(IssueMedia::class);
}
```

**Step 4: IssueController::store** — After creation, run duplicate check + auto-merge

In `app/Http/Controllers/IssueController.php::store()`, after creating the issue (line 105), after the photo/video storage (line 80-88):

Add media records:
```php
if ($photoPath) {
    $issue->media()->create(['path' => $photoPath, 'type' => 'photo']);
}
if ($videoPath) {
    $issue->media()->create(['path' => $videoPath, 'type' => 'video']);
}
```

After duplicate detection (line 75-78), add auto-merge logic:
```php
$bestDuplicate = $duplicates[0] ?? null;
if ($bestDuplicate && $bestDuplicate['similarity'] > 0.5) {
    $parentIssue = Issue::find($bestDuplicate['id']);
    if ($parentIssue && $parentIssue->status !== 'merged') {
        // Auto-merge
        \App\Services\MergeService::autoMerge($issue, $parentIssue);

        // Redirect to parent reference page
        return redirect()->route('issues.show-reference', [
            'reference_code' => $parentIssue->reference_code,
        ])->with('info', 'Your complaint was similar to an existing report. It has been combined for better tracking. Reference code: ' . $parentIssue->reference_code);
    }
}
```

**Step 5: MergeService Enhancement** — Add `autoMerge()` static method

In `app/Services/MergeService.php`, add:
```php
public static function autoMerge(Issue $source, Issue $target): bool
{
    if ($source->id === $target->id || $source->status === 'merged') {
        return false;
    }

    return DB::transaction(function () use ($source, $target) {
        // Merge media
        foreach ($source->media as $media) {
            $media->update(['issue_id' => $target->id]);
        }

        // Merge comments
        Comment::where('issue_id', $source->id)->update(['issue_id' => $target->id]);

        // Merge upvotes
        foreach (Upvote::where('issue_id', $source->id)->get() as $upvote) {
            // Skip if already upvoted the target
            if (!Upvote::hasUpvoted($target->id, $upvote->user_id, $upvote->session_id)) {
                $upvote->update(['issue_id' => $target->id]);
            }
        }

        // Update source status
        $source->update([
            'status' => 'merged',
            'duplicate_of_id' => $target->id,
        ]);

        // Events
        IssueEvent::create([
            'issue_id' => $source->id,
            'type' => 'merged',
            'description' => "Auto-merged into {$target->reference_code}.",
            'metadata' => ['merged_into_id' => $target->id, 'merged_into_code' => $target->reference_code],
            'is_public' => true,
        ]);

        IssueEvent::create([
            'issue_id' => $target->id,
            'type' => 'merged',
            'description' => "Another citizen also reported this issue (from {$source->reference_code}).",
            'metadata' => ['merged_from_id' => $source->id, 'merged_from_code' => $source->reference_code],
            'is_public' => true,
        ]);

        return true;
    });
}
```

**Step 6: Feed Display** — Show "X others also reported this"

In `FeedController::index()`, when mapping issues, check merged count:
```php
// Add to the query: withCount for merged children
// Or compute in the through() callback
$mergedCount = Issue::where('duplicate_of_id', $issue->id)->count();
```

Add to feed response:
```php
'merged_count' => $mergedCount,
```

In ComplaintCard.jsx, show:
```jsx
{issue.merged_count > 0 && (
  <span className="text-[10px] sm:text-xs text-gray-400">
    {issue.merged_count + 1} {(lang === 'np' ? 'जनाले रिपोर्ट गरे' : 'people reported this')}
  </span>
)}
```

**Step 7: Redirect Merged References**

When someone accesses a merged issue's reference page, redirect to parent:

In `IssueController::showReference()` (line 146), after finding the issue:
```php
if ($issue->status === 'merged' && $issue->duplicate_of_id) {
    $parent = Issue::find($issue->duplicate_of_id);
    if ($parent) {
        return redirect()->route('issues.show-reference', ['reference_code' => $parent->reference_code])
            ->with('info', 'This complaint was combined with ' . $parent->reference_code);
    }
}
```

**Step 8: Nepali Stop Words for Better Duplicate Detection**

In `app/Services/DuplicateDetectionService.php`, extend `STOP_WORDS` with Nepali words:
```php
private const STOP_WORDS = [
    // ... existing English words ...
    // Nepali stop words
    'को', 'मा', 'ले', 'लाई', 'बाट', 'मा', 'को', 'र', 'पनि', 'हो', 'थियो',
    'छ', 'रहेको', 'गरेको', 'भएको', 'गर्न', 'भए', 'गरी', 'सम्म', 'साथ',
    'तर', 'वा', 'अझ', 'नै', 'पछि', 'अगाडि', 'माथि', 'तल', 'भित्र',
    'बाहिर', 'यो', 'त्यो', 'जो', 'जुन', 'कुनै', 'केही', 'धेरै',
    'कम', 'सबै', 'कृपया', 'हामी', 'तपाईं', 'उहाँ', 'उनी',
];
```

---

## Database Changes (Epic 15)

1. `database/migrations/2026_07_11_000001_add_title_to_issues.php` — title column
2. `database/migrations/2026_07_11_000002_add_priority_override_to_issues.php` — user_priority, admin_priority, reviewed timestamps
3. `database/migrations/2026_07_11_000003_create_issue_media_table.php` — media consolidation

---

## Files to Create

1. `app/Models/IssueMedia.php`
2. `database/migrations/2026_07_11_000001_add_title_to_issues.php`
3. `database/migrations/2026_07_11_000002_add_priority_override_to_issues.php`
4. `database/migrations/2026_07_11_000003_create_issue_media_table.php`

---

## Files to Modify

1. `app/Models/Issue.php` — Add fillable (title, user/admin_priority, review fields), add `media()` relationship, add `effectivePriority()` method, add `socialProof()` method
2. `app/Models/IssueEvent.php` — No changes needed (metadata already supports type 'priority_changed')
3. `app/Models/Upvote.php` — No changes needed (user relation already exists)
4. `app/Models/Comment.php` — No changes
5. `app/Http/Controllers/IssueController.php` — Title validation + storage, media creation, auto-merge logic, merged reference redirect
6. `app/Http/Controllers/FeedController.php` — Social proof data, merged count, title in response
7. `app/Http/Controllers/Admin/Issues/IssueController.php` — Priority override endpoint, show user/admin priority, social proof
8. `app/Http/Controllers/CommentController.php` — No changes
9. `app/Services/MergeService.php` — Add `autoMerge()` method with media + upvote consolidation
10. `app/Services/DuplicateDetectionService.php` — Add Nepali stop words
11. `routes/web.php` — Priority override POST route
12. `resources/js/Pages/Public/Submit.jsx` — Title input field, update canProceed()
13. `resources/js/Pages/Public/Reference.jsx` — Show title
14. `resources/js/Pages/Public/StatusCheck.jsx` — Show title
15. `resources/js/Components/Feed/ComplaintCard.jsx` — Title display, social proof text, merged count
16. `resources/js/Components/Feed/UpvoteButton.jsx` — Pass social proof data
17. `resources/js/Pages/Admin/Issues/Index.jsx` — Title column, social proof
18. `resources/js/Pages/Admin/Issues/Show.jsx` — Priority override UI, title
19. `resources/js/Pages/Admin/Dashboard/Index.jsx` — Title in recent issues
20. `resources/js/Pages/Public/Feed.jsx` — Pass social proof data
21. `resources/js/lang/en.js` — Title translations
22. `resources/js/lang/np.js` — Title translations

---

## Tests

### Unit Tests

| Test | File | What it tests |
|------|------|---------------|
| Issue has fillable title | `tests/Unit/IssueTest.php` | Title is in $fillable |
| Issue can have media | `tests/Unit/IssueTest.php` | issue->media() returns collection |
| MergeService::autoMerge merges media | `tests/Unit/MergeServiceTest.php` | Media records reassigned to parent |
| MergeService::autoMerge merges upvotes | `tests/Unit/MergeServiceTest.php` | Upvotes moved to parent |
| MergeService::autoMerge merges comments | `tests/Unit/MergeServiceTest.php` | Comments moved to parent |
| Issue::effectivePriority returns admin_priority first | `tests/Unit/IssueTest.php` | admin_priority > priority > user_priority |
| FeedController computes social proof | `tests/Unit/FeedControllerTest.php` | Correct string format for mixed/anon/all-named |

### Feature Tests

| Test | File | What it tests |
|------|------|---------------|
| Citizen can submit complaint with title | `tests/Feature/IssueSubmissionTest.php` | Title stored and visible |
| Title is required | `tests/Feature/IssueSubmissionTest.php` | Validation error without title |
| Title max 200 chars | `tests/Feature/IssueSubmissionTest.php` | Validation error with 201 char title |
| Feed shows title | `tests/Feature/FeedTest.php` | Card renders title text |
| Feed shows social proof for mixed upvotes | `tests/Feature/FeedTest.php` | "Himal + 4 others" displayed |
| Feed shows social proof for all anonymous | `tests/Feature/FeedTest.php` | "5 people" displayed |
| Admin can override priority | `tests/Feature/AdminPriorityTest.php` | Priority updated, event created |
| Duplicate auto-merges on submit | `tests/Feature/DuplicateMergeTest.php` | New issue merged, parent shows count |
| Merged reference redirects to parent | `tests/Feature/DuplicateMergeTest.php` | 302 to parent's reference page |
| Priority override creates IssueEvent | `tests/Feature/AdminPriorityTest.php` | Event with type 'priority_changed' |
| Social proof updates after upvote toggle | `tests/Feature/UpvoteTest.php` | Names string changes correctly |

---

## Implementation Order (Step-by-Step)

Follow this exact order. Each step builds on the previous.

1. **Migration A** — Run `php artisan make:migration add_title_to_issues` and add the column
2. **Model** — Add `title` to Issue.php fillable
3. **Controller** — Add title validation + storage in IssueController::store
4. **Frontend** — Add title input to Submit.jsx (form + canProceed + review summary)
5. **Display** — Add title to ComplaintCard.jsx, Reference.jsx, StatusCheck.jsx, Admin pages
6. **Translations** — Add title labels to en.js and np.js
7. **Run tests** — `php artisan test --filter=IssueSubmission` — verify title works
8. **Migration B** — Add user_priority, admin_priority, review fields
9. **Backfill** — Set user_priority = priority for existing issues
10. **Model** — Add fillable + effectivePriority() method
11. **Controller** — Update IssueController::store to set user_priority = priority
12. **Endpoint** — Add updatePriority() to Admin IssueController
13. **Route** — Register POST /admin/issues/{issue}/priority
14. **Frontend** — Add priority override UI to Admin/Issues/Show.jsx
15. **Migration C** — Create issue_media table
16. **Model** — Create IssueMedia model, add media() to Issue
17. **Controller** — Update IssueController::store to create media records
18. **MergeService** — Add autoMerge() with media + upvote + comment consolidation
19. **Controller** — Wire auto-merge into IssueController::store after create
20. **Controller** — Add merged reference redirect in showReference()
21. **Frontend** — Add merged_count display to ComplaintCard
22. **FeedController** — Add social proof computation + merged count
23. **Frontend** — Add social proof text to ComplaintCard
24. **DuplicateDetection** — Add Nepali stop words
25. **Run full test suite** — `php artisan test --filter=Epic15`

---

## Commit

```bash
git add -A && git commit -m "feat(epic15): add title field, social proof with upvoter names, priority override workflow, and duplicate auto-merge with media consolidation"
```
