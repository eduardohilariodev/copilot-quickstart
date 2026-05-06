# Infrastructure Instructions

---
description: Safety rules for infrastructure and DevOps files
applyTo: "terraform/**,*.tf,.github/workflows/**,docker*,Dockerfile*,k8s/**,infra/**"
---

<!--
  Path-specific instructions for infrastructure/DevOps files.
  Place at: .github/instructions/infra.instructions.md
  Keep under 40 lines — focused on safety.
-->

## Infrastructure Safety Rules

- NEVER apply changes without running plan/dry-run first
- NEVER hardcode secrets, tokens, or credentials — use secret managers
- ALWAYS pin versions (Terraform providers, Docker base images, action SHAs)
- ALWAYS set explicit resource limits (CPU, memory, timeout)

## Terraform

- Use modules for reusable components
- State must be remote (never local in production)
- Use `prevent_destroy` lifecycle on critical resources
- Tag all resources with: environment, team, managed-by

## Docker

- Use multi-stage builds to minimize image size
- Pin base image to specific digest, not just tag
- Run as non-root user
- Don't copy `.env` files or secrets into images

## GitHub Actions

- Set `permissions` explicitly (never rely on defaults)
- Pin actions to full SHA
- Use `concurrency` groups to cancel stale runs
- Never use `pull_request_target` with `actions/checkout` of PR head

## Deployment

- All production changes go through CI pipeline (no manual kubectl/terraform)
- Canary or blue-green for production; direct deploy acceptable for staging
- Always have a documented rollback procedure
