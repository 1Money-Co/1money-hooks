import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useUpdateEffect from '..';

describe('useUpdateEffect', () => {
  it('should not run the effect on initial mount', () => {
    const effect = vi.fn();
    renderHook(() => useUpdateEffect(effect));
    expect(effect).not.toHaveBeenCalled();
  });

  it('should run the effect on updates', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useUpdateEffect(effect, [value]),
      { initialProps: { value: 0 } },
    );

    expect(effect).not.toHaveBeenCalled();

    rerender({ value: 1 });
    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ value: 2 });
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it('should call cleanup on subsequent runs', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);

    const { rerender } = renderHook(
      ({ value }) => useUpdateEffect(effect, [value]),
      { initialProps: { value: 0 } },
    );

    rerender({ value: 1 });
    expect(cleanup).not.toHaveBeenCalled();

    rerender({ value: 2 });
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
