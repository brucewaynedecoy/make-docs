---
title: "W28 R0 P9 Second Review Corrections"
kind: "history"
status: "completed"
date: "2026-11-19"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P9"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P9 Second Review Corrections

## Changes

Corrects the CodeRabbit findings on PR #64 at `e12583cb`, as a revision Phase of P8. The applied setup result names every remaining follow-up, including the `make-docs setup skills` route next to a blocked platform. Snapshot section lookup treats fenced code and inline code as literal text, so a `<!--` in code no longer hides a live section. At the owner's direction, the backlog review display now matches whole completion values, so `incomplete` is no longer shown as complete, and the report model explains why the report version stays 1. With the owner's approval for the Store write, `make-docs setup skills` refreshed the installed `backlog-review` Skill. Two builds of the 2.0.9 candidate give SHA-256 `3946a861c1b5fde1dddd79b5a06c78f2f746def05648eccdbe3cdc32bf77864e`.

Validation passed: regression tests that fail without each fix, `npm test` apart from the 3 known environment failures, `validate:defaults`, the build, and `smoke:pack:local`. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P9 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/09-second-review-corrections.md) | Closes t1–t6 and A51–A55. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the tests, the Skill sync, and both digests. |

### Maintainer

| Path | Description |
| --- | --- |
| [Report model](../../../packages/skills/backlog-review/references/report-model.md) | Why the report version stays 1. |

### User

None this session.
