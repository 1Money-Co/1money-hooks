import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import useTimeout from '..';

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call the callback once after the delay', () => {
    const fn = vi.fn();
    renderHook(() => useTimeout(fn, 200));

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(fn).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not fire again after the first call', () => {
    const fn = vi.fn();
    renderHook(() => useTimeout(fn, 200));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not fire when delay is null', () => {
    const fn = vi.fn();
    renderHook(() => useTimeout(fn, null));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should invoke the latest callback body', () => {
    const { rerender } = renderHook(
      ({ fn }) => useTimeout(fn, 200),
      { initialProps: { fn: vi.fn() } },
    );

    const next = vi.fn();
    rerender({ fn: next });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should cancel via the returned clear function', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useTimeout(fn, 200),
    );

    act(() => {
      result.current();
      vi.advanceTimersByTime(200);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should cancel the timeout on unmount', () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() =>
      useTimeout(fn, 200),
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should restart when the delay changes', () => {
    const fn = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useTimeout(fn, delay),
      { initialProps: { delay: 200 } },
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });
    // Changing the delay resets the timer from zero.
    rerender({ delay: 300 });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(fn).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
