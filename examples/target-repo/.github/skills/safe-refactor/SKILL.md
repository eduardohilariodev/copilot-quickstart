---
name: safe-refactor
description: >
  Executes multi-file refactoring in controlled batches with test verification
  gates between each batch to minimize risk of breaking changes. Use when a
  refactor touches 3+ files or when rename, extract, or move operations span
  multiple modules.
version: 1.0.0
portability: standalone
allowed-tools: Bash Read
---

# safe-refactor

<!--
  Vendored from: copilot-quickstart/templates/skills/safe-refactor
  Standards version: 1.0.0
-->

## Description

Executes multi-file refactoring operations in controlled batches with test verification gates between each batch. Minimizes risk of breaking changes.

## When to Use This Skill

This skill activates when:
- The user requests a refactor touching 3+ files
- A rename, extract, or move operation spans multiple modules

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| refactor_scope | string | yes | Description of what to refactor |
| affected_files | list | no | Known files to touch (auto-detected if omitted) |
| batch_size | number | no | Max files per batch (default: 5) |

## Behavior

### Steps

1. Identify all files affected by the refactor.
2. Group files into batches of ≤batch_size, ordered by dependency.
3. For each batch: apply changes, run tests, confirm green before next batch.
4. If tests fail, revert the current batch and report the failure point.

### Constraints

- Never proceed to the next batch if current batch tests fail.
- Preserve all existing public API contracts unless explicitly changing them.
- Create a rollback plan before starting.
