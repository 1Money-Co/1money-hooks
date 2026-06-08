# Debounce & throttle

Rate-limiting hooks for values and callbacks. Reach for these instead of
hand-rolling `setTimeout` + a `useRef` timer (which is easy to get wrong:
stale closures over the callback, leaked timers on unmount, or a re-created
debounce that resets its own timer on every render).

All three default to a `300` ms window and read the **latest** callback /
value, so there is no dependency array to keep in sync.

## useDebouncedValue

```ts
const debounced = useDebouncedValue(value, delay?); // delay default 300
```

Returns a debounced copy of `value` that only updates after `delay` ms have
passed without `value` changing. The classic use is a search box: debounce
the input value, then fetch off the debounced value.

```tsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, 300);

useEffect(() => {
  if (debouncedQuery) fetchResults(debouncedQuery);
}, [debouncedQuery]); // fires once typing pauses, not per keystroke

<input value={query} onChange={e => setQuery(e.target.value)} />;
```

**Bug it prevents:** firing a request on every keystroke, or a manual
`setTimeout` in an effect that forgets to clear the previous timer (so every
keystroke schedules its own delayed update).

## useDebouncedCallback

```ts
const { run, cancel } = useDebouncedCallback(callback, delay?); // default 300
```

`run(...args)` resets the timer; `callback` fires once calls stop for
`delay` ms, with the **most recent** arguments. `run` has a stable identity
(safe to pass to memoized children / effect deps). Any pending call is
cancelled automatically on unmount, or manually via `cancel`.

```tsx
const { run: saveDraft } = useDebouncedCallback((text: string) => {
  api.saveDraft(text); // only the last edit in a 500ms lull is saved
}, 500);

<textarea onChange={e => saveDraft(e.target.value)} />;
```

**Bug it prevents:** the broken `useCallback(debounce(fn, 300), [])` pattern
that freezes the values `fn` closes over (and re-creating the debounced fn
to fix the staleness restarts its timer). Here the body is always current
and the debounce is set up once.

## useThrottledCallback

```ts
const { run, cancel } = useThrottledCallback(callback, delay?); // default 300
```

`run(...args)` fires **immediately on the leading edge**, then at most once
per `delay` ms. The final call made during a throttled window is flushed on
the **trailing edge** with its latest arguments, so you never drop the last
event. `run` is stable; pending trailing calls cancel on unmount or via
`cancel`.

```tsx
const { run: onScroll } = useThrottledCallback(() => {
  setScrollY(window.scrollY); // updates at most ~every 100ms while scrolling
}, 100);

useEffect(() => {
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, [onScroll]);
```

**Bug it prevents:** a raw `Date.now()` throttle that drops the trailing
call (so the handler never sees the final scroll/resize position), and timer
leaks when the component unmounts mid-window.

## Debounce vs throttle — which?

- **Debounce** — wait for activity to *stop*, then act once. Search-as-you-
  type, autosave, validating after the user pauses.
- **Throttle** — act *during* activity at a steady max rate. Scroll/resize/
  mousemove handlers, progress updates, rate-limited polling.
