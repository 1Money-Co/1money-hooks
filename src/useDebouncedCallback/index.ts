import { useCallback, useEffect, useRef } from 'react';
import useLatest from '../useLatest';

type Callback<T extends unknown[]> = (
  ...args: T
) => void;

/**
 * A hook that returns a debounced wrapper around a
 * callback. Calling `run` resets a `delay` ms timer;
 * the callback only fires once calls stop for `delay`
 * ms, always with the most recent arguments. The latest
 * `callback` body is invoked, so it never goes stale and
 * needs no dependency array. The pending call is
 * cancelled automatically on unmount, or manually via
 * `cancel`.
 *
 * @param callback The function to debounce
 * @param delay The debounce delay in ms (default 300)
 * @returns `{ run, cancel }` — debounced runner and a
 *   canceller for any pending call
 */
export default function useDebouncedCallback<
  T extends unknown[]
>(callback: Callback<T>, delay = 300) {
  const callbackRef = useLatest(callback);
  const timerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const run = useCallback(
    (...args: T) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel, callbackRef]
  );

  useEffect(() => cancel, [cancel]);

  return { run, cancel };
}
