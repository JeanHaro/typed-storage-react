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

> Both packages are required — `@jeanharo98/typed-storage` is a peer dependency. `react-router-dom` is required only if you use `useTrackRoute()`.

---

## 🚀 Usage

### Basic

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

---

## 🧭 Route-based values with `useTrackRoute()`

If your schema uses `routeOverrides`, connect it to React Router automatically — no manual `setRoute()` calls needed:

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

See the [typed-storage README](https://github.com/JeanHaro/typed-storage#-different-values-per-route-with-routeoverrides) for the full `routeOverrides` documentation, including how to remove a key entirely for a specific route using `null`, and how to apply an override only once with `__once`.

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
| `routeOverrides` | `Record<string, Record<string, any>>` | — | Per-route key values, applied via `setRoute()` / `useTrackRoute()` |
| `encrypt` | `boolean` | `false` | Requires `secret` — see [typed-storage security notes](https://github.com/JeanHaro/typed-storage#-encryption-xor-obfuscation) |

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

### `useTrackRoute(storage)`

Subscribes `storage.setRoute()` to React Router location changes automatically. Must be called inside a component rendered within a Router context.

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

---

## 🆚 Angular vs React

| | Angular wrapper | React wrapper |
|---|---|---|
| Values | `storage.theme()` ← Signal (function) | `storage.theme` ← value directly |
| Reactivity | Angular Signals | `useSyncExternalStore` |
| Setup | `TypedStorageService` in a `@Service()` | `useStorage()` hook directly |
| Re-renders | Angular change detection | React state updates |
| Route tracking | `trackRoute(storage, router)` | `useTrackRoute(storage)` |

---

## 🔗 Related

- **[@jeanharo98/typed-storage](https://github.com/JeanHaro/typed-storage)** — Core library (required peer dependency)
- **[@jeanharo98/typed-storage-angular](https://github.com/JeanHaro/typed-storage-angular)** — Angular wrapper
- **[typed-storage-devtools](https://github.com/JeanHaro/typed-storage-devtools)** — Chrome DevTools extension for real-time inspection

---

## 📄 License

MIT