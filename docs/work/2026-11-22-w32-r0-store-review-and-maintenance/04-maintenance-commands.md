---
title: "Phase 4: Maintenance Commands"
kind: "work"
status: "completed"
coordinate: "W32 R0 P4"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 4: Maintenance Commands

## Purpose

Let a person keep the Store small and healthy with two commands.

## Overview

`setup store check` reports what the fixed rules would remove and what needs a decision. `setup store clean` backs up the Store, removes only what the rules prove safe, and vacuums the file.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. `check` changes nothing and explains in plain words. `clean` removes only what fixed rules prove safe, after a backup, and says how to restore ([PRD 38](../../prd/38-global-store-and-project-state.md) R-MAINT-3 to R-MAINT-5, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-STORE-CMD-3, R-STORE-CMD-4).
- Intended human outcome: a person can free space and clear crash leftovers without reading tables or reviewing each row.
- Human-facing surface or indirect effect: `setup store check` and `setup store clean` CLI and MCP output, and the backup files.
- Implementation work: the two operations, the rules, backup rotation, one transaction, vacuum, and the report.
- Evidence source or testing type selected under current authority: rule tests, backup and restore test, parity, Guided Progress Review.
- Executor: the implementing agent prepares the review. The owner gives feedback.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | No-write check, parity, each rule on fixtures, skip on unproven conditions, backup rotation and restore, and crash-leftover clearing. |
| Performance Testing | not-needed-now | `PERF-005` runs on a real Store copy in P5. |
| Guided Progress Review | selected | The owner reviews the check and clean wording on fixtures before P5. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Check

### Tasks

- [x] T1: Add `setup.store.check` (`make-docs setup store check`, MCP `setup_store_check`) in `setup` and `all`. It reads only.
- [x] T2: Report, in plain words first, the rows each rule would remove with counts and space, the decision items, and each crash leftover that blocks the machine and why.

### Acceptance criteria

- A15: `check` writes nothing, and its CLI and MCP results match.

## Stage 2 - Clean

### Tasks

- [x] T3: Add `setup.store.clean` (`make-docs setup store clean`, MCP `setup_store_clean`) in `setup` and `all`, with the Store write permission, one prompt in an interactive run, and `--yes` in a non-interactive run.
- [x] T4: Back up the Store under `~/.make-docs/backup/` first and keep the three newest backups.
- [x] T5: Remove only the rows that the fixed rules cover, in one transaction. Skip a row whose condition a rule cannot prove, and report why.
- [x] T6: Vacuum the file, and report each rule, the rows removed, the space freed, the backup path, and how to restore it.

### Acceptance criteria

- A16: Each rule removes only its rows on fixtures and never removes a keep-class row, a decision item, or project content.
- A17: The backup restores the Store exactly, and only three backups remain.
- A18: Each blocking crash leftover is cleared when its owner is proven dead, and tool update, uninstall, and Store removal work again.

### Dependencies

- P1 and P2. It can run beside P3.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 54 new tests in `packages/cli/tests/w32-r0-p4-store-maintenance.test.ts` (each P1 fixture against the fixture answers and the reference evaluator, the package-manager-idle proof on real npm, pnpm, yarn, bun, and brew process lines, the no-write check, a changed-outside Store, the missing Store, clean on each fixture with an exact restore, backup rotation, dry run, permission and confirmation, compare-and-change, rules 002 and 006 forced on, crash leftovers, the real layout readers, the built CLI, and a real setup with MCP parity and the removal handoff), the updated catalog and name catalog tests, the type check, and the full suite with only the known failures. An independent review found rules 004 and 005 safe, compare-and-change correct, and check read only on an unsafe Store, and asked for six fixes. All six are made, each with a test: rule 009 keeps the current receipt plus exactly 10 older receipts; the package-manager check examines every word and counts Homebrew and changed process titles; a failed clean leaves no backup file, and only verified backups count; a busy Store gives a typed retryable result; check and clean give the same rule 004 reason; and clean checks the schema version inside its transaction. See the [evidence report](evidence.md#review-fixes). Performance Testing is `not-needed-now` (`PERF-005` runs in P5). Guided Progress Review is selected: the owner reviews the check and clean wording below and in the [evidence report](evidence.md#sample-output) before P5. Unassisted Goal Testing is `not-needed-now`.
- Performance evidence: none in P4. Check reads each candidate query once. Clean adds one `VACUUM INTO` backup, one transaction, and one `VACUUM`. `PERF-005` measures them on a real Store copy in P5.
- Human Experience Review: prepared for the owner. Check starts with one plain summary line (rows and space clean would remove, skips, decisions, leftovers, and "Nothing was changed."), then each rule with its rows and skip reasons, then decision items, then crash leftovers with what each blocks and its next step. Clean starts with rows removed, space freed, and the backup path, then each rule, then the numbered restore steps. A Store changed outside Make Docs gets "The Store was changed outside Make Docs" and "Do not write the Store." The owner gives feedback before P5.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: pending owner review of the decisions in the [evidence report](evidence.md#p4-decisions-for-the-owner): rule 002 stays off until approved (its check is built: `FOLLOW-UP-P4-PACKAGE-MANAGER-IDLE` is `built-pending-approval`), `setup` commands are not native command rules, PRD 39 R-SURF-1 needs a wording update, rotation covers only clean backups, a clean with nothing to do makes no backup, restore exactness is logical, and A18 is met for every leftover except the pending tool update (rule 002).
- Evidence report: [P4 Maintenance Commands](evidence.md#p4-maintenance-commands).
- Phase / capability status: Phase complete on commit after owner review. A16 and A17 are met. A15 is met. A18 is met for the dead-owner lock (STORE-LEFTOVER-001); the pending tool update (STORE-LEFTOVER-002) clears only when the owner turns rule 002 on, and the other leftovers have no fixed rule by design and name their existing command. Capability partial: the real Store proof (P5) remains.
