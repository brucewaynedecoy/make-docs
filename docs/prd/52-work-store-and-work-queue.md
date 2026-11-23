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
- R-WORK-STORE-2 (MUST): when the Store is absent, unavailable, unsafe, or denied, `docs/work/` is the authority. The work queue commands that need the Store (`work sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add`) return the existing typed Store outcome with its code. They do not read or rank the files themselves. The read-only `work next`, like a project URI read and `backlog snapshot --work-store`, also names the `docs/work/` files and `make-docs backlog snapshot`, which reads them without the Store, in its next step, and it treats a checkout that is not bound to a usable Store the same way. `work status` reports the file authority and its reason. The commands that read the files, such as `backlog snapshot`, read them as they did before the work store existed.
- R-WORK-STORE-3 (MUST): `work status` reports the active authority mode and the reason for it, in human words first, with exact detail in machine output.
- R-WORK-STORE-4 (MUST): the work store holds work records only. Designs, plans, PRDs, guides, and history stay repository documents.
- R-WORK-STORE-5 (MUST): each work record keeps links to its governing repository documents, including its design, plan, PRD sections, and evidence file. Repository documents keep their links to work coordinates. Sync preserves links in both directions.
- R-WORK-STORE-6 (MUST): a project without the CLI can still use the work rules through the agent form in `make-docs://system/reference/work-store.md`. In that mode, `docs/work/` is the authority.
- R-WORK-STORE-11 (MUST): work units and claims belong to the project and are shared by every checkout of it. The sync ledger and sync conflicts belong to one checkout, so two worktrees of one project never read each other's writes as edits.
- R-WORK-STORE-12 (MUST): the work store tables arrive in Store schema v8 under [PRD 38](38-global-store-and-project-state.md) R-DB-7. Each table has the Store write guard triggers of PRD 38 R-WRITE-GUARD-1 and a Store table catalog entry under PRD 38 R-MAINT-1.
- R-WORK-STORE-13 (MUST): a scoped cleanup removes one project's work rows (units, dependencies, links, and claims) only after a project prune removed the project from `project_register` and no checkout of it is bound, only with the `workDigest` of a complete `work export` that still matches every work row, so every unit, also one whose repo copy a person removed, was written by that export, and never while a unit has a live claim. Otherwise it refuses, names why, and changes nothing. It never touches another project's rows. A prune without the digest keeps the work rows.

### Repo copy

