---
title: "W32 R0 P2 Schema v7 and Defect Fixes"
kind: "plan"
status: "draft"
coordinate: "W32 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-22-store-review-and-maintenance.md"
---

# W32 R0 P2 Schema v7 and Defect Fixes

## Purpose

Add schema v7 with the Store write guard, and fix the known Store defects.

## Outcome

The Store has `project_register`, a `failed` status with failure fields, and a receipt CHECK that accepts the current version. Only Make Docs connections can write the Store. Only Make Docs connections can write the Store. The known defects are fixed.

## Scope

- Add the v7 migration: `project_register`, the `failed` status and the R-LIFE-6 failure fields on `installation_operations`, and a widened `store_migration_receipts` CHECK. Use the existing reviewed path: back up, migrate in one transaction, and bump `user_version` in the same transaction.
- Add `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers that call `make_docs_write_guard()` to every table, in the same v7 migration. Register the function in the shared connection code that every Make Docs open path uses. Add a test that fails when a table lacks its triggers, so later migrations must add them.
- On open, check that every guard trigger exists with the expected SQL. Report a missing or changed trigger as `store-unsafe` with the reason "changed outside Make Docs" and a next action.
- Set file mode `0600` on `store.db` and on Store backups.
- Add the write guard in the v7 migration: `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers on every table that call `make_docs_write_guard()`.
- Register `make_docs_write_guard()` in the shared connection code that every Make Docs Store open uses, in the CLI and the MCP server.
- At each open, check that every table has its triggers with the expected SQL. A missing or changed trigger makes the Store `store-unsafe` with the reason "changed outside Make Docs", and the next action names `make-docs setup store check` and the newest backup.
- Set file mode `0600` on `store.db` and its backups.
- Fix the checkpoint-9 receipt insert so it passes the widened CHECK.
- Stop rewriting `root_path` and verification on every committed operation. Only the path-update rule changes them.
- Record failures in `installation_operations` with the new fields, so a failure no longer leaves a row `pending`.
- Add a size limit with a typed refusal to `work_evidence` payloads.
- Make Store status read `store_schema_journal` and report a missing version.

## Exclusions

- No removal of rows. P4 owns maintenance.

## Acceptance

- Tests cover v6 to v7, a failed migration that rolls back, and a newer-schema refusal.
- A checkpoint-9 receipt insert succeeds in a test.
- A committed operation leaves `root_path` unchanged unless the path-update rule applies.
- A failed operation is `failed` with its failure fields.
- A write from a connection without the guard function fails and changes nothing, and its reads still work.
- Every Store open path in Make Docs can write. A test fails when a table lacks its triggers.
- A removed or changed trigger makes the Store `store-unsafe` with its reason.
- A write from a connection without the guard function fails and changes nothing, and a read from it works.
- A removed trigger makes the next open report `store-unsafe` with a next action.

## Dependencies

- P1.
