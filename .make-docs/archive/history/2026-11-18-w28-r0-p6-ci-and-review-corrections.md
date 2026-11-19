---
title: "W28 R0 P6 CI and Review Corrections"
kind: "history"
status: "completed"
date: "2026-11-18"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P6"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P6 CI and Review Corrections

## Changes

Revises completed P2, and corrects P1 and P4 text, after CI and review of PR #64. The snapshot now strips HTML comments with a comment-aware scan instead of a single regular-expression pass, which fixes CodeQL alert 44 at both sites; tests cover overlapping and nested inputs. `nextPhase` counts missing linked phases, record `committed` checks every linked phase, Git paths are normalized for projects in a repository subdirectory, and a Change History entry at the wrong heading level is reported. The Wave Model, PRD 14, and the design now check archived lineage before any lineage decision, keep the owner gates after a stated coordinate, and apply the `w1-r0` fallback inside the outcome test. The flagged guides describe in-place owning-PRD updates and the full set of backlog choices.

Validation passed: 491 focused tests, `npm test` apart from the 3 known environment failures, `validate:defaults`, the build, and `smoke:pack:local`. Five CodeRabbit findings need an owner decision and are listed in the evidence report. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P6 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/06-ci-and-review-corrections.md) | Closes t1–t4 and A39–A41. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the CodeQL fix, the triage, and the owner questions. |
| [PRD 14](../../../docs/prd/14-lifecycle-workflow-and-coverage-passes.md) | R-COORD-4 and R-COORD-5 order and fallback. |

### Maintainer

| Path | Description |
| --- | --- |
| [Route choice](../../../docs/assets/maintainer/development-workflows-choosing-the-right-route.md) | Owner gates, new-Wave path, and in-place PRD updates. |

### User

| Path | Description |
| --- | --- |
| [W/R/P concepts](../../../docs/assets/user/concepts-wave-revision-phase-coordinates.md) | Owner choice for an absorbable Wave. |
| [Route choice](../../../docs/assets/user/workflows-choosing-the-right-route-for-your-project.md) | Completed-work and owner-gate rules. |
| [Stage overview](../../../docs/assets/user/workflows-how-make-docs-stages-fit-together.md) | In-place PRD updates and revision-Wave backlogs. |
