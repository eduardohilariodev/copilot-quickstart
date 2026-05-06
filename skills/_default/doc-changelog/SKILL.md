---
name: doc-changelog
description: >
  Generate a CHANGELOG entry from commit history since the last release tag,
  following Keep a Changelog format. Use when writing release notes, updating
  the changelog, summarizing what changed between versions, or preparing a
  release. Categorizes commits into Added, Changed, Fixed, and other standard
  sections. Do not trigger for commit message writing or ADR creation.
version: 1.0.0
portability: standalone
allowed-tools: Bash(git:*) Read
---

# doc-changelog

## Description

Generate a CHANGELOG entry from Git commit history since the last release tag, categorized by change type in Keep a Changelog format.

## When to Use This Skill

This skill activates when:
- User asks to generate or update a changelog
- User asks for release notes or a summary of what changed
- User is preparing a release and needs version history

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| version | string | no | Version number for the new entry (e.g., "2.1.0"). Auto-detected if omitted |
| since | string | no | Tag or SHA to start from. Default: last release tag |
| scope | string | no | Filter commits to a path or package. Default: all |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| changelog_entry | string | Formatted Keep a Changelog section for the new version |

## Tools Required

- Git CLI
- File system (read existing CHANGELOG.md)

## Behavior

### Steps

1. Find the last release tag via `git describe --tags --abbrev=0`. If no tags exist, use the initial commit.
2. Get commits since that tag: `git log <tag>..HEAD --oneline --no-merges`.
3. Categorize each commit by type using conventional commit prefixes:
   - `feat:` → **Added**
   - `fix:` → **Fixed**
   - `refactor:`, `perf:` → **Changed**
   - `deprecate:` → **Deprecated**
   - `remove:` → **Removed**
   - Security-related commits → **Security**
4. Group entries by category and deduplicate similar changes.
5. Format as a Keep a Changelog entry with version header, date, and categorized lists.
6. If CHANGELOG.md exists: prepend the new entry below the `# Changelog` header. If not: create a new file with the standard header.

### Constraints

- Follow [keepachangelog.com](https://keepachangelog.com) format strictly
- Exclude merge commits, version bump commits, and CI-only changes
- Group by category (Added, Changed, etc.), not chronologically
- If commits don't follow conventional commit format: do best-effort categorization based on diff content and note uncertainty in the entry
- Write entries from a user perspective ("Add user search endpoint" not "add getUsers handler to router")

### Error Handling

- If no tags exist: use the initial commit as the starting point and note "Initial release" in the entry
- If commit history is empty since last tag: inform user "No changes since last release"
- If conventional commit prefixes are inconsistent: categorize by diff analysis and add a note suggesting the team adopt conventional commits

## Examples

### Example 1: Standard release entry

**Input:** "generate changelog for version 2.1.0"
**Output:**
```markdown
## [2.1.0] — 2025-01-15

### Added
- User search endpoint with pagination and filtering
- Rate limiting middleware for all API routes
- Health check endpoint at `/api/health`

### Fixed
- Token refresh race condition causing spurious logouts
- Incorrect timezone handling in date serialization

### Changed
- Upgrade Express from 4.18 to 4.21
- Improve query performance for user lookup (add DB index)

### Security
- Sanitize user input in search queries to prevent injection
```
