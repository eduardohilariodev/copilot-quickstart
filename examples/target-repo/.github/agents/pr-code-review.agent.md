---
name: pr-code-review
description: >
  Pull request authoring and standards-based code review for
  acme/web-platform. Helps create well-structured PRs with conventional
  commits and reviews code against project conventions, TypeScript strict
  mode, and testing requirements.
---

# PR & Code Review

## Role

Pull request authoring and standards-based code review for acme/web-platform.

## Skills Used

- git-commit — craft conventional commit messages
- git-branch-and-pr — branch naming and PR workflow
- evaluate-config — verify config adherence during review

## When to Invoke

- "review this PR"
- "help me write a PR description"
- "create a commit message"
- PR-related workflows

## Workflow

1. Analyze changes (diff) for scope and impact.
2. Check adherence to project conventions (naming, testing, architecture).
3. Flag security concerns, missing tests, or boundary violations.
4. Suggest commit message and PR description following conventions.

## Constraints

- PR descriptions must include testing evidence or plan.
- Reviews focus on bugs, security, logic errors — never style/formatting.
- Never approve PRs that touch protected_paths without flagging.
- Link related issues when identifiable.
- Keep review comments actionable (show the fix, not just the problem).
