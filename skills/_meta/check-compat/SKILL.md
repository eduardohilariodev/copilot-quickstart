---
name: check-compat
description: >
  Verify that skill definitions and instruction files are compatible with
  current versions of host AI tools. Use after tool upgrades, when skills
  stop working, or for periodic compatibility checks.
version: 1.0.0
portability: requires-framework
---

# check-compat
## Description

Verifies that skill definitions and instruction files are compatible with current versions of host AI tools (Copilot, Claude Code, Cursor). Detects deprecated fields, removed features, breaking API changes, and proposes migration patches aligned with current standards.

## When to Use This Skill

This skill activates when:
- An AI tool is upgraded (new Copilot extension version, Claude Code update, etc.)
- A user reports "skill stopped working after update"
- As part of periodic health checks (recommended: after each tool update)

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to repository to check |
| tool_versions | object | no | Current tool versions (auto-detected if omitted) |
| check_providers | string[] | no | Providers to check: "copilot", "claude", "cursor" (default: all detected) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| compat_report | text | Compatibility assessment per provider |
| breaking_changes | object[] | Issues that will cause failures |
| deprecation_warnings | object[] | Issues that will break in future versions |
| migration_patches | file[] | Proposed file patches to resolve issues |

## Tools Required

- File system read (scan configs and detect tool versions)
- Web/documentation access (check known deprecations)
- File system write (generate patches)

## Behavior

### Steps

1. **Detect Environment:**
   - Identify installed AI tool versions:
     - VS Code Copilot extension version
     - Claude Code CLI version
     - Cursor editor version
   - Load known compatibility matrix for each version

2. **Scan Configurations:**
   - For each provider, scan relevant config files
   - Extract features/fields/patterns used
   - Map each to the version that introduced/deprecated/removed it

3. **Check Copilot Compatibility:**
   - Verify skill file structure matches current spec
   - Check for deprecated `copilot-instructions` fields
   - Verify tool references match current Copilot tool API
   - Check that file placement matches expected paths

4. **Check Claude Compatibility:**
   - Verify CLAUDE.md structure matches current expectations
   - Check for deprecated AGENTS.md patterns
   - Verify skill format aligns with current Claude skill spec
   - Check for removed/renamed configuration fields

5. **Check Cursor Compatibility:**
   - Verify .mdc frontmatter uses current schema
   - Check for deprecated glob patterns or fields
   - Verify rule format matches current Cursor parser

6. **Classify Issues:**
   - **Breaking:** Will cause immediate failure (error level)
   - **Deprecated:** Works now but will break in next version (warning level)
   - **Suboptimal:** Works but not using best available feature (info level)

7. **Generate Migration Patches:**
   - For each breaking/deprecated issue, propose a concrete patch
   - Patches must conform to current standards (read `.framework/standards.md`)
   - Include before/after comparison
   - Note any behavioral changes from migration

### Constraints

- NEVER auto-apply patches without explicit user consent
- ALWAYS verify that proposed patches don't introduce new anti-patterns
- Compatibility checks MUST be evidence-based (cite version number and changelog)
- NEVER fabricate version numbers or deprecation dates — use verified sources only

### Error Handling

- If tool version can't be detected: Ask user to provide, or check all recent versions
- If compatibility matrix is incomplete: Report as "unknown compatibility" (not "compatible")
- If migration would change skill behavior: Flag clearly — "this patch changes behavior: [description]"

## Examples

### Example 1: Post-update compatibility check

**Output:**
```
## Compatibility Report

### Copilot (v1.250.0) — 1 breaking, 1 deprecated
❌ BREAKING: .github/skills/deploy/SKILL.md
   Field `activation_event` removed in v1.248.0
   Fix: Replace with `trigger.condition` field
   Patch: [view patch]

⚠️ DEPRECATED: .github/copilot-instructions.md
   Section header format `### Section` deprecated in favor of `## Section`
   Will break in: v1.260.0 (estimated)
   Patch: [view patch]

### Claude Code (v2.3.0) — compatible ✅
   No issues detected. All configs use current format.

### Cursor (v0.50.0) — 1 deprecated
⚠️ DEPRECATED: .cursor/rules/testing.mdc
   Frontmatter field `alwaysApply` renamed to `always_apply` in v0.48.0
   Currently both accepted; old name will be removed in v0.52.0
   Patch: [view patch]
```


