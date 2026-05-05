# diagnose-brownfield

## Description

Scores a repository's AI-readiness across four dimensions: context/documentation, verification infrastructure, configuration hygiene, and safety/governance. Produces a readiness level (Basic → Ready → Advanced), per-dimension scores, and a prioritized repair checklist mapped to maintenance meta-skills.

## Trigger

- Called by `onboard-repo` during brownfield strategy selection
- User asks "how AI-ready is this repo?", "diagnose my setup", or "assess config maturity"
- Before deciding how aggressively to modify existing AI configuration

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo-profile.yml | file | yes | Repository profile for context and risk assessment |
| target_repo_path | string | yes | Path to the repository to diagnose |
| depth | string | no | "quick" (surface checks) or "deep" (full verification) (default: "deep") |
| output_format | string | no | "markdown", "json", or "both" (default: "markdown") |

## Behavior

### Scoring Model

Each dimension scores 0-10. Overall = weighted average:

| Dimension | Weight | Measures |
|-----------|--------|----------|
| Context & Documentation | 0.30 | Can an agent understand this repo? |
| Verification Infrastructure | 0.25 | Can an agent safely make changes? |
| Config Hygiene | 0.25 | Are AI configs well-structured? |
| Safety & Governance | 0.20 | Are guardrails in place? |

**Readiness levels:** Basic (0-4): agents struggle | Ready (4-7): functional with guidance | Advanced (7-10): optimized for autonomy

### Dimension 1: Context & Documentation (0.30)

| Check | Pts | Criteria |
|-------|-----|----------|
| AGENTS.md exists | 2 | Present with content |
| AGENTS.md quality | 2 | Has overview, architecture, commands, conventions |
| Build/test commands | 2 | Clear single-obvious commands for run/test/lint |
| Architecture docs | 2 | Directory structure, patterns, boundaries explained |
| Conventions explicit | 1 | Naming, code org, error handling stated |
| Tech stack declared | 1 | Languages, frameworks, versions identifiable |

### Dimension 2: Verification Infrastructure (0.25)

| Check | Pts | Criteria |
|-------|-----|----------|
| Test suite exists | 2 | Tests present and runnable |
| Tests pass | 2 | Clean result currently |
| CI on PRs | 2 | GitHub Actions/CI runs on pull requests |
| Coverage reporting | 1 | Coverage measured (any threshold) |
| Linter configured | 1 | ESLint/Prettier/Ruff/etc present and runnable |
| Type checking | 1 | TypeScript strict, mypy, or equivalent |
| Low flakiness | 1 | No retry configs, skip annotations <5% |

### Dimension 3: Config Hygiene (0.25)

| Check | Pts | Criteria |
|-------|-----|----------|
| Provider configs exist | 2 | At least one provider configured |
| Within size budgets | 2 | Per maintenance-principles.md thresholds |
| No cross-file duplication | 2 | Rules don't repeat between AGENTS/instructions/CLAUDE |
| Core workflow skills | 1 | At least testing/review skills present |
| No contradictions | 1 | Rules consistent across all config files |
| Progressive disclosure | 1 | Root files link to focused docs, not monolithic |
| Provenance metadata | 1 | Generated configs track their source |

### Dimension 4: Safety & Governance (0.20)

| Check | Pts | Criteria |
|-------|-----|----------|
| No secrets in configs | 3 | Zero credentials/tokens in AI config files |
| Protected paths declared | 2 | Migrations, .env, config paths protected |
| Destructive actions guarded | 2 | No delete/deploy without approval |
| Tool permissions scoped | 2 | No unrestricted shell/write access |
| Escalation policies | 1 | Agents know when to ask for help |

### Steps

1. **Score each check** as pass (full), partial (half), or fail (0) — collect file:line evidence.
2. **Compute scores:** Per-dimension = sum/max×10; Overall = weighted average; assign readiness level.
3. **Map failures to repair meta-skills:**
   | Failed Check | Fixing Meta-Skill |
   |---|---|
   | AGENTS.md missing/poor | `create-instructions` / `refactor-instructions` |
   | Commands undocumented | `onboard-repo` (profile) |
   | Configs oversized | `refactor-instructions` |
   | Cross-file duplication | `refactor-instructions` + `sync-config` |
   | Provider drift | `detect-drift` + `sync-config` |
   | Skills missing | `create-skill` |
   | Security gaps | `audit-tool-safety` + `check-policy` |
   | No tests | (flag to human) |
4. **Order by impact:** Safety → Context → Hygiene → Optimization
5. **Generate report** with visual dashboard, dimension breakdown, and actionable repair plan.

### Constraints

- NEVER modify any files (pure read-only diagnosis)
- ALWAYS provide evidence for scores (specific files/lines)
- Scores MUST be reproducible (same repo state = same score)
- Repair plan MUST reference specific meta-skills
- Unevaluable checks → "unverifiable" (don't assume pass or fail)

### Error Handling

- Empty repo → score 0 across all dimensions, recommend greenfield
- Commands fail → "unverifiable" with partial credit
- Unparseable configs → config hygiene 0 for those files, note parse errors
- Git history unavailable → skip freshness checks, note limitation

## Examples

### Example: Partially configured monorepo

```
## Brownfield Diagnosis: acme/platform
Readiness Level: READY (6.2/10)

| Dimension | Score | Status |
|-----------|-------|--------|
| Context & Documentation | 7/10 | ✅ Good |
| Verification Infrastructure | 8/10 | ✅ Strong |
| Config Hygiene | 4/10 | ⚠️ Needs work |
| Safety & Governance | 5/10 | ⚠️ Gaps |

Top Issues:
1. CLAUDE.md 210 lines (budget:150) — duplicates AGENTS.md
2. No copilot-instructions.md (Copilot extension detected)
3. No protected_paths (migrations/ exposed)
4. AGENTS.md missing Error Handling section

Repair Plan:
| # | Action | Meta-Skill | Impact |
|---|--------|-----------|--------|
| 1 | Declare protected paths | `check-policy` | Safety +2 |
| 2 | Generate copilot-instructions | `create-instructions` | Config +2 |
| 3 | Refactor CLAUDE.md | `refactor-instructions` | Config +1 |
| 4 | Add Error Handling to AGENTS.md | `refactor-instructions` | Context +1 |

Estimated post-repair: 8.0/10 (ADVANCED)
```

## Metadata

```yaml
name: diagnose-brownfield
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
category: orchestration
```
