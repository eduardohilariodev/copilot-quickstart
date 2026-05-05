# project-onboarding

## Description

Generate a "how to work here" guide for agents and new developers: install, run, test, debug, and where to look first.

## Trigger

This skill activates when:
- New developer (or agent) joins a project
- User asks "how do I get started with this repo?"
- AGENTS.md needs a quickstart section

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo_profile | object | yes | repo-profile.yml content |
| readme | string | no | Existing README content |

## Tools Required

- File system (scan project structure, read configs)

## Behavior

### Steps

1. Read repo-profile.yml for: languages, frameworks, build_commands, architecture.
2. Scan for onboarding-relevant files:
   - `README.md`, `CONTRIBUTING.md`, `DEVELOPMENT.md`
   - `docker-compose.yml`, `Makefile`, `.env.example`
   - CI config (for required steps)
3. Generate a concise onboarding doc with:
   - **Prerequisites**: runtime versions, tools to install
   - **Setup**: exact commands to go from clone to running (copy-paste ready)
   - **Run**: how to start the app locally
   - **Test**: how to run tests (unit, integration, e2e)
   - **Debug**: how to attach a debugger, view logs
   - **Structure**: key directories and what they contain
   - **First task guide**: "start here" pointers for common contribution types
4. Verify commands actually work (or flag if they can't be verified).
5. If AGENTS.md exists, ensure its quickstart section is consistent.

### Constraints

- Every command must be copy-paste ready (no "replace X with your...")
- Include exact version requirements (node 20+, python 3.11+, etc.)
- Keep total doc under 100 lines
- Link to detailed docs rather than inlining everything
- Note platform differences (Mac/Linux/Windows) where they matter

### Error Handling

- If build commands fail: note the failure and suggest fixes
- If no clear setup exists: generate best-guess from file analysis and flag as unverified

## Metadata

```yaml
name: project-onboarding
version: 1.0.0
standards_version: 1.0.0
category: onboarding-ops
```
