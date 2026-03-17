import { useRef, useState, useEffect, useCallback } from 'react';

export type Updater<State> = (prev: State) => State;

/**
 * Execute code before next frame but async.
 *
 * Batches multiple state updates into a single microtask (via `Promise.resolve`),
 * reducing unnecessary re-renders when multiple updates happen synchronously.
 *
 * @param defaultState The initial state value
 * @returns A tuple of `[state, setFrameState]`
 */
export default function useLayoutState<State>(
  defaultState: State,
): [State, (updater: Updater<State>) => void] {
  const stateRef = useRef(defaultState);
  const [, forceUpdate] = useState({});

  const lastPromiseRef = useRef<Promise<void> | null>(null);
  const updateBatchRef = useRef<Updater<State>[]>([]);

  const setFrameState = useCallback((updater: Updater<State>) => {
    updateBatchRef.current.push(updater);

    const promise = Promise.resolve();
    lastPromiseRef.current = promise;

    promise.then(() => {
      if (lastPromiseRef.current === promise) {
        const prevBatch = updateBatchRef.current;
        const prevState = stateRef.current;
        updateBatchRef.current = [];

        prevBatch.forEach(batchUpdater => {
          stateRef.current = batchUpdater(stateRef.current);
        });

        lastPromiseRef.current = null;

        if (prevState !== stateRef.current) {
          forceUpdate({});
        }
      }
    });
  }, []);

  useEffect(
    () => () => {
      lastPromiseRef.current = null;
    },
    [],
  );

  return [stateRef.current, setFrameState];
}

/** Lock frame, when frame pass reset the lock. */
export function useTimeoutLock<State>(
  defaultState?: State,
): [(state: State) => void, () => State | null] {
  const frameRef = useRef<State | null>(defaultState ?? null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cleanUp() {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function setState(newState: State) {
    frameRef.current = newState;
    cleanUp();

    timeoutRef.current = setTimeout(() => {
      frameRef.current = null;
      timeoutRef.current = null;
    }, 100);
  }

  function getState() {
    return frameRef.current;
  }

  useEffect(() => cleanUp, []);

  return [setState, getState];
}
