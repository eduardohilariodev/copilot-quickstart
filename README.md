# copilot-quickstart

A project-agnostic **standards corpus + meta-skills** for generating high-quality AI coding configurations. Scan any repo, produce non-hallucinated agents, skills, and instructions that conform to research-backed best practices.

## What This Is

A "meta-copilot" — instead of writing AI configurations by hand (and watching them drift), you use this repo as a **two-layer system**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: FRAMEWORK (read-only specs & contracts)               │
│  .framework/ (standards.md + schemas/)                          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: CONTENT (skills + agents + CLI + tools)               │
│  Reads framework, inspects target repo, generates/repairs       │
│  skills/ + agents/ + instructions/ + tools/                     │
│  (see examples/target-repo/ for reference output)               │
└─────────────────────────────────────────────────────────────────┘
```

1. **Framework** — Immutable design rules, prompt-engineering guide, security governance (`.framework/`)
2. **Content** — Skills, agents, instructions, CLI, and tools that read the framework and produce/repair configs (`skills/`, `agents/`, `instructions/`, `tools/`)
3. **Target output** — The actual files your AI tools consume, always aligned with standards (`examples/target-repo/` is the reference)

## Repository Structure

```
copilot-quickstart/
├── .framework/                       # Immutable standards (read, never auto-write)
│   ├── standards.md                  # Consolidated standards (design, naming, prompts,
│   │                                 #   security, maintenance, anti-patterns, config)
│   └── schemas/                      # Machine-readable contracts
│       ├── repo-profile.schema.json  # Target repo intake specification
│       ├── skill.schema.json         # Skill definition validation
│       ├── agent.schema.json         # Agent definition validation
│       └── instructions.schema.json  # Instruction file validation
├── skills/
│   ├── _meta/                        # Skills that create and maintain configurations
│   │   │
│   │   │ # Bootstrap (create from scratch)
│   │   ├── create-skill/SKILL.md     # Generates new skill definitions
│   │   ├── create-instructions/SKILL.md  # Generates instruction files
│   │   ├── create-agent/SKILL.md     # Generates agent definitions
│   │   ├── evaluate/SKILL.md         # Audits existing configs against standards
│   │   ├── sync/SKILL.md             # Syncs across Copilot/Claude/Cursor
│   │   │
│   │   │ # Maintenance — Instruction Cleanup
│   │   ├── refactor-instructions/SKILL.md  # Progressive disclosure refactoring
│   │   ├── lint/SKILL.md                   # Instruction file linter
│   │   ├── drift/SKILL.md                  # Cross-provider drift detection
│   │   │
│   │   │ # Maintenance — Skill Hygiene
│   │   ├── audit/SKILL.md                  # Skill catalog auditor
│   │   ├── prune/SKILL.md                  # Skill lifecycle/deprecation manager
│   │   ├── check-compat/SKILL.md           # Tool version compatibility checker
│   │   │
│   │   │ # Maintenance — Orchestration
│   │   ├── health/SKILL.md                 # Config health report generator
│   │   ├── batch/SKILL.md                  # Multi-repo batch maintenance
│   │   │
│   │   │ # Maintenance — Upgrade & Migration
│   │   ├── upgrade/SKILL.md                # Model/tool upgrade helper
│   │   │
│   │   │ # Maintenance — Governance & Safety
│   │   ├── audit-tool-safety/SKILL.md      # Tool/script safety auditor
│   │   ├── check-policy/SKILL.md           # Org policy conformance checker
│   │   │
│   │   │ # Onboarding — Orchestration
│   │   ├── onboard/SKILL.md                # Full onboarding decision tree
│   │   ├── diagnose-repo/SKILL.md         # Readiness scoring & repair plan
│   │   └── configure-copilot/SKILL.md  # Copilot feature config (applyTo, IDE, CLI)
│   │
│   └── _default/                     # Starter skill pack (15 generic skills)
│       ├── git-commit/               # Conventional commit messages
│       ├── git-branch-pr/            # Branch naming + PR descriptions
│       ├── git-cleanup/              # History hygiene (squash, prune)
│       ├── test-generate/            # Unit test scaffolding
│       ├── test-diagnose/            # Failing test root-cause analysis
│       ├── test-strategy/            # TESTING.md generation
│       ├── ci-starter/               # GitHub Actions best practices
│       ├── ci-health/                # Workflow security/perf audit
│       ├── deploy-guide/             # Deployment procedure docs
│       ├── infra-sanity/             # Infrastructure safety checks
│       ├── plan-change/              # Structured planning before coding
│       ├── context-pick/             # Minimal high-signal context selection
│       ├── safe-refactor/            # Multi-file refactor with test gates
│       ├── project-onboard/          # "How to work here" doc generator
│       └── shell-safe/               # Safe shell command execution
├── agents/                           # Starter agent definitions (5 agents)
│   ├── onboard-diagnose.agent.md     # Onboarding & diagnostics agent
│   ├── coding-refactor.agent.md      # Day-to-day coding agent
│   ├── pr-code-review.agent.md       # PR authoring & review agent
│   ├── ci-cd-devops.agent.md         # CI/CD & DevOps agent
│   └── maintenance-hygiene.agent.md  # Config maintenance agent
├── instructions/                     # Path-specific instruction templates (with applyTo)
│   ├── typescript.instructions.md    # applyTo: **/*.ts,**/*.tsx
│   ├── frontend.instructions.md     # applyTo: apps/web/**, components/**
│   ├── backend.instructions.md      # applyTo: apps/api/**, services/**
│   ├── infra.instructions.md        # applyTo: terraform/**, workflows/**
│   └── tests.instructions.md        # applyTo: **/*.test.*, **/*.spec.*
├── tools/
│   └── onboard/                      # Interactive CLI wizard
│       ├── package.json              # @clack/prompts + picocolors
│       ├── bin/cli.mjs               # Entry point (command routing)
│       ├── lib/
│       │   ├── constants.mjs         # Paths, version, ignore rules
│       │   ├── detect.mjs            # Repo scanning (languages, frameworks, etc.)
│       │   ├── plan.mjs              # Shared plan model (profile + artifact plan)
│       │   ├── generate.mjs          # File generation + staging
│       │   └── doctor.mjs            # Read-only diagnostics + scoring
│       └── templates/                # Generation templates (SKILL.md, AGENTS.md, etc.)
└── examples/
    └── target-repo/                  # Fully populated example output
        ├── repo-profile.yml          # Input profile
        ├── .github/copilot-instructions.md
        ├── AGENTS.md
        └── CLAUDE.md
