---
name: check-policy
description: >
  Verify that AI configurations conform to organization-level policies —
  security requirements, compliance mandates, governance rules, and review
  processes. Use for policy checks, compliance verification, governance
  audits, or security policy reviews.
version: 1.0.0
portability: requires-framework
---

# check-policy

## Description

Verifies that AI configurations conform to organization-level policies — security requirements, compliance mandates, review processes, and integration with CI/CD. Ensures agents don't promise capabilities beyond their authorization or bypass established safeguards.

## When to Use This Skill

This skill activates when:
- A user asks to "check policy", "verify compliance", or "audit governance"
- Before merging config changes to protected branches
- As part of org-wide compliance reviews
- After security incidents involving AI-generated code

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to repository to check |
| policy_file | string | no | Path to org policy document (default: uses .framework/standards.md § Security) |
| check_scope | string | no | "full", "instructions-only", "agents-only", "skills-only" (default: "full") |
| org_requirements | object | no | Additional org-specific requirements beyond base standards |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| conformance_report | text | Policy check results with pass/fail per requirement |
| violations | object[] | Specific policy violations with evidence |
| remediation_plan | text | How to fix each violation |
| attestation | object | Machine-readable conformance status (for compliance tooling) |

## Tools Required

- File system read (configs, policy docs, CI configs)
- .framework/standards.md access (§ Security)

## Behavior

### Steps

1. **Load Policy Requirements:**
   - Read `.framework/standards.md § Security` (always)
   - Read org-specific policy file if provided
   - Build complete checklist of requirements per artifact type

2. **Check Instruction Policies:**
   - Instructions remind agents to respect CI and tests (not skip them)
   - Instructions don't grant abilities beyond tool permissions
   - Instructions include security reminders (no secrets, validate input)
   - Instructions don't encourage bypassing branch protection or review
   - No instructions that override safety (e.g., "ignore security warnings")

3. **Check Agent Policies:**
   - All agents have escalation policies defined
   - No agent has unrestricted write access to protected paths
   - Agents follow risk-level-appropriate permission sets
   - Agent constraints include "never commit secrets"
   - Agents can't self-modify their own definitions
   - Agent iteration limits are appropriate for risk level

4. **Check Skill Policies:**
   - Skills don't auto-approve destructive actions
   - Skills that write to filesystem respect protected paths
   - Skills that access network declare destinations explicitly
   - Skills include error handling for security-relevant failures
   - Skills don't log sensitive information in outputs

5. **Check CI/CD Integration:**
   - Config changes require PR review (branch protection)
   - Generated artifacts are distinguishable from hand-written
   - Automated config checks exist in CI (or recommend adding)
   - Rollback procedures documented for AI config changes

6. **Check Impossible Promises:**
   - Instructions don't promise UI changes (agents can't modify GH UI)
   - Instructions don't promise merge blocking (use branch protection)
   - Instructions don't promise notification/alerting (use CI integrations)
   - Agents don't claim capabilities their tools don't support

7. **Generate Conformance Attestation:**
   ```json
   {
     "repo": "acme/web-platform",
     "policy_version": "1.0.0",
     "checked_at": "2026-05-04T20:00:00Z",
     "result": "partial_conformance",
     "pass_count": 18,
     "fail_count": 2,
     "waived": 0,
     "violations": [...]
   }
   ```

### Constraints

- NEVER modify configs (read-only check)
- ALWAYS check against written policy (never infer policy from convention)
- Violations MUST cite specific policy section being violated
- NEVER mark something as "conformant" if it can't be verified
- The absence of a feature is not a violation unless policy explicitly requires it

### Error Handling

- If no policy file found: Use .framework/standards.md § Security as default, note limitation
- If configs use patterns not covered by policy: Report as "unclassified" for human review
- If CI config can't be parsed: Note gap in coverage, don't assume non-conformance

## Policy Checklist

| ID | Category | Requirement | Severity |
|----|----------|-------------|----------|
| POL-001 | Security | No secrets in any config file | Critical |
| POL-002 | Security | Destructive actions require approval | Critical |
| POL-003 | Security | Tool permissions follow least privilege | High |
| POL-004 | Security | Protected paths enforced in scopes | High |
| POL-005 | Governance | All agents have escalation policies | High |
| POL-006 | Governance | Generated artifacts have provenance | Medium |
| POL-007 | Governance | Config changes go through PR review | High |
| POL-008 | Integrity | Instructions don't bypass CI/tests | High |
| POL-009 | Integrity | No impossible promises in configs | Medium |
| POL-010 | Integrity | Skills declare all side effects | Medium |
| POL-011 | Safety | Agent iteration limits defined | Medium |
| POL-012 | Safety | No self-modifying agent patterns | High |

## Examples

### Example 1: Policy check with violations

**Output:**
```
## Policy Conformance Report: acme/api-service

Status: PARTIAL CONFORMANCE (18/20 checks pass)

### Passing (18)
✅ POL-001: No secrets in config files
✅ POL-002: Destructive actions require approval
✅ POL-003: Tool permissions scoped appropriately
... (15 more)

### Violations (2)

❌ POL-005: Agent "auto-fixer" has no escalation policy
   File: .github/agents/auto-fixer.agent.md
   Required: At least one "ask_user" escalation condition
   Fix: Add escalation section:
   ```yaml
   escalation:
     - condition: "change affects more than 3 files"
       action: ask_user
     - condition: "unsure about intent"
       action: ask_user
   ```

❌ POL-008: copilot-instructions.md contains "skip tests for hotfixes"
   File: .github/copilot-instructions.md, line 45
   Policy: Instructions must never encourage skipping CI/tests
   Fix: Remove line 45. If hotfix process exists, document it in
        CONTRIBUTING.md without instructing AI to skip tests.

### Remediation Priority
1. Fix POL-005 (security: unescalated agent)
2. Fix POL-008 (integrity: test bypass)

### Attestation
Result: partial_conformance
Next check due: 2026-06-04
```


