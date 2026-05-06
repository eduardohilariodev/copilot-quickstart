---
name: git-undo
description: >
  Choose the safest Git undo strategy (revert, reset, or stash) based on
  context. Use when undoing commits, reverting changes, rolling back mistakes,
  or resetting to a previous state. Analyzes whether changes are pushed,
  staged, or in the working tree to pick the right approach. Do not trigger
  for branch deletion, merge conflict resolution, or interactive rebase.
version: 1.0.0
portability: standalone
allowed-tools: Bash(git:*) Read
---

# git-undo

## Description

Choose the safest Git undo strategy based on what needs undoing and whether changes have been shared.

## When to Use This Skill

This skill activates when:
- User asks to undo, revert, reset, or rollback a commit
- User wants to go back to a previous state
- User made a mistake and needs to recover

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string | no | What to undo — "last commit", a SHA, "staged changes", or "file changes" |
| preserve_history | boolean | no | Whether to keep the undo visible in Git history |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| undo_command | string | The Git command(s) executed or recommended |
| explanation | string | Why this strategy was chosen over alternatives |

## Tools Required

- Git CLI
- File system (read working tree state)

## Behavior

### Steps

1. Determine what to undo: last commit, specific commit, staged changes, unstaged file changes, or a merge.
2. Check if the target commits have been pushed to a remote via `git log @{u}.. --oneline` or `git branch -vv`.
3. Check if the working tree is clean via `git status --porcelain`.
4. Choose strategy:
   - **Pushed commits on shared branch** → `git revert <SHA>` (preserves history, safe for collaborators).
   - **Unpushed commit, keep changes** → `git reset --soft HEAD~1` (changes stay staged).
   - **Unpushed commit, unstage changes** → `git reset --mixed HEAD~1` (changes in working tree).
   - **Unpushed commit, discard everything** → `git reset --hard HEAD~1` (destructive).
   - **Staged changes only** → `git restore --staged <files>`.
   - **Unstaged file changes** → `git restore <files>` or `git stash` for temporary storage.
5. Execute the chosen command with a clear explanation of what happened.

### Constraints

- Never force-push without explicit user confirmation
- Always check if commits are pushed before suggesting reset
- Prefer `git revert` for any commit on a shared or protected branch
- Explain the trade-offs between strategies so the user learns
- Create a backup stash before destructive operations when the working tree is dirty

### Error Handling

- If working tree is dirty and reset is needed: stash changes first, then reset, then inform user about the stash
- If target commit is ambiguous: list recent commits and ask user to confirm
- If upstream tracking is not set: warn that push status cannot be determined and default to safe (revert) strategy

## Examples

### Example 1: Undo last unpushed commit, keep changes

**Input:** "undo last commit"
**Output:**
```
# Changes have NOT been pushed to remote.
# Resetting to keep your changes staged:

git reset --soft HEAD~1

# Your changes are back in the staging area — nothing was lost.
```

### Example 2: Undo a pushed commit on main

**Input:** "revert commit abc1234 on main"
**Output:**
```
# Commit abc1234 is already pushed to origin/main.
# Using revert to preserve history (safe for shared branches):

git revert abc1234

# This creates a new commit that undoes the changes from abc1234.
```
