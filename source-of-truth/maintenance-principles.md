# Maintenance Principles

> Version: 1.0.0  
> Status: Stable  
> Last updated: 2026-05-04

## Purpose

This document defines **how AI configurations are maintained over time** — the lifecycle, hygiene rules, and operational patterns that prevent entropy. Bootstrap (creation) is covered by other standards; this document covers everything after initial generation.

---

## Core Laws of Configuration Maintenance

### 1. Progressive Disclosure Over Giant Files

Root config files (AGENTS.md, CLAUDE.md, copilot-instructions) MUST remain minimal and high-signal. Details belong in focused, linked documents.

**Thresholds:**
- Root instruction files: ≤ 80 lines / ~2000 tokens
- AGENTS.md: ≤ 120 lines (link to architecture docs for detail)
- CLAUDE.md: ≤ 150 lines (may include project context)
- Individual `.cursor/rules/*.mdc`: ≤ 40 lines

**When a file exceeds its threshold:**
1. Identify sections that serve a subset of tasks (not universal)
2. Extract into a focused child document (e.g., `docs/testing-conventions.md`)
3. Replace in root with a one-line reference or brief summary + link

```markdown
# ✅ Good: progressive disclosure
## Testing
See [testing conventions](docs/testing-conventions.md) for full details.
Run tests: `pnpm test`. Require 80% coverage for new code.

# ❌ Bad: everything inline
## Testing
Write unit tests using Vitest...
(40 more lines of testing rules)
```

### 2. Modular Skills Over Bloated Instructions

Skills MUST be small, workflow-focused bundles that load only when needed.

**Thresholds:**
- SKILL.md: ≤ 200 lines
- Single responsibility: one skill = one capability
- If a skill has more than 8 steps, it's a workflow and should decompose

**Decomposition triggers:**
- Skill handles multiple unrelated concerns → split into focused skills
- Skill exceeds 200 lines → extract reference material into linked docs
- Skill duplicates logic from another skill → extract shared skill

### 3. Hard Size Thresholds as Forcing Functions

Size limits are not suggestions — they are **circuit breakers** that force structural improvement.

| Artifact | Max Lines | Max Tokens | Action When Exceeded |
|----------|-----------|------------|---------------------|
| copilot-instructions.md | 80 | 2000 | Extract to child docs |
| AGENTS.md | 120 | 3000 | Link to architecture docs |
| CLAUDE.md | 150 | 4000 | Progressive disclosure |
| SKILL.md | 200 | 5000 | Decompose skill |
| .cursor/rules/*.mdc | 40 | 500 | Split into focused files |
| agent-definition.agent.md | 80 | 2000 | Decompose agent |

### 4. Configuration as Code Lifecycle

Every config artifact follows a lifecycle:

```
DRAFT → ACTIVE → REVIEW → KEEP / MERGE / DEPRECATE → ARCHIVE
```

**Stages:**
- **Draft:** Newly generated, not yet validated in production use
- **Active:** Reviewed, merged, actively influencing agent behavior
- **Review:** Scheduled periodic review (triggered by time or event)
- **Keep:** Confirmed still valuable, reset review timer
- **Merge:** Absorbed into a broader or updated skill/instruction
- **Deprecate:** Marked for removal, notice period active
- **Archive:** Moved to `deprecated/`, no longer loaded

**Review triggers:**
- Calendar-based: every 90 days for active configs
- Event-based: after model upgrades, framework updates, or team changes
- Signal-based: skill rarely/never triggers, or frequently misfires

### 5. Continuous Evaluation and Pruning

Configs that don't earn their place MUST be removed.

**Pruning criteria (remove if):**
- Skill never triggers in 90 days of active use
- Instruction duplicates model default behavior
- Rule conflicts with another rule (and conflict was resolved elsewhere)
- Referenced tools/commands no longer exist in the repo
- Skill has been superseded by a more general or updated alternative

**Pruning process:**
1. Flag as candidate (automated detection)
2. Verify with maintainer (human decision)
3. Add deprecation notice (7-day minimum for team-shared configs)
4. Move to `deprecated/` directory
5. Remove references from agents and instruction files

### 6. Grounded in Explicit Standards

Maintenance tools MUST:
- Read `source-of-truth/*.md` for every operation
- Never infer or invent style from a single repo instance
- Always cite which standard justifies a proposed change
- Refuse to make changes that violate standards

---

## Operational Patterns

### Pattern: The Maintenance Cycle

```
┌─────────────────────────────────────────────────┐
│  1. MEASURE (health-dashboard, audit-skills)    │
│     ↓                                           │
│  2. IDENTIFY (lint-instructions, detect-drift)  │
│     ↓                                           │
│  3. PROPOSE (refactor-instructions, prune)      │
│     ↓                                           │
│  4. REVIEW (human approves/rejects)             │
│     ↓                                           │
│  5. APPLY (automated or manual)                 │
│     ↓                                           │
│  6. VALIDATE (evaluate-config, check-policy)    │
└─────────────────────────────────────────────────┘
```

### Pattern: Incremental Refactoring

Maintenance tools MUST prefer small, reviewable changes:
- One file split per PR (not "refactor everything")
- One skill deprecation per change
- One drift fix at a time

This ensures humans can review and accept/reject without understanding a massive diff.

### Pattern: Template-Driven Fixes

When proposing fixes, maintenance tools:
- Instantiate from `templates/` (consistency)
- Never invent new section names or layouts
- Preserve local overrides marked with `<!-- LOCAL OVERRIDE -->`
- Add provenance metadata to generated replacements

### Pattern: Eval Hooks

After any maintenance change:
- Update or add evaluation criteria in the affected artifact
- Run `evaluate-config` to confirm compliance score didn't drop
- Add regression test if the change fixes a specific failure mode

---

## Deprecation Protocol

### For Skills

```markdown
<!-- DEPRECATED: 2026-05-04 -->
<!-- REASON: Superseded by frontend-testing-v2 -->
<!-- REMOVAL DATE: 2026-06-04 -->
<!-- MIGRATION: Use meta-skills/create-skill to generate replacement -->
```

### For Instructions

```markdown
<!-- DEPRECATED SECTION: will be removed after 2026-06-04 -->
<!-- Replaced by: docs/typescript-style.md linked from AGENTS.md -->
```

### For Agents

```yaml
# DEPRECATED: Use code-reviewer-v2 instead
# Removal date: 2026-06-04
status: deprecated
successor: code-reviewer-v2
```

---

## Integration with CI/CD

Maintenance checks CAN be automated in CI:

```yaml
# Example: GitHub Actions maintenance check
- name: Config health check
  run: |
    # Verify no file exceeds thresholds
    # Verify no deprecated configs past removal date
    # Verify no drift between provider configs
```

Maintenance tools SHOULD produce machine-readable output (JSON) alongside human-readable reports for CI integration.
