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
- **Type-safe** — full TypeScript support inferred from your schema
- **All typed-storage features** — TTL, prefix, sessionStorage, MemoryStorage fallback

---

## 📦 Installation

```bash
npm install @jeanharo98/typed-storage @jeanharo98/typed-storage-react
# or
pnpm add @jeanharo98/typed-storage @jeanharo98/typed-storage-react
```

> Both packages are required — `@jeanharo98/typed-storage` is a peer dependency.

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
            <button onClick={() => storage.clear()}>Clear All</button>
        </div>
    );
}
```

---

## ⚙️ Options

```typescript
useStorage(schema, {
    prefix: 'myapp',        // Prefix keys — 'myapp:theme'
    storage: 'session',     // Use sessionStorage instead of localStorage
    ttl: 3600000,           // Expire after 1 hour
    sync: true,             // Sync across browser tabs
    encrypt: true,          // Shows security warning
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | — | Prepends `prefix:` to every key |
| `storage` | `'local' \| 'session'` | `'local'` | Storage type |
| `ttl` | `number` | — | Time to live in milliseconds |
| `sync` | `boolean` | `false` | Cross-tab sync via StorageEvent |
| `encrypt` | `boolean` | `false` | Shows security warning |

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
| `clear()` | Resets all keys to their `initialValue` |

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
  ├── remove() and clear() call forceUpdate()
  │     → triggers re-render so has() reflects the change
  │
  └── Returns { theme, language, ..., set, reset, remove, has, clear }
```

**Why `useSyncExternalStore`?**
It's React's official API for subscribing to external stores. It correctly handles:
- Concurrent rendering
- Server-side rendering
- Tearing prevention (all components see the same value)

**Why `useRef` for the storage instance?**
Without `useRef`, `createStorage()` would run on every render creating a new instance and losing the current values. `useRef` persists the instance across renders without causing re-renders itself.

**Why `forceUpdate` on `remove()` and `clear()`?**
`useSyncExternalStore` only subscribes to value changes via `onChange()`. When `remove()` is called, the value is deleted but `onChange` doesn't fire — so `has()` wouldn't update. `forceUpdate` forces a re-render so `has()` reflects the correct state.

---

## 🆚 Angular vs React

| | Angular wrapper | React wrapper |
|---|---|---|
| Values | `storage.theme()` ← Signal (function) | `storage.theme` ← value directly |
| Reactivity | Angular Signals | `useSyncExternalStore` |
| Setup | `TypedStorageService` in a `@Service()` | `useStorage()` hook directly |
| Re-renders | Angular change detection | React state updates |

---

## 🔗 Related

- **[@jeanharo98/typed-storage](https://github.com/JeanHaro/typed-storage)** — Core library (required peer dependency)
- **[@jeanharo98/typed-storage-angular](https://github.com/JeanHaro/typed-storage-angular)** — Angular wrapper
- **[typed-storage-devtools](https://github.com/JeanHaro/typed-storage-devtools)** — Chrome DevTools extension for real-time inspection |

---

## 📄 License

MIT