---
title: "Phase 2: Store Schema and Records"
kind: "work"
status: "active"
coordinate: "W29 R0 P2"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 2: Store Schema and Records

## Purpose

Add the work tables to the global Store under the existing migration and safety rules.

## Overview

One append-only migration moves the Store from schema v6 to v7. A Store service reads and writes the new tables with version checks. This phase adds no public operation.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `indirect`. Store safety and recovery for work records ([PRD 38](../../prd/38-global-store-and-project-state.md)).
- Intended human outcome: an upgrade keeps the existing Store safe, and a failed migration leaves it usable.
- Human-facing surface or indirect effect: migration results and Store-unavailable messages.
- Implementation work: migration, tables, Store service, and R-MIN parity test.
- Evidence source or testing type selected under current authority: automated migration and parity tests.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Migration, rollback, newer-schema refusal, claim uniqueness, and R-MIN parity tests. |
| Performance Testing | not-needed-now | Table writes are not the characterized path. |
| Guided Progress Review | not-needed-now | No new human surface in this phase. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Migration

### Tasks

- [ ] t1: Add the PRD 38 R-MIN rows from P1 before any table exists.
- [ ] t2: Add the v7 migration entry, its journal row, and the v7 expected-table list.
- [ ] t3: Use the reviewed path: back up, migrate in one transaction, and bump `user_version` in the same transaction.
- [ ] t4: Keep writer refusal on v6 and reader refusal on any newer schema.

### Acceptance criteria

- A5: Tests cover v6 to v7, a failed migration that rolls back, and a newer-schema refusal.
- A6: Store-unavailable, denied, and unsafe states return the existing typed results.

## Stage 2 - Store service

### Tasks

- [ ] t5: Add a Store service for units, dependencies, links, claims, the sync ledger, and conflicts, with `expectedVersion` on every write.
- [ ] t6: Enforce one live claim per unit in the schema.
- [ ] t7: Expire claims by time, as short-lived mutation guards.
- [ ] t8: Add a test that fails when the R-MIN register and the physical schema drift.
- [ ] t9: Record each project's `projectName` with its project ID at each Store write, and refuse a name that another project holds (PRD 38 R-ID-8). Use the project register that the D-062 Store review settles.

### Acceptance criteria

- A7: A second live claim on the same unit fails at the schema level.
- A8: A plain claim on a unit with an expired claim is refused. A takeover after a handle check succeeds.
- A9: The R-MIN parity test passes and fails when a field is removed from either side.
- A33: Two projects cannot hold the same project name in one Store, and a renamed project resolves only by its new name.

### Dependencies

- P1 accepted.
- The project register decision in the register D-062 Store review.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
