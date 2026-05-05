# diagnose-brownfield

## Description

Scores an existing repository's AI-readiness across four dimensions: context/documentation, verification infrastructure, configuration hygiene, and safety/governance. Produces a readiness level (Basic → Ready → Advanced), per-dimension scores, and a prioritized repair checklist that maps directly to maintenance meta-skills.

## Trigger

This skill activates when:
- Called by `onboard-repo` during brownfield strategy selection
- A user asks "how AI-ready is this repo?", "diagnose my setup", or "assess config maturity"
- Before deciding how aggressively to modify an existing repo's AI configuration

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_repo_path | string | yes | Path to the repository to diagnose |
| depth | string | no | "quick" (surface checks) or "deep" (full verification) (default: "deep") |
| output_format | string | no | "markdown", "json", or "both" (default: "markdown") |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| readiness_level | string | "basic", "ready", or "advanced" |
| overall_score | number | Composite score 0-10 |
| dimension_scores | object | Per-dimension breakdown (4 scores) |
| diagnosis_report | text | Detailed findings and recommendations |
| repair_plan | object[] | Ordered list of fixes mapped to meta-skills |

## Tools Required

- File system read (scan repo structure, configs, CI, tests)
- Command execution (verify build/test commands, check coverage)
- Git history (assess freshness and maintenance patterns)

## Behavior

### Scoring Model

Each dimension scores 0-10. Overall = weighted average:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Context & Documentation | 0.30 | Can an agent understand this repo? |
| Verification Infrastructure | 0.25 | Can an agent safely make changes? |
| Config Hygiene | 0.25 | Are AI configs well-structured? |
| Safety & Governance | 0.20 | Are guardrails in place? |

**Readiness levels:**
- **Basic** (0-4): Minimal AI config; agents will struggle
- **Ready** (4-7): Functional setup; agents can work with guidance
- **Advanced** (7-10): Optimized for autonomous agent operation

### Dimension 1: Context & Documentation (weight: 0.30)

Evaluates whether an AI agent can understand the repo without guessing.

| Check | Points | Criteria |
|-------|--------|----------|
| AGENTS.md exists | 2 | Present and has content |
| AGENTS.md quality | 2 | Has: overview, architecture, commands, conventions |
| Build/test commands documented | 2 | Clear, single-obvious commands for run/test/lint |
| Architecture documented | 2 | Directory structure, key patterns, boundaries explained |
| Conventions explicit | 1 | Naming, code org, error handling stated |
| Tech stack declared | 1 | Languages, frameworks, versions identifiable |

**Scoring:**
- 0-2: No agent-readable docs. Agent will hallucinate project structure.
- 3-5: Partial docs. Agent can work but will make assumption errors.
- 6-8: Good docs. Agent has enough context for most tasks.
- 9-10: Excellent. Agent has comprehensive, fresh, well-structured context.

### Dimension 2: Verification Infrastructure (weight: 0.25)

Evaluates whether changes can be verified automatically (safety net for agents).

| Check | Points | Criteria |
|-------|--------|----------|
| Test suite exists | 2 | Tests present and runnable |
| Tests pass currently | 2 | Running tests gives clean result |
| CI on pull requests | 2 | GitHub Actions/CI runs on PRs |
| Coverage reporting | 1 | Coverage measured (any threshold) |
| Linter configured | 1 | ESLint/Prettier/Ruff/etc. present and runnable |
| Type checking | 1 | TypeScript strict, mypy, or equivalent |
| Low flakiness | 1 | Tests reliable (heuristic: no retry configs, no skip annotations > 5%) |

**Scoring:**
- 0-2: No safety net. Agent changes are unverifiable.
- 3-5: Basic tests. Agent can verify happy paths.
- 6-8: Solid CI. Agent changes are well-guarded.
- 9-10: Comprehensive. Agent can operate with high autonomy.

### Dimension 3: Config Hygiene (weight: 0.25)

Evaluates the quality of existing AI configuration (per design-standards.md and maintenance-principles.md).

| Check | Points | Criteria |
|-------|--------|----------|
| Provider configs exist | 2 | At least one provider configured |
| Configs within size budgets | 2 | Per maintenance-principles.md thresholds |
| No duplication across files | 2 | Rules don't repeat between AGENTS/instructions/CLAUDE |
| Skills defined for core workflows | 1 | At least testing/review skills present |
| No contradictions | 1 | Rules consistent across all config files |
| Progressive disclosure used | 1 | Root files link to focused docs, not monolithic |
| Provenance metadata present | 1 | Generated configs track their source |

**Scoring:**
- 0-2: No AI config or severely broken. Needs full greenfield generation.
- 3-5: Partial config. Functional but has hygiene issues.
- 6-8: Well-structured. Minor drift or gaps to fix.
- 9-10: Exemplary. Fully standards-compliant, well-maintained.

