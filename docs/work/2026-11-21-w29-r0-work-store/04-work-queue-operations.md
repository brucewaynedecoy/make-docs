---
title: "Phase 4: Work Queue Operations"
kind: "work"
status: "completed"
coordinate: "W29 R0 P4"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 4: Work Queue Operations

## Purpose

Expose the work store through the shared operation registry, so the CLI and MCP share one core.

## Overview

Nine operations ship under `make-docs work`: `status`, `sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add`, with MCP tools `work_status` to `work_add`. `make-docs resource read` accepts `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/backlog/` URIs. `backlog_snapshot` reads the store when the caller asks with `--work-store` (MCP `workStore: true`) and the store is the authority.

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

- [x] T1: Admit the nine operations in the registry under `work`, with their MCP names, in the `backlog` and `workflow` profiles.
- [x] T2: Run sync at the start of each operation and include its outcome in the result.
- [x] T3: Build `next` with ready units and the reason each open, not-ready unit waits.
- [x] T4: Build `claim`, `release`, `report`, and `close` with the P1 claim rules, write permission, and `expectedVersion`.
- [x] T5: Build `status` with the authority mode and its reason in human words first, and exact detail in machine output.
- [x] T6: Build `export` for checkouts with copies off, and `export --quick <path>` for quick items.
- [x] T9: Build `add` for quick items with the next plain quick item number of the project.
- [x] T10: Accept `make-docs://project/<project>/tasks/` and `make-docs://project/<project>/tasks/<n>` in the shared resource resolver, CLI `resource read`, the `resource_read` tool, and native MCP resource reads. Resolve the project by name or project ID only. Open a read-only Store session only for project URIs. When this read lands, `work add` names the new quick item's `make-docs://project/<project>/tasks/<n>` URI in its result again; until then it names none (W29 R0 P4 review, finding 5).
- [x] T11: Accept `make-docs://project/<project>/backlog/` and its coordinate paths down to a stage or task, with each unit's readiness, wait reasons, claim, links, and child list.
- [x] T12: Build a scoped cleanup of one project's work rows (units, dependencies, links, and claims) that runs only after `work export` has written that project's work, for a project that a prune removed from the project register. A project prune keeps these rows today (W29 R0 P2 review).
- [x] T13: Hide claim IDs from callers that do not hold the claim. The owner chose this on 2026-11-23, over making a release also check the claimant, so a claim ID works like a private key. Only the holder sees its claim ID in `claim`, `work next`, and read results. Earlier text: before building `claim` and `release`, decide with the owner whether to hide claim IDs from callers that do not hold the claim, or to make a release also check the claimant. Today the P2 Store service releases a claim for any caller that names its claim ID, and `readWorkClaim` shows the claim ID to any caller.
- [x] T14: Ask the owner whether to add a report-only Store decision item for work claims that expired more than a set number of days ago. It stays a proposal, with no fixed rule that deletes an expired claim, until the owner decides (W29 R0 P2 evidence). Owner decision (2026-11-23): add the report-only item. `setup store check` lists work claims that expired more than 7 days ago as a decision item. No rule deletes them.
- [x] T15: Build the settle flags of `work sync` that the P3 conflict report names: `--settle <path>` with `--keep-file`, `--keep-store`, `--restore`, `--accept-deletion`, `--reimport`, or `--remove-file` (W29 R0 P3).
- [x] T16: Decide with the owner the file form of the store edits that the P3 writer refuses and does not write: a cleared blocker, a changed gate text, and a title other than a task's. Add writer support, or keep them in the store only and say so in `work report`. A met gate is store-only today (W29 R0 P3). Owner decision (2026-11-23): keep these edits in the Store only, and show them in `work report`. The writer gets no new file text for them.
- [x] T17: Give wave units a readiness rule. P3 makes one wave unit for each wave that an imported revision names, with no recorded status, so it stays open. Decide how archived backlogs show in `work next` (W29 R0 P3). Owner decision (2026-11-23): a wave unit is ready when all its revisions are closed. Archived backlogs never show in `work next`.
- [x] T18: Decide with the owner whether a file edit that closes a claimed unit acts for the live claim holder, or stops as a conflict. Until the owner decides, P3 import stops that file as a conflict that names the unit and its holder state, never the claim ID (W29 R0 P3). Owner decision (2026-11-23): a file edit that closes a claimed unit stays a per-file conflict. The holder releases the claim, or the claim expires; sync never acts for the holder.
- [x] T19: Decide where the sync write hold list comes from before `work sync` ships, such as the project config or the project doctor, so this repository holds `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/` until its own doctor run (register D-063). P3 built the hold as a sync option and kept repository paths out of the product (W29 R0 P3). Owner decision (2026-11-23): the hold list lives in the project config as paths that a person sets. Sync never writes a held path and reports it as held.
- [x] T20: Decide with the owner what sync does when copies are off and a person deletes a copy by hand. Today the P3 sync keeps its ledger entry, so when copies go on again that file stops as a `file-deleted` conflict, and its "accept the deletion" choice closes live units as superseded. PRD 38 says the ledger entry goes after a verified copy removal or projection off, so the code and the PRD disagree. The W29 R0 P3 second re-check proposed clearing the ledger entry in that case; it changes an owner-approved P1 sync-table row. Also add a test for a refused removal with copies off. Owner decision (2026-11-23): when copies are off and a person deletes a copy by hand, sync clears that file's ledger entry, as PRD 38 says. When copies go on again, sync writes the file back with no conflict. This changes the owner-approved P1 sync-table row for that case.

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

