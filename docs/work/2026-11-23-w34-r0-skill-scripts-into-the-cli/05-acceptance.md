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

- [ ] T1: Run the name catalog, parity, ported, twin, byte-match, guard, managed-removal, and shipped-text tests.
- [ ] T2: Run `npm run smoke:pack` and the full test suite. Record known failures.
- [ ] T3: Check the P1 side-by-side evidence against the final operations.
- [ ] T4: Complete a Human Experience Review for each promise in the index trace. Review the real text of the three Skills and the real plain output of each command.
- [ ] T5: Give the owner a short optional experience handoff: run each command on this repository and notice the plain result.

### Acceptance criteria

- A20: Every validation item in the [plan](../../plans/2026-11-23-w34-r0-skill-scripts-into-the-cli/00-overview.md#validation) has recorded evidence or a named limit.
- A21: The Human Experience Review records a conclusion and its limits for each of the five promises.

### Dependencies

- P4.

## Stage 2 - Register

### Tasks

- [ ] T6: Update D-064 to `Closed` with the evidence. Update R-008 for the helper-script part. Check whether R-008's whole close bar is now met, and close it only if it is.
- [ ] T7: Record the evidence in [evidence.md](evidence.md).
- [ ] T8: When W29 R0 P3 has landed its shared task line reader (`readTaskLine`), switch the acceptance task ID check in `packages/cli/src/operations/decomposition/output.ts` (`TASK_LABEL_IN_ACCEPTANCE_RE`) to that reader. Then rerun the ported tests and the P1 side-by-side run, and record any new difference in [evidence.md](evidence.md). If W29 R0 P3 has not landed, record that this task waits for it.

### Acceptance criteria

- A22: D-064 names the result and is closed. R-008 records the helper-script result.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
