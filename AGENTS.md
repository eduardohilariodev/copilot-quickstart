# AGENTS.md — copilot-quickstart

<!--
  This file provides context to AI coding agents working on THIS repository.
  It describes architecture, conventions, and non-obvious decisions.
  Follows: source-of-truth/design-standards.md (Documentation rules)
-->

## Project Overview

A project-agnostic meta-copilot: standards corpus + meta-skills + CLI wizard that scans any Git repo and generates research-backed AI configurations (agents, skills, instructions) for Copilot, Claude, and Cursor.

## Architecture

- **Type:** Monorepo-like (single repo, multiple concerns)
- **Primary languages:** Markdown, JavaScript (ESM), JSON Schema, YAML
- **Key tools:** Node.js, @clack/prompts, picocolors

### Three-Layer System

```
Layer 1: STANDARDS (read-only specs)     → source-of-truth/ + schemas/
Layer 2: ORCHESTRATOR (meta-skills + CLI + templates)
                                         → meta-skills/ + tools/ + templates/
Layer 3: TARGET OUTPUT (what users get)  → examples/target-repo/ (reference)
                                           + your actual target repo
```

- Layer 1 is **immutable** — never auto-modify source-of-truth/ or schemas/
- Layer 2 reads Layer 1 and produces/repairs Layer 3 artifacts
- Layer 3 exists only in target repos (examples/target-repo/ is the reference)

## Directory Structure

```
├── source-of-truth/      # Canonical specs (DO NOT MODIFY without discussion)
├── schemas/              # JSON Schema contracts (versioned with standards)
├── templates/            # Ready-to-use templates ({{placeholder}} syntax)
│   ├── skills/           # 15 starter skill SKILL.md files
│   ├── agents/           # 5 agent definition YAMLs
│   └── instructions/     # 5 path-specific instruction templates
├── meta-skills/          # 19 skills that create/maintain configurations
├── tools/onboard/        # Interactive CLI wizard (Node.js ESM)
│   ├── bin/cli.mjs       # Entry point + command routing
│   └── lib/              # Modules: detect, plan, generate, doctor, constants
└── examples/target-repo/ # Complete example of generated output
```

## Development Commands

| Task | Command |
|------|---------|
| Run CLI wizard | `node tools/onboard/bin/cli.mjs` |
| Run doctor | `node tools/onboard/bin/cli.mjs doctor` |
| Apply staged files | `node tools/onboard/bin/cli.mjs apply` |
| Reset staging | `node tools/onboard/bin/cli.mjs reset` |
| Install CLI deps | `cd tools/onboard && npm install` |

## Key Conventions

### Naming

- **Meta-skills:** `verb-noun` pattern (e.g., `create-skill`, `audit-skills`, `detect-drift`)
- **Starter skills:** Mixed — `noun-noun` or `verb-noun` (e.g., `git-commit-message`, `test-generator`)
- **Agent definitions:** `role-scope` (e.g., `onboard-diagnose`, `coding-refactor`)
- **All identifiers:** kebab-case, lowercase, hyphens only
- See `source-of-truth/naming-conventions.md` for full rules

### Code Organization

- CLI is pure ESM (`.mjs` extension, `"type": "module"`)
- Zero external deps for core logic; only `@clack/prompts` + `picocolors` for UI
- Each CLI module exports pure functions — no module-level side effects
- Templates use `{{placeholder}}` syntax (no template engine — string replacement)

### Writing Skills and Templates

- Follow `source-of-truth/prompt-engineering-guide.md` for all instruction text
- Use imperative mood, be specific, be atomic
- SKILL.md files MUST have: Description, Trigger, Inputs, Behavior (Steps + Constraints), Examples, Metadata
- Keep within size budgets: SKILL.md ≤200 lines, instructions ≤80 lines, AGENTS.md ≤120 lines

### Error Handling

- CLI uses `@clack/prompts` cancel detection — exits gracefully on Ctrl+C
- All file writes go to staging (`ai-setup/`) — never overwrite existing files directly
- Manifest tracks profile hash — `apply` refuses if profile changed since generation

## Important Architectural Decisions

1. **Standards are immutable in this repo** — source-of-truth/ is the canonical spec. Meta-skills and templates conform to it; never the reverse. Changes to standards require explicit discussion and versioning.
2. **Staging-first generation** — the CLI never writes directly to final locations. Everything goes to `ai-setup/` with a manifest, then `apply` moves it with confirmation. This prevents data loss.
3. **Provider-agnostic canonical, per-provider rendering** — all templates and skills are written once in a generic form. The `sync-config` meta-skill renders per-provider (Copilot/Claude/Cursor) at apply time.
4. **No template engine dependency** — templates use simple `{{placeholder}}` strings replaced by the generator. This avoids adding a runtime dependency and keeps templates readable.

## Protected Paths

These paths should not be auto-modified without human review:

- `source-of-truth/` — Canonical standards (immutable)
- `schemas/` — JSON Schema contracts (versioned)
- `examples/target-repo/` — Reference output (manual curation)
- `LICENSE` — Legal

## Environment

- **Runtime:** Node.js ≥18 (ESM support required)
- **Package manager:** npm (tools/onboard/)
- **CI/CD:** None yet (see backlog P7 for validation script)

## AI Maintenance

When working on this repo:

- **Before any edit:** Read `source-of-truth/design-standards.md` to understand artifact boundaries
- **Before writing skills:** Read `source-of-truth/prompt-engineering-guide.md` for writing rules
- **Before naming anything:** Read `source-of-truth/naming-conventions.md`
- **Size check:** Verify outputs stay within budgets in `source-of-truth/maintenance-principles.md`
