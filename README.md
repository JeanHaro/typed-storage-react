# @jeanharo98/typed-storage-react

React hook for [@jeanharo98/typed-storage](https://github.com/JeanHaro/typed-storage) with automatic re-renders and localStorage sync.

```tsx
function App() {
    const storage = useStorage({
        theme: 'dark' as 'dark' | 'light',
        language: 'es' as 'es' | 'en',
        fontSize: 16,
    }, { prefix: 'app', sync: true });

    return (
        <div>
            <p>Theme: {storage.theme}</p>
            <button onClick={() => storage.set('theme', 'light')}>Light</button>
            <button onClick={() => storage.set('theme', 'dark')}>Dark</button>
        </div>
    );
}
```

---

## ✨ Features

- **`useStorage()` hook** — one hook for all your localStorage needs
- **`StorageProvider` + `useAppStorage()`** — share a single storage instance across your whole app via Context
- **Automatic re-renders** — component updates when storage changes
- **`useSyncExternalStore`** — uses React's official external store API
- **Cross-tab sync** — updates across browser tabs with `sync: true`
- **`useTrackRoute()`** — automatic route-based value sync via React Router
- **Type-safe** — full TypeScript support inferred from your schema
- **All typed-storage features** — TTL, prefix, sessionStorage, MemoryStorage fallback, `destroy()`, `batch()`, `routeOverrides`

---

## 📦 Installation

```bash
npm install @jeanharo98/typed-storage @jeanharo98/typed-storage-react
# or
pnpm add @jeanharo98/typed-storage @jeanharo98/typed-storage-react
```

> Both packages are required — `@jeanharo98/typed-storage` is a peer dependency. `react-router-dom` is required only if you use `useTrackRoute()` or `StorageProvider` with `routeOverrides`.

---

## 🚀 Usage

### Basic (single component)

```tsx
import { useStorage } from '@jeanharo98/typed-storage-react';

function App() {
    const storage = useStorage({
        theme: 'dark' as 'dark' | 'light',
        language: 'es' as 'es' | 'en',
        fontSize: 16,
        sidebarOpen: true,
    });

    return (
        <div>
            <p>Theme: {storage.theme}</p>
            <p>Language: {storage.language}</p>
            <p>FontSize: {storage.fontSize}</p>

            <button onClick={() => storage.set('theme', 'light')}>Light</button>
            <button onClick={() => storage.set('theme', 'dark')}>Dark</button>
            <button onClick={() => storage.reset('theme')}>Reset</button>
        </div>
    );
}
```

`useStorage()` is fine for a single component. But if **multiple components** need to read/write the same schema — which is the common case — read the next section first.

### With options

```tsx
const storage = useStorage({
    theme: 'dark' as 'dark' | 'light',
    language: 'es' as 'es' | 'en',
}, {
    prefix: 'app',      // stored as 'app:theme', 'app:language'
    sync: true,         // sync across browser tabs
    ttl: 3600000,       // expire after 1 hour
});
```

### All methods

```tsx
function Settings() {
    const storage = useStorage({
        theme: 'dark' as 'dark' | 'light',
    }, { prefix: 'app' });

    return (
        <div>
            <p>Theme: {storage.theme}</p>
            <p>Exists: {String(storage.has('theme'))}</p>

            <button onClick={() => storage.set('theme', 'light')}>Set Light</button>
            <button onClick={() => storage.reset('theme')}>Reset</button>
            <button onClick={() => storage.remove('theme')}>Remove</button>
            <button onClick={() => storage.destroy()}>Destroy All</button>
            <button onClick={() => storage.clear()}>Clear All</button>
        </div>
    );
}
```

---

## 🌳 Sharing one instance across your app with `StorageProvider`

### The problem this solves

Every call to `useStorage()` creates its **own** internal instance (via `useRef`). If you call `useStorage()` separately in two different page components with the same schema — e.g. one call in `Home` and another in `About` — you now have **two independent JavaScript instances**. They still read/write the same `localStorage` keys underneath, but each one has to define its own `options` (including `routeOverrides`), and it's easy for those definitions to drift apart between components as your app grows, causing confusing, inconsistent behavior.

`StorageProvider` fixes this the same way Angular's `TypedStorageService` (used inside an Angular `@Service()`, effectively a singleton) does — one instance, defined once, shared everywhere via React Context.

### Usage

```tsx
// main.tsx — BrowserRouter goes OUTSIDE StorageProvider,
// since StorageProvider uses useTrackRoute() internally, which needs Router context
import { StorageProvider } from '@jeanharo98/typed-storage-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <StorageProvider
            schema={{ theme: 'dark' as 'dark' | 'light' }}
            options={{
                prefix: 'app',
                sync: true,
                routeOverrides: {
                    '/': { theme: 'dark', __once: true },
                    '/about': { theme: 'light', __once: true }
                }
            }}
        >
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </StorageProvider>
    </BrowserRouter>
);
```

```tsx
// Home.tsx and About.tsx — both read the SAME shared instance
import { useAppStorage } from '@jeanharo98/typed-storage-react';

export function Home() {
    const storage = useAppStorage();
    return <p>Theme: {storage.theme}</p>;
}
```

```tsx
export function About() {
    const storage = useAppStorage();
    return <p>Theme: {storage.theme}</p>;
}
```

### ⚠️ `<BrowserRouter>` must wrap `<StorageProvider>`, not the other way around

`StorageProvider` calls `useTrackRoute()` internally so `routeOverrides` and `setRoute()` work automatically without any extra code in your components. Since `useTrackRoute()` depends on React Router's `useLocation()`, `StorageProvider` must be rendered **inside** a `<BrowserRouter>` (or `<HashRouter>`, etc.) — not outside it, or route tracking will silently fail to do anything.

```tsx
// ✅ Correct — Router outside, Provider inside
<BrowserRouter>
    <StorageProvider schema={...} options={...}>
        <Routes>...</Routes>
    </StorageProvider>
</BrowserRouter>

// ❌ Wrong — Provider outside Router context, useTrackRoute has nothing to read
<StorageProvider schema={...} options={...}>
    <BrowserRouter>
        <Routes>...</Routes>
    </BrowserRouter>
</StorageProvider>
```

### `useAppStorage()` throws outside a `StorageProvider`

```tsx
function OrphanComponent() {
    const storage = useAppStorage();
    // ❌ Throws: "useAppStorage debe usarse dentro de un StorageProvider"
    // if this component isn't rendered inside <StorageProvider>
}
```

This is intentional — it catches the mistake immediately at runtime instead of silently returning `undefined` and producing confusing bugs later.

### ⚠️ `StorageProvider` is for ONE shared value — not per-page isolation

`StorageProvider` (with `routeOverrides`, with or without `__once`) always keeps **one shared value** across the whole tree — e.g. a single `app:theme` key. It never gives `Home` and `About` their own truly independent copies. If what you actually want is for each page to keep its **own, fully isolated** value — see the next section instead.

---

## 🗑️ Scoped storage with `destroy()`

Same as the core library — completely removes all schema keys from storage, useful for data that should only exist while a specific page/component is mounted:

```tsx
function ProductsPage() {
    const storage = useStorage({
        category: '',
        priceRange: [0, 100]
    }, { prefix: 'products-page' });

    useEffect(() => {
        return () => {
            storage.destroy();
            // → all keys removed from localStorage when this component unmounts
        };
    }, []);

    // ...
}
```

See the [typed-storage README](https://github.com/JeanHaro/typed-storage#-scoped--temporary-storage-with-destroy) for when to use `destroy()` vs `ttl`.

> Note: if a key that's `destroy()`-ed also has a `routeOverrides` entry for the current route (without `__once`), navigating back to that route will reapply the override and recreate the key — this is the same behavior documented in the [typed-storage README](https://github.com/JeanHaro/typed-storage#-different-values-per-route-with-routeoverrides). Use `__once: true` on that route's override if you want a manual `destroy()` to "stick" across navigation.

---

## 🧭 Route-based values with `useTrackRoute()` (standalone)

If you're **not** using `StorageProvider` (e.g. a single-component app), connect `routeOverrides` to React Router manually with `useTrackRoute()`:

```tsx
import { useStorage, useTrackRoute } from '@jeanharo98/typed-storage-react';

function App() {
    const storage = useStorage({
        theme: 'dark' as 'dark' | 'light',
    }, {
        prefix: 'app',
        routeOverrides: {
            '/': { theme: 'dark' },
            '/about': { theme: 'light' }
        }
    });

    useTrackRoute(storage);
    // Now navigating to /about automatically sets theme to 'light',
    // and navigating to / sets it back to 'dark' — no manual setRoute() calls

    return <p>Theme: {storage.theme}</p>;
}
```

`useTrackRoute()` reads the current path with React Router's `useLocation()` and calls `storage.setRoute(location.pathname)` inside a `useEffect` whenever it changes. It must be called from a component rendered inside a `<BrowserRouter>` (or equivalent) since it relies on React Router's context.

> If you use `StorageProvider`, you don't need to call `useTrackRoute()` yourself — it's already wired up internally.

See the [typed-storage README](https://github.com/JeanHaro/typed-storage#-different-values-per-route-with-routeoverrides) for the full `routeOverrides` documentation, including how to remove a key entirely for a specific route using `null`, and how to apply an override only once with `__once`.

---

## 🧩 Independent storage per page (separate `prefix`, no `StorageProvider`)

`StorageProvider` and `useTrackRoute()`/`routeOverrides` are for **one shared value** across your app. If instead you want each page to keep its **own, fully independent** value — where changing it in one page never affects another — just call `useStorage()` separately in each page component with its own `prefix`, and skip `StorageProvider`/`routeOverrides`/`__once` entirely:

```tsx
// Home.tsx — its own isolated storage
import { useStorage } from '@jeanharo98/typed-storage-react';

export function Home() {
    const storage = useStorage({
        theme: 'dark' as 'dark' | 'light'
    }, { prefix: 'home' }); // stored as 'home:theme'

    return <p>Theme: {storage.theme}</p>;
}
```

```tsx
// About.tsx — a completely separate isolated storage
import { useStorage } from '@jeanharo98/typed-storage-react';

export function About() {
    const storage = useStorage({
        theme: 'light' as 'dark' | 'light'
    }, { prefix: 'about' }); // stored as 'about:theme'

    return <p>Theme: {storage.theme}</p>;
}
```

Changing `Home`'s `theme` never affects `About`'s, and vice versa — they're two entirely different `localStorage` keys (`home:theme` and `about:theme`). No `StorageProvider`, no `routeOverrides`, no `__once` needed for this — it's the right tool when true per-page isolation is what you want, and `main.tsx` doesn't need any `StorageProvider` wrapping at all in this case.

See the [typed-storage README's pattern comparison table](https://github.com/JeanHaro/typed-storage#choosing-the-right-pattern) for a full breakdown of when to use separate `prefix`es vs. `routeOverrides` (with or without `__once`).

---

## ⚙️ Options

```typescript
useStorage(schema, {
    prefix: 'myapp',        // Prefix keys — 'myapp:theme'
    storage: 'session',     // Use sessionStorage instead of localStorage
    ttl: 3600000,           // Expire after 1 hour
    sync: true,             // Sync across browser tabs
    routeOverrides: {       // Different values per route
        '/checkout': { currency: null }
    },
    encrypt: true,          // Requires 'secret' — see typed-storage docs for security notes
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | — | Prepends `prefix:` to every key |
| `storage` | `'local' \| 'session'` | `'local'` | Storage type |
| `ttl` | `number` | — | Time to live in milliseconds |
| `sync` | `boolean` | `false` | Cross-tab sync via StorageEvent |
| `routeOverrides` | `Record<string, Record<string, any> & { __once?: boolean }>` | — | Per-route key values, applied via `setRoute()` / `useTrackRoute()` / `StorageProvider` |
| `encrypt` | `boolean` | `false` | Requires `secret` — see [typed-storage security notes](https://github.com/JeanHaro/typed-storage#-encryption-xor-obfuscation) |

`options` accepts the exact same options as `createStorage()` in the core library — see the [typed-storage README](https://github.com/JeanHaro/typed-storage#%EF%B8%8F-options) for the full list.

---

## 📋 API Reference

### `useStorage(schema, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `schema` | `StorageSchema` | Object with keys and initial values |
| `options` | `StorageSignalOptions` | Optional configuration |

Returns an object where each key is the current value (not a function), plus:

#### Methods

| Method | Description |
|--------|-------------|
| `set(key, value)` | Updates the value and persists to storage |
| `reset(key)` | Resets to `initialValue` |
| `remove(key)` | Removes the key from storage |
| `has(key)` | Returns `true` if the key exists in storage |
| `clear()` | Resets all keys to their `initialValue` (keys still exist) |
| `destroy()` | Completely removes all keys from storage |
| `setRoute(route)` | Applies the `routeOverrides` entry for `route`, if any |

### `StorageProvider`

React component. Creates one `useStorage()` instance and shares it via Context, wiring up `useTrackRoute()` internally.

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `StorageSchema` | Object with keys and initial values |
| `options` | `StorageSignalOptions` | Optional configuration, same as `useStorage()` |
| `children` | `ReactNode` | Must be rendered inside a `<BrowserRouter>` (or equivalent) |

### `useAppStorage()`

Reads the shared storage instance created by the nearest `StorageProvider` ancestor. Throws if called outside one.

### `useTrackRoute(storage)`

Subscribes `storage.setRoute()` to React Router location changes automatically. Must be called inside a component rendered within a Router context. Not needed if using `StorageProvider`, which calls this internally.

| Parameter | Type | Description |
|-----------|------|-------------|
| `storage` | `{ setRoute(route: string): void }` | The object returned by `useStorage()` |

---

## 🔔 How it works

```
useStorage()
  │
  ├── useRef → createStorage() only once (not on every render)
  │
  ├── For each key in schema:
  │     └── useSyncExternalStore(
  │           subscribe: storage[key].onChange(callback),
  │           getSnapshot: () => storage[key]()
  │         )
  │
  ├── remove(), clear(), destroy(), and setRoute() call forceUpdate()
  │     → triggers re-render since these can affect keys without
  │       going through a single signal's onChange in a way React
  │       would otherwise pick up on its own
  │
  └── Returns { theme, language, ..., set, reset, remove, has,
                clear, destroy, setRoute }

StorageProvider
  │
  ├── calls useStorage(schema, options) ONCE, for the whole subtree
  ├── calls useTrackRoute(storage) internally — routeOverrides work
  │     automatically without any extra code in child components
  └── exposes the instance via Context — useAppStorage() reads it
      from anywhere in the tree, guaranteeing every component sees
      the exact same values and the exact same routeOverrides config
```

**Why `useSyncExternalStore`?**
It's React's official API for subscribing to external stores. It correctly handles:
- Concurrent rendering
- Server-side rendering
- Tearing prevention (all components see the same value)

**Why `useRef` for the storage instance?**
Without `useRef`, `createStorage()` would run on every render creating a new instance and losing the current values. `useRef` persists the instance across renders without causing re-renders itself.

**Why `forceUpdate` on `remove()`, `clear()`, `destroy()`, and `setRoute()`?**
`useSyncExternalStore` subscribes to value changes via `onChange()` per key. Operations that can affect `has()` state or multiple keys at once benefit from an explicit re-render trigger, so the UI reflects the change immediately and consistently.

**Why does `StorageProvider` exist if `useStorage()` already works?**
`useStorage()` is correct for a single component owning its own schema. The moment two or more components need to read/write the *same* schema, calling `useStorage()` independently in each one creates separate instances with separately-defined `options` — a common source of subtle bugs (e.g. `routeOverrides` defined differently, or forgotten, in one of the components). `StorageProvider` removes that risk by making the instance and its configuration exist in exactly one place.

---

## 🆚 Angular vs React

| | Angular wrapper | React wrapper |
|---|---|---|
| Values | `storage.theme()` ← Signal (function) | `storage.theme` ← value directly |
| Reactivity | Angular Signals | `useSyncExternalStore` |
| Setup (single component) | `TypedStorageService` in a `@Service()` | `useStorage()` hook directly |
| Setup (shared across app) | `@Service()` is already a singleton via DI | `StorageProvider` + `useAppStorage()` (Context) |
| Re-renders | Angular change detection | React state updates |
| Route tracking | `trackRoute(storage, router)` | `useTrackRoute(storage)` (automatic if using `StorageProvider`) |

---

## 🔗 Related

- **[@jeanharo98/typed-storage](https://github.com/JeanHaro/typed-storage)** — Core library (required peer dependency)
- **[@jeanharo98/typed-storage-angular](https://github.com/JeanHaro/typed-storage-angular)** — Angular wrapper
- **[typed-storage-devtools](https://github.com/JeanHaro/typed-storage-devtools)** — Chrome DevTools extension for real-time inspection

---

## 📄 License

MIT