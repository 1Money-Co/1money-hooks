# State hooks

Variations on `useState` for cases the built-in handles awkwardly:
controlled/uncontrolled props, unmount safety, synchronous reads, and
batched updates.

## useControlledState

```ts
const [value, setValue] = useControlledState(defaultValue, controlledValue);
```

For components that accept both `value` (controlled) and `defaultValue`
(uncontrolled). `controlledValue` wins whenever it is not `undefined`;
otherwise the hook owns internal state seeded from `defaultValue`. Getting
the controlled↔uncontrolled transition right (and not desyncing) is the
bug-prone part this encapsulates.

Important: the hook manages only the *merged state*, not change
notification — you still call your own `onChange` prop.

```tsx
function Toggle({ checked, defaultChecked = false, onChange }: Props) {
  const [isOn, setIsOn] = useControlledState(defaultChecked, checked);

  const toggle = () => {
    const next = !isOn;
    setIsOn(next);       // keeps the uncontrolled case working
    onChange?.(next);    // notify parent (controlled case relies on this)
  };
  // ...
}
```

Why not roll your own: `useState(defaultChecked)` plus a sync `useEffect` on
`checked` is exactly the brittle pattern that desyncs on the
controlled↔uncontrolled boundary.

## useSafeState

```ts
const [data, setData] = useSafeState<Data>();
```

A drop-in `useState` whose setter no-ops after the component unmounts. Use
it when state is set from `await`/timeouts/subscriptions and you've seen the
"can't update state on an unmounted component" warning. On React 18+ this is
rarely needed — prefer plain `useState` unless you actually hit the warning.

## useSyncState

```ts
const [getCount, setCount] = useSyncState(0);
setCount(c => c + 1);
const now = getCount(); // always the latest, even after batched updates
```

Note the shape: the first element is a **getter function**, not a value.
Use only when you must read freshly-updated state *synchronously* — e.g.
several updates fired in one event handler that React merges into one render
(a classic `onTransitionEnd` scenario). For normal rendering, plain
`useState` is correct.

## useLayoutState / useTimeoutLock

```ts
const [state, setFrameState] = useLayoutState(initial);
setFrameState(prev => next); // many sync calls collapse into one render
```

`useLayoutState` batches synchronous updates via a microtask
(`Promise.resolve`), so a burst of updates in one tick causes a single
re-render instead of several. The setter always takes an updater function.

`useTimeoutLock` (a named export from the same module) gives a transient
lock that auto-clears after ~a frame (100ms):

```ts
import useLayoutState, { useTimeoutLock } from '@1money/hooks/useLayoutState';

const [lock, getLock] = useTimeoutLock<boolean>();
lock(true);            // set
if (getLock()) skip(); // truthy until it auto-clears
```

Useful for suppressing a follow-up effect that would otherwise fire
immediately after a programmatic change.
