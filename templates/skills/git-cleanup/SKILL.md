# git-cleanup

## Description

Maintain clean git history: squash before merge, remove stale branches, avoid large misc commits.

## Trigger

This skill activates when:
- User asks to clean up branches or history
- Before merging a feature branch with many small commits
- User asks about stale or merged branches

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | yes | One of: squash, prune-branches, audit-history |
| target_branch | string | no | Branch to operate on (default: current) |

## Tools Required

- Git CLI

## Behavior

### Steps

**For squash:**
1. Count commits on branch vs base: `git log --oneline main..HEAD | wc -l`.
2. If >1 commit, suggest interactive rebase: `git rebase -i main`.
3. Propose which commits to squash (fixups, WIP, typo fixes → squash into parent).
4. Preserve meaningful intermediate commits that represent logical units.

**For prune-branches:**
1. List merged branches: `git branch --merged main`.
2. List remote-tracking branches with no upstream: `git remote prune origin --dry-run`.
3. Propose deletions, excluding: `main`, `develop`, `release/*`, protected branches.
4. Execute with `git branch -d <branch>` (safe delete only).

**For audit-history:**
1. Scan recent commits for anti-patterns:
   - Messages like "misc", "fix", "wip", "stuff" (too vague).
   - Single commits touching >20 files (too large).
   - Commits mixing unrelated changes.
2. Report findings with suggestions to amend or split.

### Constraints

- Never force-push to shared branches without explicit user confirmation
- Never delete branches that aren't fully merged (use `-d` not `-D`)
- Preserve merge commits when they carry meaningful context
- Respect protected branches from repo-profile.yml

### Error Handling

- If rebase has conflicts: pause and explain resolution steps
- If branch deletion fails: explain why (unmerged changes) and offer alternatives

## Metadata

```yaml
name: git-cleanup
version: 1.0.0
standards_version: 1.0.0
category: git-flow
```
