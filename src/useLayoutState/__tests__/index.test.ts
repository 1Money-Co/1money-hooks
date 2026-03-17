import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useLayoutState, { useTimeoutLock } from '..';

describe('useLayoutState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useLayoutState(0),
    );

    expect(result.current[0]).toBe(0);
  });

  it('should batch multiple updates into one', async () => {
    const { result } = renderHook(() =>
      useLayoutState(0),
    );

    act(() => {
      result.current[1](prev => prev + 1);
      result.current[1](prev => prev + 1);
      result.current[1](prev => prev + 1);
    });

    // Wait for microtask to flush
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(3);
  });

  it('should not trigger re-render when state does not change', async () => {
    const renderCount = { current: 0 };
    const { result } = renderHook(() => {
      renderCount.current++;
      return useLayoutState(5);
    });

    const countBefore = renderCount.current;

    act(() => {
      result.current[1](prev => prev); // same value
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(renderCount.current).toBe(countBefore);
    expect(result.current[0]).toBe(5);
  });
});

describe('useTimeoutLock', () => {
  it('should set and get state', () => {
    const { result } = renderHook(() =>
      useTimeoutLock<number>(),
    );

    const [setState, getState] = result.current;

    expect(getState()).toBeNull();

    act(() => {
      setState(42);
    });

    expect(getState()).toBe(42);
  });

  it('should reset state after timeout', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useTimeoutLock<string>(),
    );

    const [setState, getState] = result.current;

    act(() => {
      setState('locked');
    });

    expect(getState()).toBe('locked');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(getState()).toBeNull();

    vi.useRealTimers();
  });

  it('should use default state', () => {
    const { result } = renderHook(() =>
      useTimeoutLock<number>(99),
    );

    expect(result.current[1]()).toBe(99);
  });
});
