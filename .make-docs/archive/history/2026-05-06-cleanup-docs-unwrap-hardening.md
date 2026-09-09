---
date: "2026-05-06"
summary: "Hardened cleanup-docs fix mode so list continuations and protected Markdown regions are never unwrapped."
---

# Cleanup Docs Unwrap Hardening

## Changes

| Area | Summary |
| --- | --- |
| Checker | Limited `--fix` unwrapping to top-level prose and added explicit list-continuation detection so indented list content is preserved exactly. |
| Tests | Added regression coverage for YAML frontmatter, fenced code blocks, unordered/ordered/task-list continuations, nested list content, and report-only list continuation findings. |
| Contracts | Clarified that list items should prefer one logical line and that required continuation or nested indentation is semantic. |
| Skills | Updated `cleanup-docs` instructions to require manual review of wrapped list-item continuations and to prohibit fix mode from touching frontmatter, fenced code, or list-contained text. |

No novel gaps were found. This hardening addresses a concrete unsafe cleanup behavior discovered while testing `cleanup-docs` in another project.

Validation passed with the cleanup-docs checker tests, focused CLI tests, build, instruction-router parity check, and `git diff --check`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| `docs/assets/references/output-contract.md` | Clarified list-item continuation formatting and indentation preservation. |
| `packages/docs/template/docs/assets/references/output-contract.md` | Carried the same contract wording into installed template docs. |
| `packages/skills/cleanup-docs/SKILL.md` | Updated cleanup workflow and script notes for protected regions and list-contained text. |

### Developer

None this session.

### User

None this session.
