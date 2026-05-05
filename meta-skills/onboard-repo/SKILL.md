# onboard-repo

## Description

Orchestrates complete repository onboarding into copilot-quickstart. Builds/updates `repo-profile.yml`, selects strategy (greenfield vs brownfield), then calls meta-skills in sequence to produce standards-compliant, provider-ready AI configuration. Single entry point for "make this repo AI-ready."

## Trigger

- User says "onboard this repo", "set up copilot-quickstart", or "make this repo AI-ready"
- User asks to "initialize AI config" or "bootstrap agent setup"
- A newly created repository needs its first AI configuration

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo-profile.yml | file | yes | Repository profile for context detection and strategy selection |
| target_repo_path | string | yes | Path to the repository to onboard |
| providers | string[] | no | Target AI providers: "copilot", "claude", "cursor" (default: all detected) |
| strategy | string | no | "greenfield" or "brownfield" (default: auto-detect based on existing configs) |
| interactive | boolean | no | Whether to ask clarifying questions for undetectable fields (default: true) |

## Behavior

### Phase 1: Intake — Build the Repo Profile

1. **Check for existing profile:** Load and validate `repo-profile.yml` if present; otherwise begin fresh detection.
2. **Auto-detect stack:**
   - **Languages:** Scan extensions + manifests (package.json, pyproject.toml, go.mod, Cargo.toml, *.csproj, pom.xml)
   - **Frameworks:** Parse deps for known frameworks (next, react, vue, django, fastapi, nestjs, spring, rails, etc.)
   - **Architecture:** `apps/`+`packages/`→monorepo; single `src/`→monolith; multiple Dockerfiles→microservices; `bin/`→cli; `lib/`→library
   - **Build commands:** Read scripts from manifests, Makefile targets, CI workflows
   - **Deployment:** Scan for vercel.json, Dockerfile, serverless.yml, deploy workflows, fly.toml
3. **Detect existing AI configs (determines strategy):**
   - `.github/copilot-instructions.md`→Copilot; `CLAUDE.md`/`AGENTS.md`→Claude; `.cursor/rules/`→Cursor; `.github/skills/`→Skills
4. **Fill gaps (if interactive=true):** Ask only for undetectable fields: risk level, naming conventions, git workflow, protected paths, deployment strategy.
5. **Write `repo-profile.yml`:** Validate against schema; if existed, show diff and confirm.

### Phase 2: Strategy Selection

```
Has existing AI configs?
├── NO → Greenfield (extract from existing docs or scaffold from templates)
└── YES → Brownfield
    ├── low/medium risk → Moderate repair (evaluate + refactor + sync)
    └── high/critical risk → Conservative (evaluate only, propose changes)
```

### Phase 3: Greenfield Execution

1. **Generate AGENTS.md** via `create-instructions` — populate from architecture, commands, conventions
2. **Generate provider instructions** for each configured provider:
   - Copilot: `.github/copilot-instructions.md` (<2000 tokens)
   - Claude: `CLAUDE.md` (with project context)
   - Cursor: `.cursor/rules/*.mdc` (split by topic)
3. **Generate initial skills** (medium+ repos with >5 files): `testing` + `code-review`
4. **Run `evaluate-config`** — verify score ≥4.0/5.0; self-correct if below

### Phase 4: Brownfield Execution

1. **Diagnose** via `diagnose-brownfield` — score readiness, identify worst dimension
2. **Evaluate** via `evaluate-config` scope="all" — find violations and contradictions
3. **Detect drift** via `detect-drift` (if multiple providers) — find inconsistencies
4. **Plan repairs:**
   - low/medium: `refactor-instructions` on oversized files, `lint-instructions` auto-fix, `sync-config`, add missing sections
   - high/critical: report only, propose patch set, flag for human approval
5. **Fill gaps:** Add missing AGENTS.md, provider configs, or repo-profile.yml

### Phase 5: Handover

1. **Generate report:** Strategy used, readiness score, files created/modified, recommendations
2. **Suggest maintenance cadence:**
   - Low risk: monthly health-dashboard, quarterly audit-skills
   - Medium: weekly health-dashboard, monthly audit + drift check
   - High: CI-integrated checks per PR + weekly full audit
3. **Offer next steps:** evaluate-config, create-skill, CI integration

### Constraints

- NEVER overwrite existing configs without explicit consent
- NEVER reference files/commands that don't exist
- ALWAYS validate against schemas before writing
- ALWAYS preserve existing user conventions (detected from code)
- High/critical risk: NEVER auto-apply changes
- Profile MUST be written before any generation begins
- If detection confidence <70%, ASK rather than guess

### Error Handling

- Empty repo → pure greenfield, ask more questions
- Build/test commands fail → include with "⚠️ unverified" annotation
- Conflicting signals (e.g., Jest + Vitest) → ask user which is active
- Schema validation fails → show field errors, ask for correction
- Meta-skill fails → log error, continue remaining steps, report partial completion

## Examples

### Example 1: Greenfield TypeScript project

Input: `target_repo_path: ./my-new-app, providers: ["copilot"], interactive: true`
Auto-detected: TypeScript, Next.js 14, Tailwind, monolith, npm scripts
Questions: risk→"medium", workflow→"github-flow", protected→[".env*","prisma/migrations/"]
Output: repo-profile.yml ✅, AGENTS.md ✅, copilot-instructions.md ✅, score 8.5/10

### Example 2: Brownfield monorepo

Input: `target_repo_path: ./existing-platform, strategy: brownfield`
Detected: CLAUDE.md (85 lines), partial AGENTS.md (30 lines); missing copilot-instructions
Actions: Created profile, updated AGENTS.md, created copilot-instructions, flagged 3 stale refs
Result: 6.8/10 → recommended fixes bring to 8.2/10

## Metadata

```yaml
name: onboard-repo
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
category: orchestration
```
