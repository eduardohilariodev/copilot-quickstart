# plan-and-scope-change

<!--
  Vendored from: copilot-quickstart/templates/skills/plan-and-scope-change
  Standards version: 1.0.0
-->

## Description

Structures a planning phase before any code change. Produces a clear scope, affected files list, risk assessment, and acceptance criteria before implementation begins.

## Trigger

This skill activates when:
- A task involves more than a trivial one-file edit
- The user says "plan this", "scope this change", or "what's the impact"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| task_description | string | yes | What needs to be accomplished |
| repo_context | object | no | Current repo state (auto-detected if omitted) |

## Behavior

### Steps

1. Analyze the task to identify affected modules and files.
2. Assess risk level: low (isolated), medium (cross-module), high (breaking change).
3. Produce a structured plan: scope, files, risks, acceptance criteria.
4. Present plan for approval before any implementation begins.

### Constraints

- Never start implementation without explicit plan approval.
- Flag any change that touches protected paths.
- Include rollback strategy for medium/high risk changes.
