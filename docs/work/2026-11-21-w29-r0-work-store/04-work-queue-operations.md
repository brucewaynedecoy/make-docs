---
title: "Phase 4: Work Queue Operations"
kind: "work"
status: "active"
coordinate: "W29 R0 P4"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 4: Work Queue Operations

## Purpose

Expose the work store through the shared operation registry, so the CLI and MCP share one core.

## Overview

Nine operations ship under `make-docs run work`: `status`, `sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add`, with MCP tools `work_status` to `work_add`. `make-docs resource read` accepts `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/backlog/` URIs. `backlog_snapshot` reads the store when the store is the authority.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. `run work next` and `run work status` put human meaning first, and conflicts name one settle command ([PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-STORE-3, R-WORK-QUEUE-4 to R-WORK-QUEUE-18, R-WORK-URI-1 to R-WORK-URI-7).
- Intended human outcome: a person can see what is ready, why other work waits, and which source is the authority, without reading every backlog file.
- Human-facing surface or indirect effect: CLI and MCP output of the nine operations and of a project URI read.
- Implementation work: registry admission, handlers, profiles, and the snapshot source switch.
- Evidence source or testing type selected under current authority: parity fixtures and Guided Progress Review.
- Executor: the implementing agent prepares the review. The owner gives feedback.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | CLI and MCP parity for every operation, claim rules, mode fixtures, and the no-Store snapshot. |
| Performance Testing | not-needed-now | `PERF-004` runs in P6. |
| Guided Progress Review | selected | The owner reviews `next`, `status`, and the conflict report on real backlogs. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Operations

### Tasks

- [ ] t1: Admit the nine operations in the registry under `run work`, with their MCP names, in the `backlog` and `workflow` profiles.
- [ ] t2: Run sync at the start of each operation and include its outcome in the result.
- [ ] t3: Build `next` with ready units and the reason each open, not-ready unit waits.
- [ ] t4: Build `claim`, `release`, `report`, and `close` with the P1 claim rules, write permission, and `expectedVersion`.
- [ ] t5: Build `status` with the authority mode and its reason in human words first, and exact detail in machine output.
- [ ] t6: Build `export` for checkouts with copies off, and `export --quick <path>` for quick items.
- [ ] t9: Build `add` for quick items with the next plain quick item number of the project.
- [ ] t10: Accept `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/tasks/<n>` in the shared resource resolver, CLI `resource read`, the `resource_read` tool, and native MCP resource reads. Resolve the project by name or project ID only. Open a read-only Store session only for project URIs.
- [ ] t11: Accept `make-docs://project/<project>/backlog/` and its coordinate paths down to a stage or task, with each unit's readiness, wait reasons, claim, links, and child list.

### Acceptance criteria

- A16: CLI JSON and MCP results match for every operation on every fixture.
- A17: A takeover after expiry fails unless the caller confirms the handle check.
- A18: `report` and `close` refuse a caller that no longer holds the claim.
- A19: `status` names the mode and the reason for Store present, absent, denied, and unsafe.
- A31: `add` gives each new quick item the next number. A closed quick item keeps its number, and no number is used twice.
- A32: A `tasks` read prints the same text as `export --quick` and opens no repository file. A system-resource read opens no Store session. Without a usable Store, a project URI read returns the typed Store outcome and points to the `docs/work/` files.
- A34: The same project URI gives the same result from any folder. A `backlog` read accepts any letter case, names the canonical URI, and refuses an unknown project, a part after a task, and a leading zero.

## Stage 2 - Snapshot source

### Tasks

- [ ] t7: Switch `backlog_snapshot` to the store when the store is the authority. Keep schema v2 and add resolved readiness facts.
- [ ] t8: Keep the file path, unchanged, for checkouts without a Store.

### Acceptance criteria

- A20: A no-Store checkout gives the same `backlog_snapshot` result as before this Wave.
- A21: In store mode, the snapshot facts match the store and include readiness.

### Dependencies

- P2 and P3.
- An accepted command tree review under register D-065. The command paths and MCP names in this phase follow it.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
