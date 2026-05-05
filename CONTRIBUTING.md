# Contributing to copilot-quickstart

## Before You Start

1. Read `source-of-truth/design-standards.md` to understand artifact boundaries
2. Read `source-of-truth/naming-conventions.md` for naming rules
3. Run `npm run validate` to see the baseline state

## Three-Layer Model

Every change falls into one of three layers:

| Layer | Directories | Rules |
|-------|-------------|-------|
| 1. Standards | `source-of-truth/`, `schemas/` | Immutable without discussion. Requires versioning. |
| 2. Orchestrator | `meta-skills/`, `tools/`, `templates/` | Must conform to Layer 1. Read standards before editing. |
| 3. Target Output | `examples/target-repo/` | Reference only. Manually curated to match template output. |

## Making Changes

- **One logical change per PR** — one file split, one skill addition, one rename.
- **Cite the standard** justifying your change in the PR description.
- **Run validation** before pushing: `npm run validate`
- **Stay within size budgets:** SKILL.md ≤200 lines, instructions ≤80 lines, AGENTS.md ≤120 lines.

## Adding a Meta-Skill

1. Name it `verb-noun` (e.g., `audit-configs`, `sync-providers`).
2. Create `meta-skills/<name>/SKILL.md` using `templates/SKILL.md` as the base.
3. Include required sections: Description, Trigger, Inputs, Behavior (Steps + Constraints).
4. Follow `source-of-truth/prompt-engineering-guide.md` for all instruction text.

## Adding a Template Skill

1. Name it per `source-of-truth/naming-conventions.md` (prefer `verb-ing-domain`).
2. Create `templates/skills/<name>/SKILL.md`.
3. Use `{{placeholder}}` syntax for customizable fields — no template engine.

## Protected Paths

Do not modify without explicit discussion:

- `source-of-truth/` — canonical specs
- `schemas/` — versioned contracts
- `examples/target-repo/` — curated reference
- `LICENSE`

## Questions?

Open an issue or read `AGENTS.md` for architectural context.
