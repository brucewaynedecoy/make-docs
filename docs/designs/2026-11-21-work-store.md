---
title: "Work Store"
kind: "design"
status: "draft"
coordinate: "W29 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The active PRD set owns the Store, project config, backlog review, and the work backlog format. The work store adds a new capability that changes those owners."
  coordinate_handoff: "New outcome. No earlier Wave promised a work store, so the planner opens W29 R0, subject to its coordinate check. W30 R0 (factory) depends on this Wave."
---

# Work Store

## Purpose

Give Make Docs a local, durable record of work. The work store holds waves, revisions, phases, stages, tasks, their status, their dependencies, and their assignments. It can answer "what is ready now", let one agent claim work, and record progress and closeout. The Markdown backlog under `docs/work/` becomes a shared copy of the store, in the same way that local system resource bodies are copies of the installed package.

This design is the first of two. The [factory design](2026-11-21-factory.md) depends on it. The factory uses the work store as its work queue.

## Context

Today the Markdown backlog is the only record of work. `backlog_snapshot` parses `docs/work/` on each call. It returns tasks, checkbox state, and the raw bullets under "Dependencies" and "Blockers". It does not resolve dependencies, and it reports `nextPhase` as the next unused phase file number, not the next ready phase. `work_item_resolve` turns a coordinate such as `W22 R2 P4` into paths, but it never selects work. No tool claims or assigns work. Lifecycle runs have no field for an assignee, a tool, or a task handle. Readiness is left to each agent's judgment.

That is enough for one person who reads the backlog. It is not enough for several agents that must agree on what is ready, avoid duplicate work, and recover after a crash. It is also not enough for personal and business work, which is often small and may live in a folder without git.

The owner settled these points in the 2026-11-21 grill session:

