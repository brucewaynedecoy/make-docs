---
title: "Phase 1: Table Catalog and Fixed Rules"
kind: "work"
status: "active"
coordinate: "W32 R0 P1"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 1: Table Catalog and Fixed Rules

## Purpose

Settle the Store contract that later phases build on. No Store code changes before the owner accepts this phase.

## Overview

This phase writes the table and record-kind catalog in code, each fixed rule as a precise condition, the decision items, the retention windows, and fixture Stores for every rule.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A person can read why each row stays or goes ([PRD 38](../../prd/38-global-store-and-project-state.md) R-MAINT-1 to R-MAINT-4).
- Intended human outcome: the owner can read each rule and its fixtures without knowing SQLite.
- Human-facing surface or indirect effect: the catalog and the rule wording that `setup store check` will show.
- Implementation work: catalog module, rule definitions, retention settings, and fixtures.
- Evidence source or testing type selected under current authority: catalog and fixture tests; owner review of the catalog.
- Executor: the implementing agent prepares it. The owner reviews it.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | The catalog matches the schema and the PRD 38 rows. Each rule has a fixture that removes and a fixture that keeps. |
| Performance Testing | not-needed-now | No Store code path changes yet. `PERF-005` runs in P5. |
| Guided Progress Review | selected | The owner reviews the rule wording and the retention windows before P2. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

- [D-062](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Catalog

### Tasks

- [ ] t1: Write the catalog entry for each of the 17 tables and for `project_register`: purpose, writers, readers, record class, maintenance class, and retention.
- [ ] t2: Write the catalog entry for each `installation_migration_records` kind.
- [ ] t3: Add a test that fails when the catalog, the physical schema, and the PRD 38 R-MIN rows drift.

### Acceptance criteria

- A1: Every table and record kind has one catalog entry with all fields.
- A2: The drift test fails when a table, a kind, or an R-MIN row is added or removed on one side only.

## Stage 2 - Rules and fixtures

### Tasks

- [ ] t4: Write each fixed rule in PRD 38 R-MAINT-3 as a precise condition, with the liveness proof it uses.
- [ ] t5: Write the decision items in PRD 38 R-MAINT-4 and the reason text for each.
- [ ] t6: Set the retention windows and the kept harness receipt count.
- [ ] t7: Build fixture Stores for each rule, each decision item, and each crash leftover that blocks the machine today.

### Acceptance criteria

- A3: Each rule has a fixture row it removes and a fixture row it keeps.
- A4: Each blocking crash leftover has a fixture.

### Dependencies

- Accepted PRD 38 changes.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
