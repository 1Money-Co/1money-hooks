# AGENTS.md

This file provides guidance to CODE AGENT when working with code in this repository.

## Project Overview

`@1money/hooks` — a React hooks utility library for 1Money front-end projects. Provides 10 core hooks with dual ESM/CJS output, tree-shaking support, and React 16.8.0+ compatibility.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Watch mode (rebuilds on changes)
pnpm build            # Build ESM (es/) and CJS (lib/) with .d.ts files
pnpm test             # Run all tests
pnpm test -- src/useMemoizedFn   # Run tests for a single hook
pnpm lint             # Check formatting (prettier) + linting (eslint)
pnpm lint:fix         # Auto-fix formatting and lint issues
```

## Architecture

**Build tool:** Father (bundless — transpiles TypeScript without bundling).
**Test framework:** Vitest with jsdom environment, `@testing-library/react` and `@testing-library/react-hooks`.

### Hook structure

Each hook follows the same layout:
```
src/
├── index.ts                    # Barrel export of all hooks
└── useHookName/
    ├── index.ts                # Implementation
    └── __tests__/
        └── index.test.ts       # Tests
```

### Entry points and exports

`package.json` defines per-hook export paths for tree-shaking:
```ts
import { useMemoizedFn } from '@1money/hooks';           // barrel import
import useMemoizedFn from '@1money/hooks/useMemoizedFn';  // direct import
```

`sideEffects: false` is set to enable tree-shaking. Both `es/` (ESM) and `lib/` (CJS) are published.

## Code Style

- **Strict 50-character print width** — enforced by both Prettier and ESLint.
- Single quotes, semicolons required, no trailing commas, arrow parens avoided.
- ESLint 9 flat config with TypeScript parser, React plugin, and Prettier plugin.
- All hooks use JSDoc comments with `@param` and `@returns`.

## Testing Patterns

Tests use `renderHook` and `act` from `@testing-library/react`:
```ts
import { renderHook, act } from '@testing-library/react';

const { result, rerender } = renderHook(
  ({ value }) => useHookName(value),
  { initialProps: { value: initial } }
);
expect(result.current).toBe(expected);
```

Path alias `@/*` maps to `src/*` in both `tsconfig.json` and `vitest.config.ts`.

## Adding a New Hook

1. Create `src/useNewHook/index.ts` with the implementation.
2. Create `src/useNewHook/__tests__/index.test.ts` with tests.
3. Export from `src/index.ts`.
4. Add a per-hook export path in `package.json` under `"exports"`.
