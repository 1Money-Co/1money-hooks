import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useSafeState from '..';

describe('useSafeState', () => {
  it('should behave like useState', () => {
    const { result } = renderHook(() =>
      useSafeState(0),
    );

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
  });

  it('should support functional updater', () => {
    const { result } = renderHook(() =>
      useSafeState(10),
    );

    act(() => {
      result.current[1](prev => prev + 5);
    });

    expect(result.current[0]).toBe(15);
  });

  it('should support lazy initialization', () => {
    const { result } = renderHook(() =>
      useSafeState(() => 42),
    );

    expect(result.current[0]).toBe(42);
  });

  it('should not update state after unmount', () => {
    const { result, unmount } = renderHook(() =>
      useSafeState(0),
    );

    const setState = result.current[1];
    unmount();

    // Should not throw
    act(() => {
      setState(99);
    });
  });

  it('should default to undefined when no initial state', () => {
    const { result } = renderHook(() =>
      useSafeState<number>(),
    );

    expect(result.current[0]).toBeUndefined();
  });
});
