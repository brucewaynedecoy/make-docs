---
title: "W32 R0 P2 Old Store Checkout Move Fix"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W32 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W32 R0 P2 Old Store Checkout Move Fix

## Changes

Fixes a regression from P2 schema v7. Checkout move review, checkout move, and separate checkout registration accepted only a v7 Store, so a schema 6 Store from Make Docs 2.0.5 to 2.0.9 no longer showed a moved checkout. Setup review dropped `checkoutMove`, and `project move preview` said the Store must use the current schema. The W22 R1 package proof failed at its setup review check.

One shared check in `packages/cli/src/store/installation-state.ts` now accepts a v7 Store and a schema 6 Store. Preview reads schema 6 read only. Apply and separate registration change schema 6 as it is, without a migration, under PRD 38 R-CHECKOUT-8, and write `project_register` only when the Store has it. A v7 Store with a changed write guard and a Store at schema 5 or older stay blocked. The guard is unchanged. A new `inspectStoreVersionRollback` check in `packages/cli/src/store/database.ts` refuses a Store that reports schema 6 or older but has a guard trigger, a `project_register` table, or a newer schema journal row, so a v7 Store set back to schema 6 cannot skip the guard check. The classifier, the guarded Store open, and the backup check use it.

The brief asked that apply migrate the Store first. This fix does not, because R-CHECKOUT-8 forbids it, the package proof compares operation rows that the v7 migration rebuilds, and only a reviewed setup converts the Store. The evidence report records this choice for the owner. No requirement text changed.

A new test file (8 tests) proves review with no write, apply with no schema change, separate registration, a later setup conversion to v7, the project register on v7, the refusals, and the refusal of a v7 Store set back to schema 6 with each rollback marker. The type check and 302 Store, database, and checkout tests pass. The package proof now runs the released 2.0.5 reader on the schema 6 Store right after the moves, where it still refuses unverified evidence, and again at the end, where it refuses the v7 Store with the exact newer-schema text. Both runs change nothing. With W33 R0 P4 already on the branch, `npm run smoke:pack:local` passes, including the full package proof. Performance, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [Evidence report](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/evidence.md) | Adds the P2 follow-up section: cause, fix, decision, tests, validation, and limits. |

### Maintainer

None this session.

### User

None this session.
