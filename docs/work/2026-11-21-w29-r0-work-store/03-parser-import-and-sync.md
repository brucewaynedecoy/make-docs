---
title: "Phase 3: Parser, Import, and Sync"
kind: "work"
status: "completed"
coordinate: "W29 R0 P3"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 3: Parser, Import, and Sync

## Purpose

Connect the store and the `docs/work/` files without losing an edit on either side.

## Overview

A strict parser and writer round-trip today's work files byte for byte. First import fills the store with no file change. Two-way sync follows the P1 sync table and stops on a conflict for only the affected units.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Edits reach the store, conflicts stop safely, and the file format does not change ([PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-SYNC-1 to R-WORK-SYNC-10, R-WORK-STORE-8).
- Intended human outcome: a person who edits a work file, or pulls a teammate's edit, finds it in the store, and nothing is lost.
- Human-facing surface or indirect effect: `docs/work/` files, the sync report, and the conflict report.
- Implementation work: parser, writer, import, sync, and conflict report.
- Evidence source or testing type selected under current authority: round-trip tests on real backlogs and sync fixtures.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Round trip on every current backlog, import, every sync table row, and conflict scope. |
| Performance Testing | not-needed-now | `PERF-004` measures the finished sync path in P6. |
| Guided Progress Review | selected | The owner reviews the conflict report wording. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Parser and writer

### Tasks

- [x] T1: Build a parser for the current work index and phase format: frontmatter, stages, tasks, acceptance criteria, dependencies, blockers, closeout, and links.
- [x] T2: Build a writer that renders identical bytes for any file the store did not change.
- [x] T3: Leave an unreadable file untouched and report its path and first failing line.

### Acceptance criteria

- A10: Parse then write gives identical bytes for every backlog in this repo, live and archived.
- A11: An unreadable file stays untouched, and the report names its path and line.

## Stage 2 - Import and sync

### Tasks

- [x] T4: Build first import for `docs/work/` and `.make-docs/archive/work/`, with a report of imported records, resolved dependencies, and unresolved bullets.
- [x] T5: Build two-way sync for each sync table row, and record the last applied digest after each write or import.
- [x] T6: Build the conflict report with both sides, the affected units, and one settle command for each choice.
- [x] T7: Respect `work.projection`. With copies off, write no file. Remove a copy only when its bytes match the last applied digest.

### Acceptance criteria

- A12: First import on a clean checkout leaves `git status` clean.
- A13: Each sync table row has a passing fixture.
- A14: A conflict in one phase file blocks only the units in that file.
- A15: A changed copy is kept and reported when copies are turned off.

### Dependencies

- P1 and P2.
- [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md), the task ID case Wave in register D-063, so the parser reads `t` and `T` the same and writes `T`.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 90 tests in `packages/cli/tests/w29-r0-p3-parser-import-and-sync.test.ts` cover the round trip of all 463 work files in this repository (A10), eight unreadable-file cases and an untouched file in sync (A11), first import of a temporary git copy of every backlog with a clean `git status` (A12), one fixture for each of the 31 sync table rows (A13: 23 through real sync, 8 that sync cannot meet through the decision and a state proof), conflict scope (A14), a kept changed copy with copies off (A15), the P1 dependency fixtures, moves, deleted units, a second checkout, and every finding of the independent review and its re-check as a test (the reviewers' probes). Guided Progress Review selected: the owner reviews the conflict report wording in the [evidence report](evidence.md#p3-parser-import-and-sync). Performance Testing and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none. `PERF-004` measures the finished sync path in P6. The first import of this repository's 463 files and 4,178 units runs inside one test file of about 15 seconds.
- Human Experience Review: a changed file reaches the store, a store change reaches the file, and a change on both sides stops only its own file with both sides, the waiting units, and two exact settle commands. An import that would close a claimed unit, or delete a unit that holds what the file cannot show, stops that file and says why. Every summary names each file written or removed and each unit deleted. The first sync of a checkout writes no file, and the Store records it, so every later sync writes. A file the file system refuses to write is reported and retried. An unreadable file is named with its first failing line and is never written. The owner reviews the conflict report wording in the evidence report.
- Optional experience handoff: not applicable. P3 adds no public operation. P4 builds `work sync` and its settle flags.
- Explicit human acceptance gate: owner-approved on 2026-11-23, as recommended: the deletion rule for a unit that leaves its file, the first sync of a checkout writes no file, a changed copy with copies off is removed by a later sync and the report says so, the phase-title rule, identical sides recorded with no conflict, and an archive move that keeps store IDs. PRD 52 now states each one (R-WORK-STORE-10, R-WORK-SYNC-9, R-WORK-SYNC-13 to R-WORK-SYNC-16) with Requirement History entries. The owner also chose on 2026-11-23 to record a checkout's first sync in a new `work_sync_checkouts` table in the unreleased v8 migration (PRD 38 R-MIN row and R-DB-7). A file edit that closes a claimed unit stays a conflict for each file until P4 T18. The owner still reviews the conflict report wording and accepts the phase on commit.
- Evidence report: [P3 Parser, Import, and Sync](evidence.md#p3-parser-import-and-sync).
- Phase / capability status: Phase complete on commit and owner acceptance. Capability partial: the work operations (P4), the agent twin (P5), and acceptance (P6) remain.
