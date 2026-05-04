# copilot-quickstart

A project-agnostic **standards corpus + meta-skills** for generating high-quality AI coding configurations. Scan any repo, produce non-hallucinated agents, skills, and instructions that conform to research-backed best practices.

## What This Is

A "meta-copilot" — instead of writing AI configurations by hand (and watching them drift), you use this repo as:

1. **Source of truth** — Immutable standards for how agents, skills, and instructions should be written
2. **Templates** — Copy-paste-ready structures for any target repo
3. **Meta-skills** — AI skills that *generate other skills*, instructions, and agent configs
4. **Schemas** — Machine-readable contracts for validation and automation

## Repository Structure

```
copilot-quickstart/
├── source-of-truth/              # Immutable standards (read, never auto-write)
│   ├── design-standards.md       # Agent/skill/instruction boundaries & taxonomy
│   ├── prompt-engineering-guide.md  # Writing patterns, format, anti-patterns
│   ├── security-governance.md    # Security constraints & governance policies
│   └── anti-patterns.md          # What NOT to do (with examples)
├── schemas/                      # Machine-readable contracts
│   ├── repo-profile.schema.json  # Target repo intake specification
│   ├── skill.schema.json         # Skill definition validation
│   ├── agent.schema.json         # Agent definition validation
│   └── instructions.schema.json  # Instruction file validation
├── templates/                    # Ready-to-use templates ({{placeholder}} syntax)
│   ├── AGENTS.md                 # Documentation template
│   ├── copilot-instructions.md   # Copilot instructions template
│   ├── SKILL.md                  # Skill definition template
│   ├── agent-definition.yml      # Agent config template
│   └── eval-suite.md             # Evaluation checklist template
├── meta-skills/                  # Skills that create other configurations
│   ├── create-skill/SKILL.md     # Generates new skill definitions
│   ├── create-instructions/SKILL.md  # Generates instruction files
│   ├── create-agent/SKILL.md     # Generates agent definitions
│   ├── evaluate-config/SKILL.md  # Audits existing configs
│   └── sync-config/SKILL.md      # Syncs across Copilot/Claude/Cursor
└── examples/
    └── target-repo/              # Fully populated example output
        ├── repo-profile.yml      # Input profile
        ├── .github/copilot-instructions.md
        ├── AGENTS.md
        └── CLAUDE.md
```

## Quick Start

### 1. Profile Your Repo

Create a `repo-profile.yml` describing your target project (see `schemas/repo-profile.schema.json` for the full spec):

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

### 2. Generate Configurations

Use the meta-skills with your preferred AI tool:

```
"Using copilot-quickstart/meta-skills/create-instructions, generate 
copilot instructions for my repo based on the repo-profile.yml"
```

### 3. Evaluate Quality

```
"Using copilot-quickstart/meta-skills/evaluate-config, audit my 
.github/copilot-instructions.md against the standards"
```

### 4. Sync Across Providers

```
"Using copilot-quickstart/meta-skills/sync-config, sync my Copilot 
instructions to CLAUDE.md and Cursor rules"
```

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

| Concept | Copilot | Claude | Cursor |
|---------|---------|--------|--------|
| Instructions | `.github/copilot-instructions.md` | `CLAUDE.md` | `.cursor/rules/*.mdc` |
| Agent config | `copilot-setup-steps.yml` | `AGENTS.md` | N/A |
| Skills | `.github/skills/*/SKILL.md` | Platform skills | N/A |
| Token budget | ~2000 | ~8000 | ~500/file |

### The Generation Flow

```
repo-profile.yml → meta-skill → standards check → render → validate → output
     ↑                              ↑                            ↑
  (your repo)          (source-of-truth/)              (schemas/*.json)
```

## Standards Versioning

All source-of-truth documents include a `Version: X.Y.Z` header. Generated artifacts include provenance:

```markdown
<!--
  Generated by: copilot-quickstart/meta-skills/create-instructions
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