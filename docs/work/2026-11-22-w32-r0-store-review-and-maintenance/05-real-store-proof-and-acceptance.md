---
title: "Phase 5: Real Store Proof and Acceptance"
kind: "work"
status: "active"
coordinate: "W32 R0 P5"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 5: Real Store Proof and Acceptance

## Purpose

Fix documentation drift and prove the Wave on a copy of a real Store before W29 R0 P2 starts.

## Overview

This phase corrects the Store README and code comments, runs the new commands on a copy of the maintainer machine's Store, measures `PERF-005`, and closes the Wave.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. All promises in the index, on a real Store copy.
- Intended human outcome: the owner sees the real space saved, the real findings, and a guard that holds on real data.
- Human-facing surface or indirect effect: command output on a real Store copy and the Store README.
- Implementation work: drift fixes, the copy run, `PERF-005`, the full suite, and the Human Experience Review.
- Evidence source or testing type selected under current authority: recorded copy run, `PERF-005`, Human Experience Review.
- Executor: the implementing agent runs and records. The owner reviews the wording.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Full suite and the recorded copy run. |
| Performance Testing | selected | `PERF-005`: characterize `clean` with the vacuum on a real Store copy. Informational. It decides whether the vacuum stays in `clean`. |
| Guided Progress Review | selected | The owner reviews `project list`, `check`, and `clean` output on the copy. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: `PERF-005`, created in this phase.
- Finite evidence budget and stop-rule reference or `not-applicable`: three runs on one Store copy; stop after three or on the first failure.
- Execution packet link or `not-applicable`: recorded in `evidence.md`.
- Outcome and evidence handoff or `none`: the vacuum decision, in `evidence.md`.
- Gate disposition and supported-scope limit or `not-applicable`: informational; no speed promise.

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- [D-062](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Drift

### Tasks

- [ ] T1: Correct the Store README and code comments: callers, backup names, recovery paths, and table counts.

### Acceptance criteria

- A19: The Store README and comments name only callers, files, and paths that exist.

## Stage 2 - Real Store copy

### Tasks

- [ ] T2: Copy the maintainer machine's Store to a temporary folder. Run `project list`, `setup store check`, and `setup store clean` on the copy with `MAKE_DOCS_HOME` pointed at it. Never run `clean` on the real Store.
- [ ] T3: On the copy, confirm that a `sqlite3` write fails after the migration and that a removed trigger is reported as `store-unsafe`.
- [ ] T4: Run `PERF-005` on the copy and record the vacuum decision.

### Acceptance criteria

- A20: The copy run records the findings, the rows removed, and the space before and after.
- A21: The guard holds on the copy, and a removed trigger is reported.
- A22: `PERF-005` has a recorded baseline and a vacuum decision.

## Stage 3 - Acceptance

### Tasks

- [ ] T5: Run the full test suite and record known failures.
- [ ] T6: Complete a Human Experience Review for each promise in the index, and record evidence in `evidence.md`.
- [ ] T7: Update register D-062 with the result.

### Acceptance criteria

- A23: Every plan validation item has recorded evidence or a named limit.
- A24: Register D-062 names the result and any remaining item.

### Dependencies

- P3 and P4.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
