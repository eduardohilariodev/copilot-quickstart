# Backend Instructions

---
description: Backend/API development conventions and patterns
applyTo: "apps/api/**,src/api/**,src/server/**,src/services/**,**/*.controller.*,**/*.service.*"
---

<!--
  Path-specific instructions for backend/API code.
  Place at: .github/instructions/backend.instructions.md
  Keep under 40 lines.
-->

## API Design

- RESTful resource naming (plural nouns, consistent hierarchy)
- Always validate request input at the boundary (DTOs, schemas, middleware)
- Return consistent error shapes: { error, message, statusCode }
- Version APIs when breaking changes are unavoidable

## Error Handling

- Use typed/custom error classes — never throw raw strings
- Catch at boundaries (controllers/handlers), not deep in services
- Log errors with context (request ID, user, operation) before returning
- Never leak stack traces or internal details to clients

## Security

- Authenticate at middleware/guard level, not inside business logic
- Authorize per-resource (check ownership/roles before acting)
- Parameterize all database queries — never concatenate user input into SQL
- Rate-limit expensive or public endpoints

## Data Access

- Use repository/service pattern — controllers don't talk to DB directly
- Wrap multi-step mutations in transactions
- Always handle connection errors and timeouts gracefully
- Migrations are append-only in production — never edit deployed migrations

## Logging & Observability

- Structured logging (JSON) with consistent fields: timestamp, level, message, context
- Log request lifecycle: received, processed, responded (with duration)
- Never log secrets, tokens, passwords, or PII
