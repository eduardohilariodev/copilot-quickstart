# Anti-Patterns in AI Configuration

> Version: 1.0.0  
> Status: Stable  
> Last updated: 2026-05-04

## Purpose

This document catalogs **common mistakes** in agent, skill, and instruction authoring. Use it as a negative reference when generating or reviewing configurations.

---

## Instruction Anti-Patterns

### 1. The Wishful Instruction

**Problem:** Stating desired outcomes without actionable rules.

```markdown
❌ "Write clean, maintainable code."
❌ "Follow best practices."
❌ "Be secure."
```

**Why it fails:** The model has no concrete behavior to anchor on. These are aspirations, not instructions.

**Fix:** Replace with specific, testable rules:
```markdown
✅ "Limit functions to 40 lines. Extract helpers when exceeded."
✅ "Validate all user input at API boundaries using zod schemas."
```

### 2. The Encyclopedia

**Problem:** Including every possible rule, far exceeding context budget.

**Why it fails:** Important rules get buried. Context window pressure causes the model to drop or conflate rules.

**Fix:** Prioritize ruthlessly. Include only rules that:
- Change default model behavior
- Are specific to this project
- Have been violated before

### 3. The Contradiction

**Problem:** Two rules that cannot both be satisfied.

```markdown
❌ "Always use functional components."
   ...
   "Use class components for complex state management."
```

**Why it fails:** The model picks one arbitrarily or oscillates between them.

**Fix:** Make precedence explicit:
```markdown
✅ "Use functional components. Exception: class components for Error Boundaries only."
```

### 4. The Temporal Reference

**Problem:** Instructions tied to specific moments in time.

```markdown
❌ "Since PR #1234, we use the new auth module."
❌ "As of Q1 2026, the API uses v3."
```

**Why it fails:** Instructions should be timeless truths about current behavior, not changelogs.

**Fix:** State the current rule without history:
```markdown
✅ "Use the auth module at src/auth/ for all authentication."
✅ "Target API v3 for all new endpoints."
```

---

## Agent Anti-Patterns

### 5. The God Agent

**Problem:** One agent definition that does everything.

**Why it fails:** Overloaded context, confused role, impossible to test or scope permissions.

**Fix:** Decompose into focused agents with clear boundaries:
- Code review agent (read-only, analysis tools)
- Implementation agent (edit tools, test runner)
- Deployment agent (deploy tools, monitoring)

### 6. The Unguarded Agent

**Problem:** Agent with unrestricted tool access and no escalation policy.

```yaml
❌ tools: ["*"]
❌ escalation: none
```

**Why it fails:** Single hallucination can cause irreversible damage.

**Fix:**
```yaml
✅ tools: ["read_file", "edit_file", "run_tests"]
✅ escalation:
     - condition: "unsure about intent"
       action: "ask user"
     - condition: "destructive action"
       action: "require approval"
```

### 7. The Amnesiac Agent

**Problem:** Agent with no project context — doesn't know what repo it's in.

**Why it fails:** Generates generic code, misses project conventions, suggests wrong tools.

**Fix:** Include project context (stack, conventions, architecture) in agent definition or referenced documentation.

---

## Skill Anti-Patterns

### 8. The Ambient Skill

**Problem:** Skill that depends on unstated environmental assumptions.

```markdown
❌ Input: (none specified — "it just knows")
❌ Assumes: specific directory structure, installed tools, environment variables
```

**Why it fails:** Works in one context, fails silently in another.

**Fix:** Declare all inputs, assumptions, and preconditions explicitly.

### 9. The Side-Effect Skill

**Problem:** Skill that modifies state not declared in its output contract.

**Why it fails:** Unpredictable behavior, hard to compose, impossible to test in isolation.

**Fix:** Declare all side effects. If a skill modifies files, state which files and why.

### 10. The Monolith Skill

**Problem:** One skill that handles an entire workflow (scan → analyze → generate → validate → deploy).

**Why it fails:** Can't be reused partially, hard to test, single failure breaks everything.

**Fix:** Decompose into composable skills with clear interfaces between them.

---

## Configuration Anti-Patterns

### 11. The Copy-Paste Config

**Problem:** Same instructions duplicated across Copilot, Claude, and Cursor files.

**Why it fails:** Inevitable drift. One gets updated, others become stale.

**Fix:** Single canonical source → render per-provider. Use `sync-config` meta-skill.

### 12. The Secret Config

**Problem:** Configuration that includes or references sensitive values.

```markdown
❌ "Use API key sk-abc123 for the OpenAI integration."
❌ "Connect to postgres://admin:password@prod-db:5432"
```

**Why it fails:** Config files are committed to repos. Secrets in prompts may be logged.

**Fix:** Reference secret managers or environment variables only.

### 13. The Drift-Prone Config

**Problem:** Generated config that was manually edited, losing provenance.

**Why it fails:** Can't regenerate without losing manual changes. Can't verify compliance.

**Fix:** Mark local overrides explicitly. Separate generated sections from manual ones:
```markdown
<!-- BEGIN GENERATED — do not edit below this line -->
...
<!-- END GENERATED -->

<!-- LOCAL OVERRIDES -->
...
```
