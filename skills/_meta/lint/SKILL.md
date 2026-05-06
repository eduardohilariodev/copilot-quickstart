---
name: lint-instructions
description: >
  Lint instruction files against prompt-engineering standards — check
  structure, rule quality, size budgets, and anti-patterns. Use when
  linting, checking, or validating instruction files.
version: 1.0.0
---

# lint-instructions

## Description

Lints instruction files (AGENTS.md, copilot-instructions.md, CLAUDE.md, .cursor/rules/*.mdc) against prompt-engineering standards. Checks structure, section ordering, rule quality, size budgets, and flags anti-patterns — producing actionable fix suggestions for every issue found.

## When to Use This Skill

This skill activates when:
- A user asks to "lint", "check", or "validate" their instruction files
- As part of a CI pipeline checking config quality
- After `create-instructions` or `refactor-instructions` runs (post-generation validation)

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_paths | string[] | yes | Paths to instruction files or directories to scan |
| severity_threshold | string | no | Minimum severity to report: "error", "warning", "info" (default: "warning") |
| auto_fix | boolean | no | Attempt automatic fixes for simple issues (default: false) |
| output_format | string | no | "markdown", "json", or "sarif" (default: "markdown") |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| report | text | Linting report with issues, locations, and fix suggestions |
| issues | object[] | Machine-readable issue list with severity, rule, location, fix |
| fixed_files | file[] | Auto-fixed files (only if auto_fix=true) |
| score | number | Quality score (0-100) |

## Tools Required

- File system read (scan instruction files and source-of-truth)
- File system write (if auto_fix=true)
- Token counter

## Behavior

### Steps

1. **Discover and Parse:**
   - Find all instruction files in target paths
   - Parse each into sections and individual rules
   - Count tokens per file and per section

2. **Structural Checks:**
   - Required sections present (per `design-standards.md`):
     - copilot-instructions: code style, testing, git, security (minimum)
     - AGENTS.md: overview, architecture, commands, conventions
     - CLAUDE.md: project context, commands, rules
   - Section ordering follows priority (security first, style last)
   - No orphaned content outside sections

3. **Rule Quality Checks (per prompt-engineering-guide.md):**
   For each individual rule:
   - **Imperative mood:** starts with action verb (Use, Write, Return, Validate...)
   - **Atomicity:** one concept per statement (flag compound rules with "and"/"or" joining unrelated clauses)
   - **Specificity:** no vague terms without qualification ("best practices", "clean code", "be careful")
   - **Testability:** an observer could verify compliance
   - **Positive language:** prefers "Do X" over "Don't do Y" (flag, don't error)
   - **Example presence:** complex formatting rules have code examples

4. **Size Budget Checks (per maintenance-principles.md):**
   - Total file within provider budget
   - No single section exceeds 40% of total budget
   - Flag if file could be slimmed (rules that duplicate model defaults)

5. **Anti-Pattern Detection (per anti-patterns.md):**
   - Wishful instructions ("write good code")
   - Temporal references ("since PR #1234")
   - Provider-specific leakage in agnostic files
   - Contradictions between rules in same file
   - Duplicate rules (same concept, different wording)

6. **Cross-Reference Check:**
   - Referenced file paths exist in the repo
   - Referenced commands match package.json / Makefile / etc.
   - Referenced tools are available in the target provider

7. **Report Generation:**
   - Each issue includes: severity, rule violated, location (file:line), fix suggestion
   - Calculate overall score: 100 - (errors × 10) - (warnings × 3) - (infos × 1)
   - Group issues by file, then by severity

### Constraints

- NEVER modify files unless auto_fix=true is explicitly set
- ALWAYS cite the specific standard being violated (doc + section)
- Fix suggestions MUST be concrete (show replacement text, not just "fix this")
- Score MUST NOT exceed 100 or go below 0

### Error Handling

- If file is empty: Report as error "Empty instruction file — use create-instructions to generate"
- If file is not a recognized instruction format: Skip with info-level note
- If auto_fix would change semantics: Skip fix, report as "manual fix needed"

## Lint Rules Reference

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `INST-001` | error | Missing required section |
| `INST-002` | error | File exceeds token budget |
| `INST-003` | error | Contradiction detected |
| `INST-004` | warning | Non-imperative rule |
| `INST-005` | warning | Compound rule (not atomic) |
| `INST-006` | warning | Vague/untestable instruction |
| `INST-007` | warning | Section exceeds 40% of budget |
| `INST-008` | info | Missing example for complex rule |
| `INST-009` | info | Negative phrasing (could be positive) |
| `INST-010` | info | Duplicate of model default behavior |
| `INST-011` | error | Referenced path does not exist |
| `INST-012` | warning | Temporal reference detected |
| `INST-013` | error | Secret/credential pattern detected |

## Examples

### Example 1: Lint a copilot-instructions.md

**Output (markdown format):**
```
## Lint Report: .github/copilot-instructions.md

Score: 72/100

### Errors (2)
❌ INST-002 [line 1-95]: File is 2847 tokens, exceeds 2000 budget
   Fix: Extract testing section (lines 34-62) to docs/testing.md

❌ INST-011 [line 45]: Referenced path `src/utils/helpers.ts` does not exist
   Fix: Update to actual path or remove reference

### Warnings (3)
⚠️ INST-004 [line 8]: "It's good to use TypeScript strict mode"
   Fix: "Use TypeScript strict mode for all files."

⚠️ INST-005 [line 22]: Compound rule joins 3 concepts with "and"
   Fix: Split into 3 separate rules

⚠️ INST-006 [line 31]: "Follow best practices for error handling"
   Fix: "Return errors as Result<T, AppError>. Never throw in library code."
```


