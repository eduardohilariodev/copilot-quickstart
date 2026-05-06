---
name: test-generate
description: >
  Generate unit test scaffolds for functions and modules following the
  project's testing conventions and framework. Use when writing tests for
  a function, module, or class, or when test coverage is needed for new
  or changed code.
version: 1.0.0
portability: standalone
allowed-tools: Bash Read
---

# test-generate

## Description

Generate unit test scaffolds for functions/modules following the project's testing conventions and framework.

## When to Use This Skill

This skill activates when:
- User asks to write tests for a function, module, or class
- User wants test coverage for new or changed code

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_code | string | yes | File or function to test |
| test_framework | string | no | From repo-profile.yml frameworks (jest, vitest, pytest, etc.) |
| conventions | string | no | Testing conventions from AGENTS.md |

## Tools Required

- File system (read source code and existing tests)
- Test runner CLI

## Behavior

### Steps

1. Read the target source file and identify:
   - Public API (exported functions, class methods)
   - Input types and return types
   - Dependencies and side effects
   - Edge cases (null, empty, boundary values)
2. Check existing test files for patterns:
   - File naming: `*.test.ts`, `*.spec.ts`, `*_test.go`, `test_*.py`
   - Describe/it structure vs test functions
   - Mock/stub patterns in use
   - Setup/teardown conventions
3. Generate test file following discovered conventions:
   - One describe block per function/method
   - Happy path test first
   - Error/edge case tests
   - Mock external dependencies
4. Ensure tests are runnable: correct imports, proper mock setup.
5. Run tests once to verify they pass (or fail meaningfully if testing unimplemented code).

### Constraints

- Match existing test file structure and naming in the project
- Use the project's actual test framework (don't mix jest into a vitest project)
- Mock at boundaries (HTTP, DB, filesystem), not internal functions
- Test behavior, not implementation details
- Keep tests focused: one assertion concept per test

### Error Handling

- If test framework is unclear: ask user or infer from devDependencies
- If function has no clear return type: generate assertion placeholders with TODO comments

## Examples

### Example 1: TypeScript function

**Input:** `src/utils/formatDate.ts` — exports `formatDate(date: Date, locale?: string): string`

**Output:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats date with default locale', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });

  it('respects provided locale', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'pt-BR')).toBe('15 de janeiro de 2024');
  });

  it('handles invalid date', () => {
    expect(() => formatDate(new Date('invalid'))).toThrow();
  });
});
```

