---
title: "W32 R0 P2 Schema v7 and Defect Fixes Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W32 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W32 R0 P2 Schema v7 and Defect Fixes Closeout

## Changes

Moves the Store to schema v7 in one append-only migration. The migration makes one verified backup, then runs in one transaction with its `user_version` bump and its schema journal row, and rolls back on any failure. It adds `project_register`, the `failed` operation status with four R-LIFE-6 failure fields, four bounded receipt columns that it backfills for finished operations, and a widened migration receipt check. It rebuilds two tables to change their checks. Foreign keys are checked before and after, and only a reference that the migration newly breaks stops it. A reference that was already broken stays, and setup and status report it with a repair step. It adds the Store write guard: every table has insert, update, and delete triggers that call `make_docs_write_guard()`. One shared connection path registers that function on every Make Docs connection and checks every guard trigger at open. A program that is not Make Docs can read the Store, but its writes fail and change nothing. A removed or changed trigger makes the Store `store-unsafe`, "changed outside Make Docs", with a next action that names `make-docs setup store check` and the newest backup. The Store file, its new backup, and its older backups use mode `0600`. A virtual table that an older program added cannot carry triggers, so it is skipped and reported as not guarded.

It fixes the known defects. The checkpoint-9 receipt now passes its check. A commit no longer rewrites the checkout path or its verification, so the checkout move proof now trusts the Store ledger and a full check of the target files. A failed operation is recorded as `failed` with a fixed summary, its stage, and its next action, and recovery accepts it. A `work_evidence` payload above 64 KiB is refused with a typed error that names the limit. `project state status` reads the schema journal and reports a missing version. A finished operation whose saved plan is gone now reads as complete, not as damage. The table catalog states when a failed operation's recovery is closed, marks the three P2 follow-ups done, and keeps rules 004 and 005 inactive until P4.

A finished operation with no ledger (SQL NULL or the text `null`) has a NULL ledger digest.

Validation passed: 25 new tests, a new checkout move test, the catalog tests, the type check, and the full suite with only the 3 known failures. Seven older test expectations changed because v7 or the guard made them outdated. An independent review found the migration and guard sound, and its five small fixes were made. Its later-phase items (the guard limit in status, exact path comparisons after a case rename, a read-only `setup store check`, message wording, and the largest real evidence payload) are recorded for P3 to P5. The owner reviews the move proof, the evidence limit, and the extra-trigger choice. Performance, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/02-schema-v7-and-defect-fixes.md) | Closes t1–t10, T11–T13, A5–A10, and A25–A27, awaiting owner review. |
| [Evidence report](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/evidence.md) | Records the P2 migration, guard, open paths, defect fixes, changed tests, decisions, and limits. |

### Maintainer

None this session.

### User

None this session.
