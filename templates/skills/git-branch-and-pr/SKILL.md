# git-branch-and-pr

## Description

Create well-named branches and structured pull request descriptions following team conventions.

## Trigger

This skill activates when:
- User starts a new task and needs a branch
- User is ready to open a pull request

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| task_description | string | yes | What the branch/PR is for |
| issue_number | string | no | Related issue (e.g., #42) |
| git_workflow | string | no | From repo-profile.yml conventions |

## Tools Required

- Git CLI
- GitHub CLI (gh) for PR creation

## Behavior

### Steps

1. Read `conventions.git_workflow` from repo-profile.yml (github-flow, gitflow, trunk-based).
2. Determine branch prefix from change type:
   - Feature → `feature/`, fix → `fix/`, chore → `chore/`, docs → `docs/`
3. Generate branch name: `<prefix>/<issue-number>-<short-kebab-description>` (max 50 chars).
4. Create branch: `git checkout -b <branch-name>`.
5. When PR is ready, generate description using template:
   - **Summary**: 1-2 sentence overview
   - **Changes**: bullet list of what was modified
   - **Testing**: how it was verified
   - **Risk**: low/medium/high with justification
   - **Related**: link to issue/task
6. Create PR via `gh pr create` with title matching conventional commit format.

### Constraints

- Branch names: lowercase, kebab-case, no special chars beyond `-` and `/`
- PR title follows same format as commit messages: `type(scope): description`
- PR body must include testing evidence or plan
- Link issues when available

### Error Handling

- If branch already exists: suggest alternative name or switch to existing
- If working tree is dirty: warn user to commit or stash first

## Examples

### Example 1: Feature branch + PR

**Input:** "Add user authentication with JWT, relates to #15"

**Output:**
```bash
git checkout -b feature/15-jwt-authentication
```

PR title: `feat(auth): implement JWT-based authentication`

## Metadata

```yaml
name: git-branch-and-pr
version: 1.0.0
standards_version: 1.0.0
category: git-flow
```
