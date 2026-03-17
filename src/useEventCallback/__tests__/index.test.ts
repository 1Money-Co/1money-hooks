import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useEventCallback from '..';

describe('useEventCallback', () => {
  it('should return a stable function reference', () => {
    const { result, rerender } = renderHook(
      ({ fn }) => useEventCallback(fn),
      { initialProps: { fn: () => 'a' } },
    );

    const firstRef = result.current;
    rerender({ fn: () => 'b' });
    expect(result.current).toBe(firstRef);
  });

  it('should always call the latest function', () => {
    const { result, rerender } = renderHook(
      ({ fn }) => useEventCallback(fn),
      { initialProps: { fn: () => 1 } },
    );

    expect(result.current()).toBe(1);

    rerender({ fn: () => 2 });
    expect(result.current()).toBe(2);
  });

  it('should pass arguments through', () => {
    const { result } = renderHook(() =>
      useEventCallback((a: number, b: number) => a + b),
    );

    expect(result.current(2, 3)).toBe(5);
  });
});
