import { useEffect, useRef, type DependencyList, type EffectCallback } from 'react';

/**
 * A hook identical to `useEffect`, but it skips the effect on the initial mount
 * and only runs on subsequent updates.
 *
 * @param effect The effect callback to run on updates
 * @param deps The dependency array
 */
export default function useUpdateEffect(effect: EffectCallback, deps?: DependencyList) {
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    return effect();
  }, deps);
}