### Dimension 4: Safety & Governance (weight: 0.20)

Evaluates whether guardrails prevent AI agents from causing harm.

| Check | Points | Criteria |
|-------|--------|----------|
| No secrets in configs | 3 | Zero credentials/tokens in any AI config file |
| Protected paths declared | 2 | Migrations, .env, config paths protected |
| Destructive actions guarded | 2 | Agents can't delete/deploy without approval |
| Tool permissions scoped | 2 | No unrestricted shell/write access |
| Escalation policies defined | 1 | Agents know when to ask for help |

**Scoring:**
- 0-3: Dangerous. Agent could cause irreversible damage.
- 4-6: Basic guardrails. Major risks covered but gaps exist.
- 7-8: Well-guarded. Appropriate for medium-risk repos.
- 9-10: Hardened. Suitable for high/critical-risk environments.

### Steps

1. **Run all dimension checks:**
   - Score each check as pass (full points), partial (half), or fail (0)
   - Collect evidence for each score (file:line references)

2. **Compute scores:**
   - Per-dimension: sum of check points / max possible × 10
   - Overall: weighted average of dimensions
   - Readiness level: based on overall score thresholds

3. **Identify repair priorities:**
   Map each failed check to the meta-skill that fixes it:
   
   | Failed Check | Fixing Meta-Skill |
   |--------------|-------------------|
   | AGENTS.md missing/poor | `create-instructions` or `refactor-instructions` |
   | Commands not documented | `onboard-repo` (profile generation) |
   | Configs oversized | `refactor-instructions` |
   | Cross-file duplication | `refactor-instructions` + `sync-config` |
   | Provider drift | `detect-drift` + `sync-config` |
   | Skills missing | `create-skill` |
   | Security gaps | `audit-tool-safety` + `check-policy` |
   | No tests | (manual — flag to human) |

4. **Order repairs by impact:**
   - Priority 1: Safety issues (prevent damage)
   - Priority 2: Context gaps (enable agent understanding)
   - Priority 3: Hygiene issues (improve quality)
   - Priority 4: Optimization (nice-to-have)

5. **Generate report:**
   Include visual dashboard, per-dimension breakdown, and actionable repair plan.

### Constraints

- NEVER modify any files (pure read-only diagnosis)
- ALWAYS provide evidence for scores (specific files/lines)
- Scores MUST be reproducible (same repo state = same score)
- Repair plan MUST reference specific meta-skills (not vague advice)
- If a check can't be evaluated (e.g., can't run tests): mark as "unverifiable", don't assume pass or fail

### Error Handling

- If repo is empty: Score 0 across all dimensions, recommend greenfield onboarding
- If commands fail during verification: Score that check as "unverifiable" (partial credit)
- If configs are unparseable: Score config hygiene as 0 for those files, note parse errors
- If git history unavailable: Skip freshness checks, note limitation

## Examples

### Example 1: Partially configured monorepo

**Output:**
```
## Brownfield Diagnosis: acme/platform

Readiness Level: READY (6.2/10)

### Dimension Scores
| Dimension | Score | Status |
|-----------|-------|--------|
| Context & Documentation | 7/10 | ✅ Good |
| Verification Infrastructure | 8/10 | ✅ Strong |
| Config Hygiene | 4/10 | ⚠️ Needs work |
| Safety & Governance | 5/10 | ⚠️ Gaps |

### Visualization
Context:       ███████░░░ 7/10
Verification:  ████████░░ 8/10
Config:        ████░░░░░░ 4/10
Safety:        █████░░░░░ 5/10
Overall:       ██████░░░░ 6.2/10

### Top Issues
1. ⚠️ Config: CLAUDE.md is 210 lines (budget: 150) — duplicates AGENTS.md content
2. ⚠️ Config: No copilot-instructions.md (Copilot extension detected)
3. ⚠️ Safety: No protected_paths declaration (migrations/ exposed)
4. ℹ️ Context: AGENTS.md missing "Error Handling" section

### Repair Plan (priority order)
| # | Action | Meta-Skill | Impact |
|---|--------|-----------|--------|
| 1 | Declare protected paths | `check-policy` | Safety +2 |
| 2 | Generate copilot-instructions | `create-instructions` | Config +2 |
| 3 | Refactor CLAUDE.md (split) | `refactor-instructions` | Config +1 |
| 4 | Add Error Handling to AGENTS.md | `refactor-instructions` | Context +1 |

### Estimated post-repair score: 8.0/10 (ADVANCED)
```

## Metadata

```yaml
name: diagnose-brownfield
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
category: orchestration
```
