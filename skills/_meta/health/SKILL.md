---
name: health-dashboard
description: >
  Generate a comprehensive configuration health report measuring compliance,
  freshness, and consistency. Use for config health checks, maintenance
  status, or before major changes.
version: 1.0.0
---

# health-dashboard

## Description

Generates a comprehensive configuration health report for a repository (or organization). Measures compliance with standards, identifies maintenance priorities, and produces actionable summaries that can feed into CI pipelines or human review processes.

## When to Use This Skill

This skill activates when:
- A user asks for a "config health check", "maintenance status", or "config overview"
- As a scheduled periodic check (recommended: weekly for active repos)
- Before major changes to verify baseline health

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to repository (or org root for multi-repo) |
| output_format | string | no | "markdown", "json", or "both" (default: "markdown") |
| include_recommendations | boolean | no | Include prioritized fix suggestions (default: true) |
| compare_to_baseline | string | no | Path to previous report for trend comparison |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| report | text | Human-readable health dashboard |
| report_json | object | Machine-readable metrics (for CI/dashboards) |
| priorities | object[] | Ranked list of maintenance actions to take |
| trend | object | Improvement/regression since baseline (if provided) |

## Tools Required

- File system read (scan entire repo config surface)
- Token counter
- Git history (for staleness assessment)

## Behavior

### Steps

1. **Inventory All Config Artifacts:**
   Scan for and catalog:
   - Instruction files (copilot-instructions, CLAUDE.md, .cursor/rules/)
   - Documentation files (AGENTS.md, README with agent context)
   - Skill definitions (.github/skills/, .skills/)
   - Agent definitions (YAML configs)
   - Repo profile (repo-profile.yml if present)

2. **Measure Per-Artifact Health:**
   For each discovered artifact, compute:
   - **Size:** lines, tokens, vs threshold (% of budget used)
   - **Structure:** required sections present/missing
   - **Freshness:** last modified date, days since update
   - **Quality:** lint score (run lint-instructions logic inline)
   - **Drift risk:** days since last sync across providers

3. **Compute Aggregate Metrics:**
   - **Coverage score:** % of recommended configs that exist
   - **Compliance score:** average quality across all artifacts
   - **Freshness score:** % of artifacts updated within 90 days
   - **Consistency score:** cross-provider drift level (0 = no drift)
   - **Overall health:** weighted combination of above

4. **Detect Smells:**
   - Files exceeding size thresholds
   - Duplicate rules across multiple files
   - Skills with overlapping triggers
   - Orphaned skills (not referenced by any agent)
   - Missing critical configs (no copilot-instructions in a repo with Copilot)
   - Deprecated skills past their removal date

5. **Generate Priorities:**
   Rank maintenance actions by impact:
   - **Critical:** Security issues, broken references, contradictions
   - **High:** Oversized files, missing required configs
   - **Medium:** Stale configs, minor drift, missing examples
   - **Low:** Style improvements, optional optimizations

6. **Render Dashboard:**

   Markdown format:
   ```
   # Config Health: my-org/my-repo
   
   Overall Health: 7.2/10 ████████░░
   
   | Metric | Score | Status |
   |--------|-------|--------|
   | Coverage | 85% | ✅ |
   | Compliance | 72% | ⚠️ |
   | Freshness | 90% | ✅ |
   | Consistency | 60% | ⚠️ |
   
   ## Top Priorities
   1. [HIGH] Refactor AGENTS.md (135 lines, exceeds 120 threshold)
   2. [HIGH] Fix 3 stale references in copilot-instructions
   3. [MEDIUM] Sync CLAUDE.md (4 rules missing vs canonical)
   ```

### Constraints

- NEVER modify any files (pure read-only analysis)
- ALWAYS produce actionable output (not just scores, but "what to do")
- JSON output MUST be stable schema (for CI integration)
- Comparisons to baseline MUST use same methodology (scores are comparable)
- Report MUST complete in reasonable time (skip deep analysis for huge repos)

### Error Handling

- If repo has zero AI configs: Report "unconfigured" with suggestion to bootstrap using create-* skills
- If some configs are unparseable: Report parse errors, compute scores for parseable subset
- If baseline format is outdated: Report without comparison, note incompatibility

## Examples

### Example 1: Healthy repo with minor issues

**Output:**
```
# Config Health: acme/web-platform

Overall Health: 8.4/10 █████████░

| Metric | Score | Trend | Status |
|--------|-------|-------|--------|
| Coverage | 100% | — | ✅ |
| Compliance | 88% | +3% | ✅ |
| Freshness | 95% | — | ✅ |
| Consistency | 72% | -5% | ⚠️ |

## Inventory
- ✅ .github/copilot-instructions.md (68/80 lines, score 91)
- ✅ AGENTS.md (95/120 lines, score 88)
- ✅ CLAUDE.md (110/150 lines, score 85)
- ⚠️ .cursor/rules/ (3 files, 1 exceeds 40-line threshold)
- ✅ Skills: 5 defined, all pass audit

## Top 3 Priorities
1. [MEDIUM] Consistency dropped: CLAUDE.md missing 2 rules added to copilot-instructions last week
   → Run: sync-config (source: copilot, target: claude)
2. [MEDIUM] .cursor/rules/testing.mdc is 52 lines (threshold: 40)
   → Run: refactor-instructions (split into testing-unit.mdc + testing-e2e.mdc)
3. [LOW] AGENTS.md "deployment" section hasn't been updated in 85 days
   → Review: verify deployment docs still accurate
```


