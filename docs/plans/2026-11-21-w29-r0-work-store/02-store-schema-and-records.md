---
title: "W29 R0 P2 Store Schema and Records"
kind: "plan"
status: "draft"
coordinate: "W29 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
---

# W29 R0 P2 Store Schema and Records

## Purpose

Add the work tables to the global Store under the existing migration and safety rules.

## Outcome

One append-only migration moves the Store from schema v6 to v7. It adds the work unit, dependency, link, claim, sync ledger, and conflict tables. A Store service reads and writes them with version checks.

## Scope

- Add the migration entry, its journal row, and the v7 expected-table list.
- Use the existing reviewed path: back up, migrate in one transaction, and bump `user_version` in the same transaction.
- Refuse writes on v6 with the existing migration-required error. Refuse any newer schema.
- Add a Store service with `expectedVersion` checks on every write.
- Enforce one live claim per unit in the schema, not only in code.
- Keep claims in the short-lived mutation guard class and expire them by time.
- Keep the R-MIN register in PRD 38 and the physical schema in parity. Add a test that fails when they drift.
- Record each project's `projectName` with its project ID and refuse a name that another project holds, using the project register that D-062 settles.

## Exclusions

- No parser, sync, or operation surface.
- No factory tables. W30 adds those in its own migration.

## Acceptance

- Migration tests cover v6 to v7, a failed migration rollback, and a newer-schema refusal.
- Store-unavailable, denied, and unsafe states return the existing typed results.
- The R-MIN parity test passes.

## Dependencies

- P1 contract and the PRD 38 R-MIN rows.
- The project register decision in register D-062.
