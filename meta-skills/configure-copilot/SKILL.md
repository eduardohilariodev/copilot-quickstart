---
name: configure-copilot
description: >
  Configure all Copilot features for a repository: scoped instructions,
  IDE settings, CLI environment, and prompt file scaffolding. Use when
  setting up or optimizing Copilot for a repo.
version: 1.0.0
---

# configure-copilot

## Description

Configure all Copilot features for a repository: scoped instructions with `applyTo`, IDE settings for instruction discovery, CLI environment knobs, and prompt file scaffolding. The "tell me what Copilot can do here and set it up correctly" entry point.

## When to Use This Skill

This skill activates when:
- User asks to configure or optimize Copilot for their repo
- User wants scoped/path-specific instructions
- User asks about Copilot features, `applyTo`, or instruction discovery
- After initial onboarding, to fine-tune Copilot-specific settings

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo_profile | object | yes | repo-profile.yml content |
| existing_configs | object | no | Already-detected AI configs |

## References

- `source-of-truth/copilot-config-features.md` — canonical Copilot feature reference
- `source-of-truth/design-standards.md` — instruction size/format constraints
- `source-of-truth/maintenance-principles.md` — size thresholds

## Tools Required

- File system (read repo structure, write instruction files)

## Behavior

### Phase 1: Assess Current State

1. Read `repo-profile.yml` for: languages, frameworks, architecture, providers.
2. Check if `copilot` is in providers list (if not, ask if user wants Copilot config).
3. Scan for existing Copilot configuration:
   - `.github/copilot-instructions.md` (repo-wide)
   - `.github/instructions/*.instructions.md` (path-specific)
   - `.vscode/settings.json` (instruction discovery)
   - `.github/prompts/*.prompt.md` (prompt files)
4. Report what's present vs what's missing.

### Phase 2: Propose Instruction Architecture

Based on repo profile, recommend a set of path-specific instructions:

**Always recommend:**
- Repo-wide `copilot-instructions.md` (if missing)

**Recommend based on detection:**
| Detected | Recommend |
|----------|-----------|
| TypeScript/JavaScript files | `typescript.instructions.md` |
| `apps/web/`, `src/components/`, React/Vue/Svelte | `frontend.instructions.md` |
| `apps/api/`, `src/server/`, Express/NestJS/FastAPI | `backend.instructions.md` |
| Test files detected | `tests.instructions.md` |
| `.github/workflows/`, Terraform, Docker | `infra.instructions.md` |

**For monorepos, also consider:**
- Per-package instructions with `applyTo: "packages/<name>/**"`
- Shared conventions in repo-wide, package-specific in path-specific

### Phase 3: Customize applyTo Patterns

For each recommended instruction file:
1. Read the actual directory structure of the target repo.
2. Adjust `applyTo` patterns to match real paths:
   - E.g., if frontend lives in `packages/ui/src/`, use `packages/ui/**/*.tsx`
   - If API is at `services/api/`, use `services/api/**`
3. Verify patterns don't overlap excessively (warn if same file matches 3+ instruction sets).

### Phase 4: IDE & CLI Configuration

1. **VS Code settings:**
   - Check if `.vscode/settings.json` exists
   - Propose adding `chat.instructionsFilesLocations` pointing at `.github/instructions/`
   - Show the exact JSON to add (merge, don't overwrite)

2. **Copilot CLI (if user uses it):**
   - Suggest `COPILOT_SKILLS_DIRS` env var pointing at their skills directory
   - Explain `/context` and `/compact` commands for token management
   - Offer `allowed_urls` config if they want web_fetch for docs

### Phase 5: Generate & Explain

1. Generate each recommended file from templates (with repo-specific `applyTo` patterns).
2. Stage in `ai-setup/.github/instructions/` (if using staged workflow) or write directly.
3. For each generated file, briefly explain:
   - What it does
   - Which files it affects
   - What Copilot clients honor it (Chat, Cloud Agent, Code Review)
4. Explain what instructions CANNOT do (completions, permissions) to set expectations.

### Constraints

- Keep each instruction file ≤40 lines (per maintenance-principles.md)
- Keep repo-wide instructions ≤80 lines / ~2000 tokens
- Never duplicate rules across repo-wide and path-specific files
- Path-specific files should ADD to repo-wide, not repeat it
- Always include `description` and `applyTo` in YAML frontmatter
- Verify generated patterns actually match existing files in the repo

### Error Handling

- If Copilot is not in providers: ask before generating Copilot-specific config
- If existing instructions are oversized: suggest running `refactor-instructions` first
- If `.vscode/settings.json` has conflicting settings: show diff, don't overwrite

## Examples

### Example 1: TypeScript monorepo with React frontend

**Repo profile:** TypeScript, React, NestJS, monorepo (turborepo), `apps/web` + `apps/api`

**Generated set:**
```
.github/copilot-instructions.md          (repo-wide: conventions, commands)
.github/instructions/typescript.instructions.md  (applyTo: "**/*.ts,**/*.tsx")
.github/instructions/frontend.instructions.md    (applyTo: "apps/web/**")
.github/instructions/backend.instructions.md     (applyTo: "apps/api/**")
.github/instructions/tests.instructions.md       (applyTo: "**/*.test.*,**/*.spec.*")
.vscode/settings.json                    (instruction discovery enabled)
```

### Example 2: Python API (simple)

**Repo profile:** Python, FastAPI, monolith

**Generated set:**
```
.github/copilot-instructions.md          (repo-wide)
.github/instructions/tests.instructions.md       (applyTo: "**/test_*,**/*_test.py")
.github/instructions/infra.instructions.md       (applyTo: "Dockerfile*,.github/workflows/**")
.vscode/settings.json                    (instruction discovery enabled)
```


