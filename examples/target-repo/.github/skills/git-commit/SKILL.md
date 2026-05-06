---
name: git-commit
description: >
  Generate conventional, descriptive commit messages from staged changes.
  Use when committing changes, writing commit messages, or when staged
  files need a commit description.
version: 1.0.0
portability: standalone
allowed-tools: Bash(git:*) Read
---

# git-commit

## Description

Generate conventional, descriptive commit messages from staged changes.

## When to Use This Skill

This skill activates when:
- User asks to commit changes or write a commit message
- User has staged files and needs a commit description

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| staged_diff | string | yes | Output of `git diff --cached` |
| conventions | string | no | Commit format from repo-profile.yml |

## Tools Required

- File system (read staged diff)
- Git CLI

## Behavior

### Steps

1. Read the staged diff via `git diff --cached --stat` for overview, then full diff for detail.
2. Identify the **primary change type**: feat, fix, refactor, docs, test, chore, perf, ci, build.
3. Identify the **scope** (module/package/component most affected).
4. Write subject line: `<type>(<scope>): <imperative verb> <what changed>` — max 72 chars.
5. If non-trivial, add body: what changed and why (not how). Wrap at 72 chars.
6. Add footer if applicable: `BREAKING CHANGE:`, `Closes #N`, `Co-authored-by:`.
7. Validate: subject ≤72 chars, imperative mood, body wraps correctly.

### Constraints

- Subject uses imperative mood ("add" not "added")
- One logical change per commit — suggest splitting if diff has unrelated changes
- Respect `conventions.commit_format` from repo-profile.yml if present
- Never include raw file paths unless they clarify scope

### Error Handling

- If staged diff is empty: inform user "Nothing staged — run `git add` first"
- If changes span unrelated areas: suggest splitting into multiple commits

## Examples

### Example 1: Feature commit

**Input:** Diff shows new `UserService.getById()` method + test

**Output:**
```
feat(users): add getById method to UserService

Implement user lookup by ID with proper error handling
for missing records. Includes unit test coverage.
```

