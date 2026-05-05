# Testing Instructions

<!--
  Path-specific instructions for test files.
  Place at: .github/instructions/tests.instructions.md
  Applies to: **/*.test.*, **/*.spec.*, **/test/**, **/tests/**, **/__tests__/**
  Keep under 40 lines — patterns, not procedures.
-->

## Test Philosophy

- Test behavior through public API, not internal implementation details
- Each test should have a single reason to fail
- Tests must be independent — no shared mutable state between tests
- Prefer real implementations over mocks when fast enough

## Structure

- Arrange → Act → Assert (AAA pattern)
- One describe block per function/method/component
- Test names describe the scenario: `"returns empty array when no items match"`
- Group: happy path first, then edge cases, then error cases

## Mocking

- Mock at boundaries: HTTP, database, filesystem, external services
- Never mock the thing you're testing
- Use the project's mock/stub library (from devDependencies)
- Reset mocks between tests to prevent leakage

## What to Test

- ✅ Business logic and transformations
- ✅ Error handling paths (invalid input, failures, timeouts)
- ✅ Edge cases (empty, null, boundary values, Unicode)
- ✅ Integration points (API contracts, DB queries)
- ❌ Framework boilerplate (routing config, module imports)
- ❌ Trivial getters/setters with no logic

## Naming & Files

- Co-locate with source: `module.ts` → `module.test.ts`
- Or use `__tests__/` directory mirroring `src/` structure
- Test file names must match: `*.test.*` or `*.spec.*`

## Assertions

- Use specific assertions over generic truthy checks
- Prefer `toEqual` over `toBe` for objects
- Assert on the important thing, not everything
