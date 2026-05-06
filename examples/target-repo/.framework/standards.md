# Standards Reference

> Version: 4.0.0 — Consolidated portable standards for AI configuration

---

## § Artifact Model

### Taxonomy

| Artifact | Scope | Consumer |
|----------|-------|----------|
| **Agent** (`.agent.md`) | Autonomous task executor with tool access | Platform |
| **Skill** (`SKILL.md`) | Reusable capability unit (prompt + tools + constraints) | Agent or human |
| **Instruction** (`.instructions.md`) | Behavioral directive injected into context | Agent/model |
| **Documentation** (`AGENTS.md`, `README`) | Human-readable reference and context | Human + Agent |

### Responsibility Boundaries

**Agent definitions MUST specify:** identity/role, available tools + permissions, constraints/guardrails, escalation policy, output format.
**Agent definitions MUST NOT:** contain business logic (delegate to skills), hard-code paths, grant unrestricted tool access, assume a specific provider.

**Skill definitions MUST specify:** trigger conditions, input requirements, output contract, tool dependencies, failure modes.
**Skill definitions MUST NOT:** depend on undeclared state, produce undeclared side effects, assume a specific agent context.

**Instructions MUST:** be imperative and unambiguous, be atomic (one rule per statement), be testable, use positive language, group logically.
**Instructions MUST NOT:** duplicate documentation, contain conditional logic better expressed as skill triggers, reference transient state, exceed context budget.

**Documentation MUST:** describe architecture/conventions/non-obvious decisions, be structured for both human and agent parsing, include "why" explanations.
**Documentation MUST NOT:** contain behavioral directives, define tool permissions, duplicate code comments.

### Precedence Order (highest first)

1. Session/user instructions — ephemeral overrides
2. Repository instructions — `.github/copilot-instructions.md`
3. Agent definition — role, tools, constraints
4. Skill definitions — capabilities and their rules
5. Documentation — context and reference

**Conflict resolution:** higher layers always win. More specific beats less specific. On ambiguity, escalate to user.

### Provider Mapping

| Concept | GitHub Copilot | Claude | Cursor |
|---------|---------------|--------|--------|
| Agent config | `copilot-setup-steps.yml` + instructions | `CLAUDE.md` + `AGENTS.md` | `.cursor/rules/*.mdc` |
| Instructions | `.github/copilot-instructions.md` | `CLAUDE.md` | `.cursor/rules/*.mdc` |
| Skills | `.github/skills/*/SKILL.md` | Skills (platform) | N/A (rules approximate) |
| Documentation | `AGENTS.md`, README | `CLAUDE.md` (mixed) | `.cursor/rules/*.mdc` (mixed) |

**Known gaps:** Cursor merges instructions + docs into `.mdc` files. Claude blends instructions and context in `CLAUDE.md`. Tool permissions are not portable across providers.

---

## § Writing Rules

### Core Principles

1. **Be imperative.** Write commands, not suggestions. ✅ "Use TypeScript strict mode." ❌ "You might want to consider…"
2. **Be specific.** Include the "what" and "how." ✅ "Format errors as `{ code: string, message: string }`." ❌ "Use a consistent error format."
3. **Be atomic.** One rule per statement. Compound rules are harder to follow and test.
4. **Use positive language.** State what TO do. Use negation only for explicit prohibitions.
5. **Provide examples.** Show don't tell, especially for formatting and style rules.

### Instruction Formula

```
[ACTION VERB] + [SPECIFIC TARGET] + [CONSTRAINT/FORMAT] + [EXAMPLE if complex]
```

Use "when/if" clauses for context-dependent behavior. Prefer measurable constraints over vague qualifiers.

### Structural Patterns

- Place safety constraints first (must never be overridden).
- Place most-used rules early (context window pressure).
- Place examples after the rule they illustrate.
- Place exceptions immediately after the rule they modify.
- Group rules by theme using clear markdown headers.
- Use XML-like tags (`<code_style>…</code_style>`) for scoping when the platform supports it.

### Format Constraints

- Use markdown headers for sections, code blocks for examples, bullet lists for parallel rules, bold for key terms, tables for mappings.
- Avoid numbered lists for unordered rules (implies false priority).
- Avoid deeply nested structures (max 2 levels).
- Avoid inline links (consume tokens and may not resolve).

---

## § Naming

### Skills

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `verb-ing-domain` | `testing-code` | Default — most skills |
| `domain-verb-ing` | `database-migrating` | When domain disambiguation matters |
| `verb-noun` | `create-skill` | Meta/operational skills |

