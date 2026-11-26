---
title: "Phase 2: Store Records, Config, and Copies"
kind: "work"
status: "completed"
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

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-10, R-FACTORY-14, R-FACTORY-15, R-FACTORY-22 to R-FACTORY-28, R-FACTORY-41, R-FACTORY-44 to R-FACTORY-46, and R-FACTORY-55 to R-FACTORY-61, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

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

- [x] T1: Confirm that PRD 38 has an R-MIN row for every new field before the migration exists.
- [x] T2: Add one append-only migration after v8, with the Store write guard triggers and a Store table catalog entry on each new table, with tables for machine tools and capability proofs, workflow bindings, grants, human channel and wake bindings, assignments, proof results, and backup records (R-FACTORY-15, R-FACTORY-23).
- [x] T3: Store assignment fields: work unit, role, tool, task handle, lifecycle run ID, status, and last check time. Store no prompt, transcript, or task graph (R-FACTORY-27, R-FACTORY-28).
- [x] T4: Save the machine's tool list once per machine, so all projects on that machine reuse it (R-FACTORY-15).
- [x] T5: Add migration tests for the upgrade, a failed migration rollback, and a newer-schema refusal.
- [x] T6: Add a test that fails when the R-MIN register and the physical schema drift.
- [x] T16: Add the `factory_workflow_plans` table in the same migration: project ID, workflow name, revision number, plan digest, canonical plan JSON, config digest, binding digest, and created time. Refuse any change to a saved row, with a unique key on project, workflow, and revision. Give it the `bounded` maintenance class. Each save removes older revisions in the same write, and keeps the `ready` revision, each revision that an open assignment names, and the 10 newest others (R-FACTORY-56, R-FACTORY-57). New on 2026-11-23.
- [x] T17: Add to the assignment record: the part label (a short kebab-case name; `main` for a unit with one part), the correction round count, the plan revision number and digest, and a status history that keeps the 20 newest entries of status, time, and reason code (R-FACTORY-27, R-FACTORY-41, R-FACTORY-58). New on 2026-11-23.
- [x] T18: Add a tool state (`available`, `missing`, or `blocked`) to each machine tool row. Add to each capability proof: the reported tool version, the proof time, the result (`proved`, `unproved`, or `contradicted`), and a bounded "does not cover" list. Add the accepted known losses and the `ready` revision to the workflow binding (R-FACTORY-10, R-FACTORY-14). New on 2026-11-23.
- [x] T19: Add to each grant: the scope (`once`, `run`, or `standing`), the lifecycle run for a `run` grant, an optional expiry time, and the time a `once` grant was spent (R-FACTORY-24). New on 2026-11-23.

### Acceptance criteria

- A9: The migration upgrades a v8 Store, rolls back cleanly on failure, and refuses a newer schema with the existing typed error.
- A10: Every new field has a matching R-MIN row, and the parity test fails when one is removed.
- A11: An assignment record holds only the fields in R-FACTORY-27, and its status is one of the values in R-FACTORY-28.
- A51: The `factory_workflow_plans` table refuses a change to a saved revision, refuses a second row with the same workflow and revision number, and after a save keeps exactly the `ready` revision, each revision that an open assignment names, and the 10 newest others.
- A52: An assignment record holds the part label, the round count, the plan revision number and digest, and at most 20 status history entries, each with a status, a time, and a reason code.
- A53: A machine tool row holds its state. A capability proof holds the reported tool version, the proof time, a result of `proved`, `unproved`, or `contradicted`, and a "does not cover" list. A binding holds its accepted known losses and its `ready` revision. A grant holds its action, a scope of `once`, `run`, or `standing`, and an optional expiry.

### Dependencies

- P1, W29 R0 complete, and the PRD 38 rows.

## Stage 2 - Config and Local Copies

### Tasks

- [x] T7: Add the `factory:` block to the config schema: workflow type, roles needed, capability needs, limits, steps such as preflight, and added escalation events (R-FACTORY-22).
- [x] T8: Reject grants, IDs, paths, digests, receipts, and secrets in the `factory:` block (R-FACTORY-24, R-FACTORY-26).
- [x] T9: Write generated, read-only copies of the saved setup to `.make-docs/factory/` on each factory save. Each file starts with a note that it is generated and that edits are lost (R-FACTORY-25).
- [x] T10: Make sure Make Docs never reads a copy as input.
- [x] T11: Keep `.make-docs/factory/` out of git with a generated `.gitignore` inside the folder. Make Docs never edits the project root `.gitignore`. Changed on 2026-11-23 by owner decision: setup writes no standard `.gitignore`.
- [x] T20: Add the new portable fields to the `factory:` block schema: type version; each role's job, returns, and context kinds from the fixed set; the round limit; the gates; the integration owner role; and the human channel kind. Refuse a context kind outside the fixed set (R-FACTORY-55, R-FACTORY-60, R-FACTORY-61). New on 2026-11-23.
- [x] T21: Print the latest resolved plan revision as a read-only copy in `.make-docs/factory/`, with the generated-file note and a line that says whether it is the `ready` revision (R-FACTORY-25). New on 2026-11-23.

