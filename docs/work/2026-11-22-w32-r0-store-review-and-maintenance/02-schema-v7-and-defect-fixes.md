---
title: "Phase 2: Schema v7 and Defect Fixes"
kind: "work"
status: "active"
coordinate: "W32 R0 P2"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 2: Schema v7 and Defect Fixes

## Purpose

Add schema v7 with the write guard, and fix the known Store defects.

## Overview

One append-only migration moves the Store from v6 to v7. It adds `project_register`, the `failed` operation status and failure fields, a widened receipt check, and the write guard triggers. The phase also fixes the known defects.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A program that is not Make Docs cannot change the Store by accident, and a crash no longer leaves an operation `pending` forever ([PRD 38](../../prd/38-global-store-and-project-state.md) R-WRITE-GUARD, R-LIFE-6).
- Intended human outcome: a direct write fails with a clear error, reads still work, and a removed guard is reported with a next step.
- Human-facing surface or indirect effect: direct Store writes, Store open status, and failed operations.
- Implementation work: the v7 migration, the shared connection guard function, the open-time trigger check, file mode, and defect fixes.
- Evidence source or testing type selected under current authority: migration, guard, and defect tests.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Migration, rollback, newer-schema refusal, guard on every open path, direct-write refusal, removed-trigger detection, and each defect fix. |
| Performance Testing | not-needed-now | The trigger cost is one function call per write. `PERF-005` covers clean in P5. |
| Guided Progress Review | not-needed-now | The new wording is reviewed in P5. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Migration and write guard

### Tasks

- [ ] t1: Add the v7 migration: `project_register`, the `failed` status and R-LIFE-6 failure fields on `installation_operations`, and a widened `store_migration_receipts` check. Use the reviewed path: back up, migrate in one transaction, and bump `user_version` in the same transaction.
- [ ] t2: Install `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers that call `make_docs_write_guard()` on every table.
- [ ] t3: Register `make_docs_write_guard()` in one shared connection path, and route every Make Docs Store open in the CLI and the MCP server through it.
- [ ] t4: Check every table's triggers at open. A missing or changed trigger makes the Store `store-unsafe` with the reason "changed outside Make Docs" and a next action that names `make-docs setup store check` and the newest backup.
- [ ] t5: Set file mode `0600` on `store.db` and its backups where the platform supports it.

### Acceptance criteria

- A5: Tests cover v6 to v7, a failed migration that rolls back, and a newer-schema refusal.
- A6: A write from a connection without the guard function fails and changes nothing, and its reads still work.
- A7: Every Make Docs Store open path can write, and a test fails when a table lacks its triggers.
- A8: A removed or changed trigger makes the Store `store-unsafe` with its reason and next action.

## Stage 2 - Defect fixes

### Tasks

- [ ] t6: Fix the checkpoint-9 receipt insert so it passes the widened check.
- [ ] t7: Stop rewriting `root_path` and verification on every committed operation. Only the path-update rule changes them.
- [ ] t8: Record a failed installation operation as `failed` with its failure fields.
- [ ] t9: Add the `work_evidence` payload size limit with a typed refusal.
- [ ] t10: Make Store status read `store_schema_journal` and report a missing version.

### Acceptance criteria

- A9: A checkpoint-9 receipt insert succeeds, and a committed operation leaves `root_path` unchanged unless the path-update rule applies.
- A10: A failed operation is `failed` with its fields, and an oversized `work_evidence` payload is refused with the limit named.

## Stage 3 - P1 follow-ups

### Tasks

- [ ] T11: Add the bounded receipt columns `before_ledger_digest`, `after_ledger_digest`, `step_count`, and `applied_step_count` to `installation_operations` in the v7 migration. Fill them when an operation reaches a terminal state, and backfill them for terminal rows in the migration (follow-up `FOLLOW-UP-P2-OPERATION-RECEIPT-COLUMNS`).
- [ ] T12: Make a missing detached plan on a `completed` or `rolled-back` operation read as `pruned`, not as damage, in `detachedSnapshot` and its callers (follow-up `FOLLOW-UP-P2-PRUNED-DETACHED-PLAN`).
- [ ] T13: Define when a `failed` operation's recovery is closed, and record it in the Store table catalog (follow-up `FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED`). Until a rule says otherwise, no rule touches a failed operation's rows.

### Acceptance criteria

- A25: A terminal operation has its four receipt columns filled, including terminal rows that existed before the migration.
- A26: `make-docs project layout apply <op>` and `project state recover <op> --dry-run` report a completed operation with no detached plan as complete, not as damage.
- A27: The Store table catalog states when a failed operation's recovery is closed, and a test covers it.

### Dependencies

- P1 accepted.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
