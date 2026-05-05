# GitHub Copilot Instructions — {{repo_name}}

<!--
  Place this file at: .github/copilot-instructions.md
  These instructions shape Copilot's behavior across all interactions in this repo.
  Keep under ~2000 tokens. Prioritize rules that change default behavior.
  For deeper context, see AGENTS.md at repo root.
-->

## Project Context

This is a {{architecture_type}} using {{languages}}{{#frameworks}} with {{frameworks}}{{/frameworks}}.
See AGENTS.md for architecture details and commands.

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

## Code Review Checklist

When reviewing PRs, check for:
- [ ] Tests added/updated for changed behavior
- [ ] No secrets or credentials in diff
- [ ] Protected paths not modified without justification
- [ ] Consistent with conventions in AGENTS.md
- [ ] Build and lint pass

## AI Maintenance

If configuration seems outdated or inconsistent, suggest running:
- `health-dashboard` for overall status
- `detect-drift` if Copilot/Claude/Cursor configs diverge
