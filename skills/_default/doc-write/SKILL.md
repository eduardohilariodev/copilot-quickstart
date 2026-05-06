---
name: doc-write
description: >
  Write inline documentation (JSDoc, docstrings, type annotations) for
  functions, classes, and modules. Use when adding documentation, writing
  JSDoc or TSDoc comments, creating Python docstrings, annotating code,
  or commenting functions. Matches the project's existing documentation
  style. Do not trigger for README generation or standalone documentation
  files.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# doc-write

## Description

Write inline documentation for code symbols following the project's existing documentation conventions and style.

## When to Use This Skill

This skill activates when:
- User asks to document, annotate, or comment functions, classes, or modules
- User asks for JSDoc, TSDoc, docstrings, or type documentation
- User wants to add documentation to undocumented code

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string | yes | File path or code symbol to document |
| scope | string | no | "public" (default), "all", or specific symbol name |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| documented_code | string | The code with inline documentation added |

## Tools Required

- File system (read source code and existing documentation patterns)

## Behavior

### Steps

1. Read the target code and identify the public API surface (exported functions, public methods, classes, types).
2. Scan the project for existing documentation style:
   - JavaScript/TypeScript: JSDoc (`/** */`) vs TSDoc (`/** @param */` with `@remarks`)
   - Python: Google-style, NumPy-style, or reStructuredText docstrings
   - Go: Godoc comment conventions
   - Rust: `///` doc comments with Rustdoc syntax
3. For each undocumented public symbol, generate:
   - One-line description (what it does, not how)
   - `@param` / parameter docs with types and descriptions
   - `@returns` / return type docs
   - `@throws` / `@raises` for documented error conditions
   - `@example` when usage is not immediately obvious
4. Match the existing style exactly — don't introduce JSDoc into a TSDoc project.
5. Preserve existing documentation; only fill gaps in undocumented symbols.

### Constraints

- Only document public API by default — skip private/internal helpers unless asked
- Don't restate the function name: "Gets the user name" for `getUserName()` adds no value
- Include `@example` only when the function signature alone doesn't convey usage
- Preserve all existing documentation — never overwrite or reword existing docs
- Keep descriptions concise: one line for simple functions, short paragraph for complex ones

### Error Handling

- If documentation style cannot be detected: default to the language's most common convention (JSDoc for JS/TS, Google-style for Python)
- If the function has no clear return type: add a `TODO` placeholder in the return doc

## Examples

### Example 1: TypeScript function

**Input:** Document `src/utils/retry.ts`
**Output:**
```typescript
/**
 * Retry an async operation with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Initial delay in milliseconds before first retry
 * @returns The resolved value of the function
 * @throws After exhausting all retries, throws the last error encountered
 *
 * @example
 * const data = await retry(() => fetchAPI('/users'), 3, 1000);
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
```

### Example 2: Python method

**Input:** Document `auth/service.py`
**Output:**
```python
def verify_token(self, token: str, audience: str | None = None) -> Claims:
    """Verify a JWT token and return its decoded claims.

    Args:
        token: The encoded JWT string.
        audience: Expected audience claim. If provided, validates
            the token's audience matches.

    Returns:
        Decoded claims from the verified token.

    Raises:
        TokenExpiredError: If the token has passed its expiration time.
        InvalidTokenError: If the token signature is invalid.
    """
```
