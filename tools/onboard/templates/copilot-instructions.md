# GitHub Copilot Instructions — {{repo_name}}

<!--
  Place this file at: .github/copilot-instructions.md
  These instructions shape Copilot's behavior across all interactions in this repo.
  Keep under ~2000 tokens. Prioritize rules that change default behavior.
  For deeper context, see AGENTS.md at repo root.
-->

## Project Context

This is a {{architecture_type}} using {{languages}} {{frameworks_clause}}.
Read AGENTS.md for architecture details and development commands.

## Code Style

{{code_style_rules}}

## Testing

{{testing_rules}}

## Git & Workflow

{{git_workflow_rules}}

## Architecture Rules

{{architecture_rules}}

## Security

- Never commit secrets, credentials, or API keys
- Validate all external input at API boundaries
- Never modify protected paths: {{protected_paths}}
{{additional_security_rules}}

## Documentation

{{documentation_rules}}

## Where to Find Deeper Guidance

- **Path-specific rules:** `.github/instructions/*.instructions.md` — use the `fetch-instructions` skill to discover community conventions for your stack
- **Agent personas:** `.github/agents/*.agent.md` — specialized agents for code review, CI/CD, refactoring
- **Task playbooks:** `.github/skills/` — step-by-step workflows for common tasks (commit messages, test generation, CI debugging)