- R-WORK-STORE-7 (MUST): the repo copy follows the resource projection pattern in [PRD 06](06-template-contracts-and-generated-assets.md#resource-projection-ownership). The `work.projection` setting in project config holds the desired setting. Its default is `on`. The Store holds the last applied digest of each copied file.
- R-WORK-STORE-8 (MUST): the repo copy uses the current `docs/work/` format, file names, and templates. A teammate without a Store, and an older Make Docs version, can read and edit the same files.
- R-WORK-STORE-9 (MUST): Make Docs removes a repo copy only when its bytes still match the last applied digest. A changed copy is kept and reported.
- R-WORK-STORE-10 (MUST): with `work.projection: off`, the store is the only record of that work in the checkout. `work status` says so plainly. `work export` writes the files on request to a new or empty folder that the caller names. It never writes under `docs/work/`, `.make-docs/`, or a held path, also through a symbolic link, and it never replaces a file. A copy that changed is imported, kept in that sync, and reported. Its last applied digest then matches it, so a later sync removes it, and the report says so. A copy that a person deletes while copies are off loses its ledger entry, so when copies go on again, sync writes the file with no conflict. An export that writes all of the project's work, every backlog file that the store holds, also a file whose repo copy a person removed while the store keeps its closed units, and, when the project has quick items, the quick item list, says so. It names each file whose repo copy was removed and returns the digest of the project's work rows (`workDigest`). Any other export returns no digest.

### Two-way sync

- R-WORK-SYNC-1 (MUST): sync compares the current file bytes, the last applied digest, and the store record revision for each work file.
- R-WORK-SYNC-2 (MUST): a changed file with an unchanged store record is imported into the store. This covers hand edits and edits that arrive through git.
- R-WORK-SYNC-3 (MUST): a changed store record with an unchanged file is written to the file when the repo copy is on.
- R-WORK-SYNC-4 (MUST): when both the file and the store record changed, sync stops for that file. It reports both sides, the affected units, and one settle command for each choice. Other files continue.
- R-WORK-SYNC-5 (MUST): a sync conflict blocks only the units in the conflicted file. Those units are not ready until the conflict is settled.
- R-WORK-SYNC-6 (MUST): a file that the parser cannot read stays untouched. Sync reports its path and the first failing line. The store never overwrites it.
- R-WORK-SYNC-7 (MUST): the parser and writer round-trip the current work format byte for byte. Writing a file that the store did not change produces identical bytes.
- R-WORK-SYNC-8 (MUST): sync runs at the start of each work operation and work MCP tool. A person can also run `work sync`. Each result includes the sync outcome. A read-only operation, `work status` and `work next`, runs a read-only sync check instead: it changes nothing and names each file that the next sync would import, write, or remove, and each file that waits for a person.
- R-WORK-SYNC-11 (MUST): when a person deletes a repo copy that the store still holds, sync stops for that file and reports a conflict. Make Docs neither recreates the file nor drops its work silently. The settle choices are to restore the file from the store or to accept the deletion. An accepted deletion closes the file's units as superseded and marks their repo copy as removed. Every checkout then removes its unchanged copy and stops asking. A copy that a person changed is kept and reported.
- R-WORK-SYNC-12 (MUST): a new work file with no store record is imported. A new store record with no file is written when the repo copy is on. When the store no longer has the work of a file that still exists, sync stops for that file, and Make Docs never deletes the file on its own. A state that normal sync cannot produce is reported as a conflict, so a person decides. Each conflict kind has its own two choices: two settle choices, or, for a `claimed` conflict (R-WORK-SYNC-16), the release of each claimed unit and `--keep-store`.
- R-WORK-SYNC-13 (MUST): a dependency bullet that names coordinates becomes one dependency for each named unit. "P" or "Phase" with a number resolves inside the bullet's revision, and a bare stage or task resolves inside the bullet's phase. Ranges with "to", "through", or a dash, and lists joined by commas or "and", name each unit. Status words such as "complete", "accepted", or "unlocked" do not change the match. A coordinate that matches no unit is an unresolved dependency. "None", or "parallel with" a unit, means no dependency. A bullet that is only a file path or code span is a reference. A bullet that names no coordinate, or that names coordinates with a further condition, such as an owner approval, is a gate, and it holds its unit until the condition is recorded as met. A bullet that names one unit and adds only that unit's own title, such as "Phase 1 trace and scope." for a phase titled "Phase 1: Trace and Scope", is a dependency: the title names the unit and adds no condition. A `### Dependencies` section belongs to the stage whose heading it sits under, or to the phase when it sits before the first stage.
- R-WORK-SYNC-14 (MUST): when a state that the sync table reports as a conflict meets a file whose bytes equal what the store renders for it, nothing can be lost. Sync records the file as synced and reports no conflict. This also settles a recorded conflict once both sides hold the same work.
- R-WORK-SYNC-15 (MUST): a work file that disappears from one backlog folder and appears in another with the same coordinate in the same sync, while the store has not changed its work, is a move, such as an archive move. Its units keep their store IDs, sync reports the move, and no deleted-file conflict is raised.
- R-WORK-SYNC-17 (MUST): the `work.syncHold` list in project config names work folders or files under `docs/work/` or `.make-docs/archive/work/` that a person holds. Sync reads a held path and never writes or removes it, and its result reports each held path that it would have written or removed. A settle that would write or remove a held path, or accept its deletion, is refused.
- R-WORK-SYNC-18 (MUST): `work sync --settle <path>` with one choice settles that file's conflict: `--keep-file` imports the file and replaces the store's version, `--keep-store` rewrites the file from the store, `--restore` writes the file back from the store, `--accept-deletion` closes the file's open units as superseded and marks the copy removed, `--reimport` imports the file into the store again, and `--remove-file` removes an unchanged file. A choice that the conflict kind does not offer, a stale expected revision, or a missing or changed file is refused with nothing changed. A settle never acts for a live claim holder: `--accept-deletion` is refused while a unit of the file has a live claim, and a kept file that closes a claimed unit stops again as a conflict.
- R-WORK-SYNC-16 (MUST): a unit that leaves its work file is deleted from the store only when it has no live claim and the store holds nothing about it that the file cannot show, such as a status other than its line shows (for example in progress), a met gate, a progress note, or links from other documents. Each sync result names every deleted unit. Otherwise sync stops for that file as a conflict that names each unit and why. A file edit never closes or removes a unit that has a claim, live or expired: sync stops that file as a `claimed` conflict that names the unit, its claimant, and the claim's end time, and never shows the claim ID. An expired claim ends only through a takeover, or a release or close after the handle check, and sync never runs that check. A `claimed` conflict has two kinds of choice: `make-docs work release <unit>` for each claimed unit (with `--claim-id` for its holder, or `--handle` after the check of an expired claim's task), after which the next sync imports the file; or `--keep-store`, which rewrites the file from the store. It never offers `--keep-file`. When nobody acts on an expired claim, `setup store check` lists it after 7 days (PRD 38 R-MAINT-4). Sync never changes the units of a file that waits for a person.

