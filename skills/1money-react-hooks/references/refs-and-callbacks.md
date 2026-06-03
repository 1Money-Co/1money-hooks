# Refs & stable callbacks

These three solve the "I need the current value/logic, but a stable
identity and no dependency array" family of problems. They're the most
common reason people reach for a custom hook, and the most common source of
stale-closure bugs.

## useLatest

```ts
const ref = useLatest(value); // ref.current is always the newest value
```

A ref whose `.current` is kept in sync with the latest `value` on every
render. It never triggers a re-render. Reach for this the moment you think
"I need the current value inside a callback/effect, but I don't want it in
the dependency array."

```ts
const latestProps = useLatest(props);
useEffect(() => {
  const id = setInterval(() => doThing(latestProps.current), 1000);
  return () => clearInterval(id);
}, []); // empty deps, yet always sees fresh props
```

Why not roll your own: a bare `useRef` + manual `ref.current = value` works
but is easy to forget to update; this is one intention-revealing line.

## useEventCallback / useMemoizedFn

Both return a **stable** function reference that always runs the *latest*
body — so you can pass them to memoized children or list them in effect
deps without causing re-renders or running stale logic.

- `useEventCallback` — for event-style handlers (mirrors the React `useEvent`
  RFC). Built on `useLatest` internally.
- `useMemoizedFn` — the general ahooks-equivalent; the right default when
  you just want "a stable callback that is never stale."

```ts
const onSearch = useMemoizedFn((q: string) => {
  fetchResults(q, filters); // `filters` is always current, no deps needed
});
```

**Anti-pattern this replaces:** `useCallback(fn, [a, b, c, ...everything])`.
A common bug is the debounced handler whose only dep is `[]`, freezing the
values it closes over:

```tsx
// BROKEN: filters frozen at first render; adding it to deps re-creates
// the debounced fn and breaks the timer.
const handle = useCallback(debounce(q => fetchResults(q, filters), 300), []);

// FIX: stable always-latest body, debounced once.
const search = useMemoizedFn((q: string) => fetchResults(q, filters));
const handle = useMemo(() => debounce(search, 300), [search]); // search is stable
```

The key insight: `useMemoizedFn` gives the function a permanent identity but
always executes the most recent closure, so reading `filters` inside is
never stale and there is no dependency array to keep in sync.
