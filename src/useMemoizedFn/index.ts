import { useMemo, useRef } from 'react';

type Fn<T extends unknown[], R> = (...args: T) => R;

/**
 * A hook that returns a memoized version of a callback function.
 * Unlike `useCallback`, it maintains referential equality across renders
 * without requiring a dependency array, while always calling the latest
 * version of the function.
 *
 * @param fn The function to memoize
 * @returns A memoized function with stable reference
 */
export default function useMemoizedFn<T extends unknown[], R>(fn: Fn<T, R>): Fn<T, R> {
  const fnRef = useRef(fn);
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef<Fn<T, R> | undefined>(undefined);
  if (!memoizedFn.current) {
    memoizedFn.current = function (this: unknown, ...args: T) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as Fn<T, R>;
}
