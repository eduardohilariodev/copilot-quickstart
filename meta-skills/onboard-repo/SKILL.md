# onboard-repo

## Description

Orchestrates the complete onboarding of a repository into the copilot-quickstart ecosystem. Builds or updates `repo-profile.yml`, selects the appropriate strategy (greenfield vs brownfield), then calls the correct sequence of meta-skills to produce a standards-compliant, provider-ready AI configuration. This is the single entry point for "make this repo AI-ready."

## Trigger

This skill activates when:
- A user says "onboard this repo", "set up copilot-quickstart", or "make this repo AI-ready"
- A user asks to "initialize AI config" or "bootstrap agent setup"
- A newly created repository needs its first AI configuration

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to the repository to onboard |
| providers | string[] | no | AI providers to configure: "copilot", "claude", "cursor" (default: auto-detect) |
| strategy | string | no | Force "greenfield" or "brownfield" (default: auto-detect) |
| interactive | boolean | no | Ask questions to fill gaps vs infer everything (default: true) |
| risk_level | string | no | Override risk classification (default: inferred from repo) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| repo_profile | file | Generated/updated repo-profile.yml |
| generated_files | file[] | All config files created or modified |
| onboarding_report | text | Summary of what was done, current readiness score, and next steps |
| maintenance_schedule | text | Recommended ongoing maintenance cadence |

## Tools Required

- File system read (scan target repo comprehensively)
- File system write (create/update config files)
- Command execution (verify build/test commands work)
- User interaction (questionnaire for gaps)
- Meta-skill invocation (calls other skills in sequence)

## Behavior

### Phase 1: Intake — Build the Repo Profile

1. **Check for existing profile:**
   - If `repo-profile.yml` exists: load it, validate against schema, highlight stale/missing fields
   - If absent: begin fresh detection