### First import

- R-WORK-SYNC-9 (MUST): the first work operation on a checkout bound to a usable Store imports every existing backlog under `docs/work/` and `.make-docs/archive/work/`. Import writes no project file. The first sync of a checkout only imports: it writes and removes no project file, even when the store holds work that the checkout's files do not show. It reports each file that the next sync will write or remove. The Store records when a checkout's first sync is done, so every later sync of that checkout writes and removes files under the sync table, also for a checkout with no work file at all. Every later sync result names each file that it writes or removes.
- R-WORK-SYNC-10 (MUST): import reports each imported record, each dependency bullet resolved to a unit, and each bullet it could not resolve. An unresolved bullet stays as text on its unit and keeps that unit out of the ready list until it is resolved.

### Work identity and units

- R-WORK-QUEUE-1 (MUST): each unit has a stable store ID and its coordinate. The coordinate is the human name. The store ID survives renumbering. Dependencies point to store IDs.
- R-WORK-QUEUE-2 (MUST): a wave, revision, phase, stage, task, or quick item can be a claimable unit.
- R-WORK-QUEUE-3 (MUST): a quick item is a task-level unit with no design, plan, or PRD. It belongs to the project and may link to the request that created it. A quick item lives only in the work store. It has no repo copy, and sync never reads or writes a file for it. Without a usable Store, Make Docs cannot add a quick item and returns the existing typed Store outcome.
- R-WORK-QUEUE-18 (MUST): `work add` adds a quick item with a title, an optional body, and an optional link to the request that created it. The store gives it the next quick item number of the project: a plain number such as `7`. The `tasks` URI family and the word "task" keep it apart from backlog coordinates, so human-facing text writes it as `task 7`. The store keeps every quick item while the project is bound, closed ones too, so a number is never used twice. Other unit kinds enter the store only from `docs/work/` files through sync. The `work add` result names the new quick item's `make-docs://project/<project>/tasks/<n>` URI, with the project name, or the project ID when the project has no name. `work add` needs the existing write permission.

### Ready, claim, report, and close

