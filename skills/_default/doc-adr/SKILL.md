---
name: doc-adr
description: >
  Create an Architecture Decision Record (ADR) capturing context, options
  considered, the decision made, and its consequences. Use when recording
  a design decision, documenting why a technology or approach was chosen,
  creating a decision record, or answering "why did we" questions about
  architecture. Do not trigger for code documentation, READMEs, or
  changelog entries.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# doc-adr

## Description

Create an Architecture Decision Record (ADR) that captures the context, decision, and consequences of an architectural choice in a structured, parseable format.

## When to Use This Skill

This skill activates when:
- User asks to record or document a design or architecture decision
- User asks "why did we choose X" and the answer should be preserved
- User mentions ADR, decision record, or design decision

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | yes | Short title of the decision (e.g., "Use PostgreSQL for primary datastore") |
| context | string | no | Background information driving the decision |
| alternatives | list | no | Options that were considered |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| adr_file | file | Markdown ADR file at the conventional path with sequential numbering |

## Tools Required

- File system (read existing ADR directory and files)

## Behavior

### Steps

1. Check for an existing ADR directory in order: `docs/adr/`, `docs/decisions/`, `adr/`, `doc/adr/`. If none exists, create `docs/adr/`.
2. Scan existing ADR files to determine the next sequential number (e.g., `0001`, `0002`).
3. Gather decision details from the user: title, context, options considered, chosen option, and rationale.
4. Generate the ADR using MADR (Markdown Architectural Decision Records) format:
   - **Title** — descriptive, prefixed with ADR number
   - **Status** — Proposed, Accepted, Deprecated, or Superseded
   - **Context** — what forces are at play, what problem needs solving
   - **Decision** — what was decided and why
   - **Consequences** — positive and negative outcomes of the decision
   - **Alternatives Considered** — at least 2 alternatives with brief pros/cons
5. Save the file as `NNNN-kebab-case-title.md` in the ADR directory.

### Constraints

- Always use MADR format unless the project already has ADRs in a different format — then match existing
- Status must be explicitly stated — never omit it
- Document at least 2 alternatives, even if one is "do nothing"
- Keep each ADR to exactly one decision — split compound decisions into separate ADRs
- Use the date the decision was made, not the date the ADR is written

### Error Handling

- If no ADR directory exists and cannot be created: output the ADR content and instruct the user where to save it
- If existing ADRs use a non-MADR format: match the existing format instead

## Examples

### Example 1: Database selection ADR

**Input:** "Record our decision to use PostgreSQL instead of MongoDB"
**Output:**
```markdown
# 0003 — Use PostgreSQL for primary datastore

## Status

Accepted

## Context

The application requires ACID transactions for financial data,
complex relational queries across multiple entities, and strong
schema enforcement. The team has production experience with both
PostgreSQL and MongoDB.

## Decision

Use PostgreSQL as the primary datastore for all application data.

## Consequences

### Positive
- ACID compliance ensures data integrity for financial transactions
- Rich query language supports complex joins and aggregations
- Mature ecosystem with strong tooling and monitoring

### Negative
- Horizontal scaling requires more planning than MongoDB's sharding
- Schema migrations require explicit management (using a migration tool)

## Alternatives Considered

### MongoDB
- Pros: Flexible schema, easy horizontal scaling, JSON-native
- Cons: No ACID transactions across documents, eventual consistency
  risks for financial data

### SQLite
- Pros: Zero configuration, embedded, excellent for development
- Cons: Single-writer limitation, not suitable for concurrent
  production workloads
```
