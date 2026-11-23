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

Nine operations ship under `make-docs work`: `status`, `sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add`, with MCP tools `work_status` to `work_add`. `make-docs resource read` accepts `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/backlog/` URIs. `backlog_snapshot` reads the store when the store is the authority.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. `work next` and `work status` put human meaning first, and conflicts name one settle command ([PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-STORE-3, R-WORK-QUEUE-4 to R-WORK-QUEUE-18, R-WORK-URI-1 to R-WORK-URI-7).
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

- [ ] T1: Admit the nine operations in the registry under `work`, with their MCP names, in the `backlog` and `workflow` profiles.
- [ ] T2: Run sync at the start of each operation and include its outcome in the result.
- [ ] T3: Build `next` with ready units and the reason each open, not-ready unit waits.
- [ ] T4: Build `claim`, `release`, `report`, and `close` with the P1 claim rules, write permission, and `expectedVersion`.
- [ ] T5: Build `status` with the authority mode and its reason in human words first, and exact detail in machine output.
- [ ] T6: Build `export` for checkouts with copies off, and `export --quick <path>` for quick items.
- [ ] T9: Build `add` for quick items with the next plain quick item number of the project.
- [ ] T10: Accept `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/tasks/<n>` in the shared resource resolver, CLI `resource read`, the `resource_read` tool, and native MCP resource reads. Resolve the project by name or project ID only. Open a read-only Store session only for project URIs.
- [ ] T11: Accept `make-docs://project/<project>/backlog/` and its coordinate paths down to a stage or task, with each unit's readiness, wait reasons, claim, links, and child list.
- [ ] T12: Build a scoped cleanup of one project's work rows (units, dependencies, links, and claims) that runs only after `work export` has written that project's work, for a project that a prune removed from the project register. A project prune keeps these rows today (W29 R0 P2 review).
- [ ] T13: Hide claim IDs from callers that do not hold the claim. The owner chose this on 2026-11-23, over making a release also check the claimant, so a claim ID works like a private key. Only the holder sees its claim ID in `claim`, `work next`, and read results. Earlier text: before building `claim` and `release`, decide with the owner whether to hide claim IDs from callers that do not hold the claim, or to make a release also check the claimant. Today the P2 Store service releases a claim for any caller that names its claim ID, and `readWorkClaim` shows the claim ID to any caller.
- [ ] T14: Ask the owner whether to add a report-only Store decision item for work claims that expired more than a set number of days ago. It stays a proposal, with no fixed rule that deletes an expired claim, until the owner decides (W29 R0 P2 evidence).
- [ ] T15: Build the settle flags of `work sync` that the P3 conflict report names: `--settle <path>` with `--keep-file`, `--keep-store`, `--restore`, `--accept-deletion`, `--reimport`, or `--remove-file` (W29 R0 P3).
- [ ] T16: Decide with the owner the file form of the store edits that the P3 writer refuses and does not write: a cleared blocker, a changed gate text, and a title other than a task's. Add writer support, or keep them in the store only and say so in `work report`. A met gate is store-only today (W29 R0 P3).
- [ ] T17: Give wave units a readiness rule. P3 makes one wave unit for each wave that an imported revision names, with no recorded status, so it stays open. Decide how archived backlogs show in `work next` (W29 R0 P3).
- [ ] T18: Decide with the owner whether a file edit that closes a claimed unit acts for the live claim holder, or stops as a conflict. Until the owner decides, P3 import stops that file as a conflict that names the unit and its holder state, never the claim ID (W29 R0 P3).
- [ ] T19: Decide where the sync write hold list comes from before `work sync` ships, such as the project config or the project doctor, so this repository holds `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/` until its own doctor run (register D-063). P3 built the hold as a sync option and kept repository paths out of the product (W29 R0 P3).
- [ ] T20: Decide with the owner what sync does when copies are off and a person deletes a copy by hand. Today the P3 sync keeps its ledger entry, so when copies go on again that file stops as a `file-deleted` conflict, and its "accept the deletion" choice closes live units as superseded. PRD 38 says the ledger entry goes after a verified copy removal or projection off, so the code and the PRD disagree. The W29 R0 P3 second re-check proposed clearing the ledger entry in that case; it changes an owner-approved P1 sync-table row. Also add a test for a refused removal with copies off.

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

- [ ] T7: Switch `backlog_snapshot` to the store when the store is the authority. Keep schema v2 and add resolved readiness facts.
- [ ] T8: Keep the file path, unchanged, for checkouts without a Store.

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
