# Evaluation Suite: {{config_name}}

<!--
  Use this template to evaluate generated AI configurations.
  Each section contains checks to verify quality and compliance.
-->

## Metadata

- **Target:** {{target_artifact}}
- **Standards version:** 1.0.0
- **Generated from:** {{source_profile}}
- **Evaluation date:** {{eval_date}}

---

## Compliance Checks

### Design Standards Compliance

| Check | Pass | Notes |
|-------|------|-------|
| No responsibility bleed between artifacts | ☐ | |
| Single source of truth for each rule | ☐ | |
| Provider-specific rendering separate from canonical | ☐ | |
| Provenance metadata present | ☐ | |

### Prompt Engineering Quality

| Check | Pass | Notes |
|-------|------|-------|
| All instructions use imperative mood | ☐ | |
| Rules are atomic (one concept per statement) | ☐ | |
| Specific and testable (not vague) | ☐ | |
| Examples provided for complex rules | ☐ | |
| Within token budget | ☐ | |
| No anti-patterns present | ☐ | |

### Security & Governance

| Check | Pass | Notes |
|-------|------|-------|
| No secrets in configuration | ☐ | |
| Destructive actions require approval | ☐ | |
| Tool permissions follow least privilege | ☐ | |
| Provenance tracking present | ☐ | |
| Risk level appropriate guardrails applied | ☐ | |

---

## Functional Validation

### Accuracy Checks

| Check | Pass | Notes |
|-------|------|-------|
| Referenced files/commands exist in target repo | ☐ | |
| Build/test commands are correct | ☐ | |
| Framework versions match actual | ☐ | |
| Directory paths are valid | ☐ | |

### Behavioral Verification

| Scenario | Expected Behavior | Actual | Pass |
|----------|-------------------|--------|------|
| {{scenario_1}} | {{expected_1}} | | ☐ |
| {{scenario_2}} | {{expected_2}} | | ☐ |
| {{scenario_3}} | {{expected_3}} | | ☐ |

---

## Anti-Pattern Scan

| Anti-Pattern | Found? | Location | Severity |
|--------------|--------|----------|----------|
| Wishful instruction | ☐ | | |
| Encyclopedia (over-specification) | ☐ | | |
| Contradiction | ☐ | | |
| Temporal reference | ☐ | | |
| Provider-specific leakage | ☐ | | |
| Secret exposure | ☐ | | |

---

## Score Summary

| Dimension | Score (1-5) | Weight | Weighted |
|-----------|-------------|--------|----------|
| Compliance | | 0.25 | |
| Quality | | 0.25 | |
| Security | | 0.30 | |
| Accuracy | | 0.20 | |
| **Total** | | | **__/5.0** |

## Recommendations

1. {{recommendation_1}}
2. {{recommendation_2}}
3. {{recommendation_3}}
