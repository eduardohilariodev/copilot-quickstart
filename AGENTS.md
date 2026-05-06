# AGENTS.md — copilot-quickstart

<!--
  This file provides context to AI coding agents working on THIS repository.
  It describes architecture, conventions, and non-obvious decisions.
  Follows: .framework/standards.md (Documentation rules)
-->

## Project Overview

A project-agnostic meta-copilot: standards corpus + meta-skills + CLI wizard that scans any Git repo and generates research-backed AI configurations (agents, skills, instructions) for Copilot, Claude, and Cursor.

## Architecture

- **Type:** Monorepo-like (single repo, multiple concerns)
- **Primary languages:** Markdown, JavaScript (ESM), JSON Schema, YAML
- **Key tools:** Node.js, @inquirer/prompts, chalk, Commander.js

### Two-Layer System

```
Layer 1: FRAMEWORK (read-only specs)     → .framework/ (standards.md + schemas/)
Layer 2: CONTENT (skills + agents + CLI) → skills/ + agents/ + tools/
         TARGET OUTPUT (what users get)  → examples/target-repo/ (reference)
```

- Layer 1 is **immutable** — never auto-modify `.framework/`
- Layer 2 reads Layer 1 and produces/repairs target output artifacts
- `examples/target-repo/` is the reference for generated output

## Directory Structure

```
├── .framework/               # Canonical specs (DO NOT MODIFY without discussion)
│   ├── standards.md          # Consolidated standards (design, naming, prompts, etc.)
│   └── schemas/              # JSON Schema contracts (versioned with standards)
├── skills/
│   ├── _meta/                # Meta-skills that create/maintain configurations
│   └── _default/             # 21 starter skill SKILL.md files
├── agents/                   # 5 agent definition files
├── tools/onboard/            # Interactive CLI wizard (TypeScript ESM)
│   ├── src/cli.ts            # Entry point + command routing
│   ├── src/commands/         # Command implementations (init, plan, doctor, apply, reset)
│   ├── src/core/             # Core modules: detect, plan, generate, doctor, constants
│   └── templates/            # Generation templates (SKILL.md, AGENTS.md, etc.)
└── examples/target-repo/     # Complete example of generated output
```

## Development Commands

| Task | Command |
|------|---------|
| Run CLI (init) | `cd tools/onboard && npx tsx src/cli.ts` |
| Run init | `cd tools/onboard && npx tsx src/cli.ts init` |
| Generate plan | `cd tools/onboard && npx tsx src/cli.ts plan` |
| Run doctor | `cd tools/onboard && npx tsx src/cli.ts doctor` |
| Apply staged files | `cd tools/onboard && npx tsx src/cli.ts apply` |
| Reset staging | `cd tools/onboard && npx tsx src/cli.ts reset` |
| Install CLI deps | `cd tools/onboard && npm install` |
| Type check | `cd tools/onboard && npx tsc --noEmit` |
| Validate artifacts | `npm run validate` |

## Key Conventions

### Naming

- **Meta-skills:** `verb-noun` pattern (e.g., `create-skill`, `audit`, `drift`)
- **Starter skills:** Mixed — `noun-noun` or `verb-noun` (e.g., `git-commit`, `test-generate`)
- **Agent definitions:** `role-scope` (e.g., `onboard-diagnose`, `coding-refactor`)
- **All identifiers:** kebab-case, lowercase, hyphens only
- See `.framework/standards.md` for full naming rules

### Code Organization

- CLI is TypeScript ESM (`"type": "module"`, built with tsup)
- Runtime deps: `@inquirer/prompts` + `chalk` + `commander`
- Each CLI module exports pure functions — no module-level side effects
- Templates use `{{placeholder}}` syntax (no template engine — string replacement)

### Writing Skills and Templates

- Follow `.framework/standards.md` for all instruction text
- Use imperative mood, be specific, be atomic
- SKILL.md files MUST have: Description, Trigger, Inputs, Behavior (Steps + Constraints), Examples, Metadata
- Keep within size budgets: SKILL.md ≤200 lines, instructions ≤80 lines, AGENTS.md ≤120 lines

### Error Handling

- CLI uses `@inquirer/prompts` cancel detection — exits gracefully on Ctrl+C
- All file writes go to staging (`ai-setup/`) — never overwrite existing files directly
- `copilot-plan.md` is the exception — it writes directly to repo root as the primary user-facing output
- Manifest tracks profile hash — `apply` refuses if profile changed since generation

## Important Architectural Decisions

1. **Standards are immutable in this repo** — `.framework/` is the canonical spec. Skills and agents conform to it; never the reverse. Changes to standards require explicit discussion and versioning.
2. **Staging-first generation** — the CLI never writes directly to final locations. Everything goes to `ai-setup/` with a manifest, then `apply` moves it with confirmation. This prevents data loss.
3. **Provider-agnostic canonical, per-provider rendering** — all templates and skills are written once in a generic form. The `sync` meta-skill renders per-provider (Copilot/Claude/Cursor) at apply time.
4. **No template engine dependency** — templates use simple `{{placeholder}}` strings replaced by the generator. This avoids adding a runtime dependency and keeps templates readable.

## Protected Paths

These paths should not be auto-modified without human review:

- `.framework/` — Canonical standards and schemas (immutable)
- `examples/target-repo/` — Reference output (manual curation)
- `LICENSE` — Legal

## Environment

- **Runtime:** Node.js ≥18 (ESM support required)
- **Package manager:** npm (tools/onboard/)
- **CI/CD:** None yet (see backlog P7 for validation script)

## AI Maintenance

When working on this repo:

- **Before any edit:** Read `.framework/standards.md` to understand artifact boundaries, writing rules, naming conventions, and size budgets
