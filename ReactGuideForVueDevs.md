# ⚛️ React + Laravel + Inertia + Ziggy — Guide for Vue Developers

> You know Vue with Laravel. This project uses React with Inertia. Here's everything you need to understand, mapped to Vue concepts you already know.

---

## 1. The Big Picture: Same Architecture, Different Library

```
Vue Way:                             React Way:
┌──────────────────┐                 ┌──────────────────┐
│  Laravel          │                │  Laravel          │
│  └─ Controller    │                │  └─ Controller    │
│     returns Vue   │                │     returns React │
│     page via      │                │     page via      │
│     Inertia       │                │     Inertia       │
└────────┬─────────┘                 └────────┬─────────┘
         │ JSON with props                     │ JSON with props
         ▼                                     ▼
┌──────────────────┐                 ┌──────────────────┐
│  Vue Component   │                │  React Component │
│  (SPA navigation)│                │  (SPA navigation)│
└──────────────────┘                 └──────────────────┘
```

**Nothing changes on the Laravel side.** The controller still returns `Inertia::render('PageName', $props)`. Only the frontend language changes.

---

## 2. Concept Mapping

| Vue | React (in this project) | Notes |
|-----|------------------------|-------|
| `data()` / `ref()` | `useState()` | `const [count, setCount] = useState(0)` |
| `computed` | `useMemo()` or inline | Computed properties are just memoized values |
| `methods` | Plain functions | No `methods` object — just write `function handleClick() {}` |
| `v-model` | `value` + `onChange` | Two-way binding is manual: `<input value={val} onChange={e => setVal(e.target.value)} />` |
| `v-if` / `v-show` | Ternary / `&&` | `{condition && <div>shown</div>}` or `{condition ? <A/> : <B/>}` |
| `v-for` | `.map()` | `{items.map(item => <div key={item.id}>{item.name}</div>)}` |
| `@click` | `onClick` | `<button onClick={handleClick}>` |
| `:class` | `className` + template literal | `` className={`base ${active ? 'active' : ''}`} `` |
| `:style` | `style={{}}` (camelCase) | `<div style={{ color: 'red', fontSize: 14 }}>` |
| `props` | Destructured props | `export default function Page({ title, items })` |
| `emits` | Callback props | `<Child onSave={handleSave} />` — child calls `props.onSave(data)` |
| `watch` | `useEffect()` | `useEffect(() => { console.log(count) }, [count])` |
| `computed(get, set)` | `useState` + `useCallback` | For two-way computed, use state + handler |
| `<slot>` | `{children}` | Default slot: wrap, named: pass as props |
| `<template>` | `<></>` (Fragment) | No wrapper needed: `return <> <A/> <B/> </>` |
| `vue-router` | Inertia `<Link>` | `<Link href={route('dashboard')}>` |
| `Pinia` / `Vuex` | React Context | `LanguageContext` provides `t()` and `toggleLang()` globally |
| `axios` | Inertia `router` + `useForm` | Mutations: `router.post()`, forms: `useForm().post()` |
| `Ziggy` in Vue | Ziggy in React | **Same library** — `route('dashboard')` works identically |
| `computed from usePage()` | `usePage().props` | Access shared Laravel data |

---

## 3. Key React Concepts That Trip Up Vue Devs

### 3.1 JSX vs Templates

```vue
<!-- Vue: template syntax -->
<template>
  <div v-if="show" class="card" @click="handleClick">
    {{ title }}
  </div>
</template>
```

```jsx
// React: JSX (JavaScript + XML in same file)
function Card({ show, title, onClick }) {
  return (
    <>
      {show && (
        <div className="card" onClick={onClick}>
          {title}
        </div>
      )}
    </>
  );
}
```

**Key differences:**
- JSX uses `className` not `class`
- JSX uses `onClick` not `@click` (camelCase for all events: `onChange`, `onSubmit`, `onMouseEnter`)
- JSX uses `{condition && element}` not `v-if`
- JSX uses `{items.map(...)}` not `v-for`

### 3.2 useState — Hooks, Not data()

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);   // reactive variable
  const [name, setName] = useState('');    // each call = one reactive value

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  );
}
```

In Vue you'd write `data() { return { count: 0, name: '' } }` and mutate with `this.count++`. In React, you use multiple `useState` calls and a setter function.

### 3.3 useEffect — The Watch + Mounted Replacement

```jsx
import { useEffect } from 'react';

// On mount (empty deps)
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// Watch count changes
useEffect(() => {
  console.log('count changed to', count);
}, [count]);

// Cleanup on unmount
useEffect(() => {
  const timer = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(timer);  // like onUnmounted
}, []);
```

### 3.4 Inertia useForm — Forms Without Vue's v-model

```jsx
import { useForm } from '@inertiajs/react';

function MyForm() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    post('/users');  // sends { name, email } as POST
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={data.name} onChange={e => setData('name', e.target.value)} />
      {errors.name && <p>{errors.name}</p>}
      <button disabled={processing}>Submit</button>
    </form>
  );
}
```

**`useForm`** replaces `v-model` + Vue's form handling. It:
- Manages form state
- Tracks `processing` (loading state)
- Shows `errors` from Laravel validation
- Supports `forceFormData: true` for file uploads

### 3.5 No `this` — Everything is Functional

In Vue Options API: `this.count`, `this.handleClick()`, `this.$router`.

In React: **no `this`** — variables and functions are just in the closure:

```jsx
function Page() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(c => c + 1);  // no "this" needed
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

