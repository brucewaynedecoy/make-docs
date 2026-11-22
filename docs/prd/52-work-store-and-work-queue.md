---
title: "52 Work Store and Work Queue"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w29-r0-work-store/00-overview.md"
---

# 52 Work Store and Work Queue

## Purpose

Own the Make Docs capability that keeps a durable local record of work and answers four questions about it: what is ready, who has claimed it, what progress it has made, and how it closed. This PRD owns the work store authority model, the `docs/work/` repo copy, two-way sync, first import, work identity, the work queue rules, the tracker connection contract, and the work store operations.

## Scope

This capability covers:

- work records for waves, revisions, phases, stages, tasks, and quick items, with their status, dependencies, links, and claims;
- the authority mode of each checkout: the work store when a usable Store exists, the `docs/work/` files otherwise;
- the repo copy of work records in today's `docs/work/` format;
- two-way sync between the store and the repo copy, with a conflict stop;
- first import of existing backlogs;
- readiness, claim, report, and close rules in a CLI form and an agent form;
- a tracker connection contract, with the local store as the only current connection; and
- the `run work` operations and their MCP tools.

This capability does not own the Store schema and field register, project config keys, resource identity, the backlog snapshot contract, the operation registry, MCP profiles, or the factory. Those remain with [PRD 38](38-global-store-and-project-state.md), [PRD 24](24-project-configuration-and-convention-overlay.md), [PRD 06](06-template-contracts-and-generated-assets.md), [PRD 51](51-backlog-review-and-reporting.md), [PRD 39](39-cli-command-model-and-operation-registry.md), [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md), and [PRD 53](53-factory-setup-and-orchestration.md).

Code anchors:

- `packages/cli/src/store/`
- `packages/cli/src/operations/work/`
- `packages/docs/template/`
- `docs/work/`

## Component and Capability Map

### Authority

- R-WORK-STORE-1 (MUST): when the checkout is bound to a usable Store, the work store is the authority for that project's work records. The `docs/work/` tree is a repo copy of the store.
- R-WORK-STORE-2 (MUST): when the Store is absent, unavailable, unsafe, or denied, `docs/work/` is the authority. Every work operation reads the files directly and behaves as it did before the work store existed.
- R-WORK-STORE-3 (MUST): `run work status` reports the active authority mode and the reason for it, in human words first, with exact detail in machine output.
- R-WORK-STORE-4 (MUST): the work store holds work records only. Designs, plans, PRDs, guides, and history stay repository documents.
- R-WORK-STORE-5 (MUST): each work record keeps links to its governing repository documents, including its design, plan, PRD sections, and evidence file. Repository documents keep their links to work coordinates. Sync preserves links in both directions.
- R-WORK-STORE-6 (MUST): a project without the CLI can still use the work rules through the agent form in `make-docs://system/reference/work-store.md`. In that mode, `docs/work/` is the authority.

### Repo copy