- R-WORK-QUEUE-4 (MUST): a unit is ready when its status is open or in progress; every dependency closed as done or superseded; every gate is met; it has no unresolved dependency, no open blocker, no claim (live or expired), and no unsettled sync conflict; and every ancestor is open and would be ready apart from claims. A dependency closed as cancelled keeps the unit waiting until a person decides. An expired claim keeps the unit waiting until someone takes it over or releases it. A wave is ready when all its revisions are closed, and each open revision is named as a reason it waits. A revision never waits for its own wave.
- R-WORK-QUEUE-5 (MUST): `work next` lists ready units in dependency order, then coordinate order. Coordinates compare part by part, with numbers compared as numbers, so P10 comes after P2. Quick items come after all coordinates, by number. It also lists each open unit that is not ready, with every reason it waits and one next action for each reason. Units of archived backlogs under `.make-docs/archive/work/` never show in `work next`, and they still count as dependencies.
- R-WORK-QUEUE-6 (MUST): a claim names the unit, the claimant, and a time limit. A unit has at most one live claim. The Store schema enforces this.
- R-WORK-QUEUE-7 (MUST): the claimant renews its claim at each check and checks at least every 10 minutes. One claim lasts 30 minutes by default and between 20 minutes and 24 hours from its latest renewal. A renewal sends the claim ID. Renewal has no total limit. An expired claim lets another claimant take the unit only after the new claimant checks the previous claimant's task handle. The takeover names the previous claimant, not the claim ID. The new claim records what the check saw: stopped, finished, or not found. A takeover is refused while the handle shows the work still running. A takeover after a finished handle must review that result before new work starts. When the previous claim has no task handle, a takeover is refused, and a person releases the claim instead.
- R-WORK-QUEUE-8 (MUST): `work report` records a status change, a short progress note, an evidence link, cleared blockers, or met gates. A unit with a live claim changes only through its holder. A caller without a claim can change a unit that has no live claim. A close by a caller without the claim of a unit whose claim expired needs the handle check of R-WORK-QUEUE-7: the caller sends what the check of the old task handle saw, a running task is refused, and a claim with no task handle needs `no-handle`. Clearing the last blocker of a blocked unit reopens it. A cleared or changed blocker, a changed gate text, a met gate, a title other than a task's, and a status that the file cannot show stay in the store only: the writer writes no file text for them, an import keeps them while the file still shows what the last applied text showed, and `work report` names each one. A progress note is one line of plain text of at most 256 characters. The unit keeps its latest note and its time, and a new note replaces the last. Make Docs checks a report's inputs before its sync, so a refused input changes nothing.
- R-WORK-QUEUE-9 (MUST): `work close` records the outcome `done`, `cancelled`, or `superseded` and releases the claim. It follows the same claim rule as a report. Closing every task in a phase does not close the phase. Phase closeout keeps its existing rules.
- R-WORK-QUEUE-10 (MUST): `work release` releases a claim without closing the unit. The holder releases a live claim with its claim ID. Any caller can release an expired claim without its claim ID after the handle check of R-WORK-QUEUE-7: the caller sends what the check of the old task handle saw, stopped, finished, or not found; a running task is refused; and a claim with no task handle is released with `no-handle`. So a release and a new claim never skip the check that a takeover runs.
- R-WORK-QUEUE-19 (MUST): a claim ID works like a private key, shown only to its holder. Make Docs shows it once, in the result of a new claim (a plain claim or a takeover). A renewal, a refusal, `work next`, `work status`, a sync conflict, and a Store check item never show it, also when the caller names the holder's claimant. A renewal, a report, a close, and a release of a live claim must send the claim ID; naming the claimant alone renews nothing. Every caller sees the claimant, the task handle, and the claim times.
- R-WORK-QUEUE-20 (MUST): a status line is the authority when a work file has one. For older backlogs, a phase whose file has no status line, whose store status is open, whose tasks are all checked, and whose `Tasks` sections have no unchecked checkbox at any indent counts as done for readiness: it is neither ready nor waiting, it meets a dependency, and a claim on it is refused. Every result that uses this rule says so, as `doneBy: "all-tasks-checked"` in machine output and in words. A phase with no task, or with an unchecked task or checkbox, keeps its status. The rule changes no store record or file.
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
- R-WORK-URI-3 (MUST): `make-docs://project/<project>/backlog/` lists the project's waves. Each further path part names one coordinate part: `backlog/W29/` lists the revisions of W29, `backlog/W29/R0/` lists its phases, and `backlog/W29/R0/P1/` shows the phase with its stages and tasks. `backlog/W29/R0/P1/S2` shows a stage, and `backlog/W29/R0/P1/T3` shows a task, because a task coordinate does not name its stage. Each read shows the unit's title, status, close outcome, readiness and wait reasons, live claim, links, and its child list. Sync conflicts belong to one checkout (R-WORK-STORE-11), and a project URI names no checkout, so readiness in a project URI read leaves them out, and the read says so.
- R-WORK-URI-4 (MUST): the resolver accepts any letter case in the project name and the coordinate parts, and a trailing slash or none. The result names the canonical URI: a lower-case project name, upper-case coordinate letters, and a trailing slash on a list. The resolver refuses a number with a leading zero, a quick item number `0`, a query, a fragment, and any part after a task, a stage, or a quick item.
- R-WORK-URI-5 (MUST): `make-docs resource read`, the `resource_read` MCP tool, and native MCP resource reads accept project URIs through the shared resolver. A project URI read is read-only and opens a read-only Store session. A system-resource URI read never opens a Store session. A project URI never has a local projection.
- R-WORK-URI-6 (MUST): without a usable Store, a project URI read returns the existing typed Store outcome. Its next action tells the reader to read the `docs/work/` files of the project directly. A project name or ID that the Store does not know, and a coordinate or quick number that the project does not have, return `resource-not-found` with the URI and the part that did not match.
- R-WORK-URI-7 (MUST): the text of a `tasks` read and the file that `work export --quick <path>` writes come from one renderer, so a person, an agent, and a file see the same record. Export writes quick items only to a new file at the path that the caller names, never to a default repository path, never under `docs/work/`, `.make-docs/`, or a held path, and never over an existing file.

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

