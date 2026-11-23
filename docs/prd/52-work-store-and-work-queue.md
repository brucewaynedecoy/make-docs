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
- a tracker connection contract, with the local store as the only current connection;
- the `work` operations and their MCP tools; and
- the `make-docs://project/<project>/` resource URIs that print a project's quick items and backlog.

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
- R-WORK-STORE-3 (MUST): `work status` reports the active authority mode and the reason for it, in human words first, with exact detail in machine output.
- R-WORK-STORE-4 (MUST): the work store holds work records only. Designs, plans, PRDs, guides, and history stay repository documents.
- R-WORK-STORE-5 (MUST): each work record keeps links to its governing repository documents, including its design, plan, PRD sections, and evidence file. Repository documents keep their links to work coordinates. Sync preserves links in both directions.
- R-WORK-STORE-6 (MUST): a project without the CLI can still use the work rules through the agent form in `make-docs://system/reference/work-store.md`. In that mode, `docs/work/` is the authority.
- R-WORK-STORE-11 (MUST): work units and claims belong to the project and are shared by every checkout of it. The sync ledger and sync conflicts belong to one checkout, so two worktrees of one project never read each other's writes as edits.
- R-WORK-STORE-12 (MUST): the work store tables arrive in Store schema v8 under [PRD 38](38-global-store-and-project-state.md) R-DB-7. Each table has the Store write guard triggers of PRD 38 R-WRITE-GUARD-1 and a Store table catalog entry under PRD 38 R-MAINT-1.

### Repo copy

