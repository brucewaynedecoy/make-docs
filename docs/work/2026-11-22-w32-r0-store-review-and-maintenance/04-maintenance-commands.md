---
title: "Phase 4: Maintenance Commands"
kind: "work"
status: "active"
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

- [ ] t1: Add `setup.store.check` (`make-docs setup store check`, MCP `setup_store_check`) in `setup` and `all`. It reads only.
- [ ] t2: Report, in plain words first, the rows each rule would remove with counts and space, the decision items, and each crash leftover that blocks the machine and why.

### Acceptance criteria

- A15: `check` writes nothing, and its CLI and MCP results match.

## Stage 2 - Clean

### Tasks

- [ ] t3: Add `setup.store.clean` (`make-docs setup store clean`, MCP `setup_store_clean`) in `setup` and `all`, with the Store write permission, one prompt in an interactive run, and `--yes` in a non-interactive run.
- [ ] t4: Back up the Store under `~/.make-docs/backup/` first and keep the three newest backups.
- [ ] t5: Remove only the rows that the fixed rules cover, in one transaction. Skip a row whose condition a rule cannot prove, and report why.
- [ ] t6: Vacuum the file, and report each rule, the rows removed, the space freed, the backup path, and how to restore it.

### Acceptance criteria

- A16: Each rule removes only its rows on fixtures and never removes a keep-class row, a decision item, or project content.
- A17: The backup restores the Store exactly, and only three backups remain.
- A18: Each blocking crash leftover is cleared when its owner is proven dead, and tool update, uninstall, and Store removal work again.

### Dependencies

- P1 and P2. It can run beside P3.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
