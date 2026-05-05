---
description: Testing conventions using Vitest and Playwright
applyTo: "**/*.test.ts,**/*.spec.ts,**/e2e/**/*.ts,**/tests/**/*.ts"
---

## Unit Tests (Vitest)

- Co-locate tests: `foo.ts` → `foo.test.ts` in the same directory
- Structure: `describe('ModuleName')` → `it('should …')` per behavior
- One assertion concept per test — keep tests focused
- Mock at boundaries (HTTP, DB, filesystem), not internal functions
- Use `vi.mock()` for module mocks; prefer dependency injection

## Test Organization

- `describe` blocks mirror the public API surface
- Happy path first, then error cases, then edge cases
- Use `beforeEach` for shared setup; avoid `beforeAll` for mutable state
- Name tests as behavior: `it('returns 404 when user not found')`

## E2E Tests (Playwright)

- Store in `apps/web/e2e/` directory
- Use Page Object pattern for reusable interactions
- Target elements via `data-testid` attributes, not CSS selectors
- Each test must be independent — no shared state between tests
- Use `test.describe` to group related user flows

## Coverage & CI

- Target 80% line coverage for unit tests
- Run `pnpm turbo test` to execute all unit tests
- Run `pnpm --filter web exec playwright test` for e2e
- Never skip failing tests with `.skip` — fix or delete them
