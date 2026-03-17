import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useLatest from '..';

describe('useLatest', () => {
  it('should return a ref with the latest value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatest(value),
      { initialProps: { value: 0 } },
    );

    expect(result.current.current).toBe(0);

    rerender({ value: 1 });
    expect(result.current.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
  });

  it('should keep the same ref identity across rerenders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatest(value),
      { initialProps: { value: 'a' } },
    );

    const firstRef = result.current;
    rerender({ value: 'b' });
    expect(result.current).toBe(firstRef);
  });

  it('should work with complex types', () => {
    const obj = { foo: 'bar' };
    const { result, rerender } = renderHook(
      ({ value }) => useLatest(value),
      { initialProps: { value: obj } },
    );

    expect(result.current.current).toBe(obj);

    const newObj = { foo: 'baz' };
    rerender({ value: newObj });
    expect(result.current.current).toBe(newObj);
  });
});
