---
applyTo: "apps/api/**,services/**"
---

# Backend Instructions

Validate all request inputs at the API boundary using zod schemas.
Return typed error responses: `{ error: { code: string, message: string } }`.
Use the Result pattern for operations that can fail predictably.
Log errors with structured metadata: timestamp, request ID, user context.
Never expose internal database IDs in API responses — use public UUIDs.
Use transactions for multi-step database operations.
Keep route handlers thin — delegate business logic to service modules.
Write integration tests for all API endpoints.
