# Effects & value tracking

Effect variants and a previous-value tracker — for "run on change but not on
mount" and "what was the value last time" needs.

## useUpdateEffect

```ts
useUpdateEffect(() => { refetch(); }, [query]); // skips mount, runs on change
```

Identical to `useEffect` but it skips the initial mount and only runs on
subsequent updates. Perfect for "react to a change, but not on first render"
(e.g. refetch when a filter changes, but not for the initial load which is
handled elsewhere).

Why not roll your own: the `useRef(false)` "is this the first run" guard is
boilerplate that's easy to retype slightly wrong (forgetting to set the flag,
or returning the cleanup at the wrong time).

## useLayoutEffect (this library's)

```ts
useLayoutEffect(mount => {
  if (!mount) syncScrollPosition(); // only on updates, before paint
}, [items]);
```

A `useLayoutEffect` whose callback receives a `mount` boolean — `true` on
the initial mount, `false` on subsequent runs. This lets you branch on
first-vs-subsequent without a manual ref, while still running synchronously
before the browser paints (the reason to use a layout effect at all).

## usePrevious

```ts
const prev = usePrevious(count); // undefined until a prior value exists
```

Returns the previous *distinct* value of `count`, tracked on value-change
boundaries (the internal effect depends on `[value]`, so the ref only
updates when the value actually changes). Great for "did this change, and
from what" logic.

```ts
const prevStatus = usePrevious(status);
useEffect(() => {
  if (prevStatus === 'loading' && status === 'done') celebrate();
}, [status, prevStatus]);
```

Gotcha: it returns `undefined` on the very first render — don't rely on it
being populated before at least one change has occurred.