2. **Auto-detect stack:**
   - **Languages:** Scan file extensions, manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`, `pom.xml`)
   - **Frameworks:** Parse dependency lists for known frameworks (next, react, vue, django, fastapi, nestjs, spring, rails, etc.)
   - **Architecture:** Heuristics:
     - `apps/` + `packages/` or `turbo.json`/`nx.json` → monorepo
     - Single `src/` with one manifest → monolith
     - Multiple service directories with own Dockerfiles → microservices
     - `bin/` or CLI-focused structure → cli
     - `lib/` with no app code → library
   - **Build commands:** Read `scripts` from package.json, `Makefile` targets, `pyproject.toml` scripts, CI workflow files
   - **Deployment:** Scan for `vercel.json`, `Dockerfile`, `serverless.yml`, `.github/workflows/*deploy*`, `fly.toml`, etc.

3. **Detect existing AI configs (determines strategy):**
   - `.github/copilot-instructions.md` → Copilot present
   - `CLAUDE.md` or `AGENTS.md` → Claude/general present
   - `.cursor/rules/` → Cursor present
   - `.github/skills/` → Skills already defined
   - Count and assess quality of existing configs

4. **Fill gaps (if interactive=true):**
   Ask only for fields that couldn't be auto-detected:
   - Risk level (with explanation of implications)
   - Naming conventions (if no linter config to infer from)
   - Git workflow (if no branch protection config found)
   - Protected paths (beyond obvious ones like `.env*`)
   - Deployment strategy and environments

5. **Write `repo-profile.yml`:**
   - Validate against `schemas/repo-profile.schema.json`
   - If profile already existed: show diff, ask to confirm updates

### Phase 2: Strategy Selection

**Decision tree:**

```
Has existing AI configs?
├── NO → Greenfield Path
│   └── Has existing documentation (README, CONTRIBUTING)?
│       ├── YES → Extract conventions, use as input to generation
│       └── NO → Pure scaffold from templates + profile
│
└── YES → Brownfield Path
    └── What is the risk_level?
        ├── low/medium → Moderate repair (evaluate + refactor + sync)
        └── high/critical → Conservative repair (evaluate only, propose changes)
```

### Phase 3: Greenfield Execution

For repos with NO existing AI configs:

1. **Generate AGENTS.md:**
   - Call `create-instructions` with profile to produce AGENTS.md
   - Populate from: detected architecture, commands, conventions
   - Link to deeper docs if repo has them (README, CONTRIBUTING, docs/)

2. **Generate provider instructions:**
   - Call `create-instructions` for each provider in profile
   - Copilot: `.github/copilot-instructions.md` (concise, under 2000 tokens)
   - Claude: `CLAUDE.md` (with project context section)
   - Cursor: `.cursor/rules/*.mdc` (split by topic)

3. **Generate initial skills (optional, for medium+ repos):**
   - `testing` skill: matches detected test framework
   - `code-review` skill: based on conventions in profile
   - Only if repo has >5 files and clear patterns

4. **Run initial evaluation:**
   - Call `evaluate-config` to verify generated output scores ≥ 4.0/5.0
   - If below threshold: self-correct and regenerate

### Phase 4: Brownfield Execution

For repos WITH existing AI configs:

1. **Diagnose current state:**
   - Call `diagnose-brownfield` to score readiness across 4 dimensions
   - Identify worst-scoring dimension as priority

2. **Evaluate existing configs:**
   - Call `evaluate-config` with scope="all"
   - Identify violations, contradictions, and anti-patterns

3. **Detect drift (if multiple providers):**
   - Call `detect-drift` to find inconsistencies
   - Identify canonical source

4. **Plan repairs (based on risk level):**

   For **low/medium risk:**
   - Call `refactor-instructions` on oversized files
   - Call `lint-instructions` and auto-fix simple issues
   - Call `sync-config` to normalize across providers
   - Add missing required sections to AGENTS.md

   For **high/critical risk:**
   - Generate report only (no auto-modifications)
   - Propose changes as a reviewable patch set
   - Flag all changes for human approval

5. **Fill gaps (both risk levels):**
   - Add missing AGENTS.md if absent (even in brownfield)
   - Add missing provider configs if providers detected but unconfigured
   - Add `repo-profile.yml` if it didn't exist

### Phase 5: Handover

1. **Generate onboarding report:**
   ```
   ## Onboarding Complete: my-org/my-repo
   
   Strategy: [greenfield/brownfield]
   Readiness Score: [X/10]
   
   ### Created
   - repo-profile.yml
   - AGENTS.md
   - .github/copilot-instructions.md
   
   ### Modified
   - CLAUDE.md (synced 4 missing rules from canonical)
   
   ### Recommendations
   1. Review generated AGENTS.md for accuracy
   2. Run tests to verify build commands are correct
   3. Set up maintenance: run health-dashboard weekly
   ```

2. **Suggest maintenance cadence:**
   Based on risk level and team size:
   - Low risk: monthly health-dashboard, quarterly audit-skills
   - Medium risk: weekly health-dashboard, monthly audit-skills + drift check
   - High risk: CI-integrated checks on every PR + weekly full audit

3. **Offer next steps:**
   - "Run `evaluate-config` to see detailed compliance scores"
   - "Run `create-skill` to add workflow-specific skills"
   - "Set up CI integration for ongoing maintenance"

### Constraints

- NEVER overwrite existing configs in brownfield without explicit consent
- NEVER generate configs that reference files/commands that don't exist
- ALWAYS validate generated output against schemas before writing
- ALWAYS preserve existing user conventions (detected from code, not assumed)
- For high/critical risk repos: NEVER auto-apply changes
- The profile MUST be written before any generation begins (it's the contract)
- If auto-detection confidence is low (<70% sure), ASK rather than guess

### Error Handling

- If repo is empty (no files): Treat as pure greenfield, ask more questions
- If build/test commands fail: Include with "⚠️ unverified" annotation
- If conflicting signals (e.g., both Jest and Vitest in deps): Ask user which is active
- If profile schema validation fails: Show specific field errors, ask for correction
- If a called meta-skill fails: Log error, continue with remaining steps, report partial completion

## Examples

### Example 1: Greenfield TypeScript project

**Input:**
```
target_repo_path: ./my-new-app
providers: ["copilot"]
interactive: true
```

**Auto-detected:**
- Language: TypeScript
- Framework: Next.js 14, Tailwind
- Architecture: monolith
- Build: `npm run build`, Test: `npm test`, Lint: `npm run lint`

**Questions asked:**
- Risk level? → "medium"
- Git workflow? → "github-flow"
- Protected paths? → [".env*", "prisma/migrations/"]

**Output:**
- `repo-profile.yml` ✅
- `AGENTS.md` ✅
- `.github/copilot-instructions.md` ✅
- Readiness score: 8.5/10

### Example 2: Brownfield monorepo with partial configs

**Input:**
```
target_repo_path: ./existing-platform
strategy: brownfield
```

**Detected:**
- Existing: CLAUDE.md (85 lines), partial AGENTS.md (30 lines)
- Missing: copilot-instructions, .cursor/rules
- Issues: CLAUDE.md has stale commands, AGENTS.md missing architecture section

**Actions taken:**
- Created `repo-profile.yml` from detection
- Updated AGENTS.md (added architecture, commands sections)
- Created `.github/copilot-instructions.md` (from CLAUDE.md canonical rules)
- Flagged 3 stale references in CLAUDE.md for human review
- Readiness score: 6.8/10 → recommended fixes would bring to 8.2/10

## Metadata

```yaml
name: onboard-repo
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
category: orchestration
```
