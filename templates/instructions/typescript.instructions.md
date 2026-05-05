# TypeScript Instructions

<!--
  Path-specific instructions for TypeScript files.
  Place at: .github/instructions/typescript.instructions.md
  Applies to: **/*.ts, **/*.tsx
  Keep under 40 lines — focused, not encyclopedic.
-->

## TypeScript Conventions

- Use strict mode (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes (unless union/intersection needed)
- Use explicit return types on exported functions
- Prefer `unknown` over `any`; narrow with type guards
- Use `readonly` for properties that shouldn't be mutated

## Error Handling

- Use typed errors (custom Error subclasses or Result types)
- Never swallow errors silently — log or rethrow
- Prefer early returns over deeply nested conditionals

## Imports & Structure

- Use path aliases when configured (e.g., `@/` prefix)
- Group imports: external → internal → relative → types
- One exported concept per file (exceptions: related types/helpers)

## Naming

- PascalCase: types, interfaces, classes, enums, React components
- camelCase: functions, variables, methods, properties
- SCREAMING_SNAKE: constants and env vars
- Suffix interfaces with behavior, not `I` prefix (e.g., `Serializable`, not `ISerializable`)

## Testing

- Co-locate test files: `foo.ts` → `foo.test.ts` or `foo.spec.ts`
- Use the project's configured test framework (from repo-profile.yml)
- Test behavior through public API, not internal implementation
