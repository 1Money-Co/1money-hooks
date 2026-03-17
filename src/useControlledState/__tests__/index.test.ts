import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useControlledState from '..';

describe('useControlledState', () => {
  it('should use defaultStateValue when value is undefined', () => {
    const { result } = renderHook(() =>
      useControlledState('default'),
    );

    expect(result.current[0]).toBe('default');
  });

  it('should use controlled value when provided', () => {
    const { result } = renderHook(() =>
      useControlledState('default', 'controlled'),
    );

    expect(result.current[0]).toBe('controlled');
  });

  it('should allow updating internal state in uncontrolled mode', () => {
    const { result } = renderHook(() =>
      useControlledState(0),
    );

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
  });

  it('should prefer controlled value over inner state', () => {
    const { result } = renderHook(
      ({ value }) => useControlledState(0, value),
      { initialProps: { value: 10 as number | undefined } },
    );

    expect(result.current[0]).toBe(10);

    // Trying to set inner state, but controlled value wins
    act(() => {
      result.current[1](99);
    });

    expect(result.current[0]).toBe(10);
  });

  it('should reflect controlled value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useControlledState(0, value),
      { initialProps: { value: 1 } },
    );

    expect(result.current[0]).toBe(1);

    rerender({ value: 2 });
    expect(result.current[0]).toBe(2);
  });

  it('should support functional initializer', () => {
    const { result } = renderHook(() =>
      useControlledState(() => 42),
    );

    expect(result.current[0]).toBe(42);
  });

  it('should support functional updater', () => {
    const { result } = renderHook(() =>
      useControlledState(0),
    );

    act(() => {
      result.current[1](prev => prev + 10);
    });

    expect(result.current[0]).toBe(10);
  });
});
