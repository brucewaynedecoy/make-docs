---
date: "2026-05-06"
summary: "Refined cleanup-docs around block-boundary parsing and aggressive paragraph-wrap reporting."
---

# Cleanup Docs Block Parser Refinement

## Changes

Refined the cleanup-docs Markdown checker and workflow so block boundaries are parsed explicitly, paragraph wrapping is reported as a block-level finding, and fix mode inserts missing blank lines before unwrapping only top-level paragraphs.

| Area | Summary |
| --- | --- |
| Checker | Replaced pairwise hard-wrap detection with parsed Markdown blocks and ordered findings for block spacing, paragraph wrapping, and list-continuation review. |
| Fix mode | Added two-phase fixing that inserts missing blank lines between blocks before unwrapping only top-level paragraph blocks. |
| Skill workflow | Updated `cleanup-docs` to sample JSON findings before auto-fixing and to batch manual review through worker agents when false positives appear. |
| Contracts | Clarified that every Markdown block should be separated from the next block by one blank line and that paragraphs should be one logical source line. |

No novel gaps were found. This change directly follows observed cleanup-docs false negatives in generated docs where paragraph line breaks remained after the earlier hard-wrap heuristic.

Validation passed for cleanup-docs checker tests, package build, instruction-router parity, mirror parity spot checks, `git diff --check`, and the full `npm test -w make-docs` suite after stale CLI skill-list expectations were updated to include `cleanup-docs`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| `packages/skills/cleanup-docs/SKILL.md` | Updated the cleanup workflow for report-first sampling, fix fallback, and worker-batched manual review. |
| `packages/skills/cleanup-docs/scripts/check_markdown_style.py` | Added block parsing, richer findings, grouped text output, and ordered fix behavior. |
| `docs/assets/references/output-contract.md` | Clarified block-spacing and paragraph source-line contracts. |

### Developer

None this session.

### User

None this session.
