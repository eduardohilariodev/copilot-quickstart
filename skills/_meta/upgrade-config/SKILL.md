---
name: upgrade-config
description: >
  Migrate AI configuration files when upgrading host tools or standards
  versions — parse changelogs, map impact, and produce versioned patches.
  Use when upgrading config, migrating to a new standards version, or when
  configs break after tool updates.
version: 1.0.0
portability: requires-framework
---

# upgrade-config
## Description

Helps migrate AI configuration files when upgrading host tools (Copilot, Claude Code, Cursor) or when standards evolve. Parses changelogs and deprecation notices, maps impact to existing configs, and produces versioned migration patches that maintain standards compliance.

## When to Use This Skill

This skill activates when:
- A user reports "things broke after update" or asks "how to upgrade configs"
- A new version of Copilot/Claude/Cursor is released with breaking changes
- The the standards in .framework/standards.md are bumped to a new major/minor version

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to repository to migrate |
| upgrade_type | string | yes | "tool-upgrade" (provider version) or "standards-upgrade" (quickstart version) |
| from_version | string | no | Current version (auto-detected if omitted) |
| to_version | string | no | Target version (default: latest) |
| provider | string | no | Which provider is upgrading: "copilot", "claude", "cursor" (required for tool-upgrade) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| migration_plan | text | Step-by-step upgrade plan |
| patches | file[] | File patches to apply |
| breaking_changes | object[] | Changes that alter behavior (need human review) |
| verification_steps | string[] | How to verify migration succeeded |

## Tools Required

- File system read (existing configs, changelogs)
- File system write (generate patches)
- Web/docs access (fetch provider changelogs)
- Source-of-truth access (for standards upgrades)

## Behavior

### Steps

1. **Assess Current State:**
   - Identify current versions (tool versions, standards version in provenance headers)
   - Inventory all config artifacts that may need migration
   - Snapshot current state for rollback reference

2. **Load Migration Knowledge:**

   For **tool upgrades:**
   - Fetch provider changelog between from_version and to_version
   - Identify: removed features, renamed fields, changed behaviors, new capabilities
   - Map each change to affected config patterns

   For **standards upgrades:**
   - Diff `.framework/standards.md` between versions
   - Identify: new required sections, changed thresholds, deprecated patterns, new rules
   - Map each change to affected artifact types

3. **Impact Analysis:**
   For each change, determine:
   - Which files in the target repo are affected
   - Whether the change is: auto-fixable, needs human decision, or informational
   - What the behavioral impact is (same behavior, enhanced, or breaking)

4. **Generate Migration Plan:**
   Ordered list of steps:
   ```
   1. [AUTO] Rename field X → Y in .cursor/rules/*.mdc
   2. [AUTO] Add new required section "Security" to AGENTS.md
   3. [REVIEW] Decide: new "streaming" feature — enable or keep disabled?
   4. [MANUAL] Update CI workflow to use new copilot action version
   ```

5. **Generate Patches:**
   - For auto-fixable changes: produce complete file patches
   - For review-needed changes: produce patches with `<!-- REVIEW: ... -->` markers
   - For manual changes: produce instructions only

6. **Generate Verification Steps:**
   - Run evaluate-config after applying patches
   - Run check-compatibility to confirm zero breaking issues
   - Specific behavioral tests if applicable ("verify skill X still triggers")

### Constraints

- NEVER auto-apply breaking changes without human review
- ALWAYS preserve behavioral intent even when syntax changes
- ALWAYS generate a rollback plan (or note that patches are reversible)
- Migration patches MUST pass lint-instructions after application
- For standards upgrades: new rules that are additive should be clearly labeled (not confused with fixes to existing violations)

### Error Handling

- If version detection fails: Ask user for from/to versions explicitly
- If changelog is unavailable: Work from observable differences between versions
- If a change is ambiguous: Flag as "needs human decision" rather than guessing
- If patches conflict with local overrides: Preserve overrides, flag for review

## Examples

### Example 1: Standards upgrade (v1.0 → v1.1)

**Output:**
```
## Migration Plan: Standards v1.0.0 → v1.1.0

### Changes in v1.1.0
- NEW: Required "Error Handling" section in AGENTS.md
- CHANGED: Skill size threshold 200 → 180 lines
- NEW: Provenance metadata now requires input_hash field
- DEPRECATED: `activation_event` field in skills (use `trigger.condition`)

### Impact on acme/web-platform
- AGENTS.md: needs new "Error Handling" section [AUTO-FIXABLE]
- 2/5 skills: need provenance update [AUTO-FIXABLE]  
- 1/5 skills: uses deprecated activation_event [AUTO-FIXABLE]
- 0/5 skills: exceed new 180-line threshold ✅

### Patches Generated
1. AGENTS.md — add Error Handling section (from template)
2. skills/create-tests/SKILL.md — update provenance + rename field
3. skills/deploy/SKILL.md — update provenance + rename field

### Verification
1. Run: evaluate-config → expect score ≥ previous
2. Run: check-compatibility → expect 0 breaking issues
3. Run: lint-instructions → expect 0 new errors
```


