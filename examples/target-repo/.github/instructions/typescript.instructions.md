---
description: TypeScript conventions for the acme/web-platform monorepo
applyTo: "**/*.ts,**/*.tsx"
---

## TypeScript Conventions

- Strict mode enabled (`strict: true` in all tsconfig files)
- Prefer `interface` over `type` for object shapes
- Explicit return types on all exported functions
- Prefer `unknown` over `any`; narrow with type guards
- Use `readonly` for immutable properties

## Error Handling

- Use typed errors (custom Error subclasses with `code` field)
- Never swallow errors — log via structured logger or rethrow
- Prefer early returns over deeply nested conditionals

## Imports & Structure

- Use `@/` path alias for intra-package imports
- Use `@acme/ui`, `@acme/db` for cross-package imports
- Group: external → workspace packages → internal → relative → types

## Naming

- PascalCase: types, interfaces, classes, React components
- camelCase: functions, variables, methods, properties
- SCREAMING_SNAKE: constants and env vars
- kebab-case: file and directory names

## Prisma

- Never import `PrismaClient` directly — use the `@acme/db` package
- Always handle `Prisma.PrismaClientKnownRequestError` for constraint violations
- Use transactions for multi-table writes
