---
name: test-strategy
description: >
  Create or update a TESTING.md that documents the project's test strategy
  as a reference for agents and developers. Use when setting up test
  documentation, planning a testing strategy, or capturing test conventions.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# test-strategy

## Description

Create or update a TESTING.md that documents the project's test strategy, serving as a reference for agents and developers.

## When to Use This Skill

This skill activates when:
- User asks about test strategy or test documentation
- A new project needs a testing plan
- Test conventions need to be captured or updated

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo_profile | object | yes | repo-profile.yml content |
| existing_tests | string | no | Summary of current test files/structure |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| strategy_doc | file | TESTING.md documenting test philosophy, structure, commands, and coverage targets |

## Tools Required

- File system (read existing tests, write TESTING.md)

## Behavior

### Steps

1. Scan the project for existing tests:
   - Count test files by type (unit, integration, e2e)
   - Identify frameworks in use (from repo-profile.yml or detection)
   - Check coverage configuration
   - Find test utilities, fixtures, mocks
2. Read AGENTS.md and repo-profile.yml for declared conventions.
3. Generate `TESTING.md` with sections:
   - **Philosophy**: what to test and what not to test
   - **Structure**: where test files live, naming conventions
   - **Commands**: how to run each test tier
   - **Patterns**: preferred mocking approach, fixtures, factories
   - **Coverage**: targets and how to measure
   - **CI integration**: which tests run where (PR, merge, nightly)
4. If TESTING.md exists, compare with reality and suggest updates.
5. Link from AGENTS.md so agents know to check it before writing tests.

### Constraints

- Reflect what the project actually does, not aspirational practices
- Keep it concise (≤100 lines) — agents need signal, not essays
- Include runnable commands (copy-paste ready)
- Separate required tests (must pass for merge) from optional (advisory)

### Error Handling

- If no tests exist: generate a starter strategy doc with recommendations
- If multiple conflicting frameworks: flag and ask which is canonical

