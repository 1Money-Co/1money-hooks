import { useState, useEffect } from 'react';
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
 * Subscribers re-read the URL when any instance
 * mutates it. `history.pushState/replaceState` do
 * not emit `popstate`, so we notify manually.
 */
const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach(fn => fn());
};

/**
 * Sync a piece of React state with a URL query
 * parameter, so it survives refreshes and is
 * shareable via the link.
 *
 * Reads/writes go through native
 * `history.pushState/replaceState`, which keeps it
 * compatible with the Next.js App Router (it does
 * not trigger a route re-mount). Because the value
 * is reactive, using it as a SWR/React Query key
 * makes dependent requests refetch automatically.
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

  const read = useMemoizedFn((): T | null => {
    if (!isBrowser) {
      return defaultValue ?? null;
    }
    const params = new URLSearchParams(
      window.location.search,
    );
    const raw = params.get(key);
    if (raw === null) {
      return defaultValue ?? null;
    }
    return parser
      ? parser(raw)
      : (raw as unknown as T);
  });

  const [value, setValue] = useState<T | null>(read);

  useEffect(() => {
    const handler = (): void => setValue(read());
    listeners.add(handler);
    window.addEventListener('popstate', handler);
    // Resync in case the URL changed between the
    // initial render and this effect running.
    handler();
    return () => {
      listeners.delete(handler);
      window.removeEventListener(
        'popstate',
        handler,
      );
    };
    // `read` is stable via useMemoizedFn.
  }, [key, read]);

  const set = useMemoizedFn<
    Parameters<SetQueryState<T>>,
    void
  >(next => {
    if (!isBrowser) {
      return;
    }
    const prev = read();
    const resolved =
      typeof next === 'function'
        ? (next as (p: T | null) => T | null)(prev)
        : next;

    const params = new URLSearchParams(
      window.location.search,
    );
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
    emit();
  });

  return [value, set];
}

export default useQueryState;
