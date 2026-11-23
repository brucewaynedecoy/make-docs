---
title: "Phase 5: Acceptance"
kind: "work"
status: "active"
coordinate: "W34 R0 P5"
source:
  type: "prd"
  path: "docs/prd/03-open-questions-and-risk-register.md"
---

# Phase 5: Acceptance

## Purpose

Prove the Wave and close D-064. This is step 5 of the [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) operation-first order. It depends on P4.

## Overview

This phase runs every Wave test, checks the P1 side-by-side evidence against the final operations, and completes a Human Experience Review of each promise in the [index](00-index.md#human-experience-trace). Then it closes D-064 and records the helper-script part of R-008.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Every promise in the index trace, reviewed on the real Skill text and the real plain output.
- Intended human outcome: the owner reads one review that says, for each promise, what was seen, what it shows, and its limits.
- Human-facing surface or indirect effect: the four commands, the three Skills, and the update plan.
- Implementation work: test runs, the Human Experience Review, the register update, and the evidence report.
- Evidence source or testing type selected under current authority: the full test suite, `npm run smoke:pack`, and the Human Experience Review result as a Guided Progress Review.
- Executor: the validating agent prepares it. The owner reviews the result.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Name catalog, parity, ported, twin, byte-match, guard, managed-removal, and shipped-text tests; the full suite; `npm run smoke:pack`. |
| Performance Testing | not-needed-now | No performance candidate exists. |
| Guided Progress Review | selected | The owner sees the Human Experience Review result. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-SKILL-CHECK
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-MCP-PROFILE-11, R-SKILL-RUNTIME-7
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md): R-SKILL-BUNDLE-7, Validation Boundary
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md): R-BACKLOG-SKILL-21
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md): D-064, R-008

## Source Obligations, Scenarios, And Findings

- [D-064 and R-008](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Proof and review

### Tasks

- [x] T1: Run the name catalog, parity, ported, twin, byte-match, guard, managed-removal, and shipped-text tests.
- [x] T2: Run `npm run smoke:pack` and the full test suite. Record known failures.
- [x] T3: Check the P1 side-by-side evidence against the final operations.
- [x] T4: Complete a Human Experience Review for each promise in the index trace. Review the real text of the three Skills and the real plain output of each command.
- [x] T5: Give the owner a short optional experience handoff: run each command on this repository and notice the plain result.

### Acceptance criteria

- A20: Every validation item in the [plan](../../plans/2026-11-23-w34-r0-skill-scripts-into-the-cli/00-overview.md#validation) has recorded evidence or a named limit.
- A21: The Human Experience Review records a conclusion and its limits for each of the five promises.

### Dependencies

- P4.

## Stage 2 - Register

### Tasks

- [x] T6: Update D-064 to `Closed` with the evidence. Update R-008 for the helper-script part. Check whether R-008's whole close bar is now met, and close it only if it is.
- [x] T7: Record the evidence in [evidence.md](evidence.md).
- [x] T8: When W29 R0 P3 has landed its shared task line reader (`readTaskLine`), switch the acceptance task ID check in `packages/cli/src/operations/decomposition/output.ts` (`TASK_LABEL_IN_ACCEPTANCE_RE`) to that reader. Then rerun the ported tests and the P1 side-by-side run, and record any new difference in [evidence.md](evidence.md). If W29 R0 P3 has not landed, record that this task waits for it.

### Acceptance criteria

- A22: D-064 names the result and is closed. R-008 records the helper-script result.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done. The 15 focused files (all six `w34-r0-*` files, the bundle, name catalog, consistency, shipped-text, Skill registry, Skill catalog, install, operations, and W29 R0 P3 parser tests) pass with 437 tests, `npm run smoke:pack:local` passes, and the full suite has only known failures (see the evidence). T8 adds `w34-r0-p5-acceptance-task-label.test.ts` (10 tests). After the independent review fixes, the six `w34-r0-*` files, the W29 R0 P3 parser, the two backlog snapshot files, and consistency pass with 293 tests. Performance Testing `not-needed-now`: no performance candidate exists. Guided Progress Review `selected`: the owner sees the Human Experience Review result below and in the evidence. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none needed. No measurement was taken.
- Human Experience Review: done for all five promises in the [index trace](00-index.md#human-experience-trace), on the real text of the three Skills and the real plain output of the four commands on this repository. All five are `satisfied` within their limits. The main limits: the live MCP tools were not called, because this session's MCP server is the released CLI; no agent ran a Skill without the CLI; the twin test checks rule IDs, not wording; `check decomposition` reports 629 findings on this repository because it is not a decomposition output, and the plain output does not say what kind of project the check is for; and a file that names the managed-block marker in prose is skipped as if it holds a managed block. The last two limits are open register entry D-067, with the owner's choice of the marker rule as its next step. See [Human Experience Review (A21)](evidence.md#human-experience-review-a21).
- Optional experience handoff: run `make-docs project markdown validate --path docs/designs` and notice that the first line gives the totals, what repair can fix, and what needs a person. Then run `make-docs project markdown repair --path docs/designs` and notice that it shows each exact line change and says "Changed nothing." Then run `make-docs project relations list --path docs/plans/2026-11-23-w34-r0-skill-scripts-into-the-cli` and notice that each relation names its kind and its source file. Feedback is welcome and optional.
- Explicit human acceptance gate: none for this phase. P3 T7 and A15 stay open: the owner refreshes the installed `backlog-review` copy with `make-docs update` after the release.
- Evidence report: [P5 Acceptance](evidence.md#p5-acceptance).
- Phase / capability status: complete and uncommitted, on `43d5eb18`. A20, A21, and A22 pass. T8 is done: the acceptance task ID check uses `readTaskLabel` from the shared task line reader, the work phase reader's `TASK_RE` builds on the same `TASK_ID_SOURCE`, and the side-by-side run shows no new difference. D-064 is closed. R-008 records the helper-script result and stays open for its other parts. New D-067 is open for the two output limits. The Wave has one open task, P3 T7 and A15, which waits for the release.
