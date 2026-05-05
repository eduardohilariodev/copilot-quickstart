# Copilot Configuration Features

Version: 1.0.0

> Canonical reference for GitHub Copilot configuration surfaces, quirks, and
> integration points. Used by meta-skills (especially `copilot-config-wizard`,
> `onboard-repo`, and `evaluate-config`) to generate correct configurations.

---

## 1. Instruction Hierarchy

Copilot applies instructions in layers (later layers override earlier ones):

```
Organization instructions (admin-set, lowest precedence for customization)
    └── Repository-wide instructions (.github/copilot-instructions.md)
        └── Path-specific instructions (.github/instructions/*.instructions.md)
            └── User personal instructions (highest precedence)
```

### 1.1 Repository-Wide Instructions

- **Location:** `.github/copilot-instructions.md`
- **Scope:** Applied to ALL Copilot Chat interactions in this repo
- **Clients:** VS Code Chat, Visual Studio Chat, GitHub.com Chat, Copilot CLI, Cloud Agent
- **Limits:** ~2000 tokens effective context budget; keep under 80 lines
- **Does NOT affect:** Inline completions (tab suggestions) directly

### 1.2 Path-Specific Instructions (applyTo)

- **Location:** `.github/instructions/*.instructions.md`
- **Discovery:** Copilot finds them via `chat.instructionsFilesLocations` in VS Code settings
- **Scoping:** Each file has YAML frontmatter with `applyTo` glob pattern

```markdown
---
description: TypeScript conventions for this project
applyTo: "**/*.ts,**/*.tsx"
---

## Rules here apply only when working with matching files
```

**applyTo quirks:**
- Glob syntax; multiple patterns are comma-separated (OR logic)
- `**` matches any depth of directories
- Patterns are relative to repo root
- Applied in VS Code Chat, Visual Studio Chat, and Cloud Agent
- Multiple instruction files can match the same file (all are merged)
- If no file in the conversation matches `applyTo`, the instructions are not included

### 1.3 What Instructions Cannot Do

- Cannot change model behavior for inline completions (tab)
- Cannot override organization-level restrictions
- Cannot grant tool access or permissions
- Cannot exceed the context window — if too long, they're truncated
- Should NOT be task-specific (use prompt files for that)

---

## 2. IDE Configuration

### 2.1 VS Code Settings

Key settings for `.vscode/settings.json`:

```json
{
  "chat.instructionsFilesLocations": {
    ".github/instructions/**/*.instructions.md": true
  },
  "github.copilot.chat.codeGeneration.instructions": [
    { "file": ".github/copilot-instructions.md" }
  ]
}
```

- `chat.instructionsFilesLocations`: tells Copilot Chat where to find path-specific instructions
- Without this, `.github/instructions/` files may not be discovered automatically

### 2.2 Copilot CLI Configuration

- **Config location:** `~/.copilot/config` (or platform equivalent)
- **Environment variables:**
  - `COPILOT_SKILLS_DIRS` — colon-separated list of directories containing skills
  - Useful for making copilot-quickstart skills discoverable without vendoring

- **Context commands (in-session):**
  - `/context` — shows current context window usage
  - `/compact` — summarizes conversation history to free tokens
  - These are important because instructions + tools + history share the context budget

- **Tool controls:**
  - `allowed_urls` in config — whitelist for `web_fetch` tool
  - Tool auto-approval settings (per-session or persistent)

---

## 3. Prompt Files vs Instructions

| Aspect | Instructions | Prompt Files |
|--------|-------------|--------------|
| Purpose | Persistent behavior rules | Reusable task-specific prompts |
| Activation | Automatic (always on) | Explicit invocation |
| Scope | Behavioral constraints | Workflow templates |
| Location | `.github/copilot-instructions.md` or `.github/instructions/` | `.github/prompts/*.prompt.md` |
| Use case | "Always use strict TypeScript" | "Run the test refactor workflow" |

**Guidance:** Keep instructions for rules that should ALWAYS apply. Use prompt files for
repeatable multi-step workflows that the user triggers intentionally.

---

## 4. Cloud Agent (Copilot Coding Agent)

The cloud agent (used for issue-to-PR automation) reads:
- `.github/copilot-instructions.md` (repository-wide)
- `AGENTS.md` (if present, for architecture context)
- `copilot-setup-steps.yml` (for environment setup)

It does NOT currently read:
- Path-specific `.instructions.md` files (planned but not confirmed)
- `.cursor/rules` or `CLAUDE.md` (those are other tools)

---

## 5. What Affects What

| Feature | Chat | Completions | Cloud Agent | Code Review |
|---------|------|-------------|-------------|-------------|
| Repo-wide instructions | ✅ | ❌ | ✅ | ✅ |
| Path-specific (applyTo) | ✅ | ❌ | ❌ (planned) | ✅ |
| User instructions | ✅ | ❌ | ❌ | ❌ |
| Org instructions | ✅ | ❌ | ✅ | ✅ |
| Prompt files | ✅ (explicit) | ❌ | ❌ | ❌ |

---

## 6. Best Practices for Configuration

1. **Budget tokens wisely** — repo-wide instructions get ~2000 tokens; path-specific get ~500 each
2. **Be behavioral, not procedural** — "always use strict types" not "when you write a function, first..."
3. **Use applyTo for scoping** — don't put all rules in one file; scope by language/area
4. **Test with /context** — verify instructions are being loaded and how much budget they consume
5. **Keep path-specific files ≤40 lines** — if longer, split into more-specific files
6. **Don't duplicate** — if a rule is in repo-wide, don't repeat it in path-specific
7. **Reference, don't inline** — "see AGENTS.md for architecture" instead of copying architecture into instructions
