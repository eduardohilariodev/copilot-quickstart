---
name: audit-tool-safety
description: >
  Scan skill definitions and agent configs for unsafe tool usage patterns,
  dangerous permissions, and missing guardrails. Use when auditing tool
  safety, checking allowed tools or tool permissions, reviewing security,
  or performing a security audit on agent configurations.
version: 1.0.0
portability: requires-framework
---

# audit-tool-safety

## Description

Scans skill definitions and agent configs for unsafe tool usage patterns. Identifies skills that grant dangerous tool access, auto-approve destructive actions, mix read-only with write-capable tools without guardrails, or trust untrusted input without validation.

## When to Use This Skill

This skill activates when:
- A user asks to "audit security", "check tool safety", or "review permissions"
- Before promoting a skill from draft to active status
- As part of security review for high/critical risk repos
- After adding new skills or modifying agent tool permissions

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_path | string | yes | Path to skills directory or specific agent/skill file |
| risk_level | string | no | Repo risk level for threshold selection (default: "medium") |
| strict | boolean | no | Apply critical-level checks regardless of risk_level (default: false) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| safety_report | text | Detailed findings per skill/agent |
| critical_issues | object[] | Issues requiring immediate attention |
| recommendations | object[] | Hardening suggestions per finding |
| risk_matrix | text | Visual risk assessment grid |

## Tools Required

- File system read (scan skills, agents, scripts)
- Pattern matching (detect dangerous patterns)

## Behavior

### Steps

1. **Scan Tool Declarations:**
   For each skill and agent definition, extract:
   - Declared tools and their permission levels
   - Scope restrictions (or lack thereof)
   - Approval requirements for each tool
   - Referenced scripts or external commands

2. **Check Permission Patterns:**

   **Dangerous patterns (always flag):**
   - Unrestricted shell access (`tools: ["shell"]` without scope)
   - Write permission to `**/*` (unbounded write access)
   - Execute permission without explicit command allowlist
   - Admin-level tool access without justification
   - `require_approval: []` (empty) for agents with write/execute tools

   **Risky patterns (flag for medium+ risk):**
   - Network access tools without URL restrictions
   - File write to paths outside declared scope
   - Environment variable access without explicit list
   - Tool chaining that escalates privilege (read → infer → write)

3. **Check Input Validation:**
   - Skills that accept user input → do they validate before passing to tools?
   - Skills that read files → do they check path traversal?
   - Skills that execute commands → do they sanitize arguments?
   - Skills that process URLs → do they validate domain?

4. **Check Auto-Approval Patterns:**
   - Any skill that auto-approves tool use (no human-in-the-loop)
   - Agents with `max_iterations` > 20 (long autonomous runs)
   - Skills that mix read and destructive operations in one path
   - Missing escalation policies for error conditions

5. **Check Referenced Scripts/Commands:**
   - Do referenced scripts exist?
   - Are scripts version-pinned or could they change?
   - Do scripts have appropriate permissions?
   - Could scripts be replaced by an attacker (supply chain)?

6. **Risk Matrix Generation:**
   ```
                    Low Impact    High Impact
   Low Likelihood  │ INFO       │ WARNING    │
   High Likelihood │ WARNING    │ CRITICAL   │
   ```

7. **Generate Recommendations:**
   Per finding, suggest:
   - Specific permission reduction (from `**/*` to `src/**/*.ts`)
   - Missing approval gates to add
   - Input validation to implement
   - Scope restrictions to apply

### Constraints

- NEVER modify any files (read-only audit)
- ALWAYS map findings to `.framework/standards.md § Security` rules
- ALWAYS provide actionable fix (not just "this is dangerous")
- Critical findings MUST include specific risk scenario (what could go wrong)
- NEVER flag standard read-only operations as dangerous

### Error Handling

- If a skill references tools not in any known tool catalog: Flag as "unknown tool — verify safety manually"
- If permission model is ambiguous: Assume worst case, flag for clarification
- If script files can't be analyzed: Flag as "unverified external dependency"

## Examples

### Example 1: Safety audit of a deployment skill

**Output:**
```
## Tool Safety Audit: skills/auto-deploy/SKILL.md

Risk Level: HIGH (production deployment skill)

### Critical Issues (2)

🔴 CRITICAL: Unrestricted shell execution
   Location: tools section, line 8
   Pattern: `- name: shell, permission: execute, scope: "*"`
   Risk: Could execute any command including rm -rf, data exfil, etc.
   Fix: Replace with explicit command allowlist:
   ```yaml
   - name: run_command
     permission: execute
     scope: "npm run deploy:*"
   ```

🔴 CRITICAL: No human approval for deployment
   Location: constraints section — missing require_approval
   Risk: Hallucinated deployment could push broken code to production
   Fix: Add:
   ```yaml
   require_approval:
     - "deploy to production"
     - "rollback production"
   ```

### Warnings (1)

🟡 WARNING: Reads environment variables without explicit list
   Location: step 3, "read deployment credentials from environment"
   Risk: Could accidentally log or expose unrelated secrets
   Fix: Declare explicit env var list: `[DEPLOY_TOKEN, AWS_REGION]`

### Risk Matrix
                    Low Impact    High Impact
   Low Likelihood  │             │            │
   High Likelihood │             │ 2 critical │
   
Overall Safety Score: 3/10 — DO NOT ACTIVATE without fixes
```


