---
title: "Phase 2: Store Records, Config, and Copies"
kind: "work"
status: "active"
coordinate: "W30 R0 P2"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/02-store-records-config-and-copies.md"
---

# Phase 2: Store Records, Config, and Copies

## Purpose

Save factory setup and assignments durably, keep portable choices in config, and write readable local copies. P3 builds its operations on these records.

## Overview

One append-only Store migration, after the W29 schema v8, adds the factory tables. The config validator accepts a `factory:` block. Make Docs writes generated, read-only, gitignored copies to `.make-docs/factory/`. File backups outside git are recorded and cleaned up.

## Human Experience Outcome

- Impact and governing promise: `direct` through later surfaces. Status (R-FACTORY-51) and drift (R-FACTORY-33) depend on these records.
- Intended human outcome: a person can read the saved wiring in `.make-docs/factory/` without a CLI call, and can get a file back from `.make-docs/backup/factory/` with the steps in its `README.md`.
- Human-facing surface: the `.make-docs/factory/` copies, the `factory:` block in `.make-docs/config.yaml`, and the backup folder note.
- Implementation work: Stages 1 to 3.
- Evidence source: migration, R-MIN parity, grant boundary, and cleanup tests.
- Executor: the implementing agent.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-15, R-FACTORY-22 to R-FACTORY-28, and R-FACTORY-44 to R-FACTORY-46, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Migration upgrade, rollback, and newer-schema refusal tests; R-MIN parity test; grant boundary test; copy and restore tests; cleanup tests. |
| Performance Testing | not-needed-now | No performance candidate applies. Cleanup runs on small record sets. |
| Guided Progress Review | not-needed-now | These records have no interactive surface of their own. P3 reviews status output. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [21 Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Store Tables

### Tasks

- [ ] T1: Confirm that PRD 38 has an R-MIN row for every new field before the migration exists.
- [ ] T2: Add one append-only migration after v8, with the Store write guard triggers and a Store table catalog entry on each new table, with tables for machine tools and capability proofs, workflow bindings, grants, human channel and wake bindings, assignments, proof results, and backup records (R-FACTORY-15, R-FACTORY-23).
- [ ] T3: Store assignment fields: work unit, role, tool, task handle, lifecycle run ID, status, and last check time. Store no prompt, transcript, or task graph (R-FACTORY-27, R-FACTORY-28).
- [ ] T4: Save the machine's tool list once per machine, so all projects on that machine reuse it (R-FACTORY-15).
- [ ] T5: Add migration tests for the upgrade, a failed migration rollback, and a newer-schema refusal.
- [ ] T6: Add a test that fails when the R-MIN register and the physical schema drift.

### Acceptance criteria

- A9: The migration upgrades a v8 Store, rolls back cleanly on failure, and refuses a newer schema with the existing typed error.
- A10: Every new field has a matching R-MIN row, and the parity test fails when one is removed.
- A11: An assignment record holds only the fields in R-FACTORY-27, and its status is one of the values in R-FACTORY-28.

### Dependencies

- P1, W29 R0 complete, and the PRD 38 rows.

## Stage 2 - Config and Local Copies

### Tasks

- [ ] T7: Add the `factory:` block to the config schema: workflow type, roles needed, capability needs, limits, steps such as preflight, and added escalation events (R-FACTORY-22).
- [ ] T8: Reject grants, IDs, paths, digests, receipts, and secrets in the `factory:` block (R-FACTORY-24, R-FACTORY-26).
- [ ] T9: Write generated, read-only copies of the saved setup to `.make-docs/factory/` on each factory save. Each file starts with a note that it is generated and that edits are lost (R-FACTORY-25).
- [ ] T10: Make sure Make Docs never reads a copy as input.
- [ ] T11: Add `.make-docs/factory/` to the standard `.gitignore` that setup writes.

### Acceptance criteria

- A12: Config validation accepts the `factory:` block and rejects each state or secret field in it.
- A13: A grant saved in the Store never appears in config or in any copy.
- A14: Each copy starts with the generated-file note, and changing a copy does not change any factory result.
- A15: A fresh setup writes `.make-docs/factory/` to `.gitignore`.

### Dependencies

- Stage 1.

## Stage 3 - Backups Outside Git

### Tasks

- [ ] T12: In a folder without git, copy a file to `.make-docs/backup/factory/` before a worker changes it, and record its file, hash, and assignment (R-FACTORY-44).
- [ ] T13: Delete an assignment's backups when its work is accepted or closed. Delete any backup older than 30 days. Run cleanup during normal factory operations (R-FACTORY-45).
- [ ] T14: Write a `README.md` in `.make-docs/backup/factory/` that states the cleanup rule and how to get a file back (R-FACTORY-46).
- [ ] T15: Add tests for both cleanup triggers and for the boundary with installation recovery backups.

### Acceptance criteria

- A16: Before a worker changes a file in a folder without git, a backup with a matching hash exists and is recorded.
- A17: Cleanup removes backups on close and after 30 days, and never removes an installation recovery backup.
- A18: The backup folder `README.md` states the cleanup rule and the recovery steps in plain words.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
