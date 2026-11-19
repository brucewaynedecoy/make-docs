---
title: "W28 R0 P8 Review Corrections and Skill Refresh"
kind: "history"
status: "completed"
date: "2026-11-19"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P8"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P8 Review Corrections and Skill Refresh

## Changes

Corrects the CodeRabbit findings on PR #64 that arrived after P7, as a revision Phase of P2. The backlog snapshot blanks HTML comments in the whole body, keeping line breaks, before it finds the Closeout Notes or Change History section. The design and the user route guide now match `wave-model.md`.

The installed Skill refresh exposed two CLI defects, and the owner chose to fix them in W28. D-054: the Skill adoption review reported ready for an install recorded by an older CLI, and the apply then failed. The review now validates the prepared record and names `make-docs setup` first. D-055: full setup saved an empty resource choice, after which a repeat plan would remove 62 tracked system files, and it skipped Skill updates without saying so. Setup now keeps an unset choice unset and routes the skipped Skill changes to `make-docs setup skills`. With the owner's approval for each Store write, `make-docs setup reconfigure --project-resources all` repaired this repository's saved choice, and `make-docs setup skills` refreshed the installed Skills. The 2.0.9 candidate was packed again, and two builds give SHA-256 `fdf18978b4d8df639970cb23466fe3ed6fa4150a853638c65db3508ca4735451`.

Validation passed: regression tests that fail without each fix, 763 focused tests, `npm test` apart from the 3 known environment failures, `validate:defaults`, the build, and `smoke:pack:local`. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P8 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/08-review-corrections-and-skill-refresh.md) | Closes t1–t6 and A45–A50. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the tests, the Skill sync, and both digests. |
| [Design](../../../docs/designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md) | The `committed` fact describes the current working tree. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Records and closes D-054 and D-055. |

### Maintainer

None this session.

### User

| Path | Description |
| --- | --- |
| [Route guide](../../../docs/assets/user/workflows-choosing-the-right-route-for-your-project.md) | Completed work gets a revision Phase unless the revision Wave test passes. |
