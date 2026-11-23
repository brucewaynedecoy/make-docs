---
title: "Phase 6: CI and Review Corrections"
kind: "work"
status: "completed"
coordinate: "W28 R0 P6"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 6: CI and Review Corrections

## Purpose

Correct defects that CodeQL and CodeRabbit found in completed W28 R0 work on PR #64. The fixes cover the snapshot code, the Wave Model decision procedure, PRD 14, the design, and the guides.

Revises: [P2](02-cli-snapshot-facts-and-rule.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure.

- P1, P2, and P4 are complete and committed. Each fix corrects a defect inside an existing result, and no fix redoes a Phase's result, reverses an approach, or needs its own design. So no revision Wave test passes, and the agent may decide it alone.
- The code changes revise P2. The documentation corrections touch P1 and P4 text, and the index Change History lists them.
- Owner-level review questions are not decided here. The [evidence report](evidence.md#p6-ci-and-review-corrections) lists them.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. Agents follow a decision procedure that never skips an owner gate. Snapshot facts stay correct for nested projects, missing linked phases, and tricky comments.
- **Intended human outcome:** owner questions arrive before an archived Wave is changed, and before a stated coordinate leads to a significant plan change. Guides describe the current PRD model.
- **Human-facing surface:** `wave-model.md`, PRD 14, the design, the user and maintainer guides, and the snapshot output.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing and document review.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Focused tests for the scanner and the snapshot corrections, then `npm test`, `validate:defaults`, the build, and `smoke:pack:local`. |
| Performance Testing | not-needed-now | The comment scan is linear in the section text. No target can change a current decision. |
| Guided Progress Review | not-needed-now | CodeRabbit and CodeQL review are the input. No owner review can change a current decision. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md) (R-COORD-4, R-COORD-5)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md) (R-BACKLOG-SNAPSHOT-27 to 29, R-BACKLOG-RULES-11)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- CodeQL alert 44 (`js/incomplete-multi-character-sanitization`) and the CodeRabbit review of PR #64

## Stage 1 - Corrections

### Tasks

- [x] T1: Replace both regular-expression HTML-comment strips in `snapshot.ts` with one comment-aware `stripHtmlComments` scan. It removes unterminated comments to the end of the text and re-scans until no `<!--` remains. Add tests for overlapping and nested cases.
- [x] T2: Make `nextPhase` count linked phase numbers whose files are missing. Make record-level `committed` check the index and every linked phase. Normalize Git paths when the target is a repository subdirectory. Report a Change History entry whose heading is not level 3.
- [x] T3: Reorder the Wave Model decision procedure, PRD 14 R-COORD-4, and the design procedure:
  - a stated coordinate still goes through the deviation test and the owner gates;
  - the archived-lineage check comes before any lineage decision;
  - the `w1-r0` fallback applies inside the outcome test.
- [x] T4: Correct the user and maintainer guides that CodeRabbit flagged. They now name the owner gates, new and revision Wave backlogs, and in-place owning-PRD updates instead of change documents.

### Acceptance criteria

- A39: CodeQL's two overlapping inputs, `<!<!--x-->--` and `<!--a<!--b-->c-->`, leave no comment opener. The snapshot code has no regular-expression HTML-comment strip left.
- A40: `nextPhase` is 10 when `09-nine.md` is linked but missing. Record `committed` is false when a linked phase is deleted. A nested project reports correct per-phase `committed` facts. A `####` entry emits `BACKLOG-VAL-017`.
- A41: The shipped Wave Model, PRD 14, and the design state the same order, with archived lineage first, the gate rule, and the empty-scan fallback. The template and dogfood copies of `wave-model.md` match.

### Dependencies

- P1 to P5 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p6-ci-and-review-corrections). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: the procedure now asks the owner before an archived Wave is restored and before a stated coordinate leads to a significant change. The guides no longer describe change documents.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P6 CI and Review Corrections](evidence.md#p6-ci-and-review-corrections).
- Phase / capability status: Phase complete on commit. Open owner questions are listed in the evidence and are not decided here.