- [PRD 51](51-backlog-review-and-reporting.md): `backlog_snapshot` with `workStore: true` (CLI `--work-store`) reads the work store when the store is the authority and returns the same schema with resolved readiness facts. By default it reads the files.
- [PRD 53](53-factory-setup-and-orchestration.md): the factory uses next, claim, report, and close as its work queue.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md): phase closeout and lifecycle runs keep their existing rules.
- Human outcomes for this capability follow the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md). `work next`, `work status`, and the conflict report put the human meaning first and keep exact detail available.

## Rebuild Notes

- The byte-for-byte round trip is the hardest constraint. Test it on real backlogs, not only on templates.
- Do not let a parse failure turn into a write. A file the parser cannot read stays as it is.
- Claims are a safety guard, not a lock that lasts forever. An expired claim must not let a second agent send work that the first agent already sent.
- The no-Store path must stay identical to today's behavior. It is the default for teammates without a Store.

## Requirement History

### 2026-11-23 — W29 R0 P3

- Affected requirement or section: R-WORK-STORE-10, R-WORK-SYNC-9, R-WORK-SYNC-13, and new R-WORK-SYNC-14, R-WORK-SYNC-15, and R-WORK-SYNC-16.
- Previous contract: first import wrote no project file, but a later first sync of another checkout could write files. Sync did not say what it does when both sides already hold the same bytes, when a backlog moves to the archive, or when a unit leaves its file. With copies off, a changed copy was kept and reported, with no word on what happens next. Any words beyond status words in a dependency bullet made it a gate, also a phase's own title.
- Replacement contract: the first sync of a checkout only imports and reports what the next sync writes or removes, and every result names each file written or removed. Identical sides are recorded with no conflict. A move keeps store IDs. A unit that leaves its file is deleted and named only when it holds no live claim and nothing the file cannot show; otherwise its file stops as a conflict. A file edit never closes a claimed unit. A changed copy with copies off is imported, kept in that sync, and removed by a later sync, and the report says so. A bullet that adds only the named unit's own title is a dependency.
- Rationale: an independent review of W29 R0 P3 found that a typo could silently delete a task in progress, that an import could act for a claim holder, and that a second checkout's first sync wrote a file while saying none changed. The owner approved each rule on 2026-11-23.
- Source: [W29 R0 P3 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p3-parser-import-and-sync)

### 2026-11-23 — W29 R0 P3 re-check

- Affected requirement or section: R-WORK-SYNC-9.
- Previous contract: the first sync of a checkout only imported, and the next sync wrote. Nothing recorded that a first sync was done, so it was read from an empty ledger.
- Replacement contract: the Store records when a checkout's first sync is done, in `work_sync_checkouts` under [PRD 38](38-global-store-and-project-state.md), so every later sync writes and removes files under the sync table, also for a checkout with no work file at all.
- Rationale: a re-check review found that a checkout with no work file, or whose copies were removed with copies off, never left its first sync, so its files were never written and each sync said the next one would write them. The owner chose the record on 2026-11-23.
- Source: [W29 R0 P3 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p3-parser-import-and-sync)

