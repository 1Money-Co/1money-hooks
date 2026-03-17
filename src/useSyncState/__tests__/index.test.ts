import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useSyncState from '..';

describe('useSyncState', () => {
  it('should initialize with a value', () => {
    const { result } = renderHook(() =>
      useSyncState(0),
    );

    expect(result.current[0]()).toBe(0);
  });

  it('should initialize with a function', () => {
    const { result } = renderHook(() =>
      useSyncState(() => 42),
    );

    expect(result.current[0]()).toBe(42);
  });

  it('should always return the latest state via getState', () => {
    const { result } = renderHook(() =>
      useSyncState(0),
    );

    const [getState, setState] = result.current;

    act(() => {
      setState(1);
      setState(2);
      setState(3);
    });

    expect(getState()).toBe(3);
  });

  it('should support functional updater', () => {
    const { result } = renderHook(() =>
      useSyncState(10),
    );

    act(() => {
      result.current[1](prev => prev + 5);
    });

    expect(result.current[0]()).toBe(15);
  });

  it('should not re-render if value is the same (Object.is)', () => {
    const renderCount = { current: 0 };

    const { result } = renderHook(() => {
      renderCount.current++;
      return useSyncState(1);
    });

    const countBefore = renderCount.current;

    act(() => {
      result.current[1](1); // same value
    });

    expect(renderCount.current).toBe(countBefore);
  });

  it('should return stable getState and setState references', () => {
    const { result, rerender } = renderHook(() =>
      useSyncState(0),
    );

    const [getState1, setState1] = result.current;

    act(() => {
      setState1(5);
    });

    rerender();

    const [getState2, setState2] = result.current;
    expect(getState1).toBe(getState2);
    expect(setState1).toBe(setState2);
  });
});
