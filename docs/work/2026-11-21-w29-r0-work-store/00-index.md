---
title: "W29 R0 Work Store"
kind: "work"
status: "active"
coordinate: "W29 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and PRD 52 into implementation work."
  coordinate_handoff: "Carry W29 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# W29 R0 Work Store

## Purpose

This backlog builds the work store in [PRD 52](../../prd/52-work-store-and-work-queue.md): a durable local record of work in the global Store, a two-way repo copy in `docs/work/`, and a work queue with next, claim, report, and close. The [design](../../designs/2026-11-21-work-store.md) and the [plan](../../plans/2026-11-21-w29-r0-work-store/00-overview.md) define the scope. The [W30 R0 factory backlog](../2026-11-21-w30-r0-factory/00-index.md) depends on it.

The 2.0.8 release gate is met, because 2.0.9 is released. Implementation needs separate owner authority. This backlog does not touch W22 R2 files, branches, or worktrees.

Shipped resources change in `packages/docs/template/` first. Each change is then projected into the package and, after review, into this repository's `.make-docs/` and `docs/`.

Out of scope:

- A connection for any tracker other than the local store.
- The factory, its Store records, and the backlog review button handoff. W30 owns them.
- Rebuilding `.make-docs/config.yaml` from the Store. It is recorded as a separate risk in the [risk register](../../prd/03-open-questions-and-risk-register.md).

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: `run work next` names ready units in dependency order and says why each blocked unit waits. | [Design](../../designs/2026-11-21-work-store.md), [plan](../../plans/2026-11-21-w29-r0-work-store/00-overview.md) | [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-QUEUE-4, R-WORK-QUEUE-5 | [P1](01-record-model-and-rule-catalog.md), [P4](04-work-queue-operations.md) | Fixtures, CLI and MCP parity, Guided Progress Review | P4 closeout | None |
| `direct`: hand edits and teammates' edits through git reach the store after the next work command. | Same | PRD 52 R-WORK-SYNC-2, R-WORK-SYNC-8 | [P3](03-parser-import-and-sync.md), [P6](06-package-parity-and-acceptance.md) | Two-checkout sync test | P6 closeout | None |
| `direct`: when both sides changed, Make Docs stops, shows both sides, and names one settle command. | Same | PRD 52 R-WORK-SYNC-4, R-WORK-SYNC-5 | [P3](03-parser-import-and-sync.md), [P4](04-work-queue-operations.md) | Conflict fixtures, Guided Progress Review | P4 closeout | None |
| `direct`: existing `docs/work/` files keep their format and names. A teammate without a Store sees no change. | Same | PRD 52 R-WORK-STORE-8, R-WORK-SYNC-7 | [P3](03-parser-import-and-sync.md), [P6](06-package-parity-and-acceptance.md) | Byte-for-byte round trip, no-Store run | P6 closeout | None |
| `direct`: `run work status` says whether the store or the files are the authority, and why. | Same | PRD 52 R-WORK-STORE-3 | [P4](04-work-queue-operations.md) | Mode fixtures, Guided Progress Review | P4 closeout | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-record-model-and-rule-catalog.md](01-record-model-and-rule-catalog.md) | Settle the record model, sync table, queue rules, tracker contract, R-MIN rows, and fixtures. |
| [02-store-schema-and-records.md](02-store-schema-and-records.md) | Add the work tables in one append-only migration and the Store service. |
| [03-parser-import-and-sync.md](03-parser-import-and-sync.md) | Build the round-trip parser and writer, first import, and two-way sync. |
| [04-work-queue-operations.md](04-work-queue-operations.md) | Build the `run work` operations and the store-backed snapshot. |
| [05-agent-twin-and-config.md](05-agent-twin-and-config.md) | Author the `work-store` reference and the `work` config block. |
| [06-package-parity-and-acceptance.md](06-package-parity-and-acceptance.md) | Prove the installed package, sync, no-Store behavior, `PERF-004`, and Human Experience outcomes. |

## Wave Sequence

- Full order: [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) and [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) side by side, then [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P2 to P6, then [W30 R0](../2026-11-21-w30-r0-factory/00-index.md).
- Done: P1.
- Waits for: all of [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) before P2, and all of [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) before P3.
- Next: [W30 R0](../2026-11-21-w30-r0-factory/00-index.md) P2 waits for all of this Wave. W30 R0 P1 can start any time.

## Usage Notes

- Read phases in order. P5 can start after P1. P2 waits for all of W32 R0, the Store review. P3 also waits for the task ID case Wave in register D-063.
- Every phase file includes `## Source PRD Docs`.
- Acceptance case IDs run from A1 to A34 across this backlog. A31, A32, and A34 sit in P4. A33 sits in P2.
- Evidence: [evidence.md](evidence.md).
- No `O-###` obligation or `NUAT-###` scenario is in scope. Unassisted Goal Testing is `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, start P1 and continue phase by phase.
- Why: The backlog is the implementation queue derived from the plan and PRD 52.
- Coordinate Handoff: Carry `W29 R0` into phase history records and commits, adding the active P number.

## Change History

### 2026-11-22 — W29 R0

- Kind: `edit`
- Affected scope: P2 new t9, A33, and dependency, and A8 rewritten; P3 dependency; P4 overview, t1, t6, new t9 to t11, new A31, A32, and A34; P5 new t7 and t8.
- Previous scope: eight `run work` operations, no way to add a quick item or read work by URI, no project name, and an A8 that let a plain claim take a unit with an expired claim.
- Replacement scope: `run work add` for Store-only quick items; `export --quick <path>`; `make-docs://project/<project>/tasks/` and `.../backlog/` URIs that always name the project; a `projectName` in config and the Store; P3 waits for the task ID case Wave; A8 matches the P1 takeover rule.
- Rationale: the owner chose Store-only quick items, asked for URIs that name a project, asked for a readable project name, and chose upper-case task IDs in their own Wave, and plain numbers for quick items. A8 contradicted PRD 52 R-WORK-QUEUE-17.
- PRD decision: `update-existing` — PRD 52, 38, 24, 17, 21, 25, 39, 53, and 04; register D-061, D-062, and D-063.
- Owner approval: the owner's answers on 2026-11-22.
- Source: [PRD 52](../../prd/52-work-store-and-work-queue.md)

### 2026-11-22 — W29 R0 P2

- Kind: `edit`
- Affected scope: P2 overview, t2, t9, A5, A33, and dependencies; the usage notes.
- Previous scope: the work tables arrived in schema v7, and P2 recorded project names in its own register.
- Replacement scope: the work tables arrive in schema v8 with the Store write guard triggers and Store table catalog entries. Project names resolve only through `project_register` from W32 R0. P2 waits for all of W32 R0.
- Rationale: the owner chose to finish the whole Store review (W32 R0) first. W32 R0 takes schema v7 and builds the project register and the write guard.
- PRD decision: `update-existing` — PRD 38 R-DB-7, R-REGISTER, R-WRITE-GUARD, and R-MAINT; PRD 52 R-WORK-STORE-12 and R-WORK-URI-1.
- Owner approval: the owner's choice on 2026-11-22 to finish the whole Store review before W29 R0 P2.
- Source: [W32 R0 plan](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md)
