# sync-config

## Description

Synchronizes AI configuration across multiple providers (GitHub Copilot, Claude/Anthropic, Cursor) from a single canonical source. Detects drift between providers, produces normalized diffs, and renders provider-specific output with explicit documentation of lossy mappings.

## Trigger

This skill activates when:
- The user asks to sync, harmonize, or port configs between AI providers
- The user says "sync config", "port to claude", "update cursor rules"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| source_provider | string | no | Canonical source provider (default: auto-detect from most complete) |
| target_providers | string[] | yes | Providers to sync to: "copilot", "claude", "cursor" |
| target_repo_path | string | no | Path to target repo (default: cwd) |
| strategy | string | no | "overwrite", "merge", or "diff-only" (default: "diff-only") |
| preserve_local | boolean | no | Keep provider-specific local overrides (default: true) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| synced_files | file[] | Updated config files per target provider |
| diff_report | text | What changed per provider |
| lossy_mappings | object[] | Features that couldn't map cleanly between providers |
| drift_report | text | Current state of divergence before sync |

## Tools Required

- File system read (read existing configs)
- File system write (output synced configs)
- Diff generation

## Behavior

### Steps

1. **Discover Existing Configs:**
   - Scan for all provider configs in target repo:
     - Copilot: `.github/copilot-instructions.md`
     - Claude: `CLAUDE.md`, `AGENTS.md`
     - Cursor: `.cursor/rules/*.mdc`
   - Build inventory of what exists per provider

2. **Normalize to Canonical Model:**
   - Parse each discovered config into a normalized intermediate representation:
     ```
     {
       sections: [{ name, rules: [{ text, priority, scope, examples }] }],
       context: { project_info, commands, architecture },
       metadata: { provider, last_modified, token_count }
     }
     ```
   - Identify the canonical source (most complete, or user-specified)

3. **Detect Drift:**
   - Compare normalized representations across providers
   - Classify differences:
     - **Missing:** Rule exists in source but not target
     - **Extra:** Rule exists in target but not source (local override?)
     - **Diverged:** Same concept, different wording/specificity
     - **Incompatible:** Provider-specific feature with no equivalent

4. **Plan Sync:**
   - For each target provider, determine:
     - Rules to add (from canonical source)
     - Rules to update (diverged wording)
     - Rules to preserve (local overrides, if preserve_local=true)
     - Rules to flag (incompatible features)
   - Calculate resulting token budget per provider

5. **Render Per-Provider:**

   **Copilot (`.github/copilot-instructions.md`):**
   - Markdown with `##` section headers
   - Token budget: ~2000 tokens
   - No frontmatter
   - Flat rule list per section

   **Claude (`CLAUDE.md`):**
   - Project context section (commands, structure)
   - Rules section with clear headers
   - Token budget: ~8000 tokens (can be more detailed)
   - Include "why" context where helpful

   **Cursor (`.cursor/rules/*.mdc`):**
   - Separate `.mdc` files per topic
   - YAML frontmatter with `description` and `globs`
   - Token budget: ~500 tokens per file
   - Glob-scoped activation

6. **Handle Lossy Mappings:**
   - Document any feature that can't map cleanly:
     - Cursor glob-scoping → no equivalent in Copilot (becomes universal rule)
     - Claude project context → no direct equivalent in Cursor
     - Copilot skill references → no equivalent in others
   - Never silently drop features — always log in lossy_mappings output

7. **Output:**
   - Write synced files (or preview if strategy is "diff-only")
   - Generate diff report showing all changes
   - Include provenance metadata in generated files
   - Mark generated sections clearly:
     ```markdown
     <!-- SYNCED FROM: .github/copilot-instructions.md | standards v1.0.0 | 2026-05-04 -->
     ```

### Constraints

- NEVER silently drop rules that can't be mapped (always report)
- NEVER overwrite local overrides without explicit user consent
- ALWAYS preserve provider-specific features that have no canonical equivalent
- ALWAYS include provenance markers in generated output
- Strategy "diff-only" MUST NOT modify any files (preview only)
- Token budgets MUST be respected per provider

### Error Handling

- If no source config exists: Cannot sync — suggest using create-instructions first
- If all configs are empty: Nothing to sync — suggest create-instructions
- If conflict between local override and canonical: Present both, ask user to decide
- If token budget exceeded after sync: Prioritize rules by: security > correctness > style, log dropped rules

## Provider Capability Matrix

| Feature | Copilot | Claude | Cursor |
|---------|---------|--------|--------|
| File-scoped rules | ❌ (global) | ❌ (global) | ✅ (globs) |
| Project context section | ❌ | ✅ | ❌ |
| Skill references | ✅ | ❌ | ❌ |
| Multiple rule files | ❌ (single) | ❌ (single) | ✅ (per-topic) |
| Token budget | ~2000 | ~8000 | ~500/file |
| Structured metadata | ❌ | ❌ | ✅ (YAML frontmatter) |

## Examples

### Example 1: Sync Copilot → Claude + Cursor

**Input:**
```
source_provider: copilot
target_providers: ["claude", "cursor"]
strategy: diff-only
```

**Output (drift report excerpt):**
```
## Drift Report

Source: .github/copilot-instructions.md (14 rules)
Target: CLAUDE.md (8 rules) — 6 missing, 2 diverged
Target: .cursor/rules/ (3 files, 10 rules) — 4 missing, 1 diverged

### Missing in CLAUDE.md:
- "Use Vitest for unit tests with describe/it blocks"
- "Mock external services using vi.mock()"
- ... (4 more)

### Lossy Mappings:
- Copilot rule "Run tests before committing" → Cursor: no enforcement mechanism
  (will include as advisory rule in .cursor/rules/git.mdc)
```

## Metadata

```yaml
name: sync-config
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
```
