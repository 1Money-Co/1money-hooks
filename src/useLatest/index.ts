import { useRef } from 'react';

/**
 * A hook that returns a ref object whose `.current` property is always
 * updated to the latest value. Useful for accessing the latest value
 * in callbacks without causing re-renders or stale closures.
 *
 * @param value The value to keep up-to-date
 * @returns A ref object containing the latest value
 */
export default function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
