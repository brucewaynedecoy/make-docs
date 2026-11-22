---
title: "Phase 1: Record Model and Rule Catalog"
kind: "work"
status: "active"
coordinate: "W29 R0 P1"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 1: Record Model and Rule Catalog

## Purpose

Settle every contract that later phases build on. No code starts before this phase is accepted.

## Overview

This phase defines the work records, the sync table, the readiness and claim rules, the tracker connection contract, the R-MIN field list, and the fixtures. Each rule gets one catalog entry with its CLI form and its agent form, so later phases can prove parity.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. `run work next` names ready units and why others wait ([PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-QUEUE-4, R-WORK-QUEUE-5).
- Intended human outcome: the owner can read the readiness rule and the sync table without knowing the Store tables.
- Human-facing surface or indirect effect: the rule catalog and the reasons that `run work next` will show.
- Implementation work: contracts and fixtures only.
- Evidence source or testing type selected under current authority: owner review of the catalog.
- Executor: the implementing agent prepares it. The owner reviews it.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Fixture files load and validate against the record model. |
| Performance Testing | not-needed-now | No code path exists yet. `PERF-004` runs in P6. |
| Guided Progress Review | selected | The owner reviews the readiness reasons and the conflict wording before P4 builds them. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Records and rules

### Tasks

- [ ] t1: Define unit kinds (wave, revision, phase, stage, task, quick item), their stable store ID, coordinate, parent, and status values.
- [ ] t2: Define dependency records that point to store IDs, and the unresolved-text form for a bullet that import cannot resolve.
- [ ] t3: Define link records in both directions: unit to design, plan, PRD section, and evidence file.
- [ ] t4: Write the three-way sync table and the conflict record, including the settle commands.
- [ ] t5: Write the readiness rule, the ready order, and the wording of each "waits because" reason.
- [ ] t6: Write the claim rule: claimant, default time limit, renewal interval, expiry, stale-claimant refusal, and the handle check before takeover.
- [ ] t7: Write the report and close payloads and the close outcomes.
- [ ] t8: Write the tracker connection contract and mark the local store as the only current connection.

### Acceptance criteria

- A1: Every rule has one catalog entry that names its CLI form, its agent form, and its parity fixture.
- A2: A reader can see why any open unit is or is not ready from the catalog alone.

## Stage 2 - Field register and fixtures

### Tasks

- [ ] t9: Draft an R-MIN row for every new field: class, writer, readers, retention, privacy, and recovery use.
- [ ] t10: Build the fixture matrix: this repo's current backlogs, a mixed portfolio, unresolved dependencies, a conflict, a quick item, a folder without git, and a no-Store checkout.

### Acceptance criteria

- A3: Every new field has a drafted R-MIN row that PRD 38 can take without change.
- A4: Each fixture names the rule it proves and its expected result.

### Dependencies

- Accepted design, plan, and PRD 52.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
