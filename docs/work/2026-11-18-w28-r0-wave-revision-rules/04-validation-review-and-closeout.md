---
title: "Phase 4: Validation, Review, and Closeout"
kind: "work"
status: "active"
coordinate: "W28 R0 P4"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/03-backlog-and-validation.md"
---

# Phase 4: Validation, Review, and Closeout

## Purpose

Show that the shipped rules give the expected outcomes and that the owner-facing replies meet the Human Experience Contract. Then close the Wave with package checks, the coverage pass, and history.

## Overview

This phase covers five things:

- a walkthrough of five past cases through the shipped `wave-model.md`;
- review of one sample gated owner question and one sample agent-alone reply;
- review of the Change History templates;
- sequential package checks;
- the coverage pass and history records.

It ends before any commit. The commit waits for Tyler's go-ahead.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. This phase covers all four promises in the [index trace](00-index.md#human-experience-trace).
- **Intended human outcome:**
  - The five cases give the outcomes that the design expects.
  - The gated question names the choice, the reason, and the effect, and it stands on its own.
  - The agent-alone reply names the choice and the reason.
  - A Change History entry is readable without git history.
- **Human-facing surface:** `wave-model.md`, sample agent replies, and the plan and work templates.
- **Implementation work:** Stages 1 to 4.
- **Evidence source:** Agent walkthrough and Human Experience Review recorded in `evidence.md`, plus Automated Implementation Testing for the package checks.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment) and [the Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Run `npm test`, `npm run validate:defaults -w packages/cli`, and `npm run smoke:pack` one after the other, then the PRD authority, path-hygiene, and backlog snapshot checks. |
| Performance Testing | not-needed-now | No performance candidate needs evidence. |
| Guided Progress Review | optional | Tyler may review the samples. No response is required, and the absence of one does not block closure. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

Human Experience Review is required agent review work in Stage 2. It is not a testing type.

## Source PRD Docs

- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [04 Glossary](../../prd/04-glossary.md)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- `none`

## Stage 1 - Expected-Outcome Walkthrough

### Tasks

- [ ] t1: Walk the five design cases through the shipped `wave-model.md`: W22 R2 P4, W17 R3, W26 R1, W18 R16, and W19 R7. Record the input facts, each step's result, and the final outcome in `evidence.md`.

### Acceptance criteria

- A21: Each of the five cases gives the outcome in the design's expected-outcomes table:
  - W22 R2 P4: revision Phase.
  - W17 R3: revision Wave.
  - W26 R1: in-place edit or new Phase in R0.
  - W18 R16: revision Phase in R11.
  - W19 R7: in-place edit.

  Any mismatch is recorded with its cause and fixed in P1 before closure.

### Dependencies

- P1 to P3 and P5 are complete.

## Stage 2 - Human Experience Review

### Tasks

- [ ] t2: Draft one sample gated owner question, for the W17 R3 revision Wave case, and one sample agent-alone reply, for the W22 R2 P4 revision Phase case. Review both against the User Action Requests rule and PRD 14 R-COORD-12. Record the observation, conclusion, limit, and next action for each.
- [ ] t3: Fill one sample Change History entry from the shipped `work-index.md` template. Check that a reader can see the change, the reason, the PRD decision, and the approval without git history. Record the result.

### Acceptance criteria

- A22: The gated question names the choice, the reason, and the effect. It says whether owner action is required and what it blocks. It does not require opening a link to understand it.
- A23: The agent-alone reply names the chosen coordinate and the reason in its first two sentences.
- A24: The sample Change History entry passes `BACKLOG-VAL-017`, and the review records its readability conclusion and limits.

### Dependencies

- Stage 1 is complete.

## Stage 3 - Package and Document Checks

### Tasks

- [ ] t4: Run `npm test`, then `npm run validate:defaults -w packages/cli`, then `npm run smoke:pack`, one after the other.
- [ ] t5: Run `make-docs run prd authority validate --target-root .`, `make-docs project path-hygiene validate`, and `make-docs run work backlog snapshot --target-root . --json`. Record the results.

### Acceptance criteria

- A25: All three package commands pass. The packed template contains the changed resources.
- A26: The PRD authority and path-hygiene validators pass. The snapshot reports the W28 R0 record as `supported`, with no `BACKLOG-VAL-017` on it.

### Dependencies

- Stage 2 is complete.

## Stage 4 - Coverage Pass and History

### Tasks

- [ ] t6: Run the coverage pass under [the coverage-pass contract](../../../.make-docs/system/contracts/coverage-pass-contract.md): guide, system-resource, history, PRD reconciliation, documentation hygiene, validation, obligations, and testing decisions.
- [ ] t7: Write one history record per completed phase in `.make-docs/archive/history/`, under the history-record contract, with `coordinate: "W28 R0 P<n>"`.
- [ ] t8: Add `### Closeout Notes` to each phase. Report the result to Tyler and wait for the commit go-ahead.

### Acceptance criteria

- A27: Every coverage-pass surface has a verdict and a reason. PRD reconciliation finds PRDs 14, 51, and 04 current.
- A28: Each phase has a history record and filled Closeout Notes with no unresolved placeholder.
- A29: Nothing is committed, pushed, or opened as a PR before Tyler's go-ahead.

### Dependencies

- Stage 3 is complete.
