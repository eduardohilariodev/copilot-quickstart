<!-- Instructions for GitHub Copilot working on copilot-quickstart itself. -->

# Copilot Instructions — copilot-quickstart

## Context

This is a meta-copilot: standards corpus + meta-skills + CLI wizard that generates AI configurations for any Git repository. Two layers: Framework (.framework/), Content (skills/, agents/, tools/).

## Code Style

- Write all JavaScript as pure ESM with `.mjs` extension.
- Use `@clack/prompts` and `picocolors` for CLI UI — no other runtime dependencies.
- Export pure functions from each module — avoid module-level side effects.
- Name identifiers in kebab-case: meta-skills as `verb-noun`, default skills as `noun-noun` or `verb-ing-domain`.
- Use `{{placeholder}}` syntax in templates — never add a template engine.

## Writing Skills

- Structure every SKILL.md with: Description, Trigger, Inputs, Behavior (Steps + Constraints), Examples, Metadata.
- Write in imperative mood with positive language ("Do X" not "Don't forget to X").
- Keep each instruction atomic — one rule per bullet, testable in isolation.
- Respect size budgets: SKILL.md ≤200 lines, instructions ≤80 lines, AGENTS.md ≤120 lines.
- Provide at least one concrete example per skill showing input → output.

## Architecture

- Treat `.framework/` as immutable — never auto-modify this path.
- Read Layer 1 (Framework) to produce or repair target output artifacts.
- Route all generated file writes through staging (`ai-setup/`) — never overwrite target files directly.
- Keep the two-layer separation strict: framework defines, content executes and renders.

## Protected Paths

Do not modify without explicit human approval:

- `.framework/` — canonical specs and schemas
- `examples/target-repo/` — curated reference output
- `LICENSE`

## Commands

| Task | Command |
|------|---------|
| Run CLI wizard | `node tools/onboard/bin/cli.mjs` |
| Run doctor | `node tools/onboard/bin/cli.mjs doctor` |
| Apply staged files | `node tools/onboard/bin/cli.mjs apply` |
| Reset staging | `node tools/onboard/bin/cli.mjs reset` |
| Install deps | `cd tools/onboard && npm install` |
| Validate artifacts | `npm run validate` |

## Workflow

- Run `npm run validate` after any artifact change to confirm compliance.
- Commit with descriptive messages following conventional commits (`feat:`, `fix:`, `docs:`).
- Test CLI changes by running the wizard against `examples/target-repo/`.
