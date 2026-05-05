# safe-refactor

## Description

Execute multi-file refactors safely: small batches, test verification between steps, limited blast radius, and rollback path.

## Trigger

This skill activates when:
- User asks to rename, move, restructure, or refactor across multiple files
- User wants to extract a module, split a file, or change an interface

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| refactor_description | string | yes | What to refactor and why |
| affected_scope | string | no | Known files/modules involved |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| refactor_result | markdown | Batch execution report with per-batch status, test results, and final verification |
| modified_files | file_list | List of all files changed across all batches |

## Tools Required

- File system (read/write source files)
- Test runner CLI
- Git CLI (for checkpoints)

## Behavior

### Steps

1. **Snapshot**: ensure working tree is clean (`git status`), create a work branch if not already on one.
2. **Analyze scope**:
   - Find all references to the target symbol/pattern
   - Map dependency graph of affected files
   - Identify public API surface that external code depends on
3. **Plan batches**: group changes into independently-verifiable steps:
   - Batch 1: internal renames (no public API change)
   - Batch 2: update call sites within same module
   - Batch 3: update external consumers
   - Batch 4: remove old code/aliases
4. **Execute per batch**:
   - Make the changes
   - Run type checker / linter to catch compile errors
   - Run targeted tests for affected modules
   - If tests fail: revert batch and investigate
   - If tests pass: commit batch with descriptive message
5. **Final verification**: run full test suite after all batches.
6. **Cleanup**: remove dead code, update imports, check for orphaned files.

### Constraints

- Never modify >10 files in a single batch without explicit user approval
- Run tests after every batch (not just at the end)
- Keep backward-compatible aliases during migration if public API changes
- Never refactor and change behavior simultaneously — separate concerns
- Respect protected_paths from repo-profile.yml

### Error Handling

- If tests fail after a batch: show diff, explain likely cause, offer revert
- If scope is too large (>50 files): suggest incremental approach across multiple PRs
- If circular dependencies are found: flag and propose resolution before continuing

## Metadata

```yaml
name: safe-refactor
version: 1.0.0
standards_version: 1.0.0
category: context-planning
```
