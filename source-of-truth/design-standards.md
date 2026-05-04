# Design Standards: Agents, Skills, Instructions & Documentation

> Version: 1.0.0  
> Status: Stable  
> Last updated: 2026-05-04

## Purpose

This document defines the **responsibilities, boundaries, and composition rules** for the four primary artifact types in AI-assisted development workflows. It is the canonical reference for all meta-skills that generate these artifacts.

---

## Artifact Taxonomy

| Artifact | Scope | Persistence | Consumer | Mutable at runtime? |
|----------|-------|-------------|----------|---------------------|
| **Agent** | Autonomous task executor with tool access | Session or persistent | Platform (Copilot, Claude, Cursor) | No |
| **Skill** | Reusable capability unit (prompt + tools + constraints) | Persistent | Agent or human | No |
| **Instruction** | Behavioral directive injected into context | Persistent (file) or ephemeral (session) | Agent/model | No |
| **Documentation** | Human-readable reference (AGENTS.md, README) | Persistent | Human + Agent (for context) | Yes (by humans) |

---

## Responsibility Boundaries

### Agents

An agent is a **configured persona with tool access** that executes multi-step tasks autonomously.

**An agent definition MUST specify:**
- Identity and role (who it is, what it does)
- Available tools and their permissions
- Constraints and guardrails (what it must NOT do)
- Escalation policy (when to stop and ask)
- Output format expectations

**An agent definition MUST NOT:**
- Contain business logic or domain knowledge (delegate to skills)
- Hard-code file paths or environment details (use intake profiles)
- Grant unrestricted tool access without justification
- Assume a specific provider (write provider-agnostic, render per-provider)

### Skills

A skill is a **self-contained capability** that an agent can invoke or a human can trigger.

**A skill definition MUST specify:**
- Clear trigger conditions (when to activate)
- Input requirements (what it needs)
- Output contract (what it produces)
- Tool dependencies (what it calls)
- Failure modes and fallbacks

**A skill definition MUST NOT:**
- Depend on ambient state not declared in inputs
- Produce side effects not declared in outputs
- Assume a specific agent context
- Contain instructions unrelated to its capability

### Instructions

Instructions are **behavioral directives** that shape how an agent/model operates.

**Instructions MUST:**
- Be imperative and unambiguous ("Use X" not "You might want to use X")
- Be atomic (one rule per statement)
- Be testable (an observer can verify compliance)
- Use positive language ("Do X" preferred over "Don't do Y", unless prohibiting)
- Group logically with clear section headers

**Instructions MUST NOT:**
- Duplicate information available in documentation
- Contain conditional logic better expressed as skill triggers
- Reference transient state (specific PR numbers, dates, etc.)
- Exceed context budget (prefer concise over comprehensive)

### Documentation (AGENTS.md, CLAUDE.md, README)

Documentation is **contextual reference** that agents and humans read for understanding.

**Documentation MUST:**
- Describe architecture, conventions, and non-obvious decisions
- Be up-to-date with the actual codebase
- Be structured for both human scanning and agent parsing
- Include "why" explanations, not just "what"

**Documentation MUST NOT:**
- Contain behavioral directives (those go in instructions)
- Define tool permissions (those go in agent configs)
- Duplicate what code comments already explain

---

## Composition Rules

### Layering Order (highest precedence first)

1. **Session/user instructions** — ephemeral overrides
2. **Repository instructions** — `.github/copilot-instructions.md`, `CLAUDE.md`
3. **Agent definition** — role, tools, constraints
4. **Skill definitions** — capabilities and their rules
5. **Documentation** — context and reference

### Conflict Resolution

- Later layers CANNOT override earlier layers (security constraints always win)
- If two instructions conflict, the more specific one wins
- If ambiguity remains, the agent MUST escalate to the user

### Cross-Referencing

- Skills MAY reference source-of-truth documents for standards
- Instructions SHOULD NOT reference other instruction files (self-contained)
- Agents MAY compose multiple skills
- Documentation MAY reference all other artifacts

---

## Provider Mapping

| Concept | GitHub Copilot | Claude (Anthropic) | Cursor |
|---------|---------------|-------------------|--------|
| Agent config | `copilot-setup-steps.yml` + instructions | `CLAUDE.md` + `AGENTS.md` | `.cursor/rules/*.mdc` |
| Instructions | `.github/copilot-instructions.md` | `CLAUDE.md` | `.cursor/rules/*.mdc` |
| Skills | `.github/skills/*/SKILL.md` | Skills (platform) | N/A (rules approximate) |
| Documentation | `AGENTS.md`, README | `CLAUDE.md` (mixed) | `.cursor/rules/*.mdc` (mixed) |

### Known Incompatibilities

- **Cursor** merges instructions + documentation into single `.mdc` files (no clean separation)
- **Claude** uses `CLAUDE.md` for both instructions and context (blended)
- **Copilot** has the cleanest separation but skills require specific file structure
- **Tool permissions** are not portable across providers (each has different security models)

---

## Quality Criteria

A well-formed artifact set satisfies:

1. **No duplication** — each fact lives in exactly one place
2. **Clear ownership** — each behavioral rule has one authoritative source
3. **Testability** — every instruction can be verified by observing output
4. **Minimality** — nothing included that doesn't change agent behavior
5. **Portability** — provider-specific rendering is separate from canonical content
6. **Safety** — destructive actions require explicit human approval
7. **Provenance** — generated artifacts reference their source standards version
