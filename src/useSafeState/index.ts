import { useState, useCallback, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * It is exactly the same as `React.useState`, but after the component is unmounted,
 * the setState in the asynchronous callback will no longer be executed to avoid
 * memory leakage caused by updating the state after the component is unmounted.
 *
 * @param initialState The initial state value or initializer function
 * @returns A tuple of [state, setSafeState] similar to useState
 */
function useSafeState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
// eslint-disable-next-line no-redeclare
function useSafeState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
// eslint-disable-next-line no-redeclare
function useSafeState<S = undefined>(
  initialState?: S | (() => S),
): [S | undefined, Dispatch<SetStateAction<S | undefined>>] {
  const isMountedRef = useRef(true);
  const [state, setState] = useState<S | undefined>(initialState as S | (() => S) | undefined);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback<Dispatch<SetStateAction<S | undefined>>>(value => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}

export default useSafeState;
