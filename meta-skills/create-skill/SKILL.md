# create-skill

## Description

Generates a complete, standards-compliant SKILL.md file for a target repository. Scans the repo to understand context, applies prompt-engineering best practices, and validates output against the skill schema.

## Trigger

This skill activates when:
- The user requests creation of a new skill definition
- The user says "create skill", "generate skill", or "new skill"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| skill_name | string | yes | Identifier for the skill (kebab-case) |
| skill_purpose | string | yes | What the skill should do (natural language) |
| target_repo_path | string | no | Path to the target repo (defaults to cwd) |
| target_provider | string | no | Provider target: copilot, claude, cursor (default: copilot) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| skill_file | file | Generated SKILL.md conforming to standards |
| validation_report | text | Schema compliance and quality check results |

## Tools Required

- File system read (to scan target repo)
- File system write (to output SKILL.md)
- Schema validation

## Behavior

### Steps

1. **Intake** — Read the target repo's profile (if `repo-profile.yml` exists) or scan the repo to infer stack, conventions, and structure.
2. **Load Standards** — Read `source-of-truth/design-standards.md` and `source-of-truth/prompt-engineering-guide.md` for current rules.
3. **Load Template** — Read `templates/SKILL.md` as the structural base.
4. **Generate** — Fill the template using:
   - The user's stated purpose and name
   - Inferred inputs/outputs from the skill's purpose
   - Appropriate tools for the skill's domain
   - Constraints derived from the repo's risk level
5. **Validate** — Check the generated skill against `schemas/skill.schema.json`:
   - All required fields present
   - No anti-patterns (per `source-of-truth/anti-patterns.md`)
   - Instructions follow prompt-engineering guide
   - Trigger conditions are specific and testable
6. **Output** — Write the SKILL.md file and report validation results.

### Constraints

- NEVER invent tools or capabilities not available in the target provider
- NEVER include secrets or environment-specific values
- ALWAYS include at least one example in the generated skill
- ALWAYS declare all inputs explicitly (no ambient dependencies)
- Generated skills MUST be self-contained and composable

### Error Handling

- If target repo cannot be scanned: Ask user for manual input about stack/conventions
- If skill purpose is too vague: Ask user for clarification with specific questions
- If generated output fails schema validation: Fix issues and re-validate (max 3 attempts)

## Examples

### Example 1: Create a code review skill

**Input:**
```
skill_name: review-security
skill_purpose: Review pull request diffs for common security vulnerabilities including SQL injection, XSS, and secrets leakage
target_provider: copilot
```

**Output:** A SKILL.md file with:
- Trigger: PR diff available for review
- Inputs: diff content, file paths, language
- Outputs: list of findings with severity, location, and remediation
- Steps: parse diff → pattern match → contextual analysis → report
- Constraints: no false positives for common patterns, flag uncertain findings as "needs review"

## Metadata

```yaml
name: create-skill
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
```
