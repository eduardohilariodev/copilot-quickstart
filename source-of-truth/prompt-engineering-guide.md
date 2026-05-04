# Prompt Engineering Guide: Writing Style & Patterns

> Version: 1.0.0  
> Status: Stable  
> Last updated: 2026-05-04

## Purpose

This guide codifies **how to write effective instructions, skills, and agent prompts** based on research and production experience. It covers structure, language, formatting, and anti-patterns.

---

## Core Principles

### 1. Be Imperative

Write commands, not suggestions.

```
✅ "Use TypeScript strict mode for all new files."
❌ "You might want to consider using TypeScript strict mode."
❌ "It would be good to use TypeScript strict mode."
```

### 2. Be Specific

Concrete beats abstract. Include the "what" and "how."

```
✅ "Format errors as: { code: string, message: string, details?: unknown }"
❌ "Use a consistent error format."
```

### 3. Be Atomic

One rule per statement. Compound rules are harder to follow and test.

```
✅ "Use camelCase for variable names."
✅ "Use PascalCase for class names."
❌ "Use camelCase for variables and PascalCase for classes and kebab-case for files."
```

### 4. Use Positive Language

State what TO do. Use negation only for explicit prohibitions.

```
✅ "Return early from functions when preconditions fail."
❌ "Don't nest conditions deeply."
```

### 5. Provide Examples

Show don't just tell, especially for formatting and style rules.

```
✅ "Name test files with .spec.ts suffix: `user-service.spec.ts`"
❌ "Use proper test file naming."
```

---

## Structural Patterns

### Section Organization

Group rules by theme using clear headers. Maintain a consistent hierarchy:

```markdown
# Role / Identity
# Tools & Permissions
# Behavioral Rules
  ## Code Style
  ## Testing
  ## Documentation
# Constraints & Prohibitions
# Output Format
```

### Scoping with Tags

When the target platform supports it, use XML-like tags to scope sections:

```xml
<code_style>
Use 2-space indentation for TypeScript files.
Prefer const over let; never use var.
</code_style>

<testing>
Write unit tests for all public methods.
Use describe/it blocks with descriptive names.
</testing>
```

### Priority and Ordering

- Place **safety constraints first** (they must never be overridden)
- Place **most-used rules early** (context window pressure)
- Place **examples after the rule** they illustrate
- Place **exceptions immediately after** the rule they modify

---

## Language Patterns

### The Instruction Formula

```
[ACTION VERB] + [SPECIFIC TARGET] + [CONSTRAINT/FORMAT] + [EXAMPLE if complex]
```

Examples:
- "**Use** Jest **for** all unit tests **with** describe/it structure."
- "**Return** errors **as** `Result<T, AppError>` **instead of** throwing exceptions."
- "**Name** migration files **with** timestamp prefix: `20260504_create_users.sql`"

### Conditional Rules

Use "when/if" clauses for context-dependent behavior:

```
When modifying database schemas, always create a migration file.
If a function exceeds 30 lines, extract helper functions.
When unsure about intent, ask the user before proceeding.
```

### Quantified Constraints

Prefer measurable over vague:

```
✅ "Limit functions to 40 lines maximum."
✅ "Keep import statements under 10 per file."
❌ "Keep functions short."
❌ "Don't import too many things."
```

---

## Format Constraints

### Token Budget Awareness

- **Copilot instructions**: Aim for < 2000 tokens (~1500 words). Concise rules only.
- **CLAUDE.md**: Can be longer (8000+ tokens) but front-load critical rules.
- **Cursor .mdc rules**: Keep individual rule files focused (< 500 tokens each).
- **Skill definitions**: As long as needed, but separate concerns into sections.

### Formatting Do's

- Use **markdown headers** for section organization
- Use **code blocks** for syntax/format examples
- Use **bullet lists** for parallel rules
- Use **bold** for key terms on first use
- Use **tables** for mappings and comparisons

### Formatting Don'ts

- Avoid numbered lists for unordered rules (implies priority)
- Avoid deeply nested structures (max 2 levels)
- Avoid inline links (they consume tokens and may not resolve)
- Avoid HTML in markdown (not universally rendered)

---

## Platform-Specific Patterns

### GitHub Copilot Instructions

```markdown
# .github/copilot-instructions.md

## Code Style
Use TypeScript with strict mode enabled.
Prefer functional patterns over class hierarchies.

## Testing
Write tests using Vitest with describe/it blocks.
Mock external dependencies using vi.mock().

## Git
Write commit messages in imperative mood.
Keep commits atomic — one logical change per commit.
```

### Claude (CLAUDE.md)

```markdown
# CLAUDE.md

## Project Context
This is a Next.js 14 app with App Router, using Prisma for database access.

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Rules
Use server components by default; add "use client" only when needed.
Never expose API keys in client-side code.
```

### Cursor Rules (.mdc)

```markdown
---
description: TypeScript coding standards
globs: ["**/*.ts", "**/*.tsx"]
---

Use strict TypeScript with no `any` types.
Prefer `interface` over `type` for object shapes.
Export types from a dedicated `types.ts` file per module.
```

---

## Anti-Patterns

### Vague Instructions

```
❌ "Write good code."
❌ "Follow best practices."
❌ "Be careful with security."
```

These provide no actionable guidance and waste context tokens.

### Contradictory Rules

```
❌ "Always use functional components."
   (later) "Use class components for error boundaries."
```

Fix: Make the exception explicit in the original rule.

### Over-Specification

```
❌ Listing every possible edge case for a simple rule.
❌ Repeating the same rule in different words.
❌ Including rules the model already follows by default.
```

### Provider-Specific Leakage

```
❌ "Use the edit tool to modify files." (in a provider-agnostic instruction)
❌ "Call the bash tool with..." (assumes specific toolset)
```

### Temporal References

```
❌ "As of January 2026, use React 19."
❌ "The PR #1234 introduced this pattern."
```

---

## Composition Strategies

### Layered Instructions

Build from general to specific:

```
Layer 1: Language rules (applies everywhere)
Layer 2: Framework rules (applies to framework files)
Layer 3: Module rules (applies to specific directories)
```

### Conditional Activation

Use file globs or trigger conditions to limit scope:

```yaml
# Only active for test files
globs: ["**/*.test.ts", "**/*.spec.ts"]
rules:
  - "Use test doubles (mocks/stubs) for external services."
  - "Assert behavior, not implementation details."
```

### DRY Across Providers

Write canonical rules once, render per-provider:

```
Canonical: "Use 2-space indentation for TypeScript."
Copilot:   Direct inclusion in .github/copilot-instructions.md
Claude:    Include in CLAUDE.md under ## Rules
Cursor:    Include in .cursor/rules/typescript.mdc
```