```

## Quick Start

### 1. Profile Your Repo

Create a `repo-profile.yml` describing your target project (see `.framework/schemas/repo-profile.schema.json` for the full spec):

```yaml
name: "my-org/my-repo"
languages: [typescript, python]
frameworks: [nextjs, fastapi]
architecture: monorepo
risk_level: medium
build_commands:
  test: "pnpm test"
  build: "pnpm build"
providers: [copilot, claude]
```

> **Tip:** Prefer the [CLI Wizard](#option-a-cli-wizard) for interactive setup — it auto-detects most of these values. Use manual profile creation for scripted or advanced workflows.

### 2. Generate Configurations

Use the meta-skills with your preferred AI tool:

```
"Using copilot-quickstart/skills/_meta/create-instructions, generate 
copilot instructions for my repo based on the repo-profile.yml"
```

### 3. Evaluate Quality

```
"Using copilot-quickstart/skills/_meta/evaluate, audit my 
.github/copilot-instructions.md against the standards"
```

### 4. Sync Across Providers

```
"Using copilot-quickstart/skills/_meta/sync, sync my Copilot 
instructions to CLAUDE.md and Cursor rules"
```

## Onboarding a Repo

Two paths to the same result: an **interactive CLI wizard** for guided setup, or an **AI skill** for conversational setup.

### Option A: CLI Wizard

```bash
# From your target repo root (requires Node.js):
npx @copilot-quickstart/cli

