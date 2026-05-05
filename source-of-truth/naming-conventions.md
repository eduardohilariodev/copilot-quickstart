# Naming Conventions

Version: 1.0.0

Standards for naming skills, agents, instructions, and documentation files
across the copilot-quickstart ecosystem.

## Core Principles

1. **Clear and descriptive** — name tells you what it does without reading the file
2. **Action-oriented** — prefer verbs/gerunds over vague nouns
3. **Consistent pattern** — one style across the repo, enforced by profile
4. **Short but specific** — disambiguate similar items without being a sentence
5. **Machine-friendly** — lowercase + hyphens, no spaces, matches directory name

## Skills

### Recommended Pattern: `verb-ing-domain`

The primary naming pattern for skills. The gerund form signals capability.

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `verb-ing-domain` | `testing-code`, `managing-branches` | Default — most skills |
| `domain-verb-ing` | `database-migrating`, `react-testing` | When domain disambiguation matters more |
| `verb-noun` | `create-skill`, `audit-config` | Meta/operational skills (e.g., create-*, audit-*, sync-*) |

> **Convention for `meta-skills/`:** All meta-skills in copilot-quickstart use the `verb-noun`
> variant by convention. When creating new meta-skills, prefer this pattern for consistency.


### Constraints

- **Case:** kebab-case only (lowercase, hyphens)
- **Length:** 2–4 segments, max 40 characters
- **Directory = name:** skill directory must match the `name` field in SKILL.md frontmatter
- **No generic words alone:** avoid `helper`, `utils`, `misc`, `general`
- **No provider names:** avoid `copilot-skill`, `claude-tool` (skills are provider-agnostic)

### Examples

```
✓ testing-code             — clear action + domain
✓ git-commit-message       — specific capability
✓ plan-and-scope-change    — compound action, still clear
✓ ci-health-check          — domain-action pattern (acceptable variant)

✗ helper                   — too vague
✗ code-stuff               — non-descriptive domain
✗ the-great-refactorer     — too informal/long
✗ copilot_skill_1          — wrong case, provider name, numbered
```

## Agents

### Recommended Pattern: `role-scope-agent`

Agent names describe their function with an optional `-agent` suffix for disambiguation.

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `role-scope` | `coding-refactor`, `pr-code-review` | Config identifiers (YAML) |
| `Friendly Name` | "Coding & Refactor", "PR & Code Review" | Human-facing (AGENTS.md tables) |

### Constraints

- **Config identifier:** kebab-case, 2–4 segments
- **Human name:** title case, ampersands/spaces allowed (for docs only)
- **Suffix `-agent`:** optional in identifiers, helpful when agents coexist with skills
- **Unique per repo:** no two agents with the same first segment

### Examples

```
Config ID                Human Name
─────────────────────    ─────────────────────────
onboard-diagnose         Onboard & Diagnose
coding-refactor          Coding & Refactor
pr-code-review           PR & Code Review
ci-cd-devops             CI/CD & DevOps
maintenance-hygiene      Maintenance & Hygiene
```

## Instructions Files

### Recommended Pattern: `<topic>.instructions.md`

- **Repo-wide:** `copilot-instructions.md` (fixed name, at `.github/` root)
- **Path-specific:** `.github/instructions/<topic>.instructions.md`

### Topic Naming

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `tech-conventions` | `typescript.instructions.md` | Language/framework rules |
| `domain-focus` | `frontend.instructions.md` | Area-of-concern rules |
| `tech-domain-focus` | `react-best-practices.instructions.md` | Specific tech + focus |

### Constraints

- **Case:** kebab-case for multi-word topics
- **Extension:** always `.instructions.md` (required by Copilot discovery)
- **Length:** topic portion ≤ 3 segments, ≤ 40 characters
- **No overlap:** topics should be distinct; if two instructions have overlapping `applyTo` patterns, merge them

### Examples

```
✓ typescript.instructions.md
✓ frontend-best-practices.instructions.md
✓ backend-error-handling.instructions.md
✓ tests-naming-conventions.instructions.md
✓ github-actions-ci-cd.instructions.md

✗ my-rules.instructions.md          — non-descriptive
✗ TYPESCRIPT.instructions.md         — wrong case
✗ react-nextjs-tailwind.instructions.md  — too compound (split or generalize)
```

## Documentation

| File | Name | Location |
|------|------|----------|
| Agent context | `AGENTS.md` | Repo root (and optionally per-package in monorepos) |
| Claude config | `CLAUDE.md` | Repo root |
| Cursor rules | `*.mdc` | `.cursor/rules/` |
| Repo profile | `repo-profile.yml` | Repo root |

These names are fixed conventions from their respective ecosystems.

## Naming Profiles

Three pre-built profiles for the CLI wizard:

### Standard (recommended)

```yaml
naming:
  skills_pattern: "verb-ing-domain"
  agents_pattern: "role-scope"
  instructions_pattern: "topic"
```

### Functional

```yaml
naming:
  skills_pattern: "domain-verb"
  agents_pattern: "domain-role"
  instructions_pattern: "tech-domain-focus"
```

### Custom

User defines their own pattern with validation against the constraints above.

## Encoding in Generated Artifacts

When a naming profile is chosen, the CLI should:

1. Add a "Naming Conventions" section to generated AGENTS.md
2. Add a hint in copilot-instructions.md referencing AGENTS.md conventions
3. Store the choice in `repo-profile.yml` under `naming:`

This ensures all future AI-generated skills/agents/instructions follow the pattern
without the user having to re-specify it.
