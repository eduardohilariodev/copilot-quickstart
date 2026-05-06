---
name: evaluate-config
description: >
  Audit existing AI configuration files against copilot-quickstart standards
  with actionable fix recommendations. Use when evaluating, auditing, or
  reviewing AI configurations.
version: 1.0.0
---

# evaluate-config

## Description

Audits existing AI configuration files against copilot-quickstart standards. Produces a detailed compliance report with actionable fix recommendations. Works on any combination of Copilot instructions, CLAUDE.md, Cursor rules, AGENTS.md, and skill definitions.

## When to Use This Skill

This skill activates when:
- The user asks to evaluate, audit, or review their AI configurations
- The user says "evaluate config", "audit instructions", "check compliance"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_path | string | yes | Path to file or directory to evaluate |
| scope | string | no | What to evaluate: "all", "instructions", "agents", "skills" (default: "all") |
| standards_version | string | no | Standards version to check against (default: latest) |
| strict | boolean | no | If true, treat warnings as errors (default: false) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| report | text | Detailed evaluation report with scores and recommendations |
| issues | object[] | Machine-readable list of issues found |
| score | number | Overall compliance score (0.0 - 5.0) |

## Tools Required

- File system read (to read config files and source-of-truth)
- Schema validation

## Behavior

### Steps

1. **Discover Configs:**
   - Scan target path for known config files:
     - `.github/copilot-instructions.md`
     - `CLAUDE.md`
     - `.cursor/rules/*.mdc`
     - `AGENTS.md`
     - `.github/skills/*/SKILL.md`
     - Any YAML agent definitions
   - Report what was found and what's missing

2. **Load Evaluation Criteria:**
   - Load all `source-of-truth/` documents
   - Load relevant schemas from `schemas/`
   - Build checklist from `templates/eval-suite.md`

3. **Evaluate Each Artifact:**

   **For Instructions:**
   - Token count vs budget
   - Imperative mood compliance
   - Atomicity check (compound rules flagged)
   - Specificity check (vague rules flagged)
   - Example presence for complex rules
   - Anti-pattern scan
   - Cross-reference verification (do paths/commands exist?)

   **For Agent Definitions:**
   - Schema compliance
   - Least-privilege tool check
   - Escalation policy presence
   - Constraint completeness
   - God Agent / Unguarded / Amnesiac pattern check

   **For Skills:**
   - Schema compliance
   - Input completeness (no ambient dependencies)
   - Output contract clarity
   - Side-effect declaration
   - Trigger specificity

   **For Documentation (AGENTS.md):**
   - Freshness (do referenced paths exist?)
   - Completeness (key sections present)
   - No behavioral directives (those belong in instructions)

4. **Cross-Artifact Checks:**
   - Duplication detection across files
   - Contradiction detection between rules
   - Provider consistency (if multiple providers configured)
   - Reference integrity (skills reference existing tools, agents reference existing skills)

5. **Score and Report:**
   - Calculate per-dimension scores (compliance, quality, security, accuracy)
   - Apply weights per `eval-suite.md` template
   - Generate actionable recommendations sorted by impact
   - Classify each issue: error (must fix), warning (should fix), info (nice to fix)

### Constraints

- NEVER modify the files being evaluated (read-only)
- ALWAYS provide specific fix suggestions (not just "this is wrong")
- ALWAYS reference the standard being violated (with section link)
- Report MUST be actionable by a developer without reading the full standards

### Error Handling

- If no config files found: Report absence and suggest using create-* skills
- If standards version doesn't match: Note version mismatch, evaluate against requested version
- If files are malformed/unparseable: Report parse error location, continue with parseable sections

## Examples

### Example 1: Evaluate a copilot-instructions.md

**Input:**
```
target_path: ./my-repo/.github/copilot-instructions.md
scope: instructions
```

**Output (excerpt):**
```
## Evaluation Report: copilot-instructions.md

Score: 3.8 / 5.0

### Issues Found (7)

❌ ERROR: Line 12 - Vague instruction: "Follow best practices for testing"
   Fix: Replace with specific rules like "Write unit tests using Jest with 
        describe/it blocks for all exported functions"
   Standard: prompt-engineering-guide.md § Anti-Patterns

⚠️ WARNING: Line 25 - Compound rule (3 rules in one statement)
   Fix: Split into separate atomic statements
   Standard: prompt-engineering-guide.md § Core Principles > Be Atomic

⚠️ WARNING: Token count 2847 exceeds recommended budget of 2000
   Fix: Remove lower-priority rules or split into focused instruction sets
   Standard: prompt-engineering-guide.md § Format Constraints

ℹ️ INFO: No examples provided for complex formatting rule on line 18
   Fix: Add a code block showing expected format
   Standard: prompt-engineering-guide.md § Core Principles > Provide Examples
```