### Acceptance criteria

- A12: Config validation accepts the `factory:` block and rejects each state or secret field in it.
- A13: A grant saved in the Store never appears in config or in any copy.
- A14: Each copy starts with the generated-file note, and changing a copy does not change any factory result.
- A15: The folder ignores itself: Make Docs writes a `.gitignore` inside `.make-docs/factory/` (and inside `.make-docs/backup/factory/`), so git ignores the copies in a fresh project. Make Docs never edits the project root `.gitignore`. Owner-approved 2026-11-23.
- A54: Config validation accepts the new portable fields and refuses an unknown context kind, naming it.
- A55: The resolved plan copy prints the latest revision, starts with the generated-file note, says whether it is the `ready` revision, and holds no grant.

### Dependencies

- Stage 1.

## Stage 3 - Backups Outside Git

### Tasks

- [x] T12: In a folder without git, copy a file to `.make-docs/backup/factory/` before a worker changes it, and record its file, hash, and assignment (R-FACTORY-44).
- [x] T13: Delete an assignment's backups when its work is accepted or closed. Delete any backup older than 30 days. Run cleanup during normal factory operations (R-FACTORY-45).
- [x] T14: Write a `README.md` in `.make-docs/backup/factory/` that states the cleanup rule and how to get a file back (R-FACTORY-46).
- [x] T15: Add tests for both cleanup triggers and for the boundary with installation recovery backups.

### Acceptance criteria

- A16: Before a worker changes a file in a folder without git, a backup with a matching hash exists and is recorded.
- A17: Cleanup removes backups on close and after 30 days, and never removes an installation recovery backup.
- A18: The backup folder `README.md` states the cleanup rule and the recovery steps in plain words.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing is selected and done: 59 new tests in `packages/cli/tests/w30-r0-p2-store-records-config-and-copies.test.ts` cover the migration upgrade, rollback, newer-schema refusal, and set-back check (A9); the R-MIN parity test (A10); the assignment fields, status moves, final states, round count, open-job rule, status history, never-log check, and private claim ID (A11, A52); plan revisions, their digest, and the keep rule (A51); tool, proof, binding, and grant fields (A53); the config block (A12, A54); the copies (A13, A14, A15, A55); and the backups (A16 to A18); and the owner's project scoping decision of 2026-11-23. Performance Testing, Guided Progress Review, and Unassisted Goal Testing stay `not-needed-now`.
- Performance evidence: none. No performance candidate applies.
- Human Experience Review: the copies and the backup `README.md` say in plain words that they are generated, that edits are lost, how to get a file back, and when backups go. The resolved plan copy says whether it is the `ready` revision. A refusal names the field, never the value. No interactive surface ships in P2; P3 reviews status output.
- Optional experience handoff: none.
- Explicit human acceptance gate: closed. The owner accepted W30 R0 on 2026-11-24, and this phase with it.
- Evidence report: [W30 R0 Evidence Report, P2](evidence.md#p2-store-records-config-and-copies).
- Independent review: one HIGH finding (factory records removed by cascade when sync deleted a unit) and six smaller ones are fixed and tested. Review finding 4, the `unknown` to `needs-correction` round gap, and the custom role context choice stay open for the owner. See [Independent Review Fixes](evidence.md#independent-review-fixes).
- Re-check: closing a unit while its factory assignment is open is refused everywhere (`work close`, `--accept-deletion`, and a sync close from the file), and the open-assignment sync conflict has a clear message, a working `--keep-store`, and a refused `--keep-file`. See [Re-check Fixes](evidence.md#re-check-fixes).
- Notes for P3 (not built in P2): (1) a pruned project's workflow rows (bindings, plan revisions, grants, and test task results) cannot be removed today, because every factory function refuses a project ID that `project_register` no longer holds with `project-not-registered`; P3 needs a reviewed removal path for them. (2) Removing a workflow must first delete its backup records and its final assignments, in that order, and refuse while an assignment is open, because no foreign key removes them by cascade.
- Owner decision 2026-11-23, project scoping: each project-scoped factory table carries the project ID from `project_register`, and each Store service function for those tables takes it explicitly. Machine tools and capability proofs carry none. A missing or unknown project ID is a typed refusal that changes nothing. See the evidence report.
- Owner decisions 2026-11-23 applied in P2: each assignment records its checkout; the integration owner and the human channel kind live in config only; a move from `unknown` to `needs-correction` counts a round, unless the status before `unknown` was `needs-correction`; only a custom role that the project adds must list its context kinds; and the per-folder `.gitignore` keeps the copies out of git (T11, A15). See [Owner Decisions of 2026-11-23](evidence.md#owner-decisions-of-2026-11-23).
- Phase / capability status: T1 to T21 are done. No public command or MCP tool was added; P3 owns them.
