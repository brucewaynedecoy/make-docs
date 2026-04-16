---
name: staleness-check
description: Scan the docs/ tree for artifacts that appear ready to archive based on completion, deprecation, supersession, and reference signals. Advisory mode only — reports candidates without archiving anything. Triggers include requests to check for stale docs, find what's ready to archive, or run a staleness check.
---

# Staleness Check

## Overview

Use this skill to scan the doc tree for archival candidates without archiving anything. It detects artifacts that appear complete, deprecated, superseded, or unreferenced and presents them as a grouped report. The user can then invoke the `archive` skill on any candidates they approve.

This skill is advisory only — it never moves, modifies, or archives any file.

## Workflow

1. Scan `docs/designs/`, `docs/plans/`, `docs/work/`, `docs/guides/developer/`, `docs/guides/user/`, and `docs/guides/agent/` for artifacts.
2. For each artifact, evaluate all staleness signals (see below).
3. Optionally run `scripts/trace_relationships.py --doc-root docs/` for automated relationship scanning on large trees.
4. Group candidates by staleness signal.
5. Present the report to the user with the signal and a recommendation for each candidate.

## Staleness Signals

| Signal | Applies to | Detection |
| --- | --- | --- |
| All downstream phases complete | Work backlogs | Every acceptance criterion checkbox in phase files is checked (`- [x]`). |
| All downstream work complete | Plans | Every work backlog derived from the plan has all phases complete. |
| All downstream plans and work complete | Designs | Every plan derived from the design has all work complete. |
| Status is `deprecated` | Developer/user guides | YAML frontmatter `status: deprecated`. |
| Superseded by a newer artifact | Designs, plans | A newer artifact with the same slug exists, or a `## Design Lineage` link with `new-doc-related` is present. |
| No active references | Any artifact | No other active (non-archived) artifact contains a link to this one. |

## Output Format

Present candidates grouped by signal:

```text
## Staleness Report

### Completed initiatives (all downstream work done)
- docs/designs/2026-04-15-w2-r0-monorepo-restructuring.md — all plans and work complete
- docs/plans/2026-04-16-w2-r0-guide-structure-contract/ — all work phases complete

### Deprecated guides
- docs/guides/developer/some-deprecated-guide.md — status: deprecated

### Unreferenced artifacts
- docs/guides/agent/2026-04-16-w2-r0-p1-summary.md — no active artifact links to this
```

If no candidates are found, report: "No staleness signals detected. The doc tree appears current."

## References

- [archive-workflow.md](../../references/archive-workflow.md) — shared authority for staleness signals and relationship tracing rules.
