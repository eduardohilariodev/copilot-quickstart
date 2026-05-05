# shell-ops

## Description

Guidelines for executing shell commands safely: respect protected paths, use dry-runs, never touch secrets, and prefer reversible operations.

## Trigger

This skill activates when:
- Agent needs to execute shell commands
- User asks to run scripts or system operations
- Any command touches files, environment, or external services

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| command | string | yes | The shell command to evaluate/execute |
| protected_paths | array | no | From repo-profile.yml |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| command_result | string | Shell command output or confirmation of execution with exit code |
| risk_classification | string | Safety assessment of the command: safe, moderate, dangerous, or forbidden |

## Tools Required

- Shell (bash/zsh/powershell)
- File system (check paths)

## Behavior

### Steps

1. **Classify command** by risk:
   - **Safe** (read-only): `ls`, `cat`, `grep`, `git status`, `npm list`
   - **Moderate** (reversible writes): `git checkout`, `npm install`, `mkdir`
   - **Dangerous** (potentially destructive): `rm`, `git push --force`, `DROP`, `chmod -R`
   - **Forbidden**: anything touching `.env*`, secrets, credentials, or protected_paths
2. **Pre-execution checks**:
   - Verify working directory is correct
   - Check command doesn't access protected_paths
   - For dangerous commands: require explicit confirmation
   - For forbidden commands: refuse with explanation
3. **Safe execution patterns**:
   - Always use `--dry-run` when available for first attempt
   - Prefer `git stash` before destructive git operations
   - Use `cp` before `mv` when moving important files
   - Redirect destructive output to temp file first
4. **Post-execution**:
   - Check exit code
   - Verify expected outcome (file exists, process running, etc.)
   - Report what changed

### Constraints

- Never read or display `.env`, `.env.*`, or files matching `protected_paths`
- Never run `rm -rf` without explicit path and user confirmation
- Never force-push to protected branches (main, master, develop, release/*)
- Never execute commands that download and pipe to shell (`curl | sh`)
- Always show the exact command before running it
- Prefer project scripts (`npm run X`) over raw commands

### Error Handling

- If command fails: show error output, suggest fix, don't retry automatically
- If command would affect protected paths: refuse and explain why
- If working directory seems wrong: halt and verify with user

## Metadata

```yaml
name: shell-ops
version: 1.0.0
standards_version: 1.0.0
category: onboarding-ops
```
