import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import useInterval from '..';

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call the callback every delay ms', () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, 100));

    expect(fn).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fire on start when immediate is set', () => {
    const fn = vi.fn();
    renderHook(() =>
      useInterval(fn, 100, { immediate: true }),
    );

    expect(fn).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pause when delay is null', () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, null));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should invoke the latest callback body', () => {
    const { rerender } = renderHook(
      ({ fn }) => useInterval(fn, 100),
      { initialProps: { fn: vi.fn() } },
    );

    const next = vi.fn();
    rerender({ fn: next });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should stop via the returned clear function', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useInterval(fn, 100),
    );

    act(() => {
      vi.advanceTimersByTime(100);
      result.current();
      vi.advanceTimersByTime(300);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should clear the interval on unmount', () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() =>
      useInterval(fn, 100),
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(fn).not.toHaveBeenCalled();
  });
});
