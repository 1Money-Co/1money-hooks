import { useEffect, useState } from 'react';

/**
 * A hook that returns a debounced copy of a value. The
 * returned value only updates after `delay` ms have
 * passed without `value` changing, which is handy for
 * search inputs, resize handlers and other rapidly
 * changing values you don't want to react to on every
 * keystroke.
 *
 * @param value The value to debounce
 * @param delay The debounce delay in ms (default 300)
 * @returns The latest value, debounced by `delay`
 */
export default function useDebouncedValue<T>(
  value: T,
  delay = 300
): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
