# useQueryState

Syncs a piece of React state with a URL query parameter, so it survives a
refresh and is shareable via the link. Use it for genuinely URL-worthy state
— filters, pagination, tabs, a selected id. For ephemeral UI state (a
dropdown's open flag), keep plain `useState`.

## Signature

```ts
import useQueryState, {
  queryString, queryNumber, queryBoolean, queryJson,
} from '@1money/hooks/useQueryState';

const [value, setValue] = useQueryState(key, options);
```

Options:

| Option | Default | Meaning |
|---|---|---|
| `parser` | identity (raw string) | `(raw: string) => T` — parse the URL value into `T` |
| `serializer` | `String` | `(value: T) => string` — serialize `T` back to the URL |
| `defaultValue` | — | value returned when the param is absent; when set, the hook never returns `null` |
| `history` | `'replace'` | `'replace'` (no history entry) or `'push'` (back/forward steps through values) |

`setValue` accepts a value, an updater function, or `null` to remove the
param.

## Worked example: page + status filter

```tsx
'use client';
import useQueryState, { queryNumber } from '@1money/hooks/useQueryState';

type Status = 'active' | 'inactive';
const parseStatus = (raw: string): Status | null =>
  raw === 'active' || raw === 'inactive' ? raw : null;

function TransactionsTable() {
  // number, default 1; `push` so the back button walks through pages.
  const [page, setPage] = useQueryState('page', {
    parser: queryNumber,
    defaultValue: 1,
    history: 'push',
  });

  // 'active' | 'inactive' | null (= show all). No defaultValue, so an
  // absent param reads back as null.
  const [status, setStatus] = useQueryState<Status>('status', {
    parser: parseStatus,
  });

  // Reactive value → safe to use directly as a SWR / React Query key.
  const { data } = useTransactions({ page, status });
  // ...
}
```

Read/write summary:

```ts
page;                       // number, always defined (defaultValue: 1)
status;                     // 'active' | 'inactive' | null
setPage(2);                 // ?page=2
setPage(p => (p ?? 1) + 1); // updater form sees the latest value
setStatus('active');        // &status=active
setStatus(null);            // drops &status, keeps other params
```

## Key behaviors to mention when recommending it

- **Next.js App Router safe.** Writes go through native
  `history.pushState/replaceState`, which does *not* trigger a route
  re-mount. This is why it's preferred over `router.push`/`router.replace`
  for this kind of state.
- **Reactive → drives data fetching.** Because the returned value is React
  state, using it as a SWR / React Query key makes dependent requests
  refetch automatically — no manual wiring.
- **Built-in parsers:** `queryString`, `queryNumber`, `queryBoolean`,
  `queryJson`. For non-string types pair a matching `serializer` (e.g.
  `queryJson` with `JSON.stringify`); the default serializer is `String`,
  which already round-trips numbers and booleans.
- **`setValue(null)` deletes the param** and preserves the others — the
  natural "no filter / show all" state.
- **Cross-instance + back/forward sync.** Multiple components on the same
  key stay in sync, and it reacts to `popstate`.

## Replaces

Hand-rolled `useState` + `URLSearchParams` + `router.replace`/`router.push`
glue. That custom code has to handle parse/serialize, reading the latest
URL, pushing history, and keeping instances in sync — all of which this hook
already does correctly. When you see that pattern in review, swap it.
