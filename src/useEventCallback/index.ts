import { useCallback } from 'react';
import useLatest from '../useLatest';

type Fn<T extends unknown[], R> = (...args: T) => R;

/**
 * A hook that returns a stable callback reference that always invokes
 * the latest version of the provided function. Similar to the React
 * useEvent RFC proposal.
 *
 * @param fn The function to wrap
 * @returns A stable callback that always calls the latest fn
 */
export default function useEventCallback<T extends unknown[], R>(fn: Fn<T, R>): Fn<T, R> {
  const fnRef = useLatest(fn);

  return useCallback((...args: T) => {
    return fnRef.current(...args);
  }, []);
}
