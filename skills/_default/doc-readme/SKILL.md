---
name: doc-readme
description: >
  Generate or update README.md from the actual codebase structure and project
  metadata. Use when creating a project overview, writing a README, adding a
  getting started guide, describing a project, or updating a stale README.
  Scans package.json, directory layout, and existing docs to produce accurate
  documentation. Do not trigger for inline code documentation or API reference
  docs.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# doc-readme

## Description

Generate or update README.md from the actual codebase structure, project metadata, and existing documentation.

## When to Use This Skill

This skill activates when:
- User asks to create or generate a README
- User asks for a project overview or getting started guide
- User wants to update or refresh an existing README

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| mode | string | no | "create" (new README) or "update" (refresh existing). Default: auto-detect |
| sections | list | no | Specific sections to generate. Default: all standard sections |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| readme | file | Complete README.md content ready to write |

## Tools Required

- File system (read project structure, package metadata, existing docs)

## Behavior

### Steps

1. Scan project metadata:
   - `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or equivalent for name, description, version, scripts, dependencies
   - Existing `README.md`, `AGENTS.md`, `CONTRIBUTING.md` for current state
   - Directory structure (top two levels) for project layout
   - License file for license type
2. Generate standard sections:
   - **Title** with one-line description
   - **Description** — what the project does and why it exists (2–3 sentences)
   - **Prerequisites** — runtime, language version, system dependencies
   - **Installation** — step-by-step install commands
   - **Quick Start** — minimal working example to run the project
   - **Usage** — key commands or API entry points
   - **Project Structure** — directory tree with brief descriptions
   - **Contributing** — link to CONTRIBUTING.md or brief guidelines
   - **License** — license type with link
3. If README already exists: compare generated content against existing, flag stale sections, and suggest targeted updates.
4. Verify every command is runnable by cross-referencing with `scripts` in package metadata.

### Constraints

- Reflect what the project actually does, not aspirations — don't invent features
- Every shell command must be copy-paste ready and verified against project config
- Keep total length under 200 lines — link to detailed docs instead of inlining
- Don't duplicate content from CONTRIBUTING.md or other existing docs; link to them
- Use the project's actual commands (from package.json scripts, Makefile, etc.)

### Error Handling

- If no package metadata is found: infer from directory structure and file extensions, note assumptions
- If existing README has custom sections not in the standard template: preserve them in an "Additional" block

## Examples

### Example 1: New README for a Node.js project

**Input:** "create a README for this project"
**Output:**
```markdown
# my-api

A REST API for managing user authentication and session tokens.

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

## Installation

git clone https://github.com/org/my-api.git
cd my-api
npm install

## Quick Start

npm run dev
# Server starts at http://localhost:3000

## Usage

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start development server |
| `npm test`      | Run test suite           |
| `npm run build` | Build for production     |

## Project Structure

├── src/
│   ├── routes/      # Express route handlers
│   ├── services/    # Business logic
│   └── models/      # Database models
├── tests/           # Test files
└── package.json

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
```
