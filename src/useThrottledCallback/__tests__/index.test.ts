import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import useThrottledCallback from '..';

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call immediately on the leading edge', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 300),
    );

    act(() => {
      result.current.run('a');
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('should throttle calls within the window', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 300),
    );

    act(() => {
      result.current.run('a');
      result.current.run('b');
      result.current.run('c');
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('should flush the latest args on the trailing edge', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 300),
    );

    act(() => {
      result.current.run('a');
      result.current.run('b');
      result.current.run('c');
      vi.advanceTimersByTime(300);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  it('should allow a new leading call after the window', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 300),
    );

    act(() => {
      result.current.run('a');
      vi.advanceTimersByTime(300);
      result.current.run('b');
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'a');
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('should cancel a pending trailing call', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(fn, 300),
    );

    act(() => {
      result.current.run('a');
      result.current.run('b');
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('should invoke the latest callback body', () => {
    const { result, rerender } = renderHook(
      ({ fn }) => useThrottledCallback(fn, 300),
      { initialProps: { fn: vi.fn() } },
    );

    const next = vi.fn();
    act(() => {
      result.current.run('a');
    });
    rerender({ fn: next });
    act(() => {
      result.current.run('b');
      vi.advanceTimersByTime(300);
    });
    expect(next).toHaveBeenCalledWith('b');
  });
});
