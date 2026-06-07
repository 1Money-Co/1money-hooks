---
name: 1money-react-hooks
description: >-
  Use when writing or reviewing React/TypeScript code in 1money business
  projects that involves state, refs, effects, callbacks, controlled
  components, or URL/query state. The repo ships a vetted hook in
  @1money/hooks for most of these needs, so reach for this skill BEFORE
  hand-rolling patterns like a latest-value ref, a stable event callback,
  a controlled/uncontrolled value merge, a skip-first-render effect, a
  previous-value tracker, an unmount-safe setState, or syncing state to the
  URL query string. Trigger even when the user doesn't name the library —
  phrases like "stale closure", "debounce a handler", "value or default
  prop", "useRef to hold the latest", "skip the initial effect", "keep
  filters in the URL", or "setState after await warns about unmounted"
  all mean a @1money/hooks hook probably already exists.
---

# @1money/hooks — choosing and using the right hook

`@1money/hooks` is the shared React hook library for 1money front-end
projects (React 16.8+). It exists so product code doesn't re-implement the
same subtle patterns — latest-value refs, stable callbacks, controlled
state, URL state — each with their own edge-case bugs. When you're about to
write a custom hook or a fiddly `useRef`/`useEffect` dance, first check
whether one of these already does it correctly.

## How to use this skill

1. Match the user's *need* to a hook using the table below.
2. Open the matching reference file for the exact signature, the common
   mistake it prevents, and a worked example. Don't guess the API from the
   name — `useSyncState` returns a getter, `useLayoutEffect` here takes a
   `mount` flag, `useQueryState` has parser/serializer options.
3. When you suggest a swap, briefly explain *what bug it removes* — don't
   just rename the import.

## Decide: need → hook

| You need to… | Use | Reference |
|---|---|---|
| Read the latest value in a callback without re-subscribing (avoid stale closures) | `useLatest` | `references/refs-and-callbacks.md` |
| A handler with **stable identity** that always runs the latest logic (deps-free) | `useEventCallback` / `useMemoizedFn` | `references/refs-and-callbacks.md` |
| Debounce a **value** (search box) so it settles only after input stops | `useDebouncedValue` | `references/debounce-throttle.md` |
| Debounce a **callback** — fire once after calls stop, with latest args | `useDebouncedCallback` | `references/debounce-throttle.md` |
| Throttle a **callback** — fire at most once per window (leading + trailing) | `useThrottledCallback` | `references/debounce-throttle.md` |
| Run a callback on a repeating interval (pausable, latest-fn, auto-cleared) | `useInterval` | `references/timers.md` |
| Run a callback once after a delay (pausable, latest-fn, auto-cleared) | `useTimeout` | `references/timers.md` |
| A prop that is "controlled if passed, else internal" (`value` + `defaultValue`) | `useControlledState` | `references/state.md` |
| `setState` that won't warn/leak after unmount (state set in async callbacks) | `useSafeState` | `references/state.md` |
| Always read the **latest** state synchronously, even when React batches | `useSyncState` | `references/state.md` |
| Batch many synchronous updates into one render; or a frame-scoped lock | `useLayoutState` / `useTimeoutLock` | `references/state.md` |
| An effect that **skips the first mount** and runs only on updates | `useUpdateEffect` | `references/effects.md` |
| A layout effect that knows mount vs update | `useLayoutEffect` (this lib's) | `references/effects.md` |
| The **previous** value of something across renders | `usePrevious` | `references/effects.md` |
| State that lives in the **URL query string** (filters, pagination, selected id) | `useQueryState` | `references/use-query-state.md` |

If nothing fits, it's fine to write a local hook — but say so, and keep it
in the consuming app, not in this library.

## Importing

Two equivalent styles. Prefer the **direct path** in app code so bundlers
tree-shake cleanly; the barrel import is fine too since `sideEffects:false`
is set.

```ts
import { useMemoizedFn } from '@1money/hooks';            // barrel
import useMemoizedFn from '@1money/hooks/useMemoizedFn';  // direct (tree-shake friendly)
```

Don't deep-import internal build files — only the published per-hook entry
points are stable.

## When reviewing existing code

These smells each map to a library hook — flag them and explain the swap:

- A `useRef` reassigned `ref.current = value` every render → `useLatest`.
- `useCallback(fn, [big, dep, list])` whose only purpose is "don't be
  stale" → `useMemoizedFn` / `useEventCallback`.
- A `useRef(false)` "first render" guard around an effect → `useUpdateEffect`.
- Reading/writing `?foo=` with `URLSearchParams` + `router.replace` by hand
  → `useQueryState`.
- A `value ?? defaultValue` merge with a local `useState` and a sync effect
  → `useControlledState`.
- A hand-rolled `setTimeout` + `useRef` timer to delay a value or handler,
  or a `useCallback(debounce(fn), [])` → `useDebouncedValue` /
  `useDebouncedCallback` / `useThrottledCallback`.
- A `useEffect` that calls `setInterval`/`setTimeout` and returns a clear in
  its cleanup (often with a stale callback closed over) → `useInterval` /
  `useTimeout`.

Examples in the reference files use ordinary app-code formatting — the
strict 50-character print width is a rule for the library repo itself, not
for the code you write in consuming apps.
