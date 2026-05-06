---
name: plan-change
description: >
  Create a structured PLAN.md before any non-trivial code change, following the
  Research → Plan → Implement → Review workflow. Use when planning features,
  refactors, migrations, or multi-file changes. Use when asked to plan, scope,
  think before coding, or create an approach. Do not trigger for single-file
  edits or quick fixes.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# plan-change

## Description

Produce a persistent PLAN.md (or PLAN-CHECKLIST.md) artifact before any
non-trivial code change. The plan follows the **Research → Plan → Implement →
Review** agentic workflow: gather context first, design the approach second, and
only then begin implementation. The artifact survives across sessions so future
agents or human reviewers can pick up exactly where work left off.

## When to Use This Skill

This skill activates when:

- User asks to make a non-trivial code change (multi-file, architectural).
- User describes a feature, refactor, migration, or large bug fix.
- User explicitly says "plan", "scope", "think before coding", "create an
  approach", "design the change", or "outline steps".
- Before starting implementation of any task affecting more than two files.

Do **not** activate for:

- Single-file edits or quick fixes (≤2 files, obvious scope).
- Typo corrections, formatting, or documentation-only changes.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| change_request | string | yes | What the user wants to accomplish |
| codebase_context | string | no | Relevant files, architecture notes, constraints |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| plan_file | file | `PLAN.md` or `PLAN-CHECKLIST.md` written to project root (or session workspace) |
| summary | markdown | Brief plan overview presented in chat for approval |

### Output Contract

Before this skill completes, **all** of the following must be true:

- A `PLAN.md` or `PLAN-CHECKLIST.md` file exists in the project root (or
  session workspace).
- The plan contains: Intent, Scope (files + blast radius), Success Criteria,
  Risk Assessment, and Ordered Steps.
- Every step is small enough to verify independently and includes a verification
  command or check.
- Irreversible steps are flagged and have a documented rollback path.

## Tools Required

- File system — read AGENTS.md, source files, architecture docs, test suites.

## Behavior

### Steps

1. **Research** — Before writing anything, gather context:
   - Read `AGENTS.md` (or equivalent project instructions) for conventions,
     protected paths, and architectural constraints.
   - Scan the directory structure to understand module layout.
   - Identify all files and modules that the change will touch or depend on.
   - Check existing test coverage for affected areas (look for test files,
     run test discovery if available).
   - Note any CI/CD, linting, or build commands relevant to verification.

2. **Scope** — Define the boundary of the change:
   - List every file to create, modify, or delete.
   - Estimate blast radius: **small** (1-3 files), **medium** (4-8 files),
     **large** (9+ files).
   - Map dependencies between changes (what must happen before what).

3. **Define success criteria** — State what "done" looks like:
   - Functional requirements (observable behavior).
   - Non-functional requirements (performance, security, no regressions).
   - Specific verification commands for each criterion (e.g.,
     `npm test -- email`, `npm run type-check`).

4. **Risk assessment** — Identify what could go wrong:
   - List risks and mitigations.
   - Flag irreversible steps (data migrations, API changes, file deletions).
   - Document a rollback path for each risky step.

5. **Create ordered steps** — Build the implementation sequence:
   - Each step is small enough to verify independently.
   - Each step includes: action, affected files, expected outcome, and
     verification command.
   - Order steps so earlier ones don't depend on later ones.

6. **Choose artifact format** based on complexity:
   - **Complex** (>8 files or architectural change) → Full `PLAN.md` with all
     sections (Intent, Success Criteria, Steps table, Risks, Rollback).
   - **Medium** (3-8 files, clear scope) → `PLAN-CHECKLIST.md` with task
     checkboxes grouped by phase.
   - **Simple** (<3 files) → In-chat plan only; no file artifact needed.

7. **Write the plan file** — Create `PLAN.md` or `PLAN-CHECKLIST.md` at the
   project root. Use the status markers: ⬜ (todo), 🔄 (in-progress),
   ✅ (done), ❌ (blocked). Set the overall status to 🟡 In Progress.

8. **Present to user** — Show a brief summary in chat and wait for approval
   before any implementation begins. The plan is a living document: update step
   statuses as work proceeds.

### Constraints

- Never start coding before the plan is written and confirmed.
- Plan must have ≤20 steps. If more are needed, split into multiple plans or
  suggest breaking the work into smaller PRs/tasks.
- Each step must be independently verifiable.
- Flag irreversible steps with a ⚠️ marker and document rollback.
- Reference AGENTS.md conventions and `protected_paths` when applicable.
- The plan file is a living document — mark steps done/in-progress as work
  proceeds so future sessions can resume.

### Error Handling

- If scope is too large (>20 steps): suggest breaking into smaller PRs/tasks
  with separate plans.
- If requirements are ambiguous: ask clarifying questions before planning.
  Do not guess intent.
- If plan depends on uncertain assumptions: state them explicitly in a
  dedicated "Assumptions" section.
- If research reveals the change conflicts with protected paths or
  architectural constraints: surface the conflict and propose alternatives.

## Examples

### Example 1: Full PLAN.md

**Input:** "Add email notifications when users sign up"

**Output file:** `PLAN.md`
```markdown
# PLAN: Email notifications on signup
**Status:** 🟡 In Progress | **Blast radius:** Medium (5 files) | **Rollback:** Revert after step 4

## Intent
Send welcome email to new users after account creation.

## Success Criteria
- [ ] Email sent within 5s of registration
- [ ] Failure to send doesn't block registration
- [ ] Tests pass with mocked SMTP

## Steps
| # | Action | Files | Verify | Status |
|---|--------|-------|--------|--------|
| 1 | Add SMTP config | src/config/env.ts | `npm run type-check` | ⬜ |
| 2 | Create email service | src/services/email.ts | `npm test -- email` | ⬜ |
| 3 | Hook into registration | src/services/user.ts | `npm test -- user` | ⬜ |
| 4 | Integration test | tests/email.test.ts | `npm test` | ⬜ |

## Risks
| Risk | Mitigation |
|------|------------|
| SMTP rate limits in dev | Use Ethereal for dev/test |
```

### Example 2: PLAN-CHECKLIST.md

**Input:** "Rename `utils` module to `helpers`"

**Output file:** `PLAN-CHECKLIST.md`
```markdown
# PLAN: Rename utils → helpers
**Status:** 🟡 In Progress | **Blast radius:** Medium (6 files)

- [ ] Rename `src/utils/` → `src/helpers/`
- [ ] Update all import paths
- [ ] Update test imports
- [ ] Run full test suite: `npm test`

**Rollback:** Git revert — no data migration.
```
