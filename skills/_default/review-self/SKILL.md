---
name: review-self
description: >
  Run a self-review checklist on staged or uncommitted changes before pushing.
  Use when reviewing your own code, checking changes before a PR, doing a
  pre-push review, or looking over recent modifications for issues. Catches
  bugs, security problems, and forgotten debug code. Do not trigger for
  reviewing other people's PRs or formal code review requests.
version: 1.0.0
portability: standalone
allowed-tools: Bash(git:*) Read
---

# review-self

## Description

Run a self-review checklist on staged and uncommitted changes to catch bugs, security issues, and forgotten debug code before pushing.

## When to Use This Skill

This skill activates when:
- User asks to review their own code or check their changes
- User is preparing to push or open a PR and wants a pre-push check
- User asks to look over recent modifications

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| scope | string | no | "staged", "uncommitted", or "both" (default: "both") |
| focus | string | no | Optional focus area: "security", "bugs", "tests", or "all" (default: "all") |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| findings | list | Prioritized checklist of issues found, grouped by severity |
| summary | string | One-line verdict: clean, minor issues, or blocking issues |

## Tools Required

- Git CLI
- File system (read changed files)

## Behavior

### Steps

1. Get the diff: `git diff` for unstaged changes, `git diff --cached` for staged changes.
2. Identify changed files and their languages.
3. Scan for **debug artifacts**: console.log, print(), debugger statements, TODO/FIXME/HACK markers, commented-out code blocks.
4. Scan for **security issues**: hardcoded credentials, API keys, tokens, .env values in code, SQL string concatenation, innerHTML assignments without sanitization.
5. Scan for **logic issues**: empty catch blocks, missing null checks on nullable returns, unreachable code after return/throw, off-by-one patterns in loops.
6. Check for **test coverage gaps**: new public functions without corresponding test changes, removed test assertions.
7. Check for **documentation gaps**: new public APIs without docs, breaking changes without CHANGELOG or migration notes.
8. Present findings as a prioritized checklist: 🔴 Blocking → 🟡 Warning → 🟢 Suggestion.

### Constraints

- Focus on bugs and security, not code style — linters handle style
- Be constructive: explain why each finding matters, not just that it exists
- Don't flag issues outside the changed lines unless they are directly affected
- Limit findings to actionable items — skip nitpicks

### Error Handling

- If no changes are found: inform user "No staged or unstaged changes detected"
- If diff is too large (>2000 lines): scan only staged changes and note that full review was not possible

## Examples

### Example 1: Pre-push review with findings

**Input:** "review my code before I push"
**Output:**
```
## Self-Review Results

🔴 **Blocking**
- src/api/auth.js:42 — Hardcoded API key: `const key = "sk-abc123..."`.
  Move to environment variable.

🟡 **Warning**
- src/utils/parse.ts:18 — Empty catch block swallows errors silently.
  At minimum, log the error.
- src/api/auth.js:67 — `console.log(userData)` left in.
  Remove before pushing.

🟢 **Suggestion**
- src/services/user.ts:30 — New public method `findByEmail()` has
  no corresponding test in user.test.ts.

**Verdict:** 1 blocking issue must be fixed before pushing.
```
