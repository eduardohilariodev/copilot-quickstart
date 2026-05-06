---
name: infra-sanity
description: >
  High-level infrastructure safety checks that prevent dangerous operations,
  enforce dry-runs, and validate environment configurations. Use when running
  infrastructure commands like terraform, kubectl, or database migrations.
version: 1.0.0
portability: standalone
allowed-tools: Bash Read
---

# infra-sanity

## Description

High-level infrastructure safety checks: prevent dangerous operations, enforce dry-runs, and validate environment configurations.

## When to Use This Skill

This skill activates when:
- User is about to run infrastructure commands (terraform, kubectl, migrations)
- User asks about infrastructure safety practices
- Before any destructive operation on shared resources

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| command | string | yes | The infrastructure command being considered |
| environment | string | no | Target environment |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| safety_verdict | string | Risk classification (critical/high/medium/low) with approval or rejection rationale |
| dry_run_output | string | Output of the plan/dry-run execution showing expected changes |

## Tools Required

- Shell (for dry-run execution)
- File system (read infra configs)

## Behavior

### Steps

1. Classify the command by risk level:
   - **Critical** (data loss possible): `terraform destroy`, `DROP TABLE`, `kubectl delete`, `rm -rf`
   - **High** (service disruption): `terraform apply`, `migrate`, `kubectl apply` to production
   - **Medium** (reversible changes): `terraform plan`, `kubectl apply` to staging
   - **Low** (read-only): `terraform show`, `kubectl get`, `describe`
2. Apply safety rules by risk level:
   - Critical: REFUSE without explicit justification + `--force` equivalent
   - High: require dry-run first, show diff, confirm environment
   - Medium: suggest dry-run, proceed if user confirms
   - Low: proceed freely
3. Before any mutating command:
   - Verify target environment matches user intent
   - Check for env var mismatches (KUBECONFIG, AWS_PROFILE, etc.)
   - Run `plan`/`dry-run` equivalent and show expected changes
   - Count affected resources/rows
4. After execution: verify the change took effect (health check, status check).

### Constraints

- Never apply Terraform without running plan first
- Never run destructive commands against production without double confirmation
- Always check which cluster/account/environment is active before running
- Respect `protected_paths` from repo-profile.yml
- Never expose secrets, tokens, or connection strings in output

### Error Handling

- If environment cannot be determined: halt and ask explicitly
- If dry-run shows unexpected changes: warn and suggest investigation
- If command has no dry-run equivalent: explain risks and require explicit confirmation
