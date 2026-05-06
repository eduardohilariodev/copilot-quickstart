---
name: ci-health
description: >
  Audit GitHub Actions workflow files for common issues including missing
  permissions, no caching, insecure patterns, slow CI, and missing
  concurrency controls. Use when auditing workflows, checking pipeline
  health, reviewing CI/CD configuration, or performing a CI audit.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# ci-health

## Description

Audit GitHub Actions workflow files for common issues: missing permissions, no caching, insecure patterns, missing concurrency controls.

## When to Use This Skill

This skill activates when:
- User asks to review or improve CI/CD configuration
- After adding new workflows
- As part of periodic config health checks

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| workflows_dir | string | no | Path to workflows (default: `.github/workflows/`) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| health_report | markdown | Prioritized checklist of CI issues with severity ratings and fix suggestions |
| risk_score | string | Overall workflow health: critical, warning, or healthy |

## Tools Required

- File system (read workflow YAML files)

## Behavior

### Steps

1. Read all YAML files in `.github/workflows/`.
2. For each workflow, check against rules:

   **Security:**
   - ❌ Missing `permissions` block (defaults to write-all)
   - ❌ Actions pinned to mutable tags (`:v3`) instead of SHA
   - ❌ `pull_request_target` with checkout of PR head (code injection risk)
   - ❌ Secrets used in `run:` without masking
   - ❌ `permissions: write-all` or overly broad permissions

   **Performance:**
   - ⚠️ No dependency caching (node_modules, pip, go modules)
   - ⚠️ No `concurrency` group (stale runs waste resources)
   - ⚠️ Full checkout when shallow would suffice (`fetch-depth: 0` without need)

   **Reliability:**
   - ⚠️ No timeout set (jobs can hang indefinitely)
   - ⚠️ Missing `if: failure()` handling for critical cleanup
   - ⚠️ No retry strategy for flaky network operations

   **Maintainability:**
   - ⚠️ Duplicated steps across workflows (should be reusable)
   - ⚠️ Hardcoded versions (should use `.nvmrc`, matrix, or vars)

3. Score each workflow: critical issues (must fix), warnings (should fix).
4. Output a prioritized checklist with specific fix suggestions.

### Constraints

- Only flag issues with clear negative impact (no style nitpicks)
- Provide the fix, not just the problem
- Respect that some "issues" are intentional (e.g., `fetch-depth: 0` for changelog)

### Error Handling

- If no workflows found: suggest creating one using `ci-starter` skill
- If YAML is malformed: report parse error with line number

