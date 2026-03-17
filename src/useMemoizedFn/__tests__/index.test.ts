import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useMemoizedFn from '..';

describe('useMemoizedFn', () => {
  it('should return a stable function reference', () => {
    let count = 0;
    const { result, rerender } = renderHook(() =>
      useMemoizedFn(() => count++),
    );

    const firstRef = result.current;
    rerender();
    rerender();
    expect(result.current).toBe(firstRef);
  });

  it('should always invoke the latest function', () => {
    const { result, rerender } = renderHook(
      ({ fn }) => useMemoizedFn(fn),
      { initialProps: { fn: () => 'old' } },
    );

    expect(result.current()).toBe('old');

    rerender({ fn: () => 'new' });
    expect(result.current()).toBe('new');
  });

  it('should forward arguments and return values', () => {
    const { result } = renderHook(() =>
      useMemoizedFn(
        (a: string, b: string) => `${a}-${b}`,
      ),
    );

    expect(result.current('hello', 'world')).toBe(
      'hello-world',
    );
  });

  it('should preserve this context', () => {
    const { result } = renderHook(() =>
      useMemoizedFn(function (this: { x: number }) {
        return this.x;
      }),
    );

    const ctx = { x: 42 };
    expect(result.current.call(ctx)).toBe(42);
  });
});