- [x] T7: Switch `backlog_snapshot` to the store when the store is the authority. Keep schema v2 and add resolved readiness facts. Owner decision (2026-11-23, option A): the store source and the readiness facts are opt-in, with `--work-store` on the CLI and `workStore: true` on MCP; the default snapshot stays exactly as before in every mode, so old installed Skill copies accept it.
- [x] T8: Keep the file path, unchanged, for checkouts without a Store.

### Acceptance criteria

- A20: A no-Store checkout gives the same `backlog_snapshot` result as before this Wave.
- A21: In store mode, with the work store option, the snapshot facts match the store and include readiness.

### Dependencies

- P2 and P3.
- An accepted command tree review under register D-065. The command paths and MCP names in this phase follow it.

### Closeout Notes

- First pass (2026-11-23): T1 to T6, T9, and T13 to T20 are built and tested. T7, T8, T10, T11, and T12 are not done; a follow-up pass builds them. The phase stays `active`.
- Not done in this pass: T7 and T8 (`backlog_snapshot` from the store, and A20 and A21); T10 and T11 (`make-docs://project/<project>/tasks/` and `.../backlog/` reads through the shared resource resolver, CLI `resource read`, `resource_read`, and native MCP resource reads, and A32 and A34). `work export --quick` and the `tasks` list read share one renderer already (`renderWorkTasksList`), so T10 reuses it. T12 (scoped work-row cleanup for a pruned project after export).
- New behavior to note: a read-only operation (`work status`, `work next`) runs a read-only sync check instead of a sync, because it cannot write (PRD 52 R-WORK-SYNC-8). `work export --to` writes backlog files only to a new or empty folder, and `--quick` only to a new file, never under `docs/work/`, `.make-docs/`, or a held path, also through a symbolic link.
- Independent review (2026-11-23): needs changes. Findings 1 to 6, 8, and 10 are fixed with tests: export destinations, no file replaced, the T13 claim ID rule (shown only in a new claim's result; a renewal sends it), inputs checked before the sync, no project URI from `work add` until T10, the close note only for a file that sync writes, `--accept-deletion` refused on a held path, and the claim and release words. The owner then decided findings 7 and 9 on 2026-11-23, and both are built: a phase with no status line and every task checked counts as done for readiness, and the output says `doneBy: "all-tasks-checked"` (PRD 52 R-WORK-QUEUE-20; on a copy of this repository `work next` now lists 46 ready phases instead of 125); a release of an expired claim, and a close of a unit whose claim expired by a caller without the claim, need the handle check, and a file edit never closes a unit with any claim (R-WORK-QUEUE-8, R-WORK-QUEUE-10, R-WORK-SYNC-16). P5 T10 holds the later status-line fix for older backlogs.
- Re-check (2026-11-23): fixes 2 to 10 and the owner decisions are confirmed. Seven more findings are fixed with tests from the re-check's probes: export refuses a protected folder in any letter case; a progress note is store-only data; an unchecked checkbox at any indent keeps a phase with no status line open; a file edit that closes a claimed unit is a `claimed` conflict whose choices are the release and `--keep-store` (no `--keep-file`, no loop); the expired-claim advice names the takeover or the release with `--handle`; a phase done by the fallback "counts as done"; and the MCP `claimant` text matches T13.
- Register D-066: the owner chose option A on 2026-11-23. `work report --note` keeps the latest note and its time in the unreleased v8 `work_units` table.
- Four testing decisions: Automated Implementation Testing ran (see evidence). Performance Testing stays `not-needed-now` here: `PERF-004` runs in P6. Guided Progress Review: pending owner review of the `work next`, `work report`, `work status`, and conflict samples in the evidence. Unassisted Goal Testing: `not-needed-now`.
- Performance evidence: none in this phase (`PERF-004` is P6).
- Human Experience Review: the samples put human meaning first and end read-only summaries with "Changes nothing."; owner review pending.
- Optional experience handoff: none.
- Explicit human acceptance gate: pending the owner's Guided Progress Review, now also of the second pass samples.
- Evidence report: [P4 section](evidence.md#p4-work-queue-operations).
- Second pass (2026-11-23): T7, T8, T10, T11, and T12 are built and tested, so every P4 task is checked. `backlog snapshot` reads the work store in store mode, with readiness facts and the sync check, and reads the files exactly as before without a usable Store (A20, A21). `make-docs resource read` reads `make-docs://project/<project>/tasks/` and `.../backlog/` URIs from any folder, through `project_register` only, in one read-only Store session (A32, A34). `work add` names the quick item's URI again (T10 note). A complete `work export` returns a `workDigest`, and a prune with that digest removes the pruned project's work rows (T12). `work next` without a usable Store keeps its typed Store outcome and now names the `docs/work/` files. Evidence: [P4 second pass](evidence.md#p4-second-pass).
- New behavior to note (second pass): a project URI read leaves checkout-scoped sync conflicts out of readiness and says so; `resource.read` keeps `store: none`, and only a project URI opens its own read-only Store session; the snapshot's store-mode keys (`readiness`, `workStore`) appear only in store mode; a cleanup refuses while a unit has a live claim; `work next` on a checkout not bound to a usable Store gives the same typed outcome as an absent Store, with the reason that `work status` gives.
- Owner decision needed (second pass): register D-068, whether `work next` without a usable Store keeps the typed outcome and the pointer (option A, built) or reads and ranks the files (option B).
- Second pass review (2026-11-23): needs changes; items 2 to 6 are fixed with tests. A project URI read uses the harness grant of the folder where the agent works, and a folder that is not a project is refused without a setup step for it; native MCP project reads now send the MCP connection. The snapshot runs the harness check before it reads Store state. A complete export also writes the files of units whose repo copy a person removed. An absent Store gives one next step. The snapshot schema stays strict (PRD 51 R-BACKLOG-SNAPSHOT-30). The high item, old Skill copies against the new snapshot keys, waits for the owner. Evidence: [review fixes](evidence.md#p4-second-pass-review-fixes).
- Owner decisions (2026-11-23): old Skill copies, option A: the store-mode snapshot keys are opt-in (`--work-store`, `workStore: true`), the default snapshot is unchanged in every mode, and this repository's old installed Skill accepts it (test). The backlog-review Skill reads none of the new keys, so its text does not ask for them. Register D-068, option A: `work next` keeps the typed outcome and the pointer; PRD 52 R-WORK-STORE-2 now says so, and D-068 is closed. Evidence: [owner decisions](evidence.md#p4-owner-decisions-2026-11-23).
- Phase / capability status: active; every task built; pending the owner's Guided Progress Review.