- R-WORK-STORE-7 (MUST): the repo copy follows the resource projection pattern in [PRD 06](06-template-contracts-and-generated-assets.md#resource-projection-ownership). The `work.projection` setting in project config holds the desired setting. Its default is `on`. The Store holds the last applied digest of each copied file.
- R-WORK-STORE-8 (MUST): the repo copy uses the current `docs/work/` format, file names, and templates. A teammate without a Store, and an older Make Docs version, can read and edit the same files.
- R-WORK-STORE-9 (MUST): Make Docs removes a repo copy only when its bytes still match the last applied digest. A changed copy is kept and reported.
- R-WORK-STORE-10 (MUST): with `work.projection: off`, the store is the only record of that work in the checkout. `work status` says so plainly. `work export` writes the files on request.

### Two-way sync

- R-WORK-SYNC-1 (MUST): sync compares the current file bytes, the last applied digest, and the store record revision for each work file.
- R-WORK-SYNC-2 (MUST): a changed file with an unchanged store record is imported into the store. This covers hand edits and edits that arrive through git.
- R-WORK-SYNC-3 (MUST): a changed store record with an unchanged file is written to the file when the repo copy is on.
- R-WORK-SYNC-4 (MUST): when both the file and the store record changed, sync stops for that file. It reports both sides, the affected units, and one settle command for each choice. Other files continue.
- R-WORK-SYNC-5 (MUST): a sync conflict blocks only the units in the conflicted file. Those units are not ready until the conflict is settled.
- R-WORK-SYNC-6 (MUST): a file that the parser cannot read stays untouched. Sync reports its path and the first failing line. The store never overwrites it.
- R-WORK-SYNC-7 (MUST): the parser and writer round-trip the current work format byte for byte. Writing a file that the store did not change produces identical bytes.
- R-WORK-SYNC-8 (MUST): sync runs at the start of each work operation and work MCP tool. A person can also run `work sync`. Each result includes the sync outcome.
- R-WORK-SYNC-11 (MUST): when a person deletes a repo copy that the store still holds, sync stops for that file and reports a conflict. Make Docs neither recreates the file nor drops its work silently. The settle choices are to restore the file from the store or to accept the deletion. An accepted deletion closes the file's units as superseded and marks their repo copy as removed. Every checkout then removes its unchanged copy and stops asking. A copy that a person changed is kept and reported.
- R-WORK-SYNC-12 (MUST): a new work file with no store record is imported. A new store record with no file is written when the repo copy is on. When the store no longer has the work of a file that still exists, sync stops for that file, and Make Docs never deletes the file on its own. A state that normal sync cannot produce is reported as a conflict, so a person decides. Each conflict kind has its own two settle choices.
- R-WORK-SYNC-13 (MUST): a dependency bullet that names coordinates becomes one dependency for each named unit. "P" or "Phase" with a number resolves inside the bullet's revision, and a bare stage or task resolves inside the bullet's phase. Ranges with "to", "through", or a dash, and lists joined by commas or "and", name each unit. Status words such as "complete", "accepted", or "unlocked" do not change the match. A coordinate that matches no unit is an unresolved dependency. "None", or "parallel with" a unit, means no dependency. A bullet that is only a file path or code span is a reference. A bullet that names no coordinate, or that names coordinates with a further condition, such as an owner approval, is a gate, and it holds its unit until the condition is recorded as met. A `### Dependencies` section belongs to the stage whose heading it sits under, or to the phase when it sits before the first stage.

### First import

- R-WORK-SYNC-9 (MUST): the first work operation on a checkout bound to a usable Store imports every existing backlog under `docs/work/` and `.make-docs/archive/work/`. Import writes no project file.
- R-WORK-SYNC-10 (MUST): import reports each imported record, each dependency bullet resolved to a unit, and each bullet it could not resolve. An unresolved bullet stays as text on its unit and keeps that unit out of the ready list until it is resolved.

### Work identity and units

- R-WORK-QUEUE-1 (MUST): each unit has a stable store ID and its coordinate. The coordinate is the human name. The store ID survives renumbering. Dependencies point to store IDs.
- R-WORK-QUEUE-2 (MUST): a wave, revision, phase, stage, task, or quick item can be a claimable unit.
- R-WORK-QUEUE-3 (MUST): a quick item is a task-level unit with no design, plan, or PRD. It belongs to the project and may link to the request that created it. A quick item lives only in the work store. It has no repo copy, and sync never reads or writes a file for it. Without a usable Store, Make Docs cannot add a quick item and returns the existing typed Store outcome.
- R-WORK-QUEUE-18 (MUST): `work add` adds a quick item with a title, an optional body, and an optional link to the request that created it. The store gives it the next quick item number of the project: a plain number such as `7`. The `tasks` URI family and the word "task" keep it apart from backlog coordinates, so human-facing text writes it as `task 7`. The store keeps every quick item while the project is bound, closed ones too, so a number is never used twice. Other unit kinds enter the store only from `docs/work/` files through sync. `work add` needs the existing write permission.

### Ready, claim, report, and close

- R-WORK-QUEUE-4 (MUST): a unit is ready when its status is open or in progress; every dependency closed as done or superseded; every gate is met; it has no unresolved dependency, no open blocker, no claim (live or expired), and no unsettled sync conflict; and every ancestor is open and would be ready apart from claims. A dependency closed as cancelled keeps the unit waiting until a person decides. An expired claim keeps the unit waiting until someone takes it over or releases it.
- R-WORK-QUEUE-5 (MUST): `work next` lists ready units in dependency order, then coordinate order. Coordinates compare part by part, with numbers compared as numbers, so P10 comes after P2. Quick items come after all coordinates, by number. It also lists each open unit that is not ready, with every reason it waits and one next action for each reason.
- R-WORK-QUEUE-6 (MUST): a claim names the unit, the claimant, and a time limit. A unit has at most one live claim. The Store schema enforces this.
- R-WORK-QUEUE-7 (MUST): the claimant renews its claim at each check and checks at least every 10 minutes. One claim lasts 30 minutes by default and between 20 minutes and 24 hours from its latest renewal. Renewal has no total limit. An expired claim lets another claimant take the unit only after the new claimant checks the previous claimant's task handle. The new claim records what the check saw: stopped, finished, or not found. A takeover is refused while the handle shows the work still running. A takeover after a finished handle must review that result before new work starts. When the previous claim has no task handle, a takeover is refused, and a person releases the claim instead.
- R-WORK-QUEUE-8 (MUST): `work report` records a status change, a short progress note, an evidence link, cleared blockers, or met gates. A unit with a live claim changes only through its holder. A caller without a claim can change a unit that has no live claim. Clearing the last blocker of a blocked unit reopens it.
- R-WORK-QUEUE-9 (MUST): `work close` records the outcome `done`, `cancelled`, or `superseded` and releases the claim. It follows the same claim rule as a report. Closing every task in a phase does not close the phase. Phase closeout keeps its existing rules.
- R-WORK-QUEUE-10 (MUST): `work release` releases a claim without closing the unit. The holder releases a live claim. Any caller can release an expired claim.
- R-WORK-QUEUE-11 (MUST): the readiness, claim, report, and close rules exist as code in the CLI and as agent instructions in `make-docs://system/reference/work-store.md`. Both forms give the same answer on shared fixtures. A change to one form requires a review of the other.
- R-WORK-QUEUE-14 (MUST): a unit whose parent or other ancestor has a live claim is ready only for that claimant. A claim is refused when an ancestor or a descendant of the unit has a live claim held by another claimant.
- R-WORK-QUEUE-15 (MUST): readiness and claims look at the whole parent chain. A task may sit under a stage or directly under a phase. A task is not ready while its stage waits for another stage.
- R-WORK-QUEUE-16 (MUST): a unit with draft status, or with a recorded status that Make Docs does not know, is not ready. Make Docs keeps the recorded text and names the reason.
- R-WORK-QUEUE-17 (MUST): a claim on a unit that is not ready is refused. The one exception is a takeover of an expired claim under R-WORK-QUEUE-7, when the unit waits only on that claim. Claim and release requests carry the unit's expected version, like every other work write.

### Tracker connections

- R-WORK-TRACKER-1 (MUST): a tracker connection declares which of the operations next, claim, report, and close it supports, and maps Make Docs unit, status, dependency, claim, and link fields to the tracker's fields.
- R-WORK-TRACKER-2 (MUST): the field map lives in `work.tracker` in project config and holds no secrets.
- R-WORK-TRACKER-3 (MUST): the local store is the only current connection. A connection for another tracker needs its own accepted authority and must keep this interface.

### Project resource URIs

- R-WORK-URI-1 (MUST): `make-docs://project/<project>/` is the project-resource URI family. `<project>` is the project name under [PRD 38](38-global-store-and-project-state.md) R-ID-8 or the project ID, resolved through `project_register` under PRD 38 R-REGISTER-2. Every project URI names its project in full. Nothing in a project URI resolves from the current folder, a `--target` path, or a checkout. The current families are `tasks` and `backlog`.
- R-WORK-URI-2 (MUST): `make-docs://project/<project>/tasks/` lists the project's quick items in number order, with each number, title, status, and close outcome. `make-docs://project/<project>/tasks/<n>` shows one quick item with its title, body, status, close outcome, live claim, and links.
- R-WORK-URI-3 (MUST): `make-docs://project/<project>/backlog/` lists the project's waves. Each further path part names one coordinate part: `backlog/W29/` lists the revisions of W29, `backlog/W29/R0/` lists its phases, and `backlog/W29/R0/P1/` shows the phase with its stages and tasks. `backlog/W29/R0/P1/S2` shows a stage, and `backlog/W29/R0/P1/T3` shows a task, because a task coordinate does not name its stage. Each read shows the unit's title, status, close outcome, readiness and wait reasons, live claim, links, and its child list.
- R-WORK-URI-4 (MUST): the resolver accepts any letter case in the project name and the coordinate parts, and a trailing slash or none. The result names the canonical URI: a lower-case project name, upper-case coordinate letters, and a trailing slash on a list. The resolver refuses a number with a leading zero, a quick item number `0`, a query, a fragment, and any part after a task, a stage, or a quick item.
- R-WORK-URI-5 (MUST): `make-docs resource read`, the `resource_read` MCP tool, and native MCP resource reads accept project URIs through the shared resolver. A project URI read is read-only and opens a read-only Store session. A system-resource URI read never opens a Store session. A project URI never has a local projection.
- R-WORK-URI-6 (MUST): without a usable Store, a project URI read returns the existing typed Store outcome. Its next action tells the reader to read the `docs/work/` files of the project directly. A project name or ID that the Store does not know, and a coordinate or quick number that the project does not have, return `resource-not-found` with the URI and the part that did not match.
- R-WORK-URI-7 (MUST): the text of a `tasks` read and the file that `work export --quick <path>` writes come from one renderer, so a person, an agent, and a file see the same record. Export writes quick items only to the path that the caller names, never to a default repository path.

## Contracts and Data

### Operations

| Operation | CLI path | MCP tool | Effect |
| --- | --- | --- | --- |
| `work.queue.status` | `make-docs work status` | `work_status` | Reads the authority mode, the sync state, and conflicts. |
| `work.queue.sync` | `make-docs work sync` | `work_sync` | Runs two-way sync. Reports imports, writes, and conflicts. |
| `work.queue.next` | `make-docs work next` | `work_next` | Lists ready units and the reasons other units wait. |
| `work.queue.claim` | `make-docs work claim` | `work_claim` | Claims a unit with a time limit, or renews a claim. |
| `work.queue.release` | `make-docs work release` | `work_release` | Releases a claim without closing the unit. |
| `work.queue.report` | `make-docs work report` | `work_report` | Records status, a short note, or an evidence link. |
| `work.queue.close` | `make-docs work close` | `work_close` | Closes a unit and releases its claim. |
| `work.queue.export` | `make-docs work export` | `work_export` | Writes repo copies on request, and quick items to a named path. |
| `work.queue.add` | `make-docs work add` | `work_add` | Adds a quick item with the next quick item number. |

- R-WORK-QUEUE-12 (MUST): these operations use the shared operation registry, so CLI and MCP results come from one core. The MCP tools belong to the `backlog` and `workflow` profiles under [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md).
- R-WORK-QUEUE-13 (MUST): every write needs the existing write permission and an `expectedVersion` check. Store-unavailable results use the existing typed outcomes.

### Records

The work store records units, dependencies, links, claims, the sync ledger, and conflicts. [PRD 38](38-global-store-and-project-state.md) owns their fields, classes, and migration. When the repo copy is on, work records can be rebuilt from the repository. When it is off, they cannot, so Store backup and export apply to them.

## Integrations

- [PRD 51](51-backlog-review-and-reporting.md): `backlog_snapshot` reads the work store when the store is the authority and returns the same schema with resolved readiness facts.
- [PRD 53](53-factory-setup-and-orchestration.md): the factory uses next, claim, report, and close as its work queue.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md): phase closeout and lifecycle runs keep their existing rules.
- Human outcomes for this capability follow the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md). `work next`, `work status`, and the conflict report put the human meaning first and keep exact detail available.

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