### 2026-11-23 — W29 R0 P4

- Affected requirement or section: R-WORK-STORE-10, R-WORK-SYNC-8, R-WORK-QUEUE-4, R-WORK-QUEUE-5, R-WORK-QUEUE-7, R-WORK-QUEUE-8, R-WORK-QUEUE-10, and new R-WORK-SYNC-17, R-WORK-SYNC-18, and R-WORK-QUEUE-19.
- Previous contract: every work operation ran sync first, also a read-only one. Any caller that named a claim ID could release a claim, and every reader saw claim IDs. A wave unit had no readiness rule, and archived backlogs could show in `work next`. Store edits that the file cannot show were refused by the writer. The hold list was a sync option with no source. A copy deleted by hand with copies off kept its ledger entry and came back as a file-deleted conflict. The settle commands were named, not built.
- Replacement contract: `work status` and `work next` run a read-only sync check. A claim ID shows only to its holder, a takeover names the previous claimant, and any caller releases an expired claim without its ID. A wave is ready when all its revisions are closed, and archived backlogs never show in `work next`. Store-only edits stay in the store and show in `work report`. The hold list is `work.syncHold` in project config. A copy deleted with copies off loses its ledger entry. `work sync --settle` settles one conflict. `work export` writes to a folder the caller names. A report with a progress note is refused until the store has a note field.
- Rationale: the owner decided W29 R0 P4 T13, T14, T16 to T20 on 2026-11-23. A read-only operation cannot write, and the work tables have no note field.
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-work-queue-operations)

### 2026-11-23 — W29 R0 P4 Review Fixes

- Affected requirement or section: R-WORK-QUEUE-7, R-WORK-QUEUE-8, R-WORK-QUEUE-19, R-WORK-STORE-10, R-WORK-SYNC-17, and R-WORK-URI-7.
- Previous contract: R-WORK-QUEUE-19 showed a claim ID to a caller that named the holder's claimant in `work next`, and a same-name claim renewed the claim and returned its ID. A report with a progress note was refused because the store had no note field. Export refused only a target inside the work folders, and it could replace any file.
- Replacement contract: a claim ID shows only in the result of a new claim; every other result hides it, and a renewal must send it. A report keeps the latest one-line note of at most 256 characters and its time. Export writes only to a new or empty folder or a new file, never under `docs/work/`, `.make-docs/`, or a held path, also through a symbolic link. A settle never accepts the deletion of a held path.
- Rationale: an independent review found that any caller could read a claim ID by naming the claimant, against the owner's T13 decision of 2026-11-23 that a claim ID works like a private key shown only to its holder. The owner chose option A of register D-066 on 2026-11-23: a short note field in the unreleased v8 `work_units` table. The review also found that `work export --to .` rewrote a held file and `--quick` could replace the project config.
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-work-queue-operations)

### 2026-11-23 — W29 R0 P4 Owner Decisions on Findings 7 and 9

- Affected requirement or section: R-WORK-QUEUE-8, R-WORK-QUEUE-10, R-WORK-SYNC-16, and new R-WORK-QUEUE-20.
- Previous contract: any caller could release an expired claim, or close a unit whose claim expired, with no handle check, so a release and a new claim, or a close, skipped the check that a takeover runs. A file edit could close a unit whose claim expired. A phase with no status line stayed open after every task was checked, so `work next` listed many old finished phases as ready.
- Replacement contract: a release of an expired claim, and a close of a unit whose claim expired by a caller without the claim, need the R-WORK-QUEUE-7 handle check; a file edit never closes a unit with any claim. A status line decides when present; a phase with no status line and every task checked counts as done for readiness, and results say `doneBy: "all-tasks-checked"`.
- Rationale: the owner decided on 2026-11-23, after the independent review of W29 R0 P4: finding 9 option A (a release of an expired claim also needs the handle check, and so does an expired close), and finding 7 (both rules hold: the status line is the authority, and the all-tasks-checked fallback is for older backlogs, visible in output).
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-work-queue-operations)

