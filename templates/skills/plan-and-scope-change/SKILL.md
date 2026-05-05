# plan-and-scope-change

## Description

Before any code change, force a structured plan: clarify intent, identify impact, define success criteria, and outline steps.

## Trigger

This skill activates when:
- User asks to make a non-trivial code change (multi-file, architectural)
- User describes a feature, refactor, or migration
- Before starting implementation of any task with >1 file affected

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| change_request | string | yes | What the user wants to accomplish |
| codebase_context | string | no | Relevant files, architecture notes |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| plan | markdown | Structured implementation plan with steps, risks, and success criteria |
| affected_files | file_list | List of files that will be created, modified, or deleted |

## Tools Required

- File system (read source, AGENTS.md, architecture docs)

## Behavior

### Steps

1. **Clarify intent**: restate what the user wants in one sentence. Confirm.
2. **Scope assessment**:
   - List files/modules that will be modified
   - List files/modules that might be affected indirectly
   - Estimate blast radius: small (1-3 files), medium (4-10), large (10+)
3. **Success criteria**: define what "done" looks like:
   - Functional: what should work after the change
   - Non-functional: performance, security, no regressions
   - Verifiable: how to test that it works (specific commands/checks)
4. **Risk assessment**:
   - What could go wrong?
   - Are there irreversible steps?
   - What's the rollback path?
5. **Step plan**: ordered list of implementation steps, each small enough to verify independently.
6. **Present plan** to user for approval before starting any code changes.

### Constraints

- Never start coding before plan is confirmed
- Plan must fit in a single screen (≤20 steps)
- Each step must be independently verifiable
- Flag any irreversible steps prominently
- Reference AGENTS.md conventions and protected_paths

### Error Handling

- If scope is too large: suggest breaking into smaller PRs/tasks
- If requirements are ambiguous: ask clarifying questions before planning
- If plan depends on uncertain assumptions: state them explicitly

## Examples

### Example 1: Feature planning

**Input:** "Add email notifications when users sign up"

**Output:**
```
## Plan: Email notifications on signup

Intent: Send welcome email to new users after account creation.

Scope (medium — 5 files):
- src/services/email.ts (new)
- src/services/user.ts (modify: add hook)
- src/templates/welcome.html (new)
- src/config/env.ts (modify: add SMTP vars)
- tests/services/email.test.ts (new)

Success criteria:
- [ ] Email sent within 5s of successful registration
- [ ] Template renders user's name correctly
- [ ] Failure to send doesn't block registration
- [ ] Tests pass with mocked SMTP

Steps:
1. Add SMTP config to env schema
2. Create email service with send() method
3. Create welcome email template
4. Hook email service into user registration
5. Add unit tests for email service
6. Add integration test for signup → email flow
```

## Metadata

```yaml
name: plan-and-scope-change
version: 1.0.0
standards_version: 1.0.0
category: context-planning
```
