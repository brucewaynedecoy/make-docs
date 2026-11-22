---
title: "Phase 6: Package Parity and Acceptance"
kind: "work"
status: "active"
coordinate: "W29 R0 P6"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 6: Package Parity and Acceptance

## Purpose

Prove the whole work store on an installed package before W30 builds on it.

## Overview

One package candidate passes installed, two-checkout, no-Store, folder-without-git, parity, performance characterization, and Human Experience checks.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. All five promises in the [index](00-index.md#human-experience-trace).
- Intended human outcome: a person and a teammate can share work through git, and a person without a Store sees no change.
- Human-facing surface or indirect effect: the installed CLI, MCP tools, and `docs/work/` files.
- Implementation work: installed proofs, `PERF-004`, and the Human Experience Review.
- Evidence source or testing type selected under current authority: installed tests and Human Experience Review.
- Executor: the implementing agent. The owner is invited to give feedback.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Installed package suite, two-checkout sync, no-Store, and folder-without-git runs. |
| Performance Testing | selected | `PERF-004`, `characterize-now`, informational. |
| Guided Progress Review | selected | Owner feedback on the installed `next`, `status`, and conflict output. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: `PERF-004`, written in this phase by t1 before any measurement.
- Finite evidence budget and stop-rule reference or `not-applicable`: the `PERF-004` profile's budget and stop rules.
- Execution packet link or `not-applicable`: Stage 2 tasks t6 and t7.
- Outcome and evidence handoff or `none`: the central `evidence.md` report after a result exists.
- Gate disposition and supported-scope limit or `not-applicable`: informational for speed. Sync correctness stays blocking.

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [48 Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Installed proofs

### Tasks

- [ ] t1: Write the `PERF-004` profile in this phase file under the performance evidence profile template.
- [ ] t2: Install the candidate in a clean fixture project and in this repo's dogfood instance. Run first import.
- [ ] t3: Edit the same backlog in two checkouts that share git. Prove import, write, conflict stop, and settle.
- [ ] t4: Prove a project without Store access keeps `docs/work/` as the authority and every existing command behaves as before.
- [ ] t5: Prove the commands work in a folder without git.

### Acceptance criteria

- A25: The two-checkout run shows each sync table result on the installed package.
- A26: The no-Store run matches the pre-Wave behavior of every existing work command.
- A27: The folder-without-git run completes next, claim, report, and close.

## Stage 2 - Characterization and review

### Tasks

- [ ] t6: Run `PERF-004` on a project with many backlogs within its budget.
- [ ] t7: Record the baseline and the fast-path decision.
- [ ] t8: Complete a Human Experience Review for each promise in the index.
- [ ] t9: Create `evidence.md`, record every result and limit, and link it from the index.

### Acceptance criteria

- A28: `PERF-004` has a recorded baseline and a recorded fast-path decision.
- A29: Each promise has a review conclusion with its evidence and limits.
- A30: Every plan validation item has recorded evidence or a named limit.

### Dependencies

- P2 to P5 and one identified package candidate.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
