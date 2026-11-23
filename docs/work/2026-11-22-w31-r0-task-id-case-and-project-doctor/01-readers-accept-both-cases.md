---
title: "Phase 1: Readers Accept Both Cases"
kind: "work"
status: "active"
coordinate: "W31 R0 P1"
source:
  type: "prd"
  path: "docs/prd/14-lifecycle-workflow-and-coverage-passes.md"
---

# Phase 1: Readers Accept Both Cases

## Purpose

Make every reader accept `t` and `T` as the same task ID before any writer changes. Old files must keep working on the day of the change.

## Overview

The two backlog parsers, the phase task check, and coordinate input today accept only a lower-case `t`. This phase makes them accept both cases and proves that old, new, and mixed files give the same facts.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A person can still type `t3`, and an old file with `t3` still works ([PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-22, [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SNAPSHOT-33).
- Intended human outcome: no backlog, command, or URI breaks because of the letter case of a task ID.
- Human-facing surface or indirect effect: backlog review results, phase checks, and task coordinate input.
- Implementation work: parser patterns, the phase task check, and coordinate input.
- Evidence source or testing type selected under current authority: parser fixtures.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Lower-case, upper-case, and mixed fixtures for both parsers and the phase check. |
| Performance Testing | not-needed-now | The pattern change does not change read cost. |
| Guided Progress Review | not-needed-now | No human-facing wording changes in this phase. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Readers

### Tasks

- [x] T1: Make the task line pattern in `packages/cli/src/operations/work/index.ts` accept `t` and `T`.
- [x] T2: Make the phase task check compare task IDs without regard to case, so a file with `T1`, `T2` passes.
- [x] T3: Make the task pattern in `packages/cli/src/operations/work/backlog/snapshot.ts` accept `T`, so `- [ ] T1: ...` is a task with ID `T1`. Keep the upper-case result.
- [x] T4: Accept both cases in task coordinate input for commands, and keep it aligned with the W29 R0 P1 project URI grammar.
- [x] T5: Add lower-case, upper-case, and mixed fixtures, and prove the same facts for each.

### Acceptance criteria

- A1: Both parsers report the same tasks and IDs for a lower-case, an upper-case, and a mixed fixture.
- A2: A phase file that uses only `T` passes the phase task check with no warning.
- A3: Existing tests pass with their lower-case inputs unchanged.

### Dependencies

- Accepted PRD 14 and PRD 51 changes.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 8 new reader tests, 2 new validator tests, the type check, and the full suite with only the 3 known failures ([evidence](evidence.md#p1-readers-accept-both-cases)). Performance Testing `not-needed-now`: the pattern change does not change read cost. Guided Progress Review `not-needed-now`: no human-facing wording changed. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: a person can still type `t3`, and an old file with `t3` still works. A new file with `T3` now works too. The backlog snapshot used to read `- [ ] T1: ...` as a task with no ID. Now it reads the ID `T1`. A phase file with only `T` now passes the phase check with no warning. No result text changed. Warnings still say `t`, and P2 changes them.
- Optional experience handoff: not applicable. No human-facing wording changed.
- Explicit human acceptance gate: none beyond review of this phase.
- Evidence report: [P1 Readers Accept Both Cases](evidence.md#p1-readers-accept-both-cases).
- Phase / capability status: Phase complete on commit and review. Capability partial: writers (P2), the doctor (P3), and the one-time rewrite (P4) remain.
