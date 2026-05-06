# Example Target Repo Output

> This directory demonstrates the **complete output** of copilot-quickstart when applied to a sample project (acme/web-platform — a TypeScript/Next.js/Prisma Turborepo monorepo).

## What's Here

| File/Directory | Purpose |
|---------------|---------|
| `repo-profile.yml` | Input profile describing the target project |
| `AGENTS.md` | AI agent context documentation |
| `CLAUDE.md` | Claude-specific configuration (synced from Copilot instructions) |
| `.framework/` | Standards capsule (standards.md, standards.json, schemas/) |
| `.github/copilot-instructions.md` | Repo-wide Copilot behavioral rules |
| `.github/instructions/` | Path-specific instruction files (5 total) |
| `.github/skills/` | Vendored starter skills (5 total) |
| `.github/agents/` | Agent definitions (5 total) |

## Directory Structure

```
├── .framework/
│   ├── standards.md       # Upstream standards reference
│   ├── standards.json     # Layout contract & budgets
│   └── schemas/           # JSON Schema contracts
├── .github/
│   ├── agents/            # 5 agent definitions
│   ├── copilot-instructions.md
│   ├── instructions/      # 5 path-specific instruction files
│   └── skills/            # 5 vendored starter skills
│       ├── ci-health/
│       ├── git-commit/
│       ├── plan-change/
│       ├── safe-refactor/
│       └── test-generate/
├── AGENTS.md
├── CLAUDE.md
├── README.md
└── repo-profile.yml
```

## Generation

These files were generated using:
```
node tools/onboard/bin/cli.mjs --skills
node tools/onboard/bin/cli.mjs apply
```

All artifacts reference `standards_version: 1.0.0` for provenance tracking.

## Not a Real Project

This is a reference example only. The "acme/web-platform" project does not exist — it's a realistic sample to demonstrate output structure and quality.
