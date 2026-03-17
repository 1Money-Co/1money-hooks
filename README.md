# @1money/hooks

React hooks for 1Money front-end projects.

## Installation

```bash
pnpm add @1money/hooks
```

> Requires `react >= 16.8.0` as a peer dependency.

## Hooks

| Hook | Description |
| --- | --- |
| `useControlledState` | Manages state that can be either controlled (via props) or uncontrolled. |
| `useEventCallback` | Returns a stable callback reference that always invokes the latest function. |
| `useLatest` | Returns a ref that always holds the latest value, avoiding stale closures. |
| `useLayoutEffect` | Wrapper around `useLayoutEffect` that indicates whether it's the initial mount. |
| `useLayoutState` | Batches multiple state updates into a single microtask to reduce re-renders. |
| `useMemoizedFn` | Returns a memoized function with a stable reference across re-renders. |
| `usePrevious` | Returns the previous distinct value before the last change. |
| `useSafeState` | Like `useState` but prevents updates after unmount. |
| `useSyncState` | Returns a getter/setter where the getter always reflects the latest state synchronously. |
| `useUpdateEffect` | Like `useEffect` but skips the initial mount. |

## Usage

```tsx
import { useMemoizedFn, useLatest } from '@1money/hooks';
```

Individual hooks can also be imported directly for tree-shaking:

```tsx
import useMemoizedFn from '@1money/hooks/useMemoizedFn';
```

## Development

```bash
pnpm install
pnpm dev       # watch mode
pnpm build     # production build
pnpm test      # run tests
pnpm lint      # check formatting & linting
pnpm lint:fix  # auto-fix
```

## License

MIT
