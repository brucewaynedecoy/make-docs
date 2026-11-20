---
title: "W28 R0 P5 Coordinate Facts Corrections Closeout"
kind: "history"
status: "completed"
date: "2026-11-18"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P5"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P5 Coordinate Facts Corrections Closeout

## Changes

Revises completed P2 as a revision Phase. `work.backlog.snapshot` now derives coordinate facts from the union of dated W/R work and plan directories, live and archived, so plan-only revisions such as W18 R15 and W19 R0 count toward each Wave's revisions and next free revision. Each Wave also reports `archived`, which is true only when every work and plan directory for it is archived. The catalog parity mappings for `BACKLOG-RULE-017` and `BACKLOG-RULE-018` now name `wave-model.md`. PRD 51 R-BACKLOG-SNAPSHOT-29 was updated first, and the generated Skill bundles and MCP App widget were regenerated.

Validation passed: 23 focused tests, 399 backlog and registry tests, the CLI build, and a built-CLI snapshot of this repository with unchanged diagnostics. The backlog's Change History records the revision Phase. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P5 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/05-coordinate-facts-corrections.md) | Closes t1–t4 and A32–A35. |
| [PRD 51](../../../docs/prd/51-backlog-review-and-reporting.md) | R-BACKLOG-SNAPSHOT-29 counts plan directories and per-Wave archived state. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the P5 tests and real snapshot. |

### Maintainer

None this session.

### User

None this session.
