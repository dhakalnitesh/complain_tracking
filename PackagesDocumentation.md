# Package Documentation — नागरिक सरोकार

> Every dependency in this project, explained: what it does, why we chose it, and what it replaces.

---

## Backend (Composer / PHP)

### `laravel/framework` — Laravel 13
**What:** Full-stack PHP framework  
**Why:** Industry standard for PHP. Built-in ORM (Eloquent), routing, migrations, validation, auth, queues, scheduling, testing.  
**Alternatives considered:** Symfony (too bare, needs bundles), Lumen (no Eloquent features), raw PHP (unsafe, slow to build)

### `inertiajs/inertia-laravel` — Inertia.js Server Adapter
**What:** Server-side adapter that lets Laravel render React components directly, no API layer needed.  
**Why:** Eliminates the need for a separate REST/GraphQL API. You write controllers that return React pages. Data is passed as props, auth is shared via middleware.  
**Alternatives:** Livewire (no React, full-page reloads), Vue SPA + REST API (double the code), traditional Blade (no reactivity)

### `tightenco/ziggy` — Ziggy
**What:** Generates a `route()` helper for JavaScript that mirrors Laravel's named routes.  
**Why:** You define routes once in `web.php` and call `route('issues.show-reference', code)` in React. No hardcoded URLs, no API client library needed.  
**Alternatives:** Hardcoding URLs (breaks on path changes), axios interceptors (manual), full API client like `laravel-echo` (overkill)

### `laravel/sanctum` — API Auth (included with Laravel)
**What:** Session-based token auth.  
**Why:** Handles SPA authentication seamlessly — CSRF protection, session management, cookie-based tokens for Inertia requests.  
**Alternatives:** JWT (stateless but complex for SPA), Passport (OAuth2 overkill for this)

---

## Frontend (NPM)