### Agents

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `role-scope` | `coding-refactor` | Config identifiers (YAML) |
| Friendly Name | "Coding & Refactor" | Human-facing (docs) |

### Instructions

Use `<topic>.instructions.md`. Topic naming: `tech-conventions` (e.g., `typescript`), `domain-focus` (e.g., `frontend`), or `tech-domain-focus` (e.g., `react-best-practices`).

### Universal Constraints

- **Case:** kebab-case only (lowercase, hyphens).
- **Length:** 2–4 segments, max 40 characters.
- **Directory = name:** skill directory must match the `name` field in SKILL.md frontmatter.
- **Forbidden:** generic words alone (`helper`, `utils`, `misc`), provider names (`copilot-skill`).

---

## § Security

### Mandatory Rules

1. **No secrets in configuration.** Never include API keys, tokens, passwords, connection strings, private keys, or internal URLs. Reference environment variables or secret managers instead.
2. **Destructive action guardrails.** Require explicit human approval for: file/DB/cloud resource deletion, production deployment, access control changes, `sudo`/`--force` commands, financial transactions.
3. **Least privilege.** Grant agents only the tools needed for their defined scope. Never use `tools: ["*"]`.
4. **Output sanitization.** Generated artifacts must not contain executable code in config files, unbounded loops, references to proprietary systems, or social-engineering content.
5. **Provenance tracking.** Every generated artifact must include: source standards version, generation timestamp, input profile hash, generating tool/skill.

### Governance

| Artifact | Owner | Review Required | Auto-generate Allowed |
|----------|-------|-----------------|----------------------|
| Security constraints | Security team / admin | Always | No (human-authored) |
| Agent definitions | Engineering lead | Yes | Yes, with review |
| Instructions | Team consensus | PR review | Yes, with review |
| Skills | Skill author | PR review | Yes, with review |
| Documentation | Any contributor | PR review | Yes |

All configuration changes go through PR review. Security-related changes require designated reviewer approval. Generated artifacts are clearly marked and tracked separately.

### Risk Classification

| Level | Characteristics | Requirements |
|-------|----------------|--------------|
| Low | Personal projects, experiments | Basic safety rules |
| Medium | Team projects, internal tools | Full security rules + review |
| High | Production services, financial systems | All rules + enhanced guardrails + audit |
| Critical | Security/auth infrastructure | Maximum restrictions + manual review of all AI changes |

### Drift Prevention

- Maintain a single source of truth for all behavioral rules.
- Prefer regeneration over manual patches.
- When standards change, regenerate all affected artifacts atomically.
- Track which standards version each artifact was generated from.

---

## § Maintenance

### Size Thresholds

| Artifact | Max Lines | Max Tokens | Action When Exceeded |
|----------|-----------|------------|---------------------|
| `copilot-instructions.md` | 80 | 2000 | Extract to child docs |
| `AGENTS.md` | 120 | 3000 | Link to architecture docs |
| `CLAUDE.md` | 150 | 4000 | Progressive disclosure |
| `SKILL.md` | 200 | 5000 | Decompose skill |
| `.cursor/rules/*.mdc` | 40 | 500 | Split into focused files |
| `.agent.md` | 80 | 2000 | Decompose agent |

When a file exceeds its threshold: identify sections serving a subset of tasks, extract into a focused child document, replace in root with a one-line reference.

### Lifecycle

```
DRAFT → ACTIVE → REVIEW → KEEP / MERGE / DEPRECATE → ARCHIVE
```

**Review triggers:** every 90 days for active configs, after model/framework upgrades, when a skill rarely triggers or frequently misfires.

### Pruning Criteria

Remove a config if it: never triggers in 90 days, duplicates model default behavior, conflicts with another rule resolved elsewhere, references tools/commands that no longer exist, or has been superseded.

### Deprecation Protocol

Mark deprecated artifacts with structured metadata:

```markdown
<!-- DEPRECATED: YYYY-MM-DD -->
<!-- REASON: Superseded by <replacement> -->
<!-- REMOVAL DATE: YYYY-MM-DD -->
<!-- MIGRATION: <instructions> -->
```

Minimum 7-day notice for team-shared configs. Move to `deprecated/` directory, then remove all references.

### Operational Principles

- Prefer small, reviewable changes (one file split per PR, one deprecation per change).
- Use template-driven fixes — instantiate from templates, preserve `<!-- LOCAL OVERRIDE -->` markers.
- After any maintenance change, validate compliance score did not drop.

---

