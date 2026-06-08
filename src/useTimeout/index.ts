import { useCallback, useEffect, useRef } from 'react';
import useLatest from '../useLatest';

/**
 * A hook that runs a callback once after a delay. The
 * latest `fn` is always invoked, so it never goes stale
 * and needs no dependency array. Pass `undefined`, `null`
 * or a negative `delay` to cancel the pending call. The
 * timer is cleared automatically on unmount or when
 * `delay` changes, and can be cancelled early via the
 * returned `clear` function.
 *
 * @param fn The callback to run after the delay
 * @param delay Delay in ms; nullish/negative cancels it
 * @returns A `clear` function that cancels the timeout
 */
export default function useTimeout(
  fn: () => void,
  delay?: number | null
) {
  const fnRef = useLatest(fn);
  const timerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
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

    timerRef.current = setTimeout(() => {
      fnRef.current();
    }, delay);

    return clear;
  }, [delay, clear, fnRef]);

  return clear;
}
