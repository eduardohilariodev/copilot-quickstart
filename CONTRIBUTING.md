# Contributing to copilot-quickstart

## Before You Start

1. Read `.framework/standards.md` to understand artifact boundaries
2. Read `.framework/standards.md` for naming rules
3. Run `npm run validate` to see the baseline state

## Two-Layer Model

Every change falls into one of two layers:

| Layer | Directories | Rules |
|-------|-------------|-------|
| 1. Framework | `.framework/` | Immutable without discussion. Requires versioning. |
| 2. Content | `skills/`, `agents/`, `tools/` | Must conform to Layer 1. Read standards before editing. |

> `examples/target-repo/` is reference output — manually curated to match generated output.

## Making Changes

- **One logical change per PR** — one file split, one skill addition, one rename.
- **Cite the standard** justifying your change in the PR description.
- **Run validation** before pushing: `npm run validate`
- **Stay within size budgets:** SKILL.md ≤200 lines, instructions ≤80 lines, AGENTS.md ≤120 lines.

## Adding a Meta-Skill

1. Name it `verb-noun` (e.g., `audit-configs`, `sync-providers`).
2. Create `skills/_meta/<name>/SKILL.md` using `tools/onboard/templates/SKILL.md` as the base.
3. Include required sections: Description, Trigger, Inputs, Behavior (Steps + Constraints).
4. Follow `.framework/standards.md` for all instruction text.

## Adding a Default Skill

1. Name it per `.framework/standards.md` (prefer `verb-ing-domain`).
2. Create `skills/_default/<name>/SKILL.md`.
3. Use `{{placeholder}}` syntax for customizable fields — no template engine.

## Protected Paths

Do not modify without explicit discussion:

- `.framework/` — canonical specs and schemas
- `examples/target-repo/` — curated reference
- `LICENSE`

## Questions?

Open an issue or read `AGENTS.md` for architectural context.