---

## 4. How Inertia Works (Same in Vue, Same in React)

### 4.1 Server side (Laravel controller)

```php
// Inertia always renders a page — never returns JSON directly
return Inertia::render('Submit', [
    'locations' => Location::all(),
    'organizations' => Organization::all(),
]);
```

### 4.2 Client side (React)

```jsx
// The props arrive automatically matching the controller
export default function Submit({ locations, organizations }) {
  // locations and organizations are already available as props
}
```

### 4.3 Navigation

```jsx
// Client-side navigation (no page reload)
import { Link } from '@inertiajs/react';
import { route } from '../../ziggy';

<Link href={route('issues.create')}>Submit</Link>

// Programmatic navigation
import { router } from '@inertiajs/react';
router.visit(route('dashboard'));

// POST/PATCH/DELETE
router.post(route('issues.feedback', id), { rating: 5 });

// Access page props anywhere
import { usePage } from '@inertiajs/react';
const { auth, flash } = usePage().props;
```

---

## 5. Ziggy — Works Identical to Vue

```jsx
import { route } from '../../ziggy';

route('dashboard');              // → "/"
route('issues.show-reference', 'TU-0001');  // → "/issues/reference/TU-0001"
route('admin.organizations');    // → "/admin/organizations"
```

Same `route()` function, same named routes from `web.php`. **The API is identical to the Vue version.**

---

## 6. Common Patterns Side-by-Side

### Conditional Rendering

```vue
<!-- Vue -->
<div v-if="loading">Loading...</div>
<div v-else-if="error">{{ error }}</div>
<div v-else>{{ data }}</div>
```

```jsx
// React
{loading && <div>Loading...</div>}
{!loading && error && <div>{error}</div>}
{!loading && !error && <div>{data}</div>}
```

### Lists

```vue
<!-- Vue -->
<li v-for="item in items" :key="item.id">
  {{ item.name }}
</li>
```

```jsx
// React
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

### Classes

```vue
<!-- Vue -->
<div :class="{ active: isActive, disabled: isDisabled }">
```

```jsx
// React
<div className={`base ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}>
```

### Event Handling

```vue
<!-- Vue -->
<button @click="handleClick" @submit.prevent="handleSubmit">
```

```jsx
// React
<button onClick={handleClick} onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
```

---

## 7. Gotchas to Watch Out For

| Gotcha | Vue | React |
|--------|-----|-------|
| CSS classes | `class="..."` | `className="..."` |
| Inline styles | `:style="{ color: 'red' }"` | `style={{ color: 'red' }}` |
| HTML attributes | `for="email"` | `htmlFor="email"` |
| Boolean attributes | `disabled="true"` | `disabled={true}` (no quotes) |
| Fragments | `<template>` (auto) | `<>...</>` (explicit) |
| Mutating arrays | `arr.push(x)` works | `setArr([...arr, x])` — spread operator |
| `key` on lists | `:key="item.id"` | `key={item.id}` |
| Import extension | Can skip `.vue` | Must include `.jsx` |

---

## 8. Real Example: SearchSelect Component (Custom Combobox)

This project replaces native `<select>` with a custom `SearchSelect` component. Here's how it works in React vs Vue:

**In Vue you'd write:**
```vue
<select v-model="orgId">
  <option v-for="o in orgs" :key="o.id" :value="o.id">{{ o.name }}</option>
</select>
```

**In React we use:**
```jsx
<SearchSelect
  options={orgs.map(o => ({ value: o.id, label: o.name }))}
  value={data.organization_id}
  onChange={v => handleOrgChange(v)}
  placeholder="Search organization..."
  error={errors.organization_id}
/>
```

The `SearchSelect` component (see `Components/SearchSelect.jsx`) is a self-contained React component that demonstrates several patterns:

| Pattern | How It's Done |
|---------|---------------|
| **Click-outside to close** | `useEffect` + `document.addEventListener('mousedown', ...)` |
| **Keyboard navigation** | `onKeyDown` handler with Arrow Up/Down/Enter/Escape |
| **Scroll into view** | `useEffect` watching `highlightIdx` + `scrollIntoView()` |
| **Floating dropdown** | `absolute z-50` positioned relative to container |
| **Controlled input** | `value={open ? query : displayText}` — shows query while typing, label otherwise |
| **ARIA accessibility** | `role="combobox"`, `aria-expanded`, `aria-haspopup`, `role="option"`, `aria-selected` |

This is a good example of how React handles DOM interactions that Vue would do with directives (`v-click-outside`, `v-model`) — you use hooks and explicit event listeners instead.

---

## Summary

> **Think of React as Vue without the magic.** No `v-` directives, no `data()` reactivity system, no computed setters. Everything is explicit — `useState` for reactivity, `.map()` for loops, ternary for conditionals, `onClick` for events. But the **Laravel + Inertia architecture is identical**. Your backend knowledge transfers 100%. Only the template syntax changes.
