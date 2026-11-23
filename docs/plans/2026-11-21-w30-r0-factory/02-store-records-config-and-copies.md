---
title: "W30 R0 P2 Store Records, Config, and Copies"
kind: "plan"
status: "draft"
coordinate: "W30 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
---

# W30 R0 P2 Store Records, Config, and Copies

## Purpose

Save factory setup and assignments durably, keep portable choices in config, and write readable local copies.

## Outcome

One append-only migration after W29's v8 adds the factory tables, each with the Store write guard triggers. The config validator accepts a `factory:` block. `.make-docs/factory/` copies are written from the Store and restored on request. File backups outside git are recorded and cleaned up.

## Scope

- Tables: machine tools and capability proofs (one set per machine, shared by projects); workflow bindings; grants; human channel and wake bindings; assignments; proof results; backup records.
- Assignment fields: work unit, role, tool, task handle, lifecycle run ID, status, and last check time. Status values from the design. No prompts, transcripts, or task graphs.
- R-MIN rows in PRD 38 for every field before the migration exists. Grants and bindings are Store-only and never committed.
- `factory:` config block: workflow type, roles needed, capability needs, limits, steps such as preflight, and added escalation events. No grants, IDs, paths, or secrets.
- Copies: generated, read-only, gitignored files under `.make-docs/factory/`, each with a generated-file note. Never read as input. Written on each factory save and by restore.
- Add `.make-docs/factory/` to the standard `.gitignore` that setup writes.
- Backups: in a folder without git, copy a file to `.make-docs/backup/factory/` before a worker changes it, and record it. Delete an assignment's backups when its work is accepted or closed, and any backup older than 30 days. Write a `README.md` in the backup folder that states this rule and how to get a file back. Never touch installation recovery backups.
- New on 2026-11-23: the `factory_workflow_plans` table (immutable revisions, `bounded` retention); the part label, the round count, plan revision and digest, and 20-entry status history on assignments; a tool state on machine tool rows; tool version, result, and "does not cover" list on proofs; known losses and the `ready` revision on bindings; scope and expiry on grants; the new portable fields in the `factory:` block; and a printed copy of the latest plan revision.

## Exclusions

- No public operation surface. P3 owns that.

## Acceptance

- Migration tests cover the upgrade, a rollback, and a newer-schema refusal.
- The R-MIN parity test passes.
- A grant never appears in config or in a copy.
- Cleanup tests prove both triggers and the installation-backup boundary.

## Dependencies

- P1, W29 R0 complete, and the PRD 38 rows.
