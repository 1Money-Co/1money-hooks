import { useEffect, useRef } from 'react';

/**
 * Returns the last distinct value observed before the current `value`.
 *
 * Because the internal effect depends on `[value]`, the ref is only updated
 * when `value` changes. That means this hook tracks the previous value on
 * value-change boundaries (not every render).
 *
 * @param value The value to track
 * @returns The previous distinct value, or `undefined` until one exists
 */
export default function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
