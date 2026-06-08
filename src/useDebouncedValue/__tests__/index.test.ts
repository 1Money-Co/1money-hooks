import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import useDebouncedValue from '..';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() =>
      useDebouncedValue('a'),
    );
    expect(result.current).toBe('a');
  });

  it('should not update before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');
  });

  it('should update after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('should only emit the latest of rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'd' });

    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('d');
  });
});
