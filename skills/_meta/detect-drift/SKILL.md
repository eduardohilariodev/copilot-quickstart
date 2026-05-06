---
name: detect-drift
description: >
  Detect configuration drift and inconsistencies between instruction files
  across providers and between configs and the actual codebase. Use when
  checking for drift, finding config mismatches, comparing Copilot vs
  Claude configs, or after codebase changes that may invalidate references.
version: 1.0.0
portability: requires-framework
---

# detect-drift
## Description

Detects configuration drift between instruction files across providers and between configs and the actual codebase. Identifies inconsistencies where AGENTS.md, copilot-instructions, CLAUDE.md, and Cursor rules have diverged in meaning or reference outdated state.

## When to Use This Skill

This skill activates when:
- A user asks to "check drift", "compare configs", or "find inconsistencies"
- After codebase changes that may have invalidated config references (refactors, renames, dependency updates)
- As part of periodic maintenance (every 30 days recommended)

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to the repository to check |
| canonical_source | string | no | Which file is authoritative (default: auto-detect most complete) |
| check_codebase | boolean | no | Also verify configs match actual code state (default: true) |
| since_commit | string | no | Only check drift since this commit (optimization for CI) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| drift_report | text | Human-readable drift analysis |
| drifts | object[] | Machine-readable list of drifts with type, location, severity |
| patch_plan | text | Proposed resolution plan (which file to update, how) |
| staleness_warnings | string[] | References to things that no longer exist in the repo |

## Tools Required

- File system read (all config files + codebase scanning)
- Git history (if since_commit provided)
- Command execution (verify commands still work)

## Behavior

### Steps

1. **Discover All Config Files:**
   - `.github/copilot-instructions.md`
   - `AGENTS.md`
   - `CLAUDE.md`
   - `.cursor/rules/*.mdc`
   - Any `*.instructions.md` files
   - Skill definitions in `.github/skills/` or `.skills/`

2. **Normalize to Comparable Model:**
   For each file, extract:
   - Build/test/lint commands mentioned
   - File paths referenced
   - Framework/library names and versions
   - Behavioral rules (normalized to imperative statements)
   - Tool/permission declarations

3. **Cross-Provider Drift Detection:**
   Compare normalized models across providers:
   - **Missing rules:** Present in canonical, absent in target
   - **Extra rules:** Present in target, absent in canonical (intentional local override?)
   - **Contradictory rules:** Same topic, opposite guidance
   - **Wording drift:** Same intent, different specificity or emphasis
   - **Stale references:** Path/command in one file but not others

4. **Codebase Drift Detection (if check_codebase=true):**
   Verify configs match actual repo state:
   - Do referenced file paths still exist?
   - Do build/test commands in package.json match what configs say?
   - Are listed frameworks still in dependencies?
   - Are mentioned directories still present?
   - Have any referenced tools been uninstalled?

5. **Classify and Prioritize:**
   Each drift gets:
   - **Type:** missing | extra | contradictory | stale | wording
   - **Severity:** error (contradictory/stale) | warning (missing/extra) | info (wording)
   - **Location:** source file, line number, and target file for comparison
   - **Suggested fix:** concrete patch text

6. **Generate Patch Plan:**
   - Identify canonical source (most recently updated, most complete, or user-specified)
   - For each drift: propose update to non-canonical files
   - For stale references: propose removal from all files
   - Group patches by file for efficient application

### Constraints

- NEVER auto-apply patches (always propose, human decides)
- NEVER declare a "local override" as drift without flagging it clearly
- ALWAYS check both directions (A→B and B→A) for completeness
- Canonical source determination MUST be transparent (explain why)
- Codebase checks MUST actually verify (run commands, stat files), not just grep

### Error Handling

- If only one provider config exists: Skip cross-provider check, focus on codebase drift
- If canonical source is ambiguous: Ask user to designate one
- If commands fail when verifying: Mark as "unverifiable" rather than "stale"
- If git history is unavailable: Perform full scan instead of incremental

## Examples

### Example 1: Drift between Copilot and Claude configs

**Output (excerpt):**
```
## Drift Report: my-project

Canonical source: .github/copilot-instructions.md (most recently updated)
Files checked: 3 (copilot-instructions, CLAUDE.md, .cursor/rules/)

### Cross-Provider Drift (5 issues)

❌ CONTRADICTORY [severity: error]
   copilot-instructions line 12: "Use Vitest for all tests"
   CLAUDE.md line 28: "Write tests with Jest"
   → Fix: Update CLAUDE.md line 28 to "Use Vitest for all tests"

⚠️ MISSING [severity: warning]
   Rule "Mock external services using vi.mock()" present in copilot-instructions
   Missing from: CLAUDE.md, .cursor/rules/testing.mdc
   → Fix: Add to both target files

⚠️ EXTRA [severity: warning]
   CLAUDE.md line 45: "Use pnpm workspace protocol for internal deps"
   Not in canonical source — intentional local override?
   → Action: Confirm with maintainer, then add to canonical or mark as local override

### Codebase Drift (2 issues)

❌ STALE [severity: error]
   AGENTS.md line 33: References `src/utils/auth.ts`
   File no longer exists (removed in commit abc123f)
   → Fix: Update to `src/lib/auth/index.ts` or remove reference

⚠️ STALE [severity: warning]
   copilot-instructions line 5: "Build: npm run build"
   package.json scripts.build: "turbo build" (changed to turborepo)
   → Fix: Update to "Build: pnpm turbo build"
```


