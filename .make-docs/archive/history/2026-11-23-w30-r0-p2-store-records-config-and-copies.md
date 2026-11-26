---
title: "W30 R0 P2 Store Records, Config, and Copies Closeout"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W30 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W30 R0 P2 Store Records, Config, and Copies Closeout

## Changes

Moves the Store to schema v9 in one append-only migration. Like v8, it makes one verified backup, then runs in one transaction with its `user_version` bump and its schema journal row, and rolls back on any failure. It adds eight factory tables, each with its three write guard triggers and a Store table catalog entry: machine tools and capability proofs (`bounded`, shared by every project on the machine), plan revisions (`bounded` by the keep rule), workflow bindings, grants, and assignments (`keep`), and test task results and backup records (`bounded`). A trigger refuses any change to a saved plan revision, and another refuses a change to a final assignment. A partial unique index allows one open assignment for each job. PRD 38 gained the key and version fields in its R-MIN rows before the migration, and an R-MIN parity test fails when a column or a field is on one side only.

A new Store service enforces the record rules: an expected version on every change, the status move table and its final states, the correction round count against the plan revision's round limit, a reset only through a spent `once` grant, the 20 newest status history entries, grant scopes, the never-log check, and the plan keep rule. A claim ID is checked and never saved. Pure functions write the resolved plan as canonical JSON with its SHA-256 digest. By the owner's decision of 2026-11-23, each project-scoped table carries the project ID from `project_register`, and each service function takes it explicitly; a missing or unknown ID is a typed refusal that changes nothing.

The config validator accepts a `factory:` block and refuses grants, IDs, paths, digests, receipts, secrets, and unknown context kinds. Read-only copies with a generated note go to `.make-docs/factory/`, and the plan copy says whether it is the `ready` revision; no copy holds a grant, and nothing reads a copy. Backups outside git go to `.make-docs/backup/factory/` with a README, and cleanup never touches installation recovery backups. Setup writes no standard `.gitignore`, so each generated folder ignores itself, which the owner approved for T11 on 2026-11-23; Make Docs never edits the project root `.gitignore`. Every place that took schema 8 as current now takes 9. No public command or MCP tool was added.

An independent review found that factory assignments and their backup records were removed by cascade when sync deleted a unit. No foreign key now removes a factory record by cascade: sync stops a file whose removed unit has an open assignment, `deleteWorkUnit` refuses it, a final assignment stays after its unit goes, and the scoped project cleanup removes final assignments and their backup records itself. The review fixes also make plan save check every text value and compute its own digests, keep `ready` on a save that changes nothing, apply the 30-day backup rule to every record of the project, list assignments in the order they were made, spend a reset grant only when the count is above 0, and hide token-like names in config errors. A re-check found that closing a unit with an open assignment stranded the assignment, because a close ends the claim that every assignment update needs. Every close now refuses that unit with `factory-assignment-open`: `work close`, `--accept-deletion`, and a sync that closes it from its file, which stops that file as a conflict with a plain message. `--keep-store` settles that conflict, and `--keep-file` refuses. Owner decisions of 2026-11-23 then changed P2: each assignment records the checkout it runs in, the integration owner and the human channel kind live in config only (the binding table dropped both columns), a move from `unknown` to `needs-correction` counts a round unless the status before `unknown` was already `needs-correction`, and only a custom role that the project adds must list its context kinds; the foreman and the front desk need no list. P3 notes: a pruned project's workflow rows cannot be removed yet, and removing a workflow must first delete its backup records and final assignments.

Validation passed: 59 new tests, the type check, the build, the W29, Store, config, backup, and catalog tests, `validate:defaults`, the router check, `check prd`, paths, the doctor check, and the full suite with only the three known failures. `smoke:pack:local` passed before the review fixes.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-21-w30-r0-factory/02-store-records-config-and-copies.md) | Closes T1 to T21, awaiting owner acceptance. |
| [Backlog index](../../../docs/work/2026-11-21-w30-r0-factory/00-index.md) | Records the T11 and A15 scope edit in its change history. |
| [Evidence report](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | Records the v9 tables and their classes, every v8 to v9 touch point, the service rules, the project scoping decision, and the limits. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | R-DB-7 names the v9 tables; the factory R-MIN rows name their keys and versions, the assignment checkout, and no integration owner in the binding. |

### Maintainer

| Path | Description |
| --- | --- |
| [Store README](../../../packages/cli/src/store/README.md) | Describes schema 9 and the factory tables. |

### User

None this session.