## § Anti-Patterns

### Instruction Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Wishful Instruction | "Write clean code" — no actionable rule | Replace with specific, testable rules |
| Encyclopedia | Too many rules, exceeds context budget | Include only rules that change defaults, are project-specific, or were violated before |
| Contradiction | Two rules that cannot both be satisfied | Make precedence/exceptions explicit in the original rule |
| Temporal Reference | "Since PR #1234…" — tied to a moment | State current rule without history |

### Agent Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| God Agent | One agent does everything | Decompose into focused agents with clear boundaries |
| Unguarded Agent | No escalation policy, `tools: ["*"]` | Scope tools, add escalation conditions |
| Amnesiac Agent | No project context | Include stack, conventions, and architecture reference |

### Skill Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Ambient Skill | Depends on unstated assumptions | Declare all inputs, assumptions, preconditions |
| Side-Effect Skill | Modifies undeclared state | Declare all side effects in output contract |
| Monolith Skill | Handles entire workflow | Decompose into composable skills |

### Config Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Copy-Paste Config | Same rules in Copilot + Claude + Cursor | Single canonical source → render per-provider |
| Secret Config | Credentials in config files | Reference secret managers / env vars only |
| Drift-Prone Config | Generated config manually edited | Separate generated sections from manual overrides |

---

## § Copilot Platform

### Instruction Hierarchy (lowest → highest precedence)

1. Organization instructions (admin-set)
2. Repository-wide instructions (`.github/copilot-instructions.md`)
3. Path-specific instructions (`.github/instructions/*.instructions.md`)
4. User personal instructions

### Repository-Wide Instructions

- **Location:** `.github/copilot-instructions.md`
- **Scope:** All Copilot Chat interactions in the repo (VS Code, Visual Studio, GitHub.com, CLI, Cloud Agent).
- **Budget:** ~2000 tokens / ≤80 lines.
- **Does NOT affect:** inline completions (tab suggestions).

### Path-Specific Instructions (`applyTo`)

- **Location:** `.github/instructions/*.instructions.md`
- **Frontmatter:** YAML with `applyTo` glob pattern (comma-separated, OR logic, relative to repo root).
- **Behavior:** merged when conversation touches matching files; ignored otherwise.
- **Budget:** ≤40 lines / ~500 tokens each.
- **Discovery:** requires `chat.instructionsFilesLocations` in VS Code settings.

### Prompt Files vs Instructions

| Aspect | Instructions | Prompt Files |
|--------|-------------|--------------|
| Purpose | Persistent behavior rules | Reusable task-specific prompts |
| Activation | Automatic (always on) | Explicit invocation |
| Location | `.github/copilot-instructions.md`, `.github/instructions/` | `.github/prompts/*.prompt.md` |

Use instructions for rules that ALWAYS apply. Use prompt files for repeatable workflows triggered intentionally.

### Cloud Agent (Copilot Coding Agent)

Reads: `.github/copilot-instructions.md`, `AGENTS.md`, `copilot-setup-steps.yml`.
Does NOT read: path-specific `.instructions.md` (planned), `.cursor/rules`, `CLAUDE.md`.

### Feature × Surface Matrix

| Feature | Chat | Completions | Cloud Agent | Code Review |
|---------|------|-------------|-------------|-------------|
| Repo-wide instructions | ✅ | ❌ | ✅ | ✅ |
| Path-specific (`applyTo`) | ✅ | ❌ | ❌ | ✅ |
| User instructions | ✅ | ❌ | ❌ | ❌ |
| Org instructions | ✅ | ❌ | ✅ | ✅ |
| Prompt files | ✅ | ❌ | ❌ | ❌ |

### Configuration Best Practices

- Budget tokens wisely — repo-wide gets ~2000, path-specific ~500 each.
- Be behavioral, not procedural ("always use strict types" not "when you write a function, first…").
- Use `applyTo` for scoping — don't put all rules in one file.
- Test with `/context` to verify instructions load and their budget consumption.
- Reference, don't inline ("see AGENTS.md for architecture" instead of copying).

---

## Quality Criteria

A well-formed artifact set satisfies:

1. **No duplication** — each fact lives in exactly one place.
2. **Clear ownership** — each behavioral rule has one authoritative source.
3. **Testability** — every instruction can be verified by observing output.
4. **Minimality** — nothing included that doesn't change agent behavior.
5. **Portability** — provider-specific rendering is separate from canonical content.
6. **Safety** — destructive actions require explicit human approval.
7. **Provenance** — generated artifacts reference their source standards version.
