---
applyTo: "terraform/**,.github/workflows/**"
---

# Infrastructure Instructions

Pin all GitHub Actions to full commit SHAs, not tags.
Set explicit `permissions:` blocks on every workflow job.
Use OIDC for cloud authentication — never store long-lived credentials.
Require manual approval for production deployments.
Run `terraform plan` as a PR check; apply only after merge.
Use workspaces or separate state files per environment.
Never use `terraform destroy` without explicit confirmation.
Tag all cloud resources with `team`, `environment`, and `cost-center`.
