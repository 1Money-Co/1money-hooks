import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useLayoutEffect from '..';

describe('useLayoutEffect', () => {
  it('should pass mount=true on initial render', () => {
    const effect = vi.fn();
    renderHook(() => useLayoutEffect(effect, []));

    expect(effect).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledWith(true);
  });

  it('should pass mount=false on subsequent renders', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ dep }) => useLayoutEffect(effect, [dep]),
      { initialProps: { dep: 0 } },
    );

    expect(effect).toHaveBeenLastCalledWith(true);

    rerender({ dep: 1 });
    expect(effect).toHaveBeenLastCalledWith(false);

    rerender({ dep: 2 });
    expect(effect).toHaveBeenLastCalledWith(false);
  });

  it('should call cleanup function', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);

    const { rerender } = renderHook(
      ({ dep }) => useLayoutEffect(effect, [dep]),
      { initialProps: { dep: 0 } },
    );

    rerender({ dep: 1 });
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
