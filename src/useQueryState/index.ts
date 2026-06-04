'use client';

import { useSearchParams } from 'next/navigation';
import useMemoizedFn from '../useMemoizedFn';

/** Turn a raw query string into a typed value. */
export type Parser<T> = (value: string) => T;

/** Turn a typed value back into a query string. */
export type Serializer<T> = (value: T) => string;

export interface QueryStateOptions<T> {
  /**
   * Parse the raw `string` read from the URL into `T`.
   * Defaults to identity (the raw string).
   */
  parser?: Parser<T>;
  /**
   * Serialize `T` back into a `string` for the URL.
   * Defaults to `String(value)`.
   */
  serializer?: Serializer<T>;
  /**
   * Value returned when the param is absent from
   * the URL. When set, the hook never returns
   * `null`.
   */
  defaultValue?: T;
  /**
   * How the URL is mutated:
   * - `'replace'` (default) — `history.replaceState`,
   *   does not add a history entry.
   * - `'push'` — `history.pushState`, back/forward
   *   navigates between values.
   */
  history?: 'push' | 'replace';
}

type SetQueryState<T> = (
  value: T | null | ((prev: T | null) => T | null),
) => void;

/** Identity parser used when none is supplied. */
export const queryString: Parser<string> = value =>
  value;

/** Parse a numeric query param. `NaN` for non-numbers. */
export const queryNumber: Parser<number> = value =>
  Number(value);

/** Parse a boolean query param. Only `'true'` is true. */
export const queryBoolean: Parser<boolean> = value =>
  value === 'true';

/** Parse a JSON-encoded query param. */
export const queryJson: Parser<unknown> = value =>
  JSON.parse(value);

const isBrowser = typeof window !== 'undefined';

/**
 * Sync a piece of React state with a URL query
 * parameter, so it survives refreshes and is
 * shareable via the link.
 *
 * Reading is reactive via Next's `useSearchParams`;
 * writing goes through the native
 * `history.pushState/replaceState`, which the Next.js
 * App Router intercepts and syncs back into
 * `useSearchParams` *without* a server round-trip (no
 * route re-render, no scroll-to-top). Because the
 * value is reactive, using it as a SWR/React Query key
 * makes dependent requests refetch automatically.
 *
 * Constraints (inherited from `useSearchParams`):
 * - Next.js App Router only; the calling component
 *   must be a Client Component (`'use client'`).
 * - On statically rendered routes, wrap the consumer
 *   in `<Suspense>`; otherwise that subtree opts into
 *   client-side rendering. During prerender the param
 *   reads as absent, so `value` falls back to
 *   `defaultValue ?? null`.
 *
 * @param key The query parameter name
 * @param options Parsing, serialization and history
 *   behaviour
 * @returns A `[value, setValue]` tuple. `setValue`
 *   accepts a value, an updater function, or `null`
 *   to remove the param.
 */
function useQueryState(
  key: string,
): [string | null, SetQueryState<string>];
// eslint-disable-next-line no-redeclare
function useQueryState<T>(
  key: string,
  options: QueryStateOptions<T> & { defaultValue: T },
): [T, SetQueryState<T>];
// eslint-disable-next-line no-redeclare
function useQueryState<T>(
  key: string,
  options: QueryStateOptions<T>,
): [T | null, SetQueryState<T>];
// eslint-disable-next-line no-redeclare
function useQueryState<T>(
  key: string,
  options: QueryStateOptions<T> = {},
): [T | null, SetQueryState<T>] {
  const {
    parser,
    serializer = String,
    defaultValue,
    history = 'replace',
  } = options;

  const parse = (raw: string | null): T | null => {
    if (raw === null) {
      return defaultValue ?? null;
    }
    return parser
      ? parser(raw)
      : (raw as unknown as T);
  };

  // Reactive read. Next re-renders consumers when the
  // URL changes (including our own history writes).
  const searchParams = useSearchParams();
  const value = parse(searchParams.get(key));

  const set = useMemoizedFn<
    Parameters<SetQueryState<T>>,
    void
  >(next => {
    if (!isBrowser) {
      return;
    }
    // Build from the live URL (not the captured
    // `searchParams`) so consecutive writes in one
    // tick see each other's result.
    const params = new URLSearchParams(
      window.location.search,
    );
    const resolved =
      typeof next === 'function'
        ? (next as (p: T | null) => T | null)(
            parse(params.get(key)),
          )
        : next;

    if (resolved === null || resolved === undefined) {
      params.delete(key);
    } else {
      params.set(key, serializer(resolved));
    }

    const search = params.toString();
    const url =
      window.location.pathname +
      (search ? `?${search}` : '') +
      window.location.hash;

    if (history === 'push') {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
    }
  });

  return [value, set];
}

export default useQueryState;
