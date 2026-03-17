import {
  useLayoutEffect as reactUseLayoutEffect,
  useRef,
  type DependencyList,
} from 'react';

type EffectCallback = (mount: boolean) => void | (() => void);

/**
 * A custom `useLayoutEffect` that passes a boolean indicating whether
 * it's the initial mount (`true`) or a subsequent update (`false`).
 *
 * @param effect The effect callback that receives a `mount` parameter
 * @param deps The dependency array
 */
export default function useLayoutEffect(effect: EffectCallback, deps?: DependencyList) {
  const isMounted = useRef(false);

  reactUseLayoutEffect(() => {
    const mount = !isMounted.current;
    isMounted.current = true;
    return effect(mount);
  }, deps);
}