- The work store is the durable local authority for work. Repo documents can still exist so that teams can share work through source control.
- It follows the system resource pattern in [PRD 06](../prd/06-template-contracts-and-generated-assets.md#resource-projection-ownership): one authority, an optional repo copy selected in config, a Store record of the last applied digest, and local edits that are kept and reported instead of overwritten.
- It lives in new tables in the existing global Store database ([PRD 38](../prd/38-global-store-and-project-state.md)).
- It is on by default on a machine that has a Store. A project without Store access keeps `docs/work/` as the authority, exactly as today.
- Other trackers can connect later through a config that maps fields. v1 ships only the local store.

Relevant facts from the code at `ba4b95b5`:

- The Store schema is version 6 (`CURRENT_STORE_SCHEMA_VERSION` in `packages/cli/src/store/database.ts`). Migrations are an ordered, append-only list. Each one runs in one transaction, and the reviewed path backs up the database first. Writers refuse an older schema, and every reader refuses a newer one.
- [PRD 38](../prd/38-global-store-and-project-state.md) requires a row in the R-MIN durable field register before a new table exists. W23 R0 P5 followed this order for `backlog_review_cache` (schema v6).
- `backlog_snapshot` already works in a folder without git. It reports git as `not-a-repository` and continues.
- The [developing deterministic and agentic twins](../assets/project/developing-deterministic-agentic-twins.md) guide asks for both a CLI form and an agent form of shared logic, because a project can use Make Docs without the CLI.

## Human Experience Intent

Impact: `direct`

Affected humans: the `user` and `maintainer` Personas who plan and track work in a Make Docs project, teammates who share that project through git, and people who direct agents to do that work.

Human goal or effect: Know what work is ready, who or what is doing it, and what is done, without reading every backlog file or trusting an agent's memory.

Experience promises:

- `make-docs run work next` names the ready units in dependency order and says why each blocked unit is not ready.
- A person who edits a `docs/work/` file by hand, or receives a teammate's edit through git, sees that edit in the store after the next work command. Nothing is lost silently.
- When the file and the store both changed, Make Docs stops, shows both sides, and names one command to settle the conflict.
- Turning on the work store does not change the format or names of existing `docs/work/` files. A teammate without a Store sees the same files as before.
- `make-docs run work status` tells the person whether the store or the files are the authority in this checkout, and why.

Complexity kept out of the human path:

- The person does not need to know the Store tables, digests, or sync ledger to plan, edit, or review work.
- The person does not run an import or migration by hand. The first work command on a machine with a Store imports the existing backlogs and reports what it imported.
- The person does not need to resolve dependency bullets into IDs. The store does that and reports any bullet it cannot resolve.

Evidence required:

- A fixture project with existing W/R backlogs that imports into the store with no change to the files and a matching `backlog_snapshot` result.
- A two-checkout test that edits a task on each side, syncs through git, and shows the import, the conflict stop, and the settle command.
- A review of `work next`, `work status`, and conflict output for a person who has not read this design.
- A no-Store run that proves `docs/work/` stays the authority and every existing command behaves as before.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| Automatic sync at the start of each work command on a project with many backlogs. | `create` | `characterize-now` | A work command stays usable when sync runs first on every call. | Whether automatic sync needs a digest-only fast path before it parses changed files. | The W29 plan, measured on the real sync path once it exists. |

## Decision

### Authority

When the machine has a usable Store, the work store is the authority for the work of each project bound to that Store. The `docs/work/` tree is a repo copy of the store. When the Store is absent or unusable, `docs/work/` is the authority, and every work command reads the files directly, as it does today. `make-docs run work status` reports which mode is active.

The work store holds work records only: waves, revisions, phases, stages, tasks, status, dependencies, links, claims, and assignment references. Designs, plans, PRDs, guides, and history stay as repo documents. Each work record keeps links to its governing repo documents (design, plan, PRD sections, evidence file). Repo documents keep their existing links to work coordinates. Sync preserves both directions.

### Repo copies

The repo copy follows the system resource pattern:

- A new `work` block in `.make-docs/config.yaml` holds the desired setting, for example `work.projection: on`. The default is `on`, because teams share work through git. A project can turn it off. The config holds intent only. It holds no digests, receipts, or checkout IDs ([PRD 24 R-CONFIG-STATE-1](../prd/24-project-configuration-and-convention-overlay.md)).
- The Store keeps the last applied digest of each copied file, as it does for resource projections.
- Make Docs writes the copy in today's format, from today's work templates. File names, headings, task checkboxes, and acceptance criteria do not change.
- Make Docs removes a copy only when its bytes still match the last applied digest. A changed copy is kept and reported.

With copies off, the store is the only record of that work in the checkout. `make-docs run work export` writes the files on request, so a person can still share or archive them.

### Two-way sync

Sync compares three things for each work file: the current file bytes, the last applied digest, and the store record's revision.

| File changed | Store changed | Result |
| --- | --- | --- |
| No | No | Nothing to do. |
| Yes | No | Import the file into the store. This covers hand edits and teammates' edits that arrive through git. |
| No | Yes | Write the file from the store. |
| Yes | Yes | Stop. Report a conflict for that file, show both sides, and name the settle command. Other files continue. |

Sync runs on its own at the start of each `make-docs run work` command and each work MCP tool. A person can also run `make-docs run work sync`. A conflict blocks only the units in the conflicted file. A file that does not parse stays as it is and is reported. The store never overwrites it.

### First import

The first work command on a machine with a Store imports every existing backlog under `docs/work/` and its archive. Import is read-only for the files. It reports each imported record, each dependency bullet it could resolve to a unit, and each bullet it could not resolve. An unresolved bullet stays as text on the unit and keeps that unit out of `work next` until a person or agent resolves it.

### Work identity and units

Each unit has a stable store ID and its coordinate. A wave, revision, phase, stage, or task can be a claimable unit. The coordinate stays the human name. The store ID survives renumbering. Dependencies point to store IDs. A quick item is a task-level unit with no design, plan, or PRD. It belongs to the project and can link to the request that made it.

A quick item lives only in the work store. It has no repo copy, so teammates do not see it through git. `make-docs run work add` adds one and gives it the next plain number of the project, such as `7`. Human text calls it `task 7`. The `tasks` URI family keeps it apart from backlog coordinates, so it needs no letter.

A person or an agent reads a project's work by URI, the same way as system resources. Every project URI names its project, by a short project name or by its project ID. Nothing resolves from the current folder.

- `make-docs resource read make-docs://project/make-docs/tasks/` lists the project's quick items.
- `make-docs resource read make-docs://project/make-docs/tasks/7` shows one quick item.
- `make-docs resource read make-docs://project/make-docs/backlog/W29/R0/` lists the phases of W29 R0.
- `make-docs resource read make-docs://project/make-docs/backlog/W29/R0/P1/T3` shows one task.

A project URI read uses the work store read-only. Without a Store, it says so and points to the `docs/work/` files. `make-docs run work export --quick <path>` writes the `tasks` text to a file that the person names. The project name lives in `.make-docs/config.yaml` as `projectName`, and the Store records it with the project ID.

### Ready, claim, report, and close

The store answers four questions through one small interface:

- **Next.** A unit is ready when its dependencies are closed, it is not claimed, it has no open blocker, it has no unsettled sync conflict, and its parent is open. `next` lists ready units in dependency order, then coordinate order. It also lists the reason each open, not-ready unit is waiting.
- **Claim.** A claim names the unit, the claimant, and a time limit. Only one live claim can exist for a unit. The claimant renews the claim at each check. An expired claim lets another claimant take the unit. Before it takes the unit, the new claimant must check the old claimant's task handle, so it does not send the same work twice.
- **Report.** A report changes status, adds a short progress note, or links evidence. A report from a claimant that no longer holds the claim is refused.
- **Close.** Close records the outcome (`done`, `cancelled`, or `superseded`) and releases the claim. Closing every task in a phase does not close the phase. Phase closeout keeps its existing rules.

These rules exist twice, as the twins guide requires. The CLI form is code. The agent form is a new system resource, `make-docs://system/reference/work-store.md`, which tells an agent how to apply the same rules to the Markdown files when no CLI is present. A change to one form must trigger a review of the other.

### Other trackers

v1 defines a tracker connection contract and ships one connection: the local store. A connection declares which of the four operations it supports and maps Make Docs fields (unit, status, dependencies, claim, links) to the tracker's fields. The map lives in `.make-docs/config.yaml` under `work.tracker` and holds no secrets. The rules for using a connection live in the same system resource. A later Wave can add a connection for another tracker without changing the interface. A future Make Docs kit for an Ursa workspace is out of scope. The interface leaves room for it.

### Store records

The work store adds new tables in one append-only migration (schema v8, after the W32 R0 Store review takes v7). Each new table has the Store write guard triggers. Each field gets an R-MIN row in [PRD 38](../prd/38-global-store-and-project-state.md) before the table exists. The class of the work records is `Store-canonical` when copies are off. It is `Store-canonical, rebuildable from the repo copy` when copies are on. Claims are a `short-lived mutation guard` with a time limit. The migration uses the existing backup, transaction, version, and newer-schema rules. It adds no second database file.

### Commands and MCP tools

| Command | MCP tool | Effect |
| --- | --- | --- |
| `make-docs run work status` | `work_status` | Reads the mode, the sync state, and conflicts. |
| `make-docs run work sync` | `work_sync` | Runs two-way sync. Reports imports, writes, and conflicts. |
| `make-docs run work next` | `work_next` | Lists ready units and the reasons other units wait. |
| `make-docs run work claim <unit>` | `work_claim` | Claims a unit with a time limit, or renews a claim. |
| `make-docs run work release <unit>` | `work_release` | Releases a claim without closing the unit. |
| `make-docs run work report <unit>` | `work_report` | Records status, a short note, or an evidence link. |
| `make-docs run work close <unit>` | `work_close` | Closes a unit and releases its claim. |
| `make-docs run work export` | `work_export` | Writes repo copies on request when copies are off, and quick items to a named path. |
| `make-docs run work add` | `work_add` | Adds a quick item with the next quick item number. |

The design fixes the verbs. The plan and PRD fix the exact flags. The tools join the existing `backlog` and `workflow` MCP profiles. Writes need the existing write permission and `expectedVersion` check. `backlog_snapshot` reads the store when the store is the authority, and it returns the same schema. Its result adds the resolved readiness facts. `backlog-review` keeps its read-only role.

## Alternatives Considered

- **Keep the Markdown backlog as the only record.** No shared readiness, claim, or crash recovery. Several agents would each guess what is ready.
- **Make the work store the authority in every project, with a forced migration.** This changes every project at once, including those without a Store. The owner chose on by default where a Store exists, with repo copies kept.
- **One-way sync from the store to the files.** Teammates' edits through git and hand edits would be lost. The owner chose two-way sync with a conflict stop.
- **A separate work database file.** It would need its own migration, backup, and lock rules. The existing Store already has them.
- **Store-only work with no repo copies by default.** Teams would lose their shared view in git. Copies stay on by default and can be turned off.
- **Build a connection for another tracker in v1.** No tracker has a verified fit yet. The contract comes first, and connections come later.

## Consequences

- PRD 38 gains the work tables, their R-MIN rows, and the schema v8 migration. PRD 24 gains the `work` config block. PRD 06 or a new work-store PRD states the repo copy rule for work files. PRD 51 changes so that `backlog_snapshot` reads from the store when the store is the authority. PRDs 25 and 39 gain the new operations.
- A new PRD owns the work store as a coherent product subject. The plan decides the number. The next free number is 52.
- Two-way sync needs a strict parser for the work format. A file that the parser cannot read must stay untouched and be reported. The parser and the writer must round-trip today's files byte for byte.
- When repo copies are off, the work records exist only in the Store. Store backup and export now matter for work, not just for installation state. Status must say this plainly.
- Personal and business projects in a folder without git can use the same store and commands. They lose git history, so the factory design adds file backups for those projects.
- Old Make Docs versions that do not know the work store still read and write the files. The next sync on a new version imports those edits.
- The factory design depends on `work next`, `claim`, `report`, and `close`. W30 starts only after this interface ships.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Global Store and project state](2026-07-01-global-store-and-project-state.md), [Store-owned installation and migration state](2026-09-09-store-owned-installation-and-migration-state.md), [Backlog review and reporting](2026-09-18-backlog-review-and-reporting.md), and [Wave revision and backlog amendment rules](2026-11-18-wave-revision-and-backlog-amendment-rules.md).

Reason: The work store adds a new Store-owned record and changes the authority of the work backlog. It keeps the Store safety rules, the backlog review boundary, and the wave model from those designs.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: The active PRD set owns the Store, config, backlog review, and the work format. The work store changes those owners and adds one new owner.
- Coordinate Handoff: New outcome with no lineage Wave. The planner opens W29 R0, subject to its coordinate check. W30 R0 depends on it.