- R-WORK-STORE-7 (MUST): the repo copy follows the resource projection pattern in [PRD 06](06-template-contracts-and-generated-assets.md#resource-projection-ownership). The `work.projection` setting in project config holds the desired setting. Its default is `on`. The Store holds the last applied digest of each copied file.
- R-WORK-STORE-8 (MUST): the repo copy uses the current `docs/work/` format, file names, and templates. A teammate without a Store, and an older Make Docs version, can read and edit the same files.
- R-WORK-STORE-9 (MUST): Make Docs removes a repo copy only when its bytes still match the last applied digest. A changed copy is kept and reported.
- R-WORK-STORE-10 (MUST): with `work.projection: off`, the store is the only record of that work in the checkout. `run work status` says so plainly. `run work export` writes the files on request.

### Two-way sync

- R-WORK-SYNC-1 (MUST): sync compares the current file bytes, the last applied digest, and the store record revision for each work file.
- R-WORK-SYNC-2 (MUST): a changed file with an unchanged store record is imported into the store. This covers hand edits and edits that arrive through git.
- R-WORK-SYNC-3 (MUST): a changed store record with an unchanged file is written to the file when the repo copy is on.
- R-WORK-SYNC-4 (MUST): when both the file and the store record changed, sync stops for that file. It reports both sides, the affected units, and one settle command for each choice. Other files continue.
- R-WORK-SYNC-5 (MUST): a sync conflict blocks only the units in the conflicted file. Those units are not ready until the conflict is settled.
- R-WORK-SYNC-6 (MUST): a file that the parser cannot read stays untouched. Sync reports its path and the first failing line. The store never overwrites it.
- R-WORK-SYNC-7 (MUST): the parser and writer round-trip the current work format byte for byte. Writing a file that the store did not change produces identical bytes.
- R-WORK-SYNC-8 (MUST): sync runs at the start of each work operation and work MCP tool. A person can also run `run work sync`. Each result includes the sync outcome.

### First import

- R-WORK-SYNC-9 (MUST): the first work operation on a checkout bound to a usable Store imports every existing backlog under `docs/work/` and `.make-docs/archive/work/`. Import writes no project file.
- R-WORK-SYNC-10 (MUST): import reports each imported record, each dependency bullet resolved to a unit, and each bullet it could not resolve. An unresolved bullet stays as text on its unit and keeps that unit out of the ready list until it is resolved.

### Work identity and units

- R-WORK-QUEUE-1 (MUST): each unit has a stable store ID and its coordinate. The coordinate is the human name. The store ID survives renumbering. Dependencies point to store IDs.
- R-WORK-QUEUE-2 (MUST): a wave, revision, phase, stage, task, or quick item can be a claimable unit.
- R-WORK-QUEUE-3 (MUST): a quick item is a task-level unit with no design, plan, or PRD. It belongs to the project and may link to the request that created it.

### Ready, claim, report, and close

- R-WORK-QUEUE-4 (MUST): a unit is ready when its dependencies are closed, it has no live claim, it has no open blocker, it has no unsettled sync conflict, and its parent is open.
- R-WORK-QUEUE-5 (MUST): `run work next` lists ready units in dependency order, then coordinate order. It also lists each open unit that is not ready, with the reason it waits.
- R-WORK-QUEUE-6 (MUST): a claim names the unit, the claimant, and a time limit. A unit has at most one live claim. The Store schema enforces this.
- R-WORK-QUEUE-7 (MUST): the claimant renews its claim at each check. An expired claim lets another claimant take the unit only after the new claimant confirms that it checked the previous claimant's task handle.
- R-WORK-QUEUE-8 (MUST): `run work report` records a status change, a short progress note, or an evidence link. A report from a caller that no longer holds the claim is refused.
- R-WORK-QUEUE-9 (MUST): `run work close` records the outcome `done`, `cancelled`, or `superseded` and releases the claim. Closing every task in a phase does not close the phase. Phase closeout keeps its existing rules.
- R-WORK-QUEUE-10 (MUST): `run work release` releases a claim without closing the unit.
- R-WORK-QUEUE-11 (MUST): the readiness, claim, report, and close rules exist as code in the CLI and as agent instructions in `make-docs://system/reference/work-store.md`. Both forms give the same answer on shared fixtures. A change to one form requires a review of the other.

### Tracker connections

- R-WORK-TRACKER-1 (MUST): a tracker connection declares which of the operations next, claim, report, and close it supports, and maps Make Docs unit, status, dependency, claim, and link fields to the tracker's fields.
- R-WORK-TRACKER-2 (MUST): the field map lives in `work.tracker` in project config and holds no secrets.
- R-WORK-TRACKER-3 (MUST): the local store is the only current connection. A connection for another tracker needs its own accepted authority and must keep this interface.

## Contracts and Data

### Operations

| Operation | CLI path | MCP tool | Effect |
| --- | --- | --- | --- |
| `work.queue.status` | `make-docs run work status` | `work_status` | Reads the authority mode, the sync state, and conflicts. |
| `work.queue.sync` | `make-docs run work sync` | `work_sync` | Runs two-way sync. Reports imports, writes, and conflicts. |
| `work.queue.next` | `make-docs run work next` | `work_next` | Lists ready units and the reasons other units wait. |
| `work.queue.claim` | `make-docs run work claim` | `work_claim` | Claims a unit with a time limit, or renews a claim. |
| `work.queue.release` | `make-docs run work release` | `work_release` | Releases a claim without closing the unit. |
| `work.queue.report` | `make-docs run work report` | `work_report` | Records status, a short note, or an evidence link. |
| `work.queue.close` | `make-docs run work close` | `work_close` | Closes a unit and releases its claim. |
| `work.queue.export` | `make-docs run work export` | `work_export` | Writes repo copies on request. |

- R-WORK-QUEUE-12 (MUST): these operations use the shared operation registry, so CLI and MCP results come from one core. The MCP tools belong to the `backlog` and `workflow` profiles under [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md).
- R-WORK-QUEUE-13 (MUST): every write needs the existing write permission and an `expectedVersion` check. Store-unavailable results use the existing typed outcomes.

### Records

The work store records units, dependencies, links, claims, the sync ledger, and conflicts. [PRD 38](38-global-store-and-project-state.md) owns their fields, classes, and migration. When the repo copy is on, work records can be rebuilt from the repository. When it is off, they cannot, so Store backup and export apply to them.

## Integrations

- [PRD 51](51-backlog-review-and-reporting.md): `backlog_snapshot` reads the work store when the store is the authority and returns the same schema with resolved readiness facts.
- [PRD 53](53-factory-setup-and-orchestration.md): the factory uses next, claim, report, and close as its work queue.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md): phase closeout and lifecycle runs keep their existing rules.
- Human outcomes for this capability follow the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md). `run work next`, `run work status`, and the conflict report put the human meaning first and keep exact detail available.

## Rebuild Notes

- The byte-for-byte round trip is the hardest constraint. Test it on real backlogs, not only on templates.
- Do not let a parse failure turn into a write. A file the parser cannot read stays as it is.
- Claims are a safety guard, not a lock that lasts forever. An expired claim must not let a second agent send work that the first agent already sent.
- The no-Store path must stay identical to today's behavior. It is the default for teammates without a Store.

## Source Anchors

- [Work store design](../designs/2026-11-21-work-store.md)
- [W29 R0 plan](../plans/2026-11-21-w29-r0-work-store/00-overview.md)
- `packages/cli/src/store/database.ts`
- `packages/cli/src/operations/work/backlog/snapshot.ts`
