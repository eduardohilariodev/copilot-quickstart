---
name: deploy-playbook
description: >
  Document and assist with deployment procedures based on repo-profile.yml
  deployment configuration. Use when deploying, rolling back, or documenting
  deployment steps for any environment.
version: 1.0.0
allowed-tools: Bash Read
---

# deploy-playbook

## Description

Document and assist with deployment procedures based on repo-profile.yml deployment configuration.

## When to Use This Skill

This skill activates when:
- User asks about deployment process
- User needs to deploy or rollback
- User wants to document deployment steps

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| repo_profile | object | yes | repo-profile.yml content (deployment section) |
| environment | string | no | Target environment (staging, production) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| playbook | file | DEPLOY.md with pre-deploy checklist, deploy commands, verification, and rollback steps |
| deploy_status | string | Execution result when assisting with actual deployment (success/failed/rolled-back) |

## Tools Required

- File system (read config, write playbook)
- Shell (execute deployment commands)

## Behavior

### Steps

1. Read deployment config from repo-profile.yml:
   - Platform (Vercel, AWS, GCP, Railway, Fly, etc.)
   - Strategy (blue-green, rolling, canary, recreate)
   - Environments (staging, production, preview)
2. Generate or update `DEPLOY.md` with:
   - **Pre-deploy checklist**: tests pass, migrations ready, env vars set
   - **Deploy commands**: platform-specific (step by step)
   - **Verify**: health check URL, smoke test commands
   - **Rollback**: exact steps to revert if issues found
   - **Hotfix process**: emergency deploy path
3. When assisting with an actual deploy:
   - Verify pre-deploy checklist items
   - Execute deploy command (with user confirmation)
   - Run health checks
   - Report status
4. For rollback: identify last good deployment, execute rollback steps.

### Constraints

- Never deploy to production without explicit user confirmation
- Always verify pre-deploy checklist before executing
- Include rollback steps for every deploy procedure
- Respect environment isolation (staging ≠ production configs)
- Document environment variables needed (without showing values)

### Error Handling

- If deployment config is missing: ask user for platform/strategy details
- If health check fails post-deploy: immediately suggest rollback procedure
- If environment is unclear: ask before proceeding
