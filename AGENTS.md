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
5. Update the `skills/1money-react-hooks` skill: add a row to the
   need → hook table in `SKILL.md` and document the hook (signature,
   the bug it prevents, a worked example) in the matching file under
   `references/`.

## Keeping the Skill in Sync

The `skills/1money-react-hooks` skill is the source of truth that guides
consumers on which hook to reach for. **Any change that adds, removes, or
modifies a hook MUST be mirrored in the skill:**

- **New hook** → add it to the need → hook table and a `references/` entry
  (see step 5 above).
- **Changed signature or behavior** → update that hook's reference file so
  the signature, example, and "bug it prevents" stay accurate.
- **Removed/renamed hook** → remove or rename its table row and reference.

A PR that touches `src/` hooks without a corresponding
`skills/1money-react-hooks` update is incomplete.
