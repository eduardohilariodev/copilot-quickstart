# Security & Governance Standards

> Version: 1.0.0  
> Status: Stable  
> Last updated: 2026-05-04

## Purpose

This document defines **security constraints, governance policies, and risk mitigation strategies** for AI-assisted development configurations. All generated artifacts MUST comply with these standards.

---

## Threat Model

### Attack Surfaces

| Surface | Risk | Mitigation |
|---------|------|------------|
| Prompt injection via instructions | Attacker-controlled content in repo overrides safety rules | Layer security constraints at highest precedence |
| Tool invocation abuse | Agent runs destructive commands without oversight | Require human approval for destructive actions |
| Secret leakage | Credentials in prompts, logs, or generated code | Never include secrets in any configuration artifact |
| Context poisoning | Malicious documentation shapes agent behavior | Validate documentation sources; prefer explicit rules |
| Configuration drift | Instructions diverge across providers/branches | Use single source of truth + sync mechanisms |
| Supply chain (skills) | Malicious third-party skill executes harmful code | Pin skill versions; review before adoption |

---

## Mandatory Security Rules

### 1. No Secrets in Configuration

```
NEVER include in any generated artifact:
- API keys, tokens, or passwords
- Connection strings with credentials
- Private keys or certificates
- Internal URLs not meant for public access

Instead: Reference environment variables or secret managers.
```

### 2. Destructive Action Guardrails

Any action that is **irreversible or high-impact** requires explicit human approval:

- Deleting files, databases, or cloud resources
- Publishing packages or deploying to production
- Modifying access controls or permissions
- Running commands with `sudo`, `--force`, or equivalent
- Making financial transactions or sending communications

```yaml
# In agent definitions:
guardrails:
  require_human_approval:
    - file_deletion_outside_build_dirs
    - database_schema_changes
    - deployment_commands
    - access_control_modifications
```

### 3. Tool Permission Principle of Least Privilege

Agents MUST only have access to tools they need for their defined scope:

```yaml
# Good: Scoped permissions
tools:
  - read_file    # Can read any file
  - edit_file    # Can edit files in src/ only
  - run_tests    # Can run test commands only

# Bad: Unrestricted
tools:
  - shell        # Unrestricted shell access
```

### 4. Output Sanitization

Generated artifacts MUST NOT contain:
- Executable code in configuration files (injection vector)
- Unbounded loops or recursive patterns in instructions
- References to internal/proprietary systems without authorization
- Content that could be used for social engineering

### 5. Provenance Tracking

Every generated artifact MUST include:
- Source standards version used for generation
- Generation timestamp
- Input profile hash (for reproducibility)
- Tool/skill that generated it

```yaml
# Frontmatter for generated artifacts
---
generated_by: copilot-quickstart/meta-skills/create-instructions
standards_version: 1.0.0
generated_at: 2026-05-04T19:00:00Z
input_hash: sha256:abc123...
---
```

---

## Governance Policies

### Configuration Ownership

| Artifact | Owner | Review Required | Auto-generate Allowed |
|----------|-------|-----------------|----------------------|
| Security constraints | Security team / repo admin | Always | No (human-authored) |
| Agent definitions | Engineering lead | Yes | Yes, with review |
| Instructions | Team consensus | PR review | Yes, with review |
| Skills | Skill author | PR review | Yes, with review |
| Documentation | Any contributor | PR review | Yes |

### Change Management

1. **All configuration changes** go through pull request review
2. **Security-related changes** require approval from a designated reviewer
3. **Generated artifacts** are clearly marked and tracked separately from hand-written ones
4. **Version bumps** to source-of-truth require a migration plan for existing generated artifacts

### Audit Trail

Maintain records of:
- Who generated/modified each configuration
- What standards version was used
- What input profile was provided
- Any manual overrides applied post-generation

---

## Hallucination Mitigation

### For Generated Instructions

1. **Ground in observable facts** — only reference tools, commands, and patterns that exist in the target repo
2. **Verify before including** — meta-skills MUST scan the target repo to confirm referenced files/commands exist
3. **Prefer explicit over inferred** — ask users to confirm assumptions rather than guessing
4. **Include validation steps** — generated configs should include "how to verify this works" notes

### For Agent Behavior

1. **Constrain knowledge claims** — agents should say "I don't know" rather than fabricate
2. **Pin to verified sources** — reference specific files, not assumed knowledge
3. **Separate facts from recommendations** — clearly mark opinionated choices
4. **Test with adversarial inputs** — evaluation suites should include edge cases designed to trigger hallucination

---

## Configuration Drift Prevention

### Detection

- **Automated checks**: CI jobs that compare generated artifacts against current standards
- **Staleness alerts**: Flag configs not regenerated since last standards update
- **Cross-provider diff**: Detect when Copilot/Claude/Cursor configs diverge in meaning

### Prevention

- **Single source of truth**: All behavioral rules live in one canonical location
- **Generated > hand-edited**: Prefer regeneration over manual patches
- **Atomic updates**: When standards change, regenerate all affected artifacts together
- **Lock files**: Track which standards version each artifact was generated from

### Resolution

When drift is detected:
1. Identify the authoritative source (usually source-of-truth)
2. Regenerate affected artifacts from current standards
3. Review diff for intentional local overrides
4. Preserve legitimate overrides; update the rest
5. Document any permanent local exceptions

---

## Risk Classification

### Repo Risk Levels

| Level | Characteristics | Requirements |
|-------|----------------|--------------|
| **Low** | Personal projects, experiments | Basic safety rules sufficient |
| **Medium** | Team projects, internal tools | Full security rules + review |
| **High** | Production services, financial systems | All rules + enhanced guardrails + audit |
| **Critical** | Security infrastructure, auth systems | Maximum restrictions + manual review of all AI changes |

### Risk-Based Defaults

```yaml
# Low risk
allow_auto_commit: true
allow_auto_deploy: false
require_test_pass: true

# High risk
allow_auto_commit: false
allow_auto_deploy: false
require_test_pass: true
require_security_review: true
require_human_approval_for_all_writes: true
```
