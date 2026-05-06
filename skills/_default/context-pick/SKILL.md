---
name: context-pick
description: >
  Select and compress the minimum relevant context (files, docs, code) for a
  specific task, avoiding context window waste. Use when starting complex
  multi-file tasks or when the context window needs pruning.
version: 1.0.0
portability: standalone
allowed-tools: Read
---

# context-pick

## Description

Select and compress the minimum relevant context (files, docs, code) for a specific task, avoiding context window waste.

## When to Use This Skill

This skill activates when:
- Starting a complex task that requires understanding multiple files
- Context window is getting large and needs pruning
- User asks "what files do I need to understand X?"

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| task | string | yes | What needs to be accomplished |
| repo_structure | string | no | Available files/directories |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| context_set | file_list | Minimal set of file paths and excerpts relevant to the task |
| token_estimate | number | Approximate token count of the curated context package |

## Tools Required

- File system (read files, directory listings)
- Search/grep (find relevant symbols)

## Behavior

### Steps

1. **Understand the task**: parse what the user needs to do.
2. **Identify entry points**: find the files most directly related:
   - Files mentioned in the request
   - Files that export the function/class being modified
   - Test files for the target code
3. **Trace dependencies** (1 level deep only):
   - What does the target import?
   - What imports the target?
   - What shared types/interfaces are involved?
4. **Gather context docs** (only if directly relevant):
   - AGENTS.md sections about the target module
   - Architecture docs about the target layer/component
   - Type definitions
5. **Compress and prioritize**:
   - Include full content of files being modified
   - Include only relevant excerpts of dependencies (interfaces, types, key functions)
   - Exclude: test utilities, unrelated modules, framework boilerplate
   - Total context should fit in ~4000 tokens when possible
6. **Present** a curated context package with clear labels.

### Constraints

- Maximum context: ~4000 tokens for the curated set (adjustable per provider)
- Prefer type signatures and interfaces over full implementations
- Never include entire large files — extract relevant sections
- Always include AGENTS.md header (conventions and commands) as baseline
- Exclude files in `.gitignore`, `node_modules/`, build artifacts

### Error Handling

- If task is too broad: ask user to narrow scope
- If context exceeds budget: prioritize by direct relevance, drop indirect deps
