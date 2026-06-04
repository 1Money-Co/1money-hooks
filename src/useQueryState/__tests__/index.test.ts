import { renderHook, act } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  vi,
} from 'vitest';

// Simulate the Next.js App Router: native history
// writes are intercepted and synced into
// `useSearchParams`. jsdom does not do this, so we
// patch history to emit an event the mock listens to.
const NAV_EVENT = 'next-nav-sync';

vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import(
    'react'
  );
  return {
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(
          cb => {
            window.addEventListener('popstate', cb);
            window.addEventListener(NAV_EVENT, cb);
            return () => {
              window.removeEventListener(
                'popstate',
                cb,
              );
              window.removeEventListener(
                NAV_EVENT,
                cb,
              );
            };
          },
          () => window.location.search,
          () => '',
        ),
      ),
  };
});

import useQueryState, {
  queryNumber,
  queryBoolean,
  queryJson,
} from '..';

beforeAll(() => {
  (['pushState', 'replaceState'] as const).forEach(
    method => {
      const original =
        window.history[method].bind(window.history);
      window.history[method] = (...args) => {
        original(...args);
        window.dispatchEvent(new Event(NAV_EVENT));
      };
    },
  );
});

const setUrl = (search: string): void => {
  window.history.replaceState(
    null,
    '',
    `/${search ? `?${search}` : ''}`,
  );
};

describe('useQueryState', () => {
  beforeEach(() => {
    setUrl('');
  });

  it('reads the raw string param', () => {
    setUrl('q=hello');
    const { result } = renderHook(() =>
      useQueryState('q'),
    );
    expect(result.current[0]).toBe('hello');
  });

  it('returns null when param is absent', () => {
    const { result } = renderHook(() =>
      useQueryState('missing'),
    );
    expect(result.current[0]).toBeNull();
  });

  it('falls back to defaultValue', () => {
    const { result } = renderHook(() =>
      useQueryState('page', {
        parser: queryNumber,
        defaultValue: 1,
      }),
    );
    expect(result.current[0]).toBe(1);
  });

  it('parses the value with the parser', () => {
    setUrl('page=3');
    const { result } = renderHook(() =>
      useQueryState('page', {
        parser: queryNumber,
        defaultValue: 1,
      }),
    );
    expect(result.current[0]).toBe(3);
  });

  it('writes to the URL on set', () => {
    const { result } = renderHook(() =>
      useQueryState('page', {
        parser: queryNumber,
        defaultValue: 1,
      }),
    );

    act(() => {
      result.current[1](2);
    });

    expect(result.current[0]).toBe(2);
    expect(window.location.search).toBe('?page=2');
  });

  it('supports a functional updater', () => {
    setUrl('page=5');
    const { result } = renderHook(() =>
      useQueryState('page', {
        parser: queryNumber,
        defaultValue: 1,
      }),
    );

    act(() => {
      result.current[1](prev => (prev ?? 0) + 1);
    });

    expect(result.current[0]).toBe(6);
    expect(window.location.search).toBe('?page=6');
  });

  it('removes the param when set to null', () => {
    setUrl('page=2&keep=1');
    const { result } = renderHook(() =>
      useQueryState('page', {
        parser: queryNumber,
      }),
    );

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    expect(window.location.search).toBe('?keep=1');
  });

  it('preserves other params on write', () => {
    setUrl('keep=1');
    const { result } = renderHook(() =>
      useQueryState('q'),
    );

    act(() => {
      result.current[1]('x');
    });

    const params = new URLSearchParams(
      window.location.search,
    );
    expect(params.get('keep')).toBe('1');
    expect(params.get('q')).toBe('x');
  });

  it('syncs instances sharing a key', () => {
    const a = renderHook(() => useQueryState('q'));
    const b = renderHook(() => useQueryState('q'));

    act(() => {
      a.result.current[1]('shared');
    });

    expect(b.result.current[0]).toBe('shared');
  });

  it('reacts to popstate (back/forward)', () => {
    setUrl('q=first');
    const { result } = renderHook(() =>
      useQueryState('q'),
    );

    act(() => {
      result.current[1]('second');
    });
    expect(result.current[0]).toBe('second');

    act(() => {
      window.history.replaceState(
        null,
        '',
        '/?q=back',
      );
      window.dispatchEvent(
        new PopStateEvent('popstate'),
      );
    });
    expect(result.current[0]).toBe('back');
  });

  it('uses replaceState by default', () => {
    const before = window.history.length;
    const { result } = renderHook(() =>
      useQueryState('q'),
    );
    act(() => {
      result.current[1]('a');
    });
    expect(window.history.length).toBe(before);
  });

  it('pushes a history entry when history=push', () => {
    const before = window.history.length;
    const { result } = renderHook(() =>
      useQueryState('q', { history: 'push' }),
    );
    act(() => {
      result.current[1]('a');
    });
    expect(window.history.length).toBe(before + 1);
  });

  it('round-trips booleans', () => {
    const { result } = renderHook(() =>
      useQueryState('flag', {
        parser: queryBoolean,
        defaultValue: false,
      }),
    );
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
    expect(window.location.search).toBe('?flag=true');
  });

  it('round-trips JSON with a serializer', () => {
    const { result } = renderHook(() =>
      useQueryState<{ a: number }>('obj', {
        parser: queryJson as never,
        serializer: JSON.stringify,
      }),
    );
    act(() => {
      result.current[1]({ a: 1 });
    });
    expect(result.current[0]).toEqual({ a: 1 });
  });
});
