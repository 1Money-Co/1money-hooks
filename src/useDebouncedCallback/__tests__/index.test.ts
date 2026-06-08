import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import useDebouncedCallback from '..';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call before the delay elapses', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(fn, 300),
    );

    act(() => {
      result.current.run();
      vi.advanceTimersByTime(299);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should call once after the delay with latest args', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(fn, 300),
    );

    act(() => {
      result.current.run('a');
      vi.advanceTimersByTime(100);
      result.current.run('b');
      vi.advanceTimersByTime(300);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('should invoke the latest callback body', () => {
    const { result, rerender } = renderHook(
      ({ fn }) => useDebouncedCallback(fn, 300),
      { initialProps: { fn: vi.fn(() => 'old') } },
    );

    act(() => {
      result.current.run();
    });
    const next = vi.fn(() => 'new');
    rerender({ fn: next });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should cancel a pending call', () => {
    const fn = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(fn, 300),
    );

    act(() => {
      result.current.run();
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should cancel a pending call on unmount', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(fn, 300),
    );

    act(() => {
      result.current.run();
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should keep a stable run reference', () => {
    const { result, rerender } = renderHook(
      ({ fn }) => useDebouncedCallback(fn, 300),
      { initialProps: { fn: vi.fn() } },
    );

    const firstRun = result.current.run;
    rerender({ fn: vi.fn() });
    expect(result.current.run).toBe(firstRun);
  });
});
