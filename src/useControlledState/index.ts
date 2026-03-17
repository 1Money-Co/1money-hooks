import { useState } from 'react';
import useLayoutEffect from '../useLayoutEffect';

type Updater<T> = (updater: T | ((origin: T) => T)) => void;

/**
 * Similar to `useState` but will use props value if provided.
 * From React 18, we do not need safe `useState` since it will not throw for unmounted update.
 * This hook removes the `onChange` & `postState` logic since we only need basic merged state logic.
 *
 * The `mergedValue` return already reflects the latest controlled `value` without
 * the layout effect. The effect exists to sync `innerValue` for the edge case where
 * the component starts in uncontrolled mode (calling `setInnerValue` directly) and
 * then transitions to controlled mode (parent starts providing `value`). Without this
 * sync, reverting back to uncontrolled mode would show the stale `innerValue`.
 */
export default function useControlledState<T>(
  defaultStateValue: T | (() => T),
  value?: T,
): [T, Updater<T>] {
  const [innerValue, setInnerValue] = useState<T>(defaultStateValue);

  const mergedValue = value !== undefined ? value : innerValue;

  useLayoutEffect(
    mount => {
      if (!mount && value !== undefined) {
        setInnerValue(value);
      }
    },
    [value],
  );

  return [
    // Value
    mergedValue,
    // Update function
    setInnerValue,
  ];
}
