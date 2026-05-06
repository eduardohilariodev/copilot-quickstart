---
name: ci-cd-starter
description: >
  Design and generate GitHub Actions workflows following CI/CD best
  practices including modular jobs, caching, security, and proper
  permissions. Use when setting up CI/CD pipelines, configuring GitHub
  Actions, or bootstrapping workflows for a new project.
version: 1.0.0
allowed-tools: Read
---

# ci-cd-starter

## Description

Design and generate GitHub Actions workflows following CI/CD best practices: modular, cached, secure, with proper permissions.

## When to Use This Skill

This skill activates when:
- User needs CI/CD pipeline setup or improvement
- User asks about GitHub Actions configuration
- New project needs initial workflow files

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo_profile | object | yes | repo-profile.yml content |
| existing_workflows | string | no | Contents of `.github/workflows/` |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| workflow_file | file | GitHub Actions workflow YAML at `.github/workflows/` |
| pipeline_summary | markdown | Overview of generated pipeline stages and their purposes |

## Tools Required

- File system (read/write workflow YAML)

## Behavior

### Steps

1. Read repo-profile.yml for: languages, frameworks, build_commands, architecture.
2. Scan `.github/workflows/` for existing pipelines.
3. Design pipeline architecture:
   - **PR workflow**: lint → type-check → test → build (fast feedback)
   - **Merge workflow**: full test → build → deploy-staging
   - **Release workflow**: build → deploy-production (manual trigger or tag)
4. Generate workflow files following best practices:
   - Set explicit `permissions` (least privilege)
   - Add `concurrency` groups to cancel stale runs
   - Use `actions/cache` for dependencies (node_modules, pip, go mod)
   - Pin action versions to SHA, not tags
   - Use matrix strategy for multi-version testing when applicable
   - Keep secrets in environment-level configuration
5. Add job dependencies (`needs:`) for correct ordering.
6. Include comments explaining non-obvious choices.

### Constraints

- Always set `permissions` block (never use default `write-all`)
- Pin actions to full SHA: `uses: actions/checkout@<sha>`
- Never expose secrets in logs (use masking)
- Keep individual jobs under 10 minutes where possible
- Use reusable workflows for shared logic across repos

### Error Handling

- If build commands unknown: generate placeholder with TODO
- If existing workflows conflict: propose migration, don't overwrite

## Examples

### Example 1: Node.js PR workflow

**Output:**
```yaml
name: PR Check
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - uses: actions/setup-node@<sha>
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
```

