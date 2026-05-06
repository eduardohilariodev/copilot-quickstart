---
name: ci-health
description: >
  Audits GitHub Actions workflows for security, performance, and reliability
  issues including unpinned actions, missing permissions, and caching gaps.
  Use when reviewing CI/CD configuration, when workflow files are added or
  modified, or during periodic maintenance audits.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# ci-health

<!--
  Vendored from: copilot-quickstart/templates/skills/ci-health
  Standards version: 1.0.0
-->

## Description

Audits GitHub Actions workflows for security, performance, and reliability issues. Checks for unpinned actions, missing permissions, excessive timeouts, and caching opportunities.

## When to Use This Skill

This skill activates when:
- The user asks to review CI/CD configuration
- A workflow file is added or modified
- Periodic maintenance audit runs

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| workflow_paths | list | no | Specific workflow files to audit (defaults to all in .github/workflows/) |
| severity_threshold | string | no | Minimum severity to report: low, medium, high (default: medium) |

## Behavior

### Steps

1. Scan all workflow YAML files for known anti-patterns.
2. Check: actions pinned to SHA, explicit permissions, timeout-minutes set.
3. Check: caching configured for package managers, matrix strategy for multi-version.
4. Produce a prioritized report grouped by severity.

### Constraints

- Never modify workflow files without explicit approval.
- Flag all high-severity issues regardless of threshold setting.
- Report both the problem and the specific fix (with code snippet).
