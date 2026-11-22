---
title: "W29 R0 P1 Record Model and Rule Catalog"
kind: "plan"
status: "draft"
coordinate: "W29 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
---

# W29 R0 P1 Record Model and Rule Catalog

## Purpose

Settle every contract that later phases build on, before any code starts.

## Outcome

P1 produces an accepted work record model, sync table, readiness rule, claim rule, tracker connection contract, R-MIN field list, and fixture matrix. Each rule has one entry in a rule catalog that names its CLI form and its agent form.

## Scope

- Define the unit kinds (wave, revision, phase, stage, task, quick item), their stable store ID, their coordinate, their parent, and their status values.
- Define dependency records that point to store IDs, plus the unresolved-text form for a bullet that import cannot resolve.
- Define link records in both directions: unit to design, plan, PRD section, and evidence file.
- Define the three-way sync table (file bytes, last applied digest, store revision) and the conflict record.
- Define readiness: dependencies closed, no live claim, no open blocker, no sync conflict, and an open parent. Define the order: dependency order, then coordinate order.
- Define claims: claimant, time limit, renewal, expiry, refusal of a stale claimant, and the handle check before takeover. Define the default time limit and the renewal interval.
- Define report and close payloads and the close outcomes `done`, `cancelled`, and `superseded`.
- Define the tracker connection contract: the four operations, the field map, and the capability declaration. Mark the local store as the only v1 connection.
- Draft the R-MIN rows for every new field: class, writer, readers, retention, privacy, and recovery use.
- Define a fixture matrix: this repo's current backlogs, a mixed portfolio, unresolved dependencies, a conflict, a quick item, a folder without git, and a no-Store checkout.

## Exclusions

- No migration, operation, parser, or resource body.
- No connection for any other tracker.

## Acceptance

- Every rule in the catalog has a CLI form and an agent form, and a parity fixture.
- Every new field has a drafted R-MIN row.
- The owner can read the sync table and the readiness rule without knowing the Store tables.

## Dependencies

- Accepted design. PRD 52 and the PRD 38 rows written from this plan.
