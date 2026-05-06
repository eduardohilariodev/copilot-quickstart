---
name: audit-skills
description: >
  Scan skill definitions for structural compliance, size violations,
  missing sections, and cross-skill duplication. Checks against
  .framework/standards.md for quality and completeness. Use when auditing
  skills, reviewing the skill catalog, checking skill quality, or after
  adding new skills.
version: 1.0.0
portability: requires-framework
---

# audit-skills
## Description

Scans skill definitions (SKILL.md files) for structural compliance, size violations, missing sections, hardcoded project-specifics, and cross-skill duplication. Produces a per-skill audit card with compliance score and concrete fix recommendations.

## When to Use This Skill

This skill activates when:
- A user asks to "audit skills", "check skill quality", or "review skill catalog"
- As part of periodic maintenance (recommended: every 60 days)
- After adding new skills (post-creation validation)

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| skills_dir | string | yes | Directory containing skill subdirectories |
| threshold_lines | integer | no | Max lines before flagging as oversized (default: 200) |
| check_cross_repo | boolean | no | Check for duplicate skills across linked repos (default: false) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| audit_report | text | Per-skill audit cards with findings |
| catalog_summary | text | Overview: total skills, healthy/warn/error counts |
| issues | object[] | Machine-readable issue list |
| decomposition_suggestions | object[] | Skills that should be split, with proposed breakdown |

## Tools Required

- File system read (scan skill directories and `.framework/standards.md`)
- Token counter

## Behavior

### Steps

1. **Discover Skills:**
   - Scan skills_dir recursively for SKILL.md files
   - Build catalog: name, path, line count, token count, last modified date

2. **Per-Skill Structural Audit:**
   For each SKILL.md, verify presence and quality of:
   - **Description** — clear, one-paragraph summary (required)
   - **Trigger** — specific activation conditions (required)
   - **Inputs** — complete table with types and descriptions (required)
   - **Outputs** — complete table with types and descriptions (required)
   - **Tools Required** — explicit list (required)
   - **Steps** — numbered, actionable behavior description (required)
   - **Constraints** — what the skill must NOT do (required)
   - **Error Handling** — failure modes and responses (required)
   - **Examples** — at least one input/output example (required)
   - **Metadata** — name, version, standards_version (required)

3. **Size and Complexity Check:**
   - Line count vs threshold (default: 200)
   - Step count (flag if > 8 steps — workflow, not skill)
   - Input count (flag if > 6 inputs — too complex interface)
   - Tool count (flag if > 5 tools — too broad scope)

4. **Content Quality Check:**
   - Detect hardcoded project-specific values (paths, package names, URLs)
   - Detect ambient dependencies (undeclared env vars, assumed installed tools)
   - Detect vague steps ("analyze the code" without specifying how)
   - Detect missing error paths (steps that can fail but have no error handling)

5. **Cross-Skill Analysis:**
   - Detect duplicate capabilities (two skills that do the same thing)
   - Detect overlapping triggers (ambiguous which skill activates)
   - Detect skill chains that could be consolidated
   - Identify shared logic candidates (extract into shared utility skill)

6. **Generate Audit Cards:**
   Per skill:
   ```
   ┌─ Skill: create-instructions ─────────────┐
   │ Lines: 142/200 ✅  Sections: 10/10 ✅    │
   │ Steps: 7/8 ✅      Inputs: 4/6 ✅        │
   │ Issues: 1 warning                         │
   │ ⚠️ Hardcoded path: "package.json" in step 1│
   │ Score: 92/100                             │
   └───────────────────────────────────────────┘
   ```

### Constraints

- NEVER modify skill files (read-only audit)
- ALWAYS check against current `.framework/standards.md`
- Decomposition suggestions MUST include proposed skill names and scope boundaries
- Cross-skill analysis MUST NOT flag intentional specialization as duplication

### Error Handling

- If SKILL.md is empty or unparseable: Report as critical error, skip to next
- If skills_dir contains no skills: Report "No skills found" with suggestion to use create-skill
- If a skill references non-existent tools: Flag as warning (tool may be provider-specific)

## Examples

### Example 1: Catalog audit

**Output (excerpt):**
```
## Skill Catalog Audit

Total skills: 8
Healthy (score ≥ 80): 5
Warnings (score 60-79): 2
Critical (score < 60): 1

### Critical Issues

❌ skill: legacy-deploy (score: 45/100)
   - Missing: Constraints, Error Handling, Examples
   - Oversized: 287 lines (threshold: 200)
   - 12 steps (threshold: 8) — decompose into: pre-deploy-check, deploy-execute, post-deploy-verify
   - Hardcoded: 3 project-specific paths, 2 environment variables

### Warnings

⚠️ skill: code-review + skill: pr-review — overlapping triggers
   Both activate on "pull request available for review"
   Suggestion: Merge into single skill or differentiate triggers

⚠️ skill: format-code (score: 68/100)
   - Missing: Examples section
   - Vague step 3: "format the code appropriately" → specify formatter and config
```


