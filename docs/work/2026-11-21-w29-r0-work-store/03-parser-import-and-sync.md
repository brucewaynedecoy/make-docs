---
title: "Phase 3: Parser, Import, and Sync"
kind: "work"
status: "active"
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

- [ ] t1: Build a parser for the current work index and phase format: frontmatter, stages, tasks, acceptance criteria, dependencies, blockers, closeout, and links.
- [ ] t2: Build a writer that renders identical bytes for any file the store did not change.
- [ ] t3: Leave an unreadable file untouched and report its path and first failing line.

### Acceptance criteria

- A10: Parse then write gives identical bytes for every backlog in this repo, live and archived.
- A11: An unreadable file stays untouched, and the report names its path and line.

## Stage 2 - Import and sync

### Tasks

- [ ] t4: Build first import for `docs/work/` and `.make-docs/archive/work/`, with a report of imported records, resolved dependencies, and unresolved bullets.
- [ ] t5: Build two-way sync for each sync table row, and record the last applied digest after each write or import.
- [ ] t6: Build the conflict report with both sides, the affected units, and one settle command for each choice.
- [ ] t7: Respect `work.projection`. With copies off, write no file. Remove a copy only when its bytes match the last applied digest.

### Acceptance criteria

- A12: First import on a clean checkout leaves `git status` clean.
- A13: Each sync table row has a passing fixture.
- A14: A conflict in one phase file blocks only the units in that file.
- A15: A changed copy is kept and reported when copies are turned off.

### Dependencies

- P1 and P2.
- The task ID case Wave in register D-063, so the parser reads `t` and `T` the same and writes `T`.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
