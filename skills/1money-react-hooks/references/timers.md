# Interval & timeout

Declarative wrappers around `setInterval` / `setTimeout`. They solve the
two classic bugs of using the raw timers inside `useEffect`:

1. **Stale callback** — a `setInterval(() => doThing(count), 1000)` set up
   with `[]` deps closes over the first render's `count` forever. Adding the
   value to deps tears down and recreates the timer on every change, which
   resets the interval. These hooks read the **latest** `fn` via a ref, so
   the body is always current *and* the timer keeps running.
2. **Leaked timer** — forgetting to clear on unmount. These clear
   automatically on unmount and whenever `delay` changes.

Both **pause** when `delay` is `undefined`, `null`, or negative, and both
return a `clear` function to stop early.

## useInterval

```ts
const clear = useInterval(fn, delay?, options?);
// options: { immediate?: boolean }
```

Runs `fn` every `delay` ms. Pass `{ immediate: true }` to also fire once
right when the interval starts. Set `delay` to `null` to pause (e.g. stop
polling when a tab is hidden).

```tsx
const [count, setCount] = useState(0);
const [running, setRunning] = useState(true);

// Pauses by passing null; fn is never stale despite empty-looking deps.
useInterval(() => setCount(c => c + 1), running ? 1000 : null);
```

**Bug it prevents:** the `setInterval` whose callback is frozen at first
render, or the dependency-array dance that silently restarts the timer on
every state change.

## useTimeout

```ts
const clear = useTimeout(fn, delay?);
```

Runs `fn` once, `delay` ms after mount (or after `delay` changes). Pass
`null` to cancel; call the returned `clear` to cancel early.

```tsx
const [show, setShow] = useState(true);

// Auto-dismiss a toast after 3s; cancels cleanly if unmounted first.
useTimeout(() => setShow(false), show ? 3000 : null);
```

**Bug it prevents:** a `setTimeout` in an effect that fires after the
component has unmounted (warns / sets state on a dead component), or one
that keeps the stale closure.

## Note on changing the delay

Changing `delay` restarts the timer from zero (the effect re-runs). That's
usually what you want for a paused/resumed interval. If you need to change
the *callback* without restarting, you already get that for free — the hook
always calls the latest `fn` without touching the running timer.
