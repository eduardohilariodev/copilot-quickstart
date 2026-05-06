---
name: create-instructions
description: >
  Generate provider-specific instruction files for a target repository.
  Use when creating AI instructions, generating copilot-instructions,
  or setting up CLAUDE.md.
version: 1.0.0
portability: requires-framework
---

# create-instructions

## Description

Generates provider-specific instruction files (`.github/copilot-instructions.md`, `CLAUDE.md`, or `.cursor/rules/*.mdc`) for a target repository. Scans the repo to ground instructions in actual code, applies prompt-engineering best practices, and ensures compliance with design standards.

## When to Use This Skill

This skill activates when:
- The user requests creation of AI instruction files for a repo
- The user says "create instructions", "generate copilot instructions", "set up CLAUDE.md"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to the target repository |
| providers | string[] | no | Which providers to generate for (default: all detected) |
| focus_areas | string[] | no | Specific topics to prioritize (e.g., ["testing", "security"]) |
| repo_profile | object | no | Pre-filled repo profile (skips auto-scan if provided) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| instruction_files | file[] | Generated instruction files per provider |
| validation_report | text | Quality and compliance check results |
| drift_warnings | text[] | Warnings about potential drift if multiple providers |

## Tools Required

- File system read (scan repo structure, package.json, configs)
- File system write (output instruction files)
- Command execution (run build/test to verify commands)
- Schema validation

## Behavior

### Steps

0. **Discover layout** — Read `.ai/system/standards.json` and `.ai/system/standards-summary.md` in the target repo (if they exist). Use the `local` block to determine where to place artifacts and the `upstream` block for provenance metadata. If the capsule is missing, fall back to conventional paths (AGENTS.md, .github/copilot-instructions.md, .github/skills/).
1. **Scan Target Repo:**
   - Read `package.json`, `Cargo.toml`, `pyproject.toml`, etc. for stack detection
   - Identify test runner, linter, formatter from config files
   - Scan directory structure for architecture patterns
   - Look for existing instruction files (to update, not duplicate)

2. **Build Repo Profile:**
   - Construct a `repo-profile.schema.json`-compliant profile
   - Infer risk level from dependencies and deployment config
   - Identify protected paths from `.gitignore`, CI config, etc.

3. **Load Standards:**
   - Read all `.framework/standards.md` documents
   - Determine applicable rules based on repo profile
   - Calculate token budget per provider

4. **Generate Canonical Rules:**
   - Produce a provider-agnostic rule set covering:
     - Code style (from detected linter/formatter config)
     - Testing (from detected test framework)
     - Git workflow (from branch protection, CI config)
     - Architecture (from detected patterns)
     - Security (from risk level)
   - Each rule follows prompt-engineering guide format

5. **Render Per-Provider:**
   - **Copilot:** Output `.github/copilot-instructions.md` with markdown sections
   - **Claude:** Output `CLAUDE.md` with project context + rules
   - **Cursor:** Output `.cursor/rules/*.mdc` files with frontmatter globs
   - Apply token budget constraints per provider
   - Document any lossy mappings

6. **Validate:**
   - Check against `.framework/schemas/instructions.schema.json`
   - Verify all referenced paths/commands exist in target repo
   - Scan for anti-patterns
   - Check token budget compliance

7. **Report:**
   - Output files with provenance metadata
   - List any cross-provider drift risks
   - Provide recommendations for manual review items

### Constraints

- Never hard-code artifact paths. Derive all output locations from `.ai/system/standards.json` when available, falling back to standard defaults.
- NEVER include rules the model already follows by default
- NEVER reference files or commands that don't exist in the target repo
- ALWAYS verify build/test commands actually work before including them
- ALWAYS stay within provider-specific token budgets
- Generated instructions MUST NOT conflict with each other
- If a rule can't be accurately mapped to a provider, log a drift warning rather than producing a lossy mapping silently

### Error Handling

- If repo has no detectable config files: Ask user for manual stack info
- If build/test commands fail: Include them with a "⚠️ verify" note
- If existing instructions are found: Offer to merge or replace (never silently overwrite)
- If token budget is exceeded: Prioritize by: security > correctness > style

## Examples

### Example 1: TypeScript Next.js project

**Input:**
```
target_repo_path: ./my-nextjs-app
providers: ["copilot", "claude"]
```

**Detected:** Next.js 14, TypeScript, Vitest, ESLint, Prettier, Prisma, Vercel deployment

**Output (copilot-instructions.md excerpt):**
```markdown
## Code Style
Use TypeScript strict mode. No `any` types without JSDoc justification.
Use server components by default; add "use client" only for interactivity.
Prefer named exports over default exports.

## Testing
Write tests using Vitest with describe/it blocks.
Co-locate test files: `component.test.tsx` next to `component.tsx`.
Mock Prisma client in tests using `vitest-mock-extended`.

## Database
Create Prisma migrations for all schema changes.
Never modify migration files after they've been applied.

## Security
Validate all API inputs using zod schemas.
Use server actions for mutations; never expose internal IDs to clients.
```


