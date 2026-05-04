# create-agent

## Description

Generates a complete agent definition (persona, tools, constraints, escalation policy) for a target repository. Produces provider-agnostic YAML that can be rendered for Copilot, Claude, or Cursor configurations.

## Trigger

This skill activates when:
- The user requests creation of a new agent definition
- The user says "create agent", "define agent", or "set up agent"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| agent_purpose | string | yes | What the agent should do (natural language description) |
| agent_name | string | no | Identifier (auto-generated from purpose if omitted) |
| target_repo_path | string | no | Path to target repo for context (defaults to cwd) |
| risk_level | string | no | Override risk level: low, medium, high, critical |
| tool_set | string[] | no | Explicit tool list (auto-inferred if omitted) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| agent_definition | file | YAML agent definition conforming to schema |
| rendered_configs | file[] | Provider-specific config files if target providers specified |
| validation_report | text | Schema compliance and security audit results |

## Tools Required

- File system read (scan repo for context)
- File system write (output definitions)
- Schema validation

## Behavior

### Steps

1. **Clarify Scope:**
   - Parse the agent_purpose for: domain, actions, boundaries
   - If purpose is too broad (would create a "God Agent"), suggest decomposition
   - Determine appropriate tool set from purpose

2. **Assess Security Posture:**
   - Determine risk level from repo profile or user override
   - Map risk level to constraint intensity:
     - Low: basic guardrails
     - Medium: full security rules
     - High: enhanced guardrails + audit
     - Critical: maximum restrictions

3. **Generate Definition:**
   - **Persona:** identity, tone, expertise areas
   - **Tools:** minimum set needed, with explicit permissions and scopes
   - **Constraints:** prohibited actions, approval requirements, iteration limits
   - **Escalation:** conditions → actions mapping
   - **Skills:** referenced skills this agent can invoke
   - **Context:** documentation and instruction files to include

4. **Apply Security Governance:**
   - Ensure destructive actions require approval
   - Enforce least-privilege tool permissions
   - Add escalation for ambiguous situations
   - Cap max_iterations based on risk level

5. **Validate:**
   - Check against `schemas/agent.schema.json`
   - Verify no security governance violations
   - Scan for agent anti-patterns (God Agent, Unguarded, Amnesiac)
   - Verify referenced skills and documentation exist

6. **Render (optional):**
   - If target providers specified, render provider-specific configs
   - Document any capability gaps per provider

### Constraints

- NEVER create agents with unrestricted tool access
- NEVER omit escalation policies
- ALWAYS include at least one "ask_user" escalation condition
- ALWAYS scope file write permissions to specific paths
- Agent definitions MUST reference existing documentation
- Max 5 tools per agent (decompose if more needed)

### Error Handling

- If purpose implies unrestricted access: Refuse and suggest decomposition
- If referenced skills don't exist: Note as "to be created" dependency
- If risk_level and tool_set conflict: Flag and ask user to resolve

## Examples

### Example 1: Code review agent

**Input:**
```
agent_purpose: Review pull requests for code quality, security issues, and adherence to project conventions
risk_level: medium
```

**Output (agent-definition.yml):**
```yaml
name: code-reviewer
role: "Reviews PRs for quality, security, and convention compliance"
version: 1.0.0

persona:
  identity: "A thorough but pragmatic code reviewer"
  tone: "constructive, concise, focused on impact"
  expertise:
    - code quality patterns
    - security vulnerability detection
    - project convention enforcement

tools:
  - name: read_file
    permission: read
    scope: "**/*"
  - name: get_pr_diff
    permission: read
    scope: "current PR"
  - name: add_review_comment
    permission: write
    scope: "current PR"

constraints:
  prohibited_actions:
    - "modifying source code"
    - "approving PRs without security check"
    - "commenting on style-only issues without substance"
  require_approval:
    - "requesting changes on PR"
  max_iterations: 10

escalation:
  - condition: "potential security vulnerability found"
    action: ask_user
  - condition: "unclear if pattern is intentional"
    action: ask_user
  - condition: "PR touches protected paths"
    action: ask_user

skills:
  - review-security
  - review-conventions
```

## Metadata

```yaml
name: create-agent
version: 1.0.0
standards_version: 1.0.0
author: copilot-quickstart
```
