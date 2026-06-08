import { useCallback, useEffect, useRef } from 'react';
import useLatest from '../useLatest';

export interface UseIntervalOptions {
  /**
   * Run the callback once immediately when the interval
   * starts, in addition to every `delay` ms after.
   */
  immediate?: boolean;
}

/**
 * A hook that runs a callback on a fixed interval. The
 * latest `fn` is always invoked, so it never goes stale
 * and needs no dependency array. Pass `undefined`, `null`
 * or a negative `delay` to pause the interval. The timer
 * is cleared automatically on unmount or when `delay`
 * changes, and can be stopped early via the returned
 * `clear` function.
 *
 * @param fn The callback to run each interval
 * @param delay Interval in ms; nullish/negative pauses it
 * @param options `{ immediate }` to also fire on start
 * @returns A `clear` function that stops the interval
 */
export default function useInterval(
  fn: () => void,
  delay?: number | null,
  options?: UseIntervalOptions
) {
  const immediate = options?.immediate;
  const fnRef = useLatest(fn);
  const timerRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (
      delay === undefined ||
      delay === null ||
      delay < 0
    ) {
      return;
    }

    if (immediate) {
      fnRef.current();
    }

    timerRef.current = setInterval(() => {
      fnRef.current();
    }, delay);

    return clear;
  }, [delay, immediate, clear, fnRef]);

  return clear;
}
