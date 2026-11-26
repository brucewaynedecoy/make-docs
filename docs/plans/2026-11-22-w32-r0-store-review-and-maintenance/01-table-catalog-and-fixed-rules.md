---
title: "W32 R0 P1 Table Catalog and Fixed Rules"
kind: "plan"
status: "draft"
coordinate: "W32 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-22-store-review-and-maintenance.md"
---

# W32 R0 P1 Table Catalog and Fixed Rules

## Purpose

Settle the contract that later phases build on. No code changes the Store before this phase is accepted.

## Outcome

One catalog in code describes every table and every `installation_migration_records` kind. Each fixed removal rule has a precise condition and fixtures.

## Scope

- For each of the 17 tables, record its purpose, writers, readers, record class (PRD 38 R-MIN-1), maintenance class (keep, bounded, or disposable), and retention.
- For each `installation_migration_records` kind, record the same.
- Record that every table carries the write-guard triggers, and add fixtures for a direct write, a read, and a removed trigger.
- Write each fixed rule as a precise condition:
  - a lock whose owner is proven dead and that guards no pending operation;
  - a pending `tool.update` or `tool.uninstall` whose owner is proven dead and with no active package manager run, marked `failed` with reason `abandoned`;
  - saved file bytes in `installation_steps` of a terminal operation after the retention window;
  - `detached:` and `detached-original:` snapshots and `atomic:` intents of a terminal operation;
  - a quiescence row whose lock is gone;
  - a `store_checkpoint_journal` row with a matching `store_migration_receipts` row;
  - `backlog_review_cache` rows for old versions;
  - harness receipt history beyond the kept count.
- List the decision items that no rule removes: a missing checkout folder, a long-open run, a pending `legacy.recovery` operation.
- Set the retention windows and kept counts.
- Draft the PRD 38 R-MIN rows to match.
- Build fixture Stores for each rule, each decision item, and each blocking crash leftover.

## Exclusions

- No schema or code change to Store writers. P2 owns those.

## Acceptance

- Every table and record kind has one catalog entry with all fields.
- Every fixed rule has fixtures that show a row it removes and a row it keeps.
- The drafted R-MIN rows can go into PRD 38 without change.

## Dependencies

- Accepted PRD 38 changes.
