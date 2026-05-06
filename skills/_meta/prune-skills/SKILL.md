---
name: prune-skills
description: >
  Manage skill lifecycle — identify deprecation candidates, archive unused
  or stale skills, and update agent references. Use when pruning skills,
  cleaning the skill catalog, deprecating old skills, or removing unused
  entries after major upgrades.
version: 1.0.0
portability: requires-framework
---

# prune-skills
## Description

Manages the lifecycle of skills — identifying candidates for deprecation, archiving unused skills, updating agent references, and maintaining a clean, current skill catalog. Implements the lifecycle stages defined in .framework/standards.md § Maintenance.

## When to Use This Skill

This skill activates when:
- A user asks to "prune skills", "clean up skills", or "deprecate old skills"
- The health-dashboard identifies skills that haven't been triggered in 90+ days
- After a major framework/tool upgrade that may have obsoleted skills

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| skills_dir | string | yes | Directory containing skill subdirectories |
| action | string | no | "identify", "deprecate", "archive", or "full-cycle" (default: "identify") |
| staleness_days | integer | no | Days without use before flagging (default: 90) |
| usage_log_path | string | no | Path to usage log/metrics if available |
| archive_dir | string | no | Directory for archived skills (default: "skills-deprecated/") |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| candidates | object[] | Skills identified for deprecation/archival |
| actions_taken | object[] | What was done (if action != "identify") |
| agent_updates | object[] | Required agent definition updates after removals |
| migration_notes | text | Instructions for users of deprecated skills |

## Tools Required

- File system read (scan skills, git history, usage logs)
- File system write (add deprecation notices, move to archive)
- Git history access (last modified dates, commit frequency)

## Behavior

### Steps

1. **Gather Lifecycle Data:**
   For each skill, collect:
   - Last modified date (git log)
   - Last referenced in a commit message or PR (search)
   - Usage frequency (from logs if available, else heuristic)
   - Whether superseded by another skill (name/purpose similarity)
   - Whether its tools/dependencies are still installed

2. **Identify Pruning Candidates:**
   Flag a skill for pruning if ANY of:
   - Not modified or referenced in `staleness_days`
   - Its declared tools no longer exist in the project
   - Another skill covers the same capability (superseded)
   - The framework/library it targets has been removed
   - It references deprecated APIs or patterns

3. **Classify Candidates:**
   - **Deprecate:** Still functional but superseded — add notice, keep temporarily
   - **Archive:** Non-functional or clearly obsolete — move to archive dir
   - **Merge:** Overlaps with active skill — merge capabilities into the surviving skill

4. **Execute (if action != "identify"):**

   For **deprecate**:
   - Add deprecation header to SKILL.md (per .framework/standards.md § Maintenance protocol)
   - Set removal date (default: 30 days from now)
   - Note successor skill if applicable

   For **archive**:
   - Move skill directory to archive_dir
   - Remove references from agent definitions
   - Add entry to CHANGELOG or migration notes
   - Verify no remaining hard references in instruction files

   For **merge**:
   - Identify target skill to absorb capability
   - Propose combined SKILL.md (human must review)
   - Flag for human: "Merge skill-A into skill-B? [preview]"

5. **Update References:**
   - Scan agent definitions for references to pruned skills
   - Scan instruction files for mentions of pruned skills
   - Generate patch list: "Remove reference to X from agent Y line Z"

6. **Generate Migration Notes:**
   - Per pruned skill: what it did, why it's going away, what to use instead
   - Include any manual steps users need to take

### Constraints

- NEVER auto-archive without explicit user consent (identify mode by default)
- NEVER remove the last skill covering a critical capability without warning
- ALWAYS provide a migration path (successor skill or manual instructions)
- Deprecation notices MUST include removal date and successor
- Archive MUST preserve the skill (not delete) — it can be restored

### Error Handling

- If no usage data available: Fall back to git-based heuristics (last commit date)
- If skill is referenced by multiple agents: Require explicit confirmation before deprecating
- If archive_dir doesn't exist: Create it
- If a "superseded" claim is uncertain: Flag as "possible duplicate — needs human review"

## Examples

### Example 1: Identify pruning candidates

**Output:**
```
## Pruning Candidates

### Ready to Archive (2)
1. skill: react-class-components
   Reason: Project migrated to functional components 6 months ago
   Last used: 2025-11-15
   Successor: react-functional-patterns
   
2. skill: webpack-config
   Reason: Project switched to Vite; webpack removed from deps
   Last used: 2025-09-02
   Successor: None (capability no longer needed)

### Recommend Deprecation (1)
1. skill: manual-deploy
   Reason: Superseded by ci-deploy (automated)
   Last used: 2026-02-10 (once, as fallback)
   Action: Deprecate with 30-day notice, keep as emergency fallback

### Possible Merge (1)
1. skill: eslint-fix + skill: prettier-format
   Reason: Both triggered on "format code" — could be single lint-and-format skill
   Action: Review and decide

### Agent Updates Needed (if candidates archived)
- .github/agents/code-reviewer.agent.md line 12: remove "react-class-components"
- .github/agents/deploy-agent.agent.md line 8: remove "webpack-config"
```