# Or clone and run directly:
node path/to/copilot-quickstart/tools/onboard/bin/cli.mjs
```

> **Note:** The wizard generates `repo-profile.yml` automatically. For manual creation, see [Profile Your Repo](#1-profile-your-repo).

The interactive wizard guides you through 5 phases:

1. **Environment check** — verifies git repo, shows warnings
2. **Repo scan** — auto-detects languages, frameworks, architecture, CI, existing AI configs
3. **Profile questions** — presents scan as defaults, asks only for gaps (risk level, providers, conventions)
4. **Plan proposal** — shows toggleable list of files to generate (AGENTS.md, instructions, skills, etc.)
5. **Generate** — writes to `ai-setup/` staging directory with manifest

#### Commands

```bash
copilot-quickstart              # Full wizard (interactive)
copilot-quickstart doctor       # Read-only diagnostics + readiness score
copilot-quickstart doctor --json  # Machine-readable (for CI)
copilot-quickstart apply        # Move staged files to final locations
copilot-quickstart apply --force  # Overwrite existing
copilot-quickstart reset        # Remove staging directory
```

#### Non-Interactive (CI/scripting)

```bash
# Full unattended — uses scan defaults, no prompts:
copilot-quickstart --non-interactive --skills
copilot-quickstart apply --force
```

Exit codes: `0` = success/healthy, `1` = needs work (doctor) or error.

### Option B: Copilot/Claude Skill

```
"Run the onboard skill from copilot-quickstart on this repository"
```

The skill runs the same decision tree interactively:
- **Greenfield** (no existing configs) → generates AGENTS.md, instructions, and starter skills
- **Brownfield** (existing configs) → diagnoses readiness, proposes repairs, normalizes structure

### Greenfield vs Brownfield

| | Greenfield | Brownfield |
|--|-----------|------------|
| **Trigger** | No AGENTS/instructions found | Existing configs detected |
| **Approach** | Generate from templates + profile | Diagnose → repair → normalize |
| **Skills used** | `create-*` | `evaluate`, `diagnose-repo`, `refactor-instructions`, `sync` |
| **Risk** | Low (nothing to break) | Medium (must preserve conventions) |

### Readiness Scoring (Brownfield)

The `diagnose-repo` skill scores repos on four dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Context & Documentation | 30% | AGENTS.md quality, architecture docs, clear commands |
| Verification Infrastructure | 25% | Test coverage, CI config, failure clarity |
| Config Hygiene | 25% | Standards alignment, duplication, structure |
| Safety & Governance | 20% | Secrets, permissions, protected paths |

Readiness levels: **Basic** (0–4) → **Ready** (4–7) → **Advanced** (7–10)

### Starter Skill Pack

15 generic, research-backed skills that work in any repo. Vendored on demand with `--skills`:

| Category | Skill | What It Does |
|----------|-------|-------------|
| **Git & Flow** | `git-commit` | Conventional commit messages from staged diffs |
| | `git-branch-pr` | Branch naming + structured PR descriptions |
| | `git-cleanup` | Squash, prune stale branches, audit history |
| **Testing** | `test-generate` | Unit test scaffolds matching project conventions |
| | `test-diagnose` | Root-cause analysis for failing tests |
| | `test-strategy` | Generate/update TESTING.md |
| **CI/CD** | `ci-starter` | GitHub Actions workflows (secure, cached, modular) |
| | `ci-health` | Audit workflows for security/perf issues |
| | `deploy-guide` | Deployment procedures + rollback docs |
| | `infra-sanity` | Safety checks before destructive infra commands |
| **Context & Planning** | `plan-change` | Structured planning before code changes |
| | `context-pick` | Select minimal high-signal context for tasks |
| | `safe-refactor` | Multi-file refactors with test gates per batch |
| **Onboarding & Ops** | `project-onboard` | "How to work here" quickstart guide |
| | `shell-safe` | Safe shell execution with protected-path guards |

#### Library vs Vendored

- **Library** (default): skills stay in `copilot-quickstart/skills/_default/` — agents reference them
- **Vendored** (`--skills` flag): copied into your repo at `.github/skills/` — you own and evolve them

### Starter Agents

5 provider-agnostic agent definitions that cover the most common workflows:

| Agent | Role | Skills Used |
|-------|------|-------------|
| **Onboard & Diagnose** | First setup / reset / health checks | `onboard`, `evaluate`, `diagnose-repo`, `health` |
| **Coding & Refactor** | Day-to-day development | `context-pick`, `plan-change`, `safe-refactor`, `test-generate` |
| **PR & Code Review** | PR authoring + standards-based review | `git-commit`, `git-branch-pr`, `evaluate` |
| **CI/CD & DevOps** | Pipeline design + deployment | `ci-starter`, `ci-health`, `deploy-guide`, `infra-sanity` |
| **Maintenance & Hygiene** | Config upkeep (never edits code) | `health`, `audit`, `drift`, `sync`, `prune` |

Agents are defined in `agents/*.agent.md` and rendered per-provider by `sync`.

### Path-Specific Instructions

Focused instruction templates for common file types (keep under 40 lines each):

| Template | Applies To | Key Focus |
|----------|-----------|-----------|
| `typescript.instructions.md` | `**/*.ts`, `**/*.tsx` | Strict types, naming, error handling |
| `frontend.instructions.md` | `apps/web/**`, `**/components/**` | Component patterns, accessibility, UI state |
| `backend.instructions.md` | `apps/api/**`, `services/**` | Error handling, auth, validation, logging |
| `infra.instructions.md` | `terraform/**`, `.github/workflows/**` | Safety rules, pinning, permissions |
| `tests.instructions.md` | `**/*.test.*`, `**/*.spec.*` | AAA pattern, mocking boundaries, what to test |

Place in `.github/instructions/` — Copilot applies them based on `applyTo` glob matching.

### Copilot Config Features

The quickstart understands and configures all Copilot-specific knobs:

| Feature | What It Does | Client Support |
|---------|-------------|----------------|
| **Repo-wide instructions** | Always-on behavior rules | Chat, Cloud Agent, Code Review |
| **Path-specific instructions** | Per-file-type rules via `applyTo` globs | Chat, Code Review |
| **VS Code settings** | `chat.instructionsFilesLocations` for discovery | VS Code Copilot Chat |
| **`COPILOT_SKILLS_DIRS`** | CLI discovers custom skills from env var | Copilot CLI |
| **Prompt files** | Reusable task-specific prompts (`.prompt.md`) | VS Code Chat |

Use the `configure-copilot` meta-skill to configure all of the above based on your repo profile:

```
"Run configure-copilot on this repo to set up scoped instructions and IDE settings"
```

See `.framework/standards.md` for the full reference.

## Maintenance Workflow

After initial setup, the maintenance meta-skills keep configs clean over time:

### The Maintenance Cycle

```
MEASURE → IDENTIFY → PROPOSE → REVIEW → APPLY → VALIDATE
```

### Regular Maintenance

```
# Check overall health (weekly)
"Run health on my repo and show priorities"

# Lint instruction quality
"Run lint on my .github/copilot-instructions.md"

# Detect drift between providers
"Check for drift between my Copilot and Claude configs"

# Audit skill catalog (monthly)
"Audit all my skills for compliance and hygiene issues"

# Prune unused skills (quarterly)
"Identify skills that should be deprecated or archived"
```

### After Tool Upgrades

```
# Check compatibility with new versions
"Run check-compat after my Copilot extension update"

# Migrate configs to new standards
"Run upgrade to migrate from standards v1.0 to v1.1"
```

### Organization-Wide

```
# Batch maintenance across repos
"Run batch on all repos in my org with health + lint checks"

# Policy conformance (before audit)
"Check policy conformance for acme/api-service"
```

### Maintenance Meta-Skills Reference

| Category | Skill | Purpose |
|----------|-------|---------|
| **Instruction Cleanup** | `refactor-instructions` | Progressive disclosure — split oversized files |
| | `lint` | Quality lint with rule-level fix suggestions |
| | `drift` | Find inconsistencies across providers + codebase |
| **Skill Hygiene** | `audit` | Structural audit of skill catalog |
| | `prune` | Lifecycle management: deprecate, archive, merge |
| | `check-compat` | Verify configs work with current tool versions |
| **Orchestration** | `health` | Aggregate health report with scores and priorities |
| | `batch` | Multi-repo maintenance with issue/PR creation |
| **Upgrade** | `upgrade` | Migration helper for tool/standards version bumps |
| **Governance** | `audit-tool-safety` | Tool permission and safety pattern audit |
| | `check-policy` | Org-level policy conformance verification |
| **Onboarding** | `onboard` | Full decision-tree onboarding orchestrator |
| | `diagnose-repo` | Readiness scoring with 4-dimension analysis |

## Design Principles

| Principle | How It's Applied |
|-----------|-----------------|
| **Single source of truth** | Standards live in one place; everything else is derived |
| **Machine + human readable** | Markdown for humans, JSON schemas for automation |
| **Provider-agnostic** | Canonical rules are universal; rendering is per-provider |
| **Grounded, not hallucinated** | Meta-skills scan real repos; never invent paths/commands |
| **Secure by default** | Security rules at highest precedence; least-privilege tools |
| **Versionable** | Standards are versioned; generated artifacts track provenance |

## Key Concepts

### Artifact Hierarchy

```
Instructions (behavioral rules)
    └── consumed by → Agents (autonomous executors)
                          └── invoke → Skills (reusable capabilities)
                                          └── reference → Documentation (context)
```

### Provider Mapping

See [`.framework/standards.md`](.framework/standards.md) for the canonical provider mapping.

**Token budgets (approximate):**

| Provider | Budget |
|----------|--------|
| Copilot | ~2000 tokens |
| Claude | ~8000 tokens |
| Cursor | ~500 tokens/file |

### The Generation Flow

```
repo-profile.yml → meta-skill → standards check → render → validate → output
     ↑                              ↑                            ↑
  (your repo)              (.framework/)              (.framework/schemas/)
```

## Standards Versioning

All `.framework/standards.md` sections include a `Version: X.Y.Z` header. Generated artifacts include provenance:

```markdown
<!--
  Generated by: copilot-quickstart/skills/_meta/create-instructions
  Standards version: 1.0.0
  Input hash: sha256:abc123...
-->
```

When standards are updated:
- Patch (1.0.x): Clarifications, no behavioral change
- Minor (1.x.0): New rules added, existing rules unchanged
- Major (x.0.0): Breaking changes, requires regeneration

## Contributing

1. **Standards changes** require discussion and review (they affect all generated output)
2. **Template changes** should maintain backward compatibility with existing profiles
3. **Meta-skill changes** must pass the evaluation suite against the examples
4. **Schema changes** are versioned alongside the standards they validate

## References

- [GitHub Copilot Custom Instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)
- [Prompt Engineering for Copilot](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering)
- [Claude Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [AGENTS.md Impact Study](https://arxiv.org/abs/2601.20404)
- [Configuring Agentic AI Coding Tools](https://arxiv.org/abs/2602.14690)

## License

MIT — see [LICENSE](LICENSE)