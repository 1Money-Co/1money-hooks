import { useCallback, useEffect, useRef } from 'react';
import useLatest from '../useLatest';

type Callback<T extends unknown[]> = (
  ...args: T
) => void;

/**
 * A hook that returns a throttled wrapper around a
 * callback. `run` fires immediately on the leading edge,
 * then at most once per `delay` ms; the final call made
 * during a throttled window is flushed on the trailing
 * edge with its latest arguments. The most recent
 * `callback` body is always used, so it never goes stale.
 * Any pending trailing call is cancelled on unmount, or
 * manually via `cancel`.
 *
 * @param callback The function to throttle
 * @param delay The throttle window in ms (default 300)
 * @returns `{ run, cancel }` — throttled runner and a
 *   canceller for any pending trailing call
 */
export default function useThrottledCallback<
  T extends unknown[]
>(callback: Callback<T>, delay = 300) {
  const callbackRef = useLatest(callback);
  const lastRunRef = useRef(0);
  const timerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lastArgsRef = useRef<T | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
    lastRunRef.current = 0;
  }, []);

  const run = useCallback(
    (...args: T) => {
      const now = Date.now();
      const remaining =
        delay - (now - lastRunRef.current);
      lastArgsRef.current = args;

      if (remaining <= 0) {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        lastRunRef.current = now;
        lastArgsRef.current = null;
        callbackRef.current(...args);
        return;
      }

      if (timerRef.current === null) {
        timerRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          timerRef.current = null;
          if (lastArgsRef.current) {
            const pending = lastArgsRef.current;
            lastArgsRef.current = null;
            callbackRef.current(...pending);
          }
        }, remaining);
      }
    },
    [delay, callbackRef]
  );

  useEffect(() => cancel, [cancel]);

  return { run, cancel };
}
