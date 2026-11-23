---
title: "Phase 4: One-Time Rewrite and Acceptance"
kind: "work"
status: "active"
coordinate: "W31 R0 P4"
source:
  type: "prd"
  path: "docs/prd/14-lifecycle-workflow-and-coverage-passes.md"
---

# Phase 4: One-Time Rewrite and Acceptance

## Purpose

Use the doctor to rewrite this repository's active backlogs once, and prove the Wave before W29 R0 P3 starts.

## Overview

This phase runs the doctor on this repository with the W22 R2 backlog excluded, reviews the result with the owner, applies the fix, and records the evidence.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Every coordinate in this repository's active backlogs uses upper-case letters, and the fix changed only what the owner reviewed ([PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-20, R-COORD-22; [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-DOCTOR-4).
- Intended human outcome: the owner sees one task ID form in active backlogs and can trace every change to a reviewed digest.
- Human-facing surface or indirect effect: active backlogs under `docs/work/` and the doctor output.
- Implementation work: the doctor run, the review, the fix, the second check, and evidence.
- Evidence source or testing type selected under current authority: the recorded digest, before and after counts, and a Human Experience Review.
- Executor: the implementing agent runs and records. The owner reviews the findings before the fix.
- Accepted obligation or deferral route: none. The later W22 R2 run is recorded in register D-063.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Full suite, a second clean check, and an unchanged archive and history check. |
| Performance Testing | not-needed-now | One run on a few hundred files. |
| Guided Progress Review | selected | The owner reviews the check findings on this repository before the fix. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)

## Source Obligations, Scenarios, And Findings

- [D-063](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Rewrite

### Tasks

- [x] T1: Run `make-docs project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`. Record the totals and the digest.
- [x] T2: Review the findings with the owner, then run `make-docs project doctor fix --review <digest>` with the same exclusion.
- [x] T3: Run the check again and confirm it finds nothing outside the excluded path. Confirm that no file under `.make-docs/archive/` and no history record changed.
- [x] T4: Confirm that the backlog snapshot facts are the same before and after, apart from the task ID case.
- [x] T5: Record in register D-063 that the W22 R2 backlog still needs a doctor run after W22 R2 closes.

### Acceptance criteria

- A13: The second check is clean outside the excluded path.
- A14: Archives, history records, and the W22 R2 backlog are byte-identical before and after.
- A15: The backlog snapshot facts match before and after, apart from the task ID case.

## Stage 2 - Acceptance

### Tasks

- [x] T6: Run the full test suite and record known failures.
- [x] T7: Complete a Human Experience Review for each promise in the index, and record evidence in `evidence.md`.

### Acceptance criteria

- A16: Every plan validation item has recorded evidence or a named limit.

### Dependencies

- P2 and P3.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: a second doctor check found nothing, a byte check proved that every change is a `t` to `T` in a reviewed place, and the full suite has only known failures ([evidence](evidence.md#p4-one-time-rewrite-and-acceptance)). Guided Progress Review selected and done: the owner reviewed the check findings and the prose review list, and approved the fix on 2026-11-22. Performance Testing and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none. One run on a few hundred files.
- Human Experience Review: all four promises hold on this repository. Every task ID that Make Docs writes, and every task ID in the active backlogs, now uses `T`. Older files and typed input with `t` still work. The check named each finding in plain words and changed nothing. The fix changed only the reviewed places, reported each file, and named the undo path. Owner feedback on the wording is welcome; none was raised.
- Optional experience handoff: run `make-docs project doctor check` in another Make Docs project. Notice the totals first, then each line. Feedback is optional.
- Explicit human acceptance gate: the owner reviewed the findings and approved the fix on 2026-11-22.
- Evidence report: [P4 One-Time Rewrite and Acceptance](evidence.md#p4-one-time-rewrite-and-acceptance).
- Phase / capability status: Phase complete on commit. W31 R0 is complete. The W22 R2 backlog keeps `t` until its own doctor run after W22 R2 closes (register D-063).
