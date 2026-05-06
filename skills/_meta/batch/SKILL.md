---
name: batch-maintain
description: >
  Orchestrate maintenance across multiple repositories — run health checks,
  identify work, and create issues or PRs. Use for org-wide cleanup, batch
  maintenance, or after standards updates.
version: 1.0.0
---

# batch-maintain

## Description

Orchestrates maintenance across multiple repositories in an organization. Runs health checks on each repo, identifies maintenance work, and creates GitHub issues or PRs assigned to human maintainers or Copilot agents with clear, scoped task descriptions.

## When to Use This Skill

This skill activates when:
- A user asks to "maintain across repos", "org-wide cleanup", or "batch maintenance"
- Scheduled by an organization-level automation (weekly/monthly)
- After a standards version bump (all repos need alignment check)

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repos | string[] | yes | List of repos (owner/repo format) or path to org config |
| actions | string[] | no | Which maintenance to run: "health", "lint", "drift", "audit", "prune" (default: ["health"]) |
| assignee | string | no | Who to assign issues to: username, "copilot", or "team:slug" (default: none) |
| create_issues | boolean | no | Create GitHub issues for findings (default: false) |
| create_prs | boolean | no | Create PRs with auto-fixes (default: false) |
| max_issues_per_repo | integer | no | Limit issues created per repo (default: 3) |
| dry_run | boolean | no | Preview what would be created without creating (default: true) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| summary | text | Org-wide maintenance summary |
| per_repo_results | object[] | Health/audit results per repo |
| created_issues | object[] | Issues created (if create_issues=true) |
| created_prs | object[] | PRs created (if create_prs=true) |

## Tools Required

- File system read (scan repos if local)
- GitHub API (list repos, create issues/PRs)
- Meta-skill invocation (runs health-dashboard, lint-instructions, etc.)

## Behavior

### Steps

1. **Resolve Repo List:**
   - If org name: fetch all repos (optionally filtered by topic, language, activity)
   - If explicit list: validate repos exist and are accessible
   - Sort by priority: most active repos first

2. **Run Maintenance Per Repo:**
   For each repo, execute requested actions:
   - `health` → run health-dashboard, collect scores
   - `lint` → run lint-instructions on all config files
   - `drift` → run detect-drift across providers
   - `audit` → run audit-skills on skill catalog
   - `prune` → run prune-skills in identify mode

3. **Aggregate and Prioritize:**
   - Rank repos by health score (worst first)
   - Identify common patterns across repos (same issue in many repos)
   - Group issues by type for efficient batch resolution

4. **Generate Work Items (if create_issues or create_prs):**
   Each issue/PR follows a template:
   ```markdown
   ## Config Maintenance: [specific task]
   
   **Priority:** [HIGH/MEDIUM/LOW]
   **Source:** copilot-quickstart health check (standards v1.0.0)
   **Estimated effort:** [small/medium]
   
   ### Problem
   [Specific, measurable description of what's wrong]
   
   ### Proposed Fix
   [Concrete steps or diff showing the fix]
   
   ### Acceptance Criteria
   - [ ] [Measurable verification]
   - [ ] Config health score improves by X points
   - [ ] No regressions in evaluate-config output
   ```

5. **Rate Limiting and Safety:**
   - Respect max_issues_per_repo to avoid flooding
   - Space issue creation to avoid spam
   - Group related issues into single meta-issue where possible
   - Never create duplicate issues (check existing open issues first)

6. **Report:**
   - Org-wide summary: "X repos checked, Y issues found, Z auto-fixable"
   - Per-repo cards with score and top actions
   - Trend data if previous batch run exists

### Constraints

- NEVER create issues/PRs in dry_run mode (default is dry_run=true)
- NEVER flood a repo with more than max_issues_per_repo
- ALWAYS make issues small and scoped (one clear task per issue)
- ALWAYS check for existing open maintenance issues before creating duplicates
- Issues assigned to Copilot MUST have sufficient context to complete autonomously
- PRs MUST be scoped to one logical change (not "fix all maintenance issues")

### Error Handling

- If repo is inaccessible: Skip with warning, continue with others
- If a maintenance action fails on a repo: Log error, continue with others
- If issue creation fails: Retry once, then log and continue
- If rate limited: Pause, report progress so far, resume later

## Examples

### Example 1: Org-wide health check with issue creation

**Input:**
```
repos: ["acme/web-platform", "acme/api-service", "acme/shared-libs"]
actions: ["health", "lint"]
create_issues: true
assignee: "copilot"
max_issues_per_repo: 2
dry_run: false
```

**Output:**
```
## Batch Maintenance Summary

Repos checked: 3
Total issues found: 7
Issues created: 5 (capped at 2/repo, 1 repo was healthy)

| Repo | Health | Issues Created |
|------|--------|----------------|
| acme/web-platform | 8.4/10 | 0 (healthy) |
| acme/api-service | 5.8/10 | 2 |
| acme/shared-libs | 6.5/10 | 2 |

### Created Issues
1. acme/api-service#142: "Refactor AGENTS.md: split oversized testing section"
   Assigned: @copilot | Priority: HIGH
2. acme/api-service#143: "Fix 5 stale file references in copilot-instructions"
   Assigned: @copilot | Priority: HIGH
3. acme/shared-libs#89: "Add missing copilot-instructions.md"
   Assigned: @copilot | Priority: HIGH
4. acme/shared-libs#90: "Deprecate legacy-bundler skill (replaced by vite-build)"
   Assigned: @copilot | Priority: MEDIUM
```


