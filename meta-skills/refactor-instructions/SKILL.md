---
name: refactor-instructions
description: >
  Identify oversized or poorly-structured instruction files and apply
  progressive disclosure by extracting details into focused child
  documents. Use when cleaning up, refactoring, or slimming down configs.
version: 1.0.0
---

# refactor-instructions

## Description

Identifies oversized, mixed-concern, or poorly-structured instruction files (AGENTS.md, CLAUDE.md, copilot-instructions) and applies progressive disclosure — extracting details into focused child documents while keeping root files minimal and high-signal.

## When to Use This Skill

This skill activates when:
- An instruction file exceeds its size threshold (per maintenance-principles.md)
- A user asks to "clean up", "refactor", or "slim down" their agent/instruction config
- The health-dashboard flags a file as oversized or mixed-concern

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_file | string | yes | Path to the instruction file to refactor |
| output_dir | string | no | Directory for extracted child docs (default: `docs/`) |
| strategy | string | no | "progressive-disclosure", "section-split", or "dedup" (default: "progressive-disclosure") |
| dry_run | boolean | no | Preview changes without writing (default: true) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| refactored_root | file | Slimmed root file with links to child docs |
| extracted_docs | file[] | New focused child documents |
| change_summary | text | What was moved, merged, or deleted |
| contradictions | object[] | Detected contradictions requiring human resolution |

## Tools Required

- File system read (scan existing configs and source-of-truth)
- File system write (output refactored files)
- Diff generation (show before/after)

## Behavior

### Steps

1. **Analyze Current State:**
   - Measure file: line count, token count, section count
   - Compare against thresholds from `maintenance-principles.md`
   - Identify distinct topics/concerns within the file
   - Detect contradictory rules (same topic, conflicting guidance)

2. **Classify Content:**
   For each section/rule, classify as:
   - **Universal** — applies to every task in this repo (stays in root)
   - **Scoped** — applies to a subset of files/tasks (extract to focused doc)
   - **Redundant** — duplicates model default behavior (candidate for removal)
   - **Contradictory** — conflicts with another rule (flag for human)
   - **Vague** — not actionable or testable (flag for rewrite or removal)

3. **Plan Refactor:**
   - Keep universals in root (prioritized: security > correctness > style)
   - Group scoped rules by topic → one child doc per topic
   - Surface contradictions with both versions and ask human to choose
   - Mark redundant/vague rules for deletion (with justification)

4. **Generate Output:**
   - Rewrite root file using `templates/AGENTS.md` or `templates/copilot-instructions.md` structure
   - Create child docs with clear titles and scope declarations
   - Add links from root to child docs (one-line summary + link)
   - Include provenance metadata in all generated files

5. **Validate:**
   - Confirm refactored root is within size thresholds
   - Confirm no rules were silently dropped (all accounted for in child docs, deletions list, or contradictions list)
   - Verify all links resolve to real files

### Constraints

- NEVER silently delete rules — always account for every rule's fate
- NEVER resolve contradictions autonomously — present both and ask human
- ALWAYS preserve the user's intent even when reorganizing
- Root file MUST stay under threshold after refactoring
- Child documents follow the same prompt-engineering guide quality rules

### Error Handling

- If file is already under threshold: Report "healthy, no action needed"
- If contradictions can't be resolved: Output both with clear labels, continue with rest of refactor
- If dry_run=true: Show diff preview, write nothing

## Examples

### Example 1: Oversized AGENTS.md

**Before (145 lines, mixed concerns):**
```
# AGENTS.md
## Overview ...
## Architecture ...
## TypeScript Conventions (35 lines of detail)
## Testing Strategy (28 lines of detail)
## Git Workflow (20 lines of detail)
## Deployment ...
```

**After refactoring:**
```
# AGENTS.md (62 lines — under 120 threshold)
## Overview ...
## Architecture ...
## Conventions
See [TypeScript conventions](docs/typescript-conventions.md).
See [Testing strategy](docs/testing-strategy.md).
## Git Workflow
Trunk-based; squash merge PRs. Full guide: [git workflow](docs/git-workflow.md).
## Deployment ...
```

**Extracted:**
- `docs/typescript-conventions.md` (35 lines, focused)
- `docs/testing-strategy.md` (28 lines, focused)
- `docs/git-workflow.md` (20 lines, focused)


