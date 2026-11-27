---
title: "Checkpoint Events and Store-First Roadmap"
date: "2026-11-27"
kind: "reference"
status: "draft"
---

# Checkpoint Events and Store-First Roadmap

This document holds the long-term ideas for how Make Docs keeps stored data current as it grows. The owner asked for it on 2026-11-27. It is seed material, not a contract and not a commitment. Nothing here is decided or scheduled. Each item becomes authority only when it lands in a design, a plan, a PRD, and a work backlog. Record risks and open questions for these items in the [register](../../prd/03-open-questions-and-risk-register.md) when work on an item starts.

The near-term work is in the design [Agent Checkpoints and Triggers](../../designs/2026-11-27-agent-checkpoints-and-triggers.md). That design adds one checkpoint command and the first triggers. It also fixes a small list of event names. Every item below builds on those two things. That design is a draft with open owner decisions, so the details below can change with it.

## The Starting Point

After the near-term design ships, Make Docs has:

- one checkpoint command that does all that is due for a project, and that is safe to repeat;
- six event names: `session-start`, `files-changed`, `turn-end`, `commit`, `branch-change`, and `phase-closed`;
- a first set of adapters that fire those events: the CLI reminder, the router rules, the MCP server instructions, git hooks, and the hooks of each agent tool that supports them;
- two kinds of run: a direct run that a person or agent types, which runs the full sync, and a trigger run that a hook starts with an event name, which imports only and writes no project file;
- git hooks that `make-docs setup` offers for each project as an opt-in choice, with a machine preference that can make "yes" the default answer for each new project, and with no machine-wide git hooks path (owner decision of 2026-11-27); and
- a fixed map in code: every event runs the checkpoint.

The person-editable registry of item 1 is not part of that design. The owner placed it in this roadmap on 2026-11-27.

An adapter is a small piece that notices a point in time and fires an event. The command does the work. This split is the durable part. A new way to notice a point in time is a new adapter. It does not change the command or the rules.

## The Direction

The owner's roadmap, as stated on 2026-11-27, has three larger moves. This document does not design them. It names them because each one makes current data more important:

- **Store-first documents.** Designs, plans, and archives move into the Store, as work did. Their files become optional in the repo.
- **A merge of another project's data.** Another project's data files and systems merge into the Make Docs CLI and Stores.
- **A server.** A planned server serves interactive apps and dashboards from Store data.

A dashboard that shows old data is wrong in front of a person. A Store that is the only copy of a design must have that design. So the question "who makes sure the Store is current" moves from useful to necessary.

## Items

### 1. Make Docs' own event list with adapters

The idea: grow the fixed event list into Make Docs' own hook system. A registry in config lists which commands run on each event. Small adapters fire the events: git hooks, each agent tool's own hooks, MCP, and a file watcher. No gateway is needed.

What it depends on:

- The near-term design, with its event names and its single checkpoint command.
- A config contract for the registry under [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md). Config holds intent only, and no state.
- A safety rule for commands that run from config. A first safe form lets the registry name only Make Docs operations from the registry, never a free shell command.
- A change to the plugin and hook admission boundary in [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) and [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md).

What it unlocks:

- More than one command for each event. For example, a phase close can also refresh a report.
- New Stores join without new triggers. When designs, plans, and archives move into the Store, their sync steps join the checkpoint or the registry. Every installed adapter then covers them with no new setup.
- The merged data of another project gets the same events and the same adapters.
- The server and the gateway below become adapters, not new systems.

Main risks:

- A registry that can run any command is a way to run code from a shared file. The first form must not allow that.
- Too many commands on one event make each git action or agent turn slow.
- People edit the registry and then cannot tell why something ran. Status output must show which event ran which command.
- The agent form must keep up. Each event rule needs its written form, as the [twins guide](developing-deterministic-agentic-twins.md) asks.

Rough order: first of the four. The other items are easier and safer with it.

### 2. The server watches the folders and syncs by itself

The idea: the planned server watches the project folders. When a file that the Store copies changes, the server fires `files-changed` and runs the checkpoint. No agent and no person runs a command.

What it depends on:

- The planned server itself, with its start, stop, and failure rules.
- Item 1, so that the watcher is one more adapter.
- A clear rule for who may write project files. The near-term design proposes that a trigger run imports only and never writes a project file. A watcher needs the same rule, or its own reviewed rule.
- A rule for branches and worktrees. One project store serves every branch and every linked worktree of a clone. A watcher that imports each file change moves the store to the branch of the checkout that it watches. The near-term design proposes that a branch change only reports and does not import. A watcher needs an answer for the same case.
- A cheap change signal. Today the exact sync check reads and hashes each work file, at about 250 ms over the CLI floor for 463 work files (result [`PERF-004-R1`](../../work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record)). The owner decided "Fast path: not now" on 2026-11-23, with a look again at about 900 work files. A watcher that runs often makes that question current.
- A rule for two writers. The server and a CLI command can run at the same time. The Store locks and the sync conflict stop must hold for both.

What it unlocks:

- Apps and dashboards that show current data with no agent action.
- The same result for a person who edits a file by hand in an editor and never runs the CLI.
- Less need for the other triggers while the server runs. They remain for when it does not.

Main risks:

- A process that stays alive costs memory and battery, and it can fail with no sign. The person must be able to see that it runs, and what it last did.
- File watching differs between operating systems and breaks on network drives and very large folders.
- A sync in the middle of a person's edit, or in the middle of a git rebase, can import half-done work. The watcher needs a quiet period and the same "git is busy" rule that the near-term design proposes for the hooks.
- Sync conflicts are never settled automatically. A watcher that finds one must report it where a person will see it.

