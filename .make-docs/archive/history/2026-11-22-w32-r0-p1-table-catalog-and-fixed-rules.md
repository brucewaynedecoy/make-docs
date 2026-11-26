---
title: "W32 R0 P1 Table Catalog and Fixed Rules Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W32 R0 P1"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W32 R0 P1 Table Catalog and Fixed Rules Closeout

## Changes

Adds the Store maintenance contract that later W32 phases build on. A new catalog in `packages/cli/src/store/table-catalog.ts` names all 17 schema v6 tables and the planned v7 `project_register`, each with its purpose, writers, readers, record class, maintenance class, and retention. It names the 5 `installation_migration_records` kinds and 13 record families, with a classifier. It states the 9 fixed rules of PRD 38 R-MAINT-3 and the 3 decision items of R-MAINT-4 as precise conditions, each with a read-only candidate query, its proofs, its skip reasons, an activation state, and a plain meaning. "Terminal" means completed or rolled back only, so no rule touches a failed operation. The rules skip the latest removal that setup reads to offer setup after removal, and rules 003 and 004 wait until a detached plan or atomic intent is gone. Rule 003 strips only `contentBase64` and keeps `payload` backup file links. Every rule names the values that P4 must match in a compare-and-change write inside one transaction. Rules 002, 004, and 005 stay inactive until P4 builds the package manager check and P2 adds receipt columns and a "pruned plan" reader. Rule 006 stays inactive, because the barrier that every setup leaves is the post-migration freeze; a later phase may remove only unbound crash barriers, with owner approval. It lists 7 crash leftovers that block the machine today and the route for each one. It sets the retention values for owner review: 30 days, 10 older harness receipts, and 90 days for an open lifecycle run. A drift check ties the catalog to the physical schema and to the class of every mapped PRD 38 R-MIN row. No Store schema, migration, writer, or reader changed.

Validation passed: 36 catalog, drift, and fixture tests on 10 fixture Stores with injected liveness, and the type check. The full suite has only the known failures. An independent review asked for 11 fixes before owner review, and two re-checks asked for 8 more. All were made. The phase waits for the owner to accept the catalog, the rules, the retention values, and the recommended v7 receipt columns before P2. Twelve gaps between PRD 38 and the code and eight follow-ups are listed in the evidence report. Performance and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/01-table-catalog-and-fixed-rules.md) | Closes t1–t7 and A1–A4, awaiting owner acceptance. |
| [Evidence report](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/evidence.md) | Records the P1 catalog, rules, fixtures, checks, gaps, and limits. |
| [W32 R0 backlog](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) | Links the evidence report. |

### Maintainer

None this session.

### User

None this session.
