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

- [x] T1: Add the v7 migration: `project_register`, the `failed` status and R-LIFE-6 failure fields on `installation_operations`, and a widened `store_migration_receipts` check. Use the reviewed path: back up, migrate in one transaction, and bump `user_version` in the same transaction.
- [x] T2: Install `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers that call `make_docs_write_guard()` on every table.
- [x] T3: Register `make_docs_write_guard()` in one shared connection path, and route every Make Docs Store open in the CLI and the MCP server through it.
- [x] T4: Check every table's triggers at open. A missing or changed trigger makes the Store `store-unsafe` with the reason "changed outside Make Docs" and a next action that names `make-docs setup store check` and the newest backup.
- [x] T5: Set file mode `0600` on `store.db` and its backups where the platform supports it.

### Acceptance criteria

- A5: Tests cover v6 to v7, a failed migration that rolls back, and a newer-schema refusal.
- A6: A write from a connection without the guard function fails and changes nothing, and its reads still work.
- A7: Every Make Docs Store open path can write, and a test fails when a table lacks its triggers.
- A8: A removed or changed trigger makes the Store `store-unsafe` with its reason and next action.

## Stage 2 - Defect fixes

### Tasks

- [x] T6: Fix the checkpoint-9 receipt insert so it passes the widened check.
- [x] T7: Stop rewriting `root_path` and verification on every committed operation. Only the path-update rule changes them.
- [x] T8: Record a failed installation operation as `failed` with its failure fields.
- [x] T9: Add the `work_evidence` payload size limit with a typed refusal.
- [x] T10: Make Store status read `store_schema_journal` and report a missing version.

### Acceptance criteria

- A9: A checkpoint-9 receipt insert succeeds, and a committed operation leaves `root_path` unchanged unless the path-update rule applies.
- A10: A failed operation is `failed` with its fields, and an oversized `work_evidence` payload is refused with the limit named.

## Stage 3 - P1 follow-ups

### Tasks

- [x] T11: Add the bounded receipt columns `before_ledger_digest`, `after_ledger_digest`, `step_count`, and `applied_step_count` to `installation_operations` in the v7 migration. Fill them when an operation reaches a terminal state, and backfill them for terminal rows in the migration (follow-up `FOLLOW-UP-P2-OPERATION-RECEIPT-COLUMNS`).
- [x] T12: Make a missing detached plan on a `completed` or `rolled-back` operation read as `pruned`, not as damage, in `detachedSnapshot` and its callers (follow-up `FOLLOW-UP-P2-PRUNED-DETACHED-PLAN`).
- [x] T13: Define when a `failed` operation's recovery is closed, and record it in the Store table catalog (follow-up `FOLLOW-UP-P2-FAILED-RECOVERY-CLOSED`). Until a rule says otherwise, no rule touches a failed operation's rows.

### Acceptance criteria

- A25: A terminal operation has its four receipt columns filled, including terminal rows that existed before the migration.
- A26: `make-docs project layout apply <op>` and `project state recover <op> --dry-run` report a completed operation with no detached plan as complete, not as damage.
- A27: The Store table catalog states when a failed operation's recovery is closed, and a test covers it.

### Dependencies

- P1 accepted.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 25 new tests in `packages/cli/tests/w32-r0-p2-schema-v7.test.ts`, 1 new checkout move test, the 36 catalog tests, the type check, and the full suite with only the 3 known failures. An independent review found the migration and the guard sound and advised five small fixes. All were made: only newly broken references stop the migration, virtual tables are skipped and reported, the text `null` has no ledger digest, older backups get mode `0600`, and one comment was corrected. The review's later-phase items are in the evidence report. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`, as decided above.
- Performance evidence: none. The guard adds one SQL function call for each written row and one `sqlite_schema` read for each connection. `PERF-005` covers clean in P5.
- Human Experience Review: a direct write fails with `no such function: make_docs_write_guard` and changes nothing. A removed or changed guard trigger stops each Store command with "changed outside Make Docs", the missing trigger, a next action that names `make-docs setup store check`, and the newest Store backup. A failed operation shows as `Failed operation` with a fixed summary, its stage, and its next action. The wording is reviewed in P5.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: pending owner review of the decisions listed in the [evidence report](evidence.md#decisions-for-the-owner), mainly the checkout move proof, the 64 KiB evidence limit, extra triggers, and kept broken references.
- Evidence report: [P2 Schema v7 and Defect Fixes](evidence.md#p2-schema-v7-and-defect-fixes).
- Follow-ups for later phases: the guard limit in status and docs (P5), exact `root_path` comparisons after a case rename (P3 or P4), a read-only `setup store check` that opens a changed Store (P4), the repeated next action wording (P5), and the largest real evidence payload (P5). See the [evidence report](evidence.md#follow-ups-for-later-phases-1).
- Phase / capability status: Phase complete on commit after owner review. Capability partial: the project register writes and `project list` (P3), the maintenance commands and rule activation (P4), and the real Store proof (P5) remain.