Rough order: after item 1, and together with the server. It does not depend on items 3 or 4.

### 3. Files become optional

The idea: designs, plans, and archives live in the Store. Their repo files are optional copies, as work files are today with `work.projection`. When a project turns the copies off, the CLI and the MCP server are the only way to read them.

What it depends on:

- A Store record model for each document kind, with field register rows and migrations under [PRD 38](../../prd/38-global-store-and-project-state.md).
- The repo copy pattern of [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) and the two-way sync rules of [PRD 52](../../prd/52-work-store-and-work-queue.md), applied to each kind. Long prose documents need their own conflict rules.
- Project resource URIs for each kind, in the same family as `make-docs://project/<project>/backlog/`.
- Read commands that are good enough that an agent does not miss the files: search, list, read one section, and follow links.
- Items 1 and 2, or at least the near-term triggers. With no files, an agent cannot fall back to a file search.
- Store backup and export for these records. With copies off, the Store holds the only copy.

What it unlocks:

- The Store-first future that the owner described: one exact source for designs, plans, archives, and work.
- Queries across documents, such as "which designs have no plan", with no file scan.
- Smaller repos for teams that do not want the documents in git.
- A direct data source for the server's apps and dashboards.

Main risks:

- A project can use Make Docs without Store access. That rule must hold. A project with copies off and no Store has no documents. The default must stay "copies on", and turning copies off must say plainly what it means.
- Teams share documents through git. Without repo copies they need another way to share, which Make Docs does not have today.
- The agent form gets harder. Without files and without the CLI, an agent has nothing to read. The twins rule needs an honest answer for that case.
- The router rule changes from "prefer the CLI" to "the CLI is the only way". An agent that still searches for files finds nothing and may conclude that nothing exists.
- This is the item with the most data-loss risk. Migration, backup, and export must be proved first.

Rough order: after item 1. It can come before or after item 2. It is safer after item 2, because the server gives people a way to see Store-only documents.

### 4. A gateway service in the path of model traffic

The idea: a separate service sits between an agent tool and its model provider. It sees each request and each reply. It fires events such as `session-start` and `turn-end` for any agent tool, also for one that has no hook support. The owner raised this idea on 2026-11-27.

Strengths:

- It is universal. One adapter covers every agent tool that can send its model traffic through the gateway.
- It needs no hook support in each tool, and no setup inside each tool beyond one address.
- It sees every turn, so it can fire `turn-end` exactly, where other adapters can only come close.
- It can do more than fire events later, such as put a reminder in front of the agent at the correct moment.

Costs:

- It is a separate project, with its own design, release, and support. It is the most costly idea here.
- Privacy. It sees all prompts, code, and replies. People and companies must trust it with that. It must store nothing that it does not need, and it must say exactly what it reads.
- Sign-in. It handles the person's provider keys or sign-in tokens. A mistake there is a security event.
- Failure. When the gateway is down or slow, every agent tool that uses it is down or slow. It needs a safe path that passes traffic through with no events.
- Each provider and each agent tool has its own traffic form, and these forms change. The gateway must follow them.
- Some agent tools, and some company rules, do not allow traffic through a third service.

What it depends on:

- Item 1. With the event list, the gateway is one more adapter. Without it, the gateway needs its own rules for what runs.
- A decision that the gain in coverage is worth a separate project, after the cheaper adapters have run for some time and their gaps are measured.

What it unlocks:

- Events for agent tools that no other adapter can reach.
- Exact turn events for the server's apps and dashboards.
- A possible home for other cross-tool needs, outside the scope of this document.

Main risks: the privacy, sign-in, and failure costs above. A second risk is scope: a gateway can grow into a product of its own and pull effort from Make Docs.

Rough order: last. It is a separate project. Start it only when measured gaps in items 1 and 2 show that the cheaper adapters are not enough.

## Rough Order

| Order | Item | Why here |
| --- | --- | --- |
| 0 | The near-term design: checkpoint command, first triggers, fixed event names. | It is the base for every item. |
| 1 | The event list with a config registry and more adapters. | Each later item is one more adapter or one more command on it. |
| 2 | The server watches and syncs. | It needs the server. It makes apps and dashboards current. |
| 3 | Files become optional. | It needs strong read commands and current data first. It carries the most data risk. |
| 4 | The gateway. | It is a separate project. It is worth its cost only if measured gaps remain. |

Items 2 and 3 can change places. The merge of another project's data can start at any point after item 1. Its data then gets the same events with no new triggers.

## Rules That Hold for Every Item

- A project can use Make Docs without Store access. Each item must work, or do nothing, without a Store.
- Sync conflicts are never settled automatically. Each adapter reports a conflict with its settle command.
- Proposed, from the near-term design, and not decided: a trigger never blocks or fails the action that fired it.
- Each deterministic behavior has its written agent form, and a change to one triggers a review of the other.
- Proposed, from the near-term design, and not decided: each installed piece, such as a hook or a service entry, has a reviewed plan, a Store record of what Make Docs wrote, and an exact removal.
- Shared text stays tool-agnostic. An agent tool is named only where setup already supports it.

## Why This Is a New Document

Two older documents in this folder hold forward direction: [evolution-direction.md](evolution-direction.md) from 2026-06-17 and [v2-proposed-design-and-roadmap.md](v2-proposed-design-and-roadmap.md). Both describe the v2 restructure, and most of their items are done or retired. Neither covers the work store, events, or the Store-first direction. A new dated asset keeps this direction easy to find and leaves the old documents as history. These items are ideas, not accepted obligations, so the deferred-obligation register does not apply to them.
