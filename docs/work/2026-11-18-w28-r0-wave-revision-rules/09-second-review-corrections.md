---
title: "Phase 9: Second Review Corrections"
kind: "work"
status: "completed"
coordinate: "W28 R0 P9"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 9: Second Review Corrections

## Purpose

Correct the CodeRabbit findings on PR #64 at `e12583cb`, and refresh the installed `backlog-review` Skill again so it matches the corrected source.

Revises: [P8](08-review-corrections-and-skill-refresh.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure.

- P8 is complete and committed. Two fixes correct defects inside P8's result: the setup follow-up action and the snapshot comment scan. No fix reverses an approach, redoes two completed Phases, or needs its own design, so no revision Wave test passes.
- The backlog review status check is a defect from W25 R0 P3, outside W28's plan. The report model note explains P7's owner decision. Both change the `backlog-review` Skill. The owner chose to fix both in W28 on 2026-11-19, and approved the Store write for the Skill sync.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. Setup names every follow-up that remains. Snapshot facts treat code as literal text. A backlog review never shows an `incomplete` phase as complete.
- **Intended human outcome:** a person whose setup leaves both a blocked platform and Skill changes is told both. A `<!--` inside code no longer hides a live section. A phase recorded as `incomplete` displays from its tasks.
- **Human-facing surface:** the `make-docs setup` result, the snapshot output, the backlog review display, and the installed `backlog-review` Skill.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing, the real Skill sync, and document review.
- **Executor:** the implementing agent, with the owner installing the package build.
- **Accepted obligation:** none.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Regression tests for each defect, the focused suites, `npm test`, `validate:defaults`, the build, `smoke:pack:local`, and two candidate packs. |
| Performance Testing | not-needed-now | The code scans are linear in the body text. No target can change a current decision. |
| Guided Progress Review | not-needed-now | The owner chose the fixes and approved the Store write. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md) (R-BACKLOG-SNAPSHOT-10, R-BACKLOG-SNAPSHOT-27, R-BACKLOG-RULES-11)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md) (R-SKILL-SETUP-6)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- The CodeRabbit review of PR #64 at `e12583cb`

## Stage 1 - Corrections

### Tasks

- [x] t1: Make the applied setup result name both a blocked platform action and the `make-docs setup skills` route when both remain. Add a test.
- [x] t2: Treat fenced code and inline code spans as literal text when the snapshot finds live Closeout Notes and Change History sections. A heading inside a fenced block starts no section. Add tests.
- [x] t3: Match whole completion values in the backlog review phase display state, so `incomplete` falls through to the task checks. Regenerate the Skill bundles and the MCP App widget. Add a test.
- [x] t4: State in the `backlog-review` report model why refusing a report that embeds a version 1 snapshot is not a breaking report change.
- [x] t5: Refresh the installed Skills with `make-docs setup skills`, using the owner-installed build.
- [x] t6: Last, pack the 2.0.9 candidate twice and save its matching SHA-256 in `.github/release-candidates/v2.0.9.sha256`.

### Acceptance criteria

- A51: With a blocked platform and pending Skill changes, the applied result names both. With one, it names that one. With neither, it is null.
- A52: A `<!--` in a fenced block or an inline code span does not hide a live Closeout Notes or Change History section, and a heading inside a fenced block starts no section. Each test fails without the fix.
- A53: Status values `complete`, `completed`, `closed`, and `done` display as complete. `incomplete` displays from its tasks. The test fails without the fix, and the Skill bundles and widget match the source.
- A54: The installed Skills match `packages/skills/`, and repeat dry runs of `make-docs setup` and `make-docs setup skills` plan no change.
- A55: Two packs of the 2.0.9 candidate have the same SHA-256, and `.github/release-candidates/v2.0.9.sha256` holds it as one lowercase hex line.

### Dependencies

- P1 to P8 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p9-second-review-corrections). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: setup names every remaining follow-up. Code examples no longer change snapshot facts. The review display no longer calls an incomplete phase complete.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P9 Second Review Corrections](evidence.md#p9-second-review-corrections).
- Phase / capability status: Phase complete on commit.
