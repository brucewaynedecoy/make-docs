---
title: "W29 R0 P2 Store Schema and Records Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W29 R0 P2 Store Schema and Records Closeout

## Changes

Moves the Store to schema v8 in one append-only migration. The migration makes one verified backup, then runs in one transaction with its `user_version` bump and its schema journal row, and rolls back on any failure. It adds six work store tables: `work_units`, `work_dependencies`, `work_links`, `work_claims`, `work_sync_ledger`, and `work_sync_conflicts`. Each table has its three write guard triggers and a Store table catalog entry. `work_claims` allows one claim row for each unit through a unique key, so a second claim fails in the schema. Units, dependencies, links, and the sync ledger are `keep`. Claims and sync conflicts are `bounded` by their keys, and no fixed rule removes them.

A new Store service reads and writes the tables. Every write carries an expected version: the record revision for units and claims, and a new entry version for the sync ledger and sync conflicts. A plain claim on an expired claim is refused, and a takeover after a handle check succeeds. A close follows the claim rule of a report, a renewal after the clock goes back starts from the later time, and a write session refuses another project's records. Projects resolve by name or ID only through `project_register`, so a renamed project resolves only by its new name. The service never creates or migrates a Store, and it gives the existing typed Store results. This phase adds no public operation.

The rollback check now covers every schema older than the current one, so a v8 Store set back to schema 7 is reported as changed outside Make Docs. A v7 Store stays readable where a v6 Store is, and only a reviewed setup converts it. The catalog drift check accepts one R-MIN row for several tables only for a named row and its named tables. The path `CHECK` of each work table also refuses a `..` segment. An R-MIN parity test fails when a column or a field is on one side only. The P1 fixture store IDs no longer collide for P1 and P10. The pack proof now expects released 2.0.5 to refuse schema 8.

Validation passed: 36 new tests, the Store tests, the type check, the build, `validate:defaults`, the instruction router check, `smoke:pack:local`, and the full suite with only the known failures. Older tests that expected schema 7 as current now expect schema 8. An independent review found the phase safe and asked for seven small changes, which were made. The owner reviews the catalog classes. The owner approved the entry version in two PRD 38 rows on 2026-11-23. P4 now holds three open items: a scoped cleanup of a pruned project's work rows after export (T12), who may see claim IDs or release a claim (T13), and the report-only item for long-expired claims, which stays a proposal (T14). Performance, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-21-w29-r0-work-store/02-store-schema-and-records.md) | Closes T1–T9, A5–A9, and A33, awaiting owner acceptance. |
| [P4 work](../../../docs/work/2026-11-21-w29-r0-work-store/04-work-queue-operations.md) | Adds T12 to T14 from the P2 review. |
| [Backlog index](../../../docs/work/2026-11-21-w29-r0-work-store/00-index.md) | Records the P4 scope edit in its change history. |
| [Evidence report](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md) | Records the v8 migration, the tables and their catalog classes, every v7 to v8 touch point, the Store service, the parity test, the owner decisions, and the limits. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | R-DB-7 names the v8 tables; the work sync ledger and conflict rows add an entry version. |

### Maintainer

| Path | Description |
| --- | --- |
| [Store README](../../../packages/cli/src/store/README.md) | Describes schema 8, the work store tables, and the service. |

### User

None this session.