### `react` + `react-dom` — React 19
**What:** UI component library  
**Why:** Component-based, declarative, massive ecosystem. React 19 has the new compiler, better server components, and improved hydration.  
**Alternatives:** Vue (user's previous experience — see ReactGuide.md for comparison), Svelte (smaller community), Solid (too new)

### `@inertiajs/react` — Inertia.js React Adapter
**What:** Client-side adapter that lets React pages be rendered by Laravel via Inertia protocol.  
**Why:** You get SPA-like navigation (no full page reloads) without building an API. Laravel sends JSON with props, Inertia swaps React components.  
**Key features used:**
- `<Link>` — client-side navigation without reload
- `useForm()` — form handling with validation errors
- `usePage()` — access shared props (auth user, flash messages)
- `router` — programmatic navigation, POST/PATCH/DELETE from JS
- `Head` — sets `<title>` and meta tags per page

### `recharts` — Charts
**What:** React charting library built on D3.  
**Why:** Declarative, composable, works well with React state. Supports bar, line, pie, area charts out of the box.  
**Alternatives:** Chart.js (imperative API, less React-friendly), D3 (too low-level), Nivo (heavier)

### `@tailwindcss/vite` — Tailwind CSS v4 + Vite Plugin
**What:** Utility-first CSS framework with JIT compiler  
**Why:** Zero runtime CSS. Write styles inline with utility classes like `flex`, `text-sm`, `bg-white`, `rounded-xl`. The Vite plugin handles purging unused CSS automatically.  
**Alternatives:** Bootstrap (pre-built components, harder to customize), vanilla CSS (slow to write, no design system), styled-components (runtime CSS cost)

### `vite` — Vite 8
**What:** Next-gen build tool  
**Why:** Sub-3-second builds, native ESM dev server, HMR (hot module replacement) out of the box. Replaces Laravel Mix (Webpack wrapper).  
**Alternatives:** Webpack (slow, complex config), Laravel Mix (unmaintained, outdated)

---

## Database

### `mysql` — MySQL 8
**What:** Relational database  
**Why:** Available on most hosting, excellent with Laravel's Eloquent, supports JSON columns, full-text search, and GIS.  
**Alternatives:** SQLite (not suitable for production), PostgreSQL (equally good, less common on Nepal hosting), MariaDB (drop-in MySQL replacement)

---

## Infrastructure

### `ngrok` (dev only)
**What:** Secure tunnel to expose localhost publicly  
**Why:** Let judges/attendees scan a QR code and access the app from their phones during a hackathon demo.  
**Alternatives:** Cloud deployment (Railway, Render), local network IP (requires same WiFi)

---

## Custom Components (Built In-House)

### `SearchSelect.jsx` — Searchable Dropdown
**What:** A combobox/autocomplete component that replaces native `<select>` with a searchable input.

**Why (over native `<select>`):**
- Native `<select>` on mobile shows a clunky scroll wheel — unusable with 20+ options
- No search/filter capability — users had to scroll through long lists (13 categories, 40+ locations)
- No keyboard navigation — native selects don't support typing to filter

**Features:**
- Type-ahead filtering as you type
- Keyboard navigation (Arrow Up/Down, Enter to select, Escape to close)
- Click-outside to close
- Grouped options support (for locations with parent/child hierarchy)
- Selected option shows checkmark
- Highlighted item scrolls into view automatically
- Works with Inertia form state

**Where it's used:** Submit page (org, category, location), Admin Dashboard (status filter)

**Alternatives considered:** React-Select (heavy, 30KB+), Headless UI Combobox (requires additional wrapper), Downshift (complex API)

### `VoiceInput.jsx` — Speech-to-Text
**What:** Web Speech API wrapper that transcribes speech into text in the description field.

**Why:** Low literacy rates in Nepal (~67%) and preference for speaking over typing, especially for lengthy complaint descriptions.

**Caveat:** Only works in Chrome/Edge/Samsung Internet. Falls back to nothing on unsupported browsers.

### `ProgressSteps.jsx` — Status Timeline
**What:** Visual 3-step progress indicator (Received → In Progress → Resolved) with activity event list.

**Why:** Citizens need to see where their complaint is in the workflow at a glance. Text-only status is less intuitive.

### `Toast.jsx` — Flash Messages
**What:** Auto-dismissing notification system for success/error messages.

**Why:** Provides feedback after form submissions (issue submitted, status updated, feedback received) without blocking the user.

### `ShareButton.jsx` — WhatsApp + Clipboard
**What:** Buttons to share a complaint reference via WhatsApp or copy to clipboard.

**Why:** WhatsApp has 97%+ penetration in Nepal. Citizens share complaints with family/friends for moral support or to apply social pressure.

### `Badge.jsx` — Status & Priority Badges
**What:** Small colored labels for issue status and priority level.

**Why:** Consistent visual indicators make the UI scannable — red=urgent, green=resolved, amber=pending.

### `StatsCard.jsx` — Metric Display
**What:** Icon + number + label card for dashboard statistics.

**Why:** Reusable across 3 dashboards (public, org, admin) for consistent stat presentation.

### `LanguageToggle.jsx` — EN/NP Switcher
**What:** Button to toggle between English and Nepali.

**Why:** Bilingual support is critical for a Nepal-focused app. The toggle is compact enough for the nav bar.

---

## Package Aesthetics (Not Installed, But Why We Used SVGs Over Icons)

All icons in the UI are hand-crafted **inline SVGs** rather than a library like Heroicons or FontAwesome.

**Why:** Zero bundle size overhead, complete control over stroke widths and colors, no icon library API to learn. The downside is more verbose JSX, but for a project with ~20 unique icons, it's a net win.

---

## Summary: Minimal Dependency Philosophy

The entire project uses only **10 direct dependencies** (5 backend + 5 frontend). Every package was chosen to solve exactly one problem:

| Problem | Solution |
|---------|----------|
| Server rendering | Laravel |
| SPA without API | Inertia.js |
| Named routes in JS | Ziggy |
| UI components | React |
| Charts | Recharts |
| CSS | Tailwind |
| Build tool | Vite |
| Database | MySQL |

No unnecessary abstractions, no "nice to have" libraries. This keeps the build fast (808KB JS gzipped ~232KB) and the codebase easy to understand.
