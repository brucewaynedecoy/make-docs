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

- [x] T1: Write the catalog entry for each of the 17 tables and for `project_register`: purpose, writers, readers, record class, maintenance class, and retention.
- [x] T2: Write the catalog entry for each `installation_migration_records` kind.
- [x] T3: Add a test that fails when the catalog, the physical schema, and the PRD 38 R-MIN rows drift.

### Acceptance criteria

- A1: Every table and record kind has one catalog entry with all fields.
- A2: The drift test fails when a table, a kind, or an R-MIN row is added or removed on one side only.

## Stage 2 - Rules and fixtures

### Tasks

- [x] T4: Write each fixed rule in PRD 38 R-MAINT-3 as a precise condition, with the liveness proof it uses.
- [x] T5: Write the decision items in PRD 38 R-MAINT-4 and the reason text for each.
- [x] T6: Set the retention windows and the kept harness receipt count.
- [x] T7: Build fixture Stores for each rule, each decision item, and each crash leftover that blocks the machine today.

### Acceptance criteria

- A3: Each rule has a fixture row it removes and a fixture row it keeps.
- A4: Each blocking crash leftover has a fixture.

### Dependencies

- Accepted PRD 38 changes.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 36 catalog, drift, and fixture tests on 10 fixture Stores, the type check, and the full suite with only known failures. An independent review asked for 11 fixes before owner review, and two re-checks asked for 8 more. All were made. Guided Progress Review selected: the owner reviews the rule wording, the decision item reasons, the retention values, the recommended v7 receipt columns, and the four inactive rules before P2. Performance Testing and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none. No Store code path changed. `PERF-005` runs in P5.
- Human Experience Review: each table, record family, rule, and decision item has plain wording. Each decision item has a reason with row values and one next action. The owner's feedback on this wording is invited before P4 shows it in `setup store check`.
- Optional experience handoff: not applicable until P4.
- Explicit human acceptance gate: accepted by the owner on 2026-11-22: the 30-day window, 10 kept harness receipts, and the 90-day open-run review; four bounded receipt columns in v7; rules 002, 004, 005, and 006 inactive until their follow-ups; plan copies removed only after the window and never for a failed operation.
- Evidence report: [P1 Table Catalog and Fixed Rules](evidence.md#p1-table-catalog-and-fixed-rules).
- Follow-ups for later phases: P2 defines when a failed operation's recovery is closed, adds the bounded receipt columns if the owner accepts them, and makes a missing detached plan on a finished operation read as pruned. P3 rewrites `deleteProjectRows`. P4 builds the package-manager-idle check and implements the compare-and-change write contract for every rule. A later phase removes old operation backup files together with their `payload` links, and may turn rule 006 on for unbound crash barriers with owner approval. Rules 002, 004, 005, and 006 stay inactive until then. See the [evidence report](evidence.md#follow-ups-for-later-phases).
- Phase / capability status: Phase complete on commit. Capability partial: schema v7 and the write guard (P2), the project register (P3), the maintenance commands (P4), and the real Store proof (P5) remain.