### 2026-11-23 — W29 R0 P4 Re-check Fixes

- Affected requirement or section: R-WORK-SYNC-12, R-WORK-SYNC-16, and R-WORK-QUEUE-20.
- Previous contract: a file edit that closed a claimed unit stopped as an `unclear` conflict whose choices were `--keep-file` and `--keep-store`; `--keep-file` stopped the file again, and no choice named the release. A unit with a progress note that left its file was deleted with the note. An unchecked checkbox that was not a task unit, such as an indented one, did not keep a phase with no status line open.
- Replacement contract: such a file stops as a `claimed` conflict whose choices are `work release` of each claimed unit and `--keep-store`, never `--keep-file`. A progress note is store-only data, so a unit with one that leaves its file stops the file. Any unchecked checkbox in a `Tasks` section keeps the fallback from counting the phase as done.
- Rationale: a re-check of W29 R0 P4 found the loop, the lost note, and the missed checkbox. The rules keep the owner decisions T18 and finding 9 of 2026-11-23: sync never acts for a claim holder and never skips the handle check.
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-work-queue-operations)

### 2026-11-23 — W29 R0 P4 Second Pass

- Affected requirement or section: R-WORK-STORE-10, new R-WORK-STORE-13, R-WORK-QUEUE-18, and R-WORK-URI-3.
- Previous contract: `work export` did not say whether it wrote all of a project's work. No requirement said how a pruned project's work rows leave the Store. `work add` named no URI. R-WORK-URI-3 did not say which sync conflicts a project URI read shows.
- Replacement contract: a complete export returns the `workDigest` of the project's work rows. A scoped cleanup removes a pruned project's work rows only with a matching digest and no live claim. `work add` names the quick item's project URI. A project URI read leaves checkout-scoped sync conflicts out of readiness and says so.
- Rationale: W29 R0 P4 T10 to T12 built the project URI reads and the cleanup that PRD 38 names ("remove only under explicit scoped project-state cleanup after export"). A digest proves that an export wrote this exact work, with no new Store table. A project URI resolves from no folder, so it cannot pick one checkout's conflicts.
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-second-pass)

### 2026-11-23 — W29 R0 P4 Second Pass Review Fixes

- Affected requirement or section: R-WORK-STORE-10 and R-WORK-STORE-13.
- Previous contract: a "complete" export left out the files of units whose repo copy a person removed, while the cleanup that a complete export allows removed those units.
- Replacement contract: a complete export also writes those files, outside `docs/work/` as for every export, and names them. So the cleanup never removes a unit that no export wrote.
- Rationale: an independent review of the W29 R0 P4 second pass. Writing the files is the safer choice: it keeps every unit, and the cleanup stays possible.
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-second-pass-review-fixes)

### 2026-11-23 — W29 R0 P4 Owner Decisions on D-068 and the Snapshot Option

- Affected requirement or section: R-WORK-STORE-2 and the PRD 51 integration line.
- Previous contract: without a usable Store, "every work operation reads the files directly". The snapshot read the work store whenever the store was the authority.
- Replacement contract: without a usable Store, the queue commands that need it return the typed Store outcome; the read-only `work next` also points to `docs/work/` and `make-docs backlog snapshot`; file-reading commands read the files. The snapshot reads the work store only with `workStore: true` (`--work-store`).
- Rationale: there was no `work next` before the work store, so the old sentence promised a file-read queue that did not exist. The owner chose option A of register D-068 on 2026-11-23. The snapshot option follows the owner's option A for old Skill copies (PRD 51 R-BACKLOG-SNAPSHOT-31).
- Owner decision: D-068 option A and the snapshot option A, 2026-11-23.
- Source: [W29 R0 P4 evidence](../work/2026-11-21-w29-r0-work-store/evidence.md#p4-owner-decisions-2026-11-23)

## Source Anchors

- [Work store design](../designs/2026-11-21-work-store.md)
- [W29 R0 plan](../plans/2026-11-21-w29-r0-work-store/00-overview.md)
- `packages/cli/src/store/database.ts`
- `packages/cli/src/operations/work/backlog/snapshot.ts`
