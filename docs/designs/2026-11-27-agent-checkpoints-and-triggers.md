---
title: "Agent Checkpoints and Triggers"
kind: "design"
status: "draft"
coordinate: "W35 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "PRD 52 owns the work queue and sync, PRD 39 owns command names, PRD 25 owns the MCP server, PRD 28 owns agent tool setup, and PRD 15 owns the router blocks. This design adds one command and several triggers that change those owners."
  coordinate_handoff: "Recommended W35 R0 as new work. The owner said 'the next Wave' on 2026-11-27, and W34 is the highest Wave in docs/work/, docs/plans/, and the register. W29 R0 promised sync at the start of each work command, and it delivered that. No Wave promised that agents run those commands. The planner checks the choice under the wave-model decision procedure. On 2026-11-27 the owner chose option A of OD-1, OD-2, OD-3, OD-5, OD-6, OD-7, and OD-9, and approved the change to the PRD 28 sentence about hooks. OD-10 is open: whether this Wave builds agent tool hooks."
---

# Agent Checkpoints and Triggers

## Purpose

Make agents keep the work store current, and read work from it, without a person who reminds them. This design adds one checkpoint command that does all that is due. It then adds several small triggers that call that one command at the points where it makes sense. Each trigger works for a different set of agent tools. Phase 1 lowers the problem. Phase 2 closes it for agents that commit. An agent that never commits is reached only by text, by a Make Docs command that it already runs, or by an agent tool hook that the plan proves.

The design covers the next Wave in two phases. It also names a small event list that later stages can build on, as owner decisions 1 and 3 set. The long-term ideas are in the [checkpoint events and Store-first roadmap](../assets/project/2026-11-27-checkpoint-events-and-store-first-roadmap.md).

## Context

### The problem

The owner tested release 2.1.0 and reported this on 2026-11-27:

- The work store has much potential. But the person must remember to run the commands, or must tell the agent to run them.
- Agents still read `docs/work/` files with `ls`, `grep`, and file reads. A Store query is more exact and costs less context.
- Nothing makes agents sync file changes to the Store at regular points.
- This is not only a work store problem. The owner's roadmap moves designs, plans, and archives into the Store, with files optional in the repo. It merges another project's data files and systems into the CLI and Stores. It adds a server that serves interactive apps and dashboards. All of these need agents to keep data current.

The immediate goal is a simple and effective way for agents to remember to run certain work store commands at the correct points. The long-term goal is something durable and universal that keeps working as Make Docs grows.

### Checked facts

A read-only check of the code at `b50f9d49` on 2026-11-27 found these facts.

**Authority and sync**

- `workAuthority` in `packages/cli/src/operations/work/work-queue/queue.ts` decides who is in charge. The work store is in charge only when the caller may use the Store, the Store exists, its schema is current, it is safe, and this checkout is bound to it. In every other case the `docs/work/` files are in charge, and the result gives the reason and one next action. This matches [PRD 52](../prd/52-work-store-and-work-queue.md) R-WORK-STORE-1 to R-WORK-STORE-3. The rule does not ask whether the first sync of the checkout is done. So the work store is in charge in a bound checkout that never synced.
- `make-docs work sync` runs two-way sync (`syncWorkFiles` in `packages/cli/src/operations/work/work-store/sync.ts`). A changed file is imported. A changed store record is written to its file when repo copies are on. When both sides changed, sync stops for that file only and reports a conflict with one settle command for each choice. Sync never settles a conflict by itself (PRD 52 R-WORK-SYNC-1 to R-WORK-SYNC-18).
- Each work write command already syncs first. The read commands `work status` and `work next` already run a read-only sync check (`previewWorkSync`). They change nothing. When files wait for sync, their result says so, for example: "Sync check: 2 files to import. The next work write command, or make-docs work sync, applies the changes." (PRD 52 R-WORK-SYNC-8).
- When files wait for import, `work next` still ranks the units from the store records. Its result has the sync line, but it does not mark which listed units are out of date. A new work file that waits for import has no unit in the store yet, so `work next` does not list its work at all. In a checkout that never synced, `work next` lists only what other checkouts of the project imported, or nothing.
- A project URI read, such as `make-docs://project/<project>/backlog/`, names no checkout. Its code in `packages/cli/src/operations/work/work-queue/project-resource.ts` calls no sync and no sync check. Its text already says: "Sync conflicts belong to one checkout, so this read does not show them. Run make-docs work next in a checkout to see them." PRD 52 R-WORK-URI-3 requires that sentence about conflicts. Neither the PRD nor the code says anything about files that wait for import.
- The first sync of a checkout only imports. It writes no project file. Each later sync of that checkout writes and removes files under the sync table (PRD 52 R-WORK-SYNC-9).
- Work units belong to the project. The sync ledger and the sync conflicts belong to one checkout (`buildSyncViews` reads the units by project ID, and the ledger and the conflicts by checkout ID). One clone can have many linked worktrees on different branches, and each one is its own checkout over the same project units.
- An import happens today only when someone runs a work write command or `work sync` in a checkout. Nothing imports by itself.

**No cheap change signal exists today**

- The sync ledger table `work_sync_ledger` in `packages/cli/src/store/work-store-schema.ts` holds, for each file, the last applied digest, the store revision, and the time `synced_at`. It holds no file size and no file change time. The table `work_sync_checkouts` holds one row for each checkout, with only the time of its first sync. The Store schema version is 9.
- Sync sets `synced_at` only for a file that it applies (every call of `putLedger` in `sync.ts`: an import, a write, a settled conflict, a store edit that the file cannot show, and an unchanged file whose units changed through the import of another file). The value is the time at which the command started. In the common case, a file with unchanged bytes gets no new ledger time. A file that sync itself writes gets a file change time that is later than its ledger time.
- So a compare of file change times with `synced_at` does not work as a change signal. After a branch change, a file with the same bytes has a newer file time, and no later sync gives it a newer ledger time. A file that sync wrote looks changed from the start. No run of sync or of a checkpoint clears either case.
- `scanWorkFiles` reads the bytes of every work file under `docs/work/` and `.make-docs/archive/work/`, and the sync check hashes each one. No shortcut skips a file that did not change.
- This repository has 463 work files by the scan rule, counted on 2026-11-27: 333 under `docs/work/` and 130 under `.make-docs/archive/work/`. The unit count was not counted again, because that needs a Store read.
- The cost is measured. Result [`PERF-004-R1`](../work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record) ran on this repository with 463 work files. The medians are: the CLI floor (`make-docs --version`) 84 ms, the first import of a checkout 1,380 ms, `work sync` with no change 386 ms, `work next` 330 ms, and `work status` 351 ms. So the read-only sync check costs about 250 ms over the floor, and a sync with no change costs about 300 ms over the floor, at about 0.65 ms for each work file.
- The owner decided on 2026-11-23, in the same [phase record](../work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record): "Fast path: not now." The record says to look again when this repository holds about 900 work files, or when a person reports a slow work command. A fast path is a shortcut that skips files that did not change.

**Routers**

- The managed block of the root router (`packages/docs/template/AGENTS.md` and `CLAUDE.md`) says nothing about the work store. It has the rule that a project can use Make Docs without Store access.
- The `docs/work/` router (`packages/docs/template/docs/work/AGENTS.md`) has one line: to find, claim, report, close, or sync work, read `make-docs://system/reference/work-store.md`, and "Without the CLI or a usable Store, `docs/work/` is the authority." It does not tell the agent to prefer the CLI when the store is in charge, and it does not say when to sync.
- The installed copies of both routers in this repository match the template.

**MCP server**

- `createMakeDocsMcpServer` in `packages/cli/src/mcp/server.ts` gives the server only a name and a version. It sends no server instructions today.
- A successful tool result is the operation result as JSON, two times: as text in `content` and as the object `structuredContent` (`formatMcpToolResult`). A host can read only one of the two. A tool with an `mcpResultSchema` takes another path in that function, with a fixed result schema. Work results carry `lines` and `summary`. Only some results carry `nextAction`: the authority result, each wait reason of `work next`, and each typed error. No uniform next-step field exists on success results.
- The work tools belong to the `backlog` and `workflow` profiles and declare `defaultExposure: "deferred"`. That field is host advice only.

**Setup and hooks**

- Setup has three first-party adapters in `packages/cli/src/harness-access/registry.ts`: Codex, Claude Code, and GitHub Copilot CLI. It also has a generic MCP client profile. The adapter methods are `mcp`, `command-rules`, and `permission-rules`. No adapter has a hook method.
- Make Docs installs no agent tool hook and no git hook today. A search of `packages/cli/src` for hook paths and hook event names found nothing.
- [PRD 28](../prd/28-shared-agentics-installation-and-harness-exposure.md) says: "Make Docs has no general plugin, hook, extension, workflow-bundle, or Playbook-generated Skill product." A new adapter method needs a traced purpose, an owning PRD, real capability evidence for that agent tool, explicit selection, and safe install and removal authority. [PRD 30](../prd/30-plugin-substrate-and-workflow-bundles.md) owns that admission boundary.
- Each adapter declares its owned native entries (PRD 28 R-HARNESS-1), and each receipt in the Store records its history (PRD 28 R-HARNESS-17). `setup remove` removes a file only when the Store ledger proves that Make Docs owns it, and it removes a router block only when the block still matches ([PRD 07](../prd/07-cli-command-surface-and-lifecycle.md), [PRD 15](../prd/15-agent-instruction-ownership-and-managed-blocks.md)). A new installed file such as a hook needs the same: a reviewed plan, a Store record of the exact bytes that Make Docs wrote, a drift check, and an exact removal.

**Git facts**

- In a linked worktree, `git rev-parse --git-path hooks` returns the hooks folder of the main checkout. So every worktree of one clone shares one set of hooks. That folder is outside the worktree's project folder. The Store keeps its file ledger for each checkout.
- The git setting `core.hooksPath` replaces the hooks folder. Set for the whole machine, it replaces the hooks of every repository on the computer. Hook managers use the same setting.
- Git does not copy hooks on clone. Each clone needs its own setup.
- Git runs the hook after a merge (`post-merge`) for `git pull` with a merge. A review test of 2026-11-27 with git 2.47.1 in a temporary repository showed two cases for `git pull --rebase`. With no local commits, it runs `post-merge`. With local commits, it runs `post-checkout`, `post-commit`, and `post-rewrite`, and not `post-merge`. Git also runs `post-rewrite` for an amended commit, which runs `post-commit` too. In the same test, the rebase folder of git was still there when `post-rewrite` ran, and `MERGE_HEAD` was still there when `post-merge` ran after a true merge. `post-checkout` also runs for a file checkout (its third argument is 0), for `git worktree add`, and for a clone. The plan proves each of these facts again on each supported platform.

**Without a Store**

- `work sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add` return the typed Store result without a usable Store. `work status` and `backlog snapshot` work without one (PRD 52 R-WORK-STORE-2).
- Without a Store, the files are the authority and there is nothing to sync.

**Names**

- `make-docs lifecycle checkpoint` exists today. It saves a checkpoint of a lifecycle run. The word "checkpoint" in a new command name must not be confused with it.
- [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) R-NAME-1 to R-NAME-5 set the rules: one capability in one group, an MCP name of at most 26 characters, and one entry in the name catalog. R-MIG-1 keeps an old name as a hidden alias for two minor releases after a rename.

**Twins**

- The [twins guide](../assets/project/developing-deterministic-agentic-twins.md) asks for a CLI form and a written agent form of shared logic. The work rules already have both: code, and `make-docs://system/reference/work-store.md` with shared rule IDs (PRD 52 R-WORK-QUEUE-11).

### What the facts mean

Sync already works, and the read commands already say when the store is out of date. The gap is before that: an agent never runs a work command, so it never sees the message. The fix must reach the agent at points that do not depend on its memory, and each trigger must lead to one command. The facts also show two limits. No cheap change signal exists, so a reminder on each command has a cost or needs new stored data (OD-6). And one project store serves every branch and worktree, so a trigger that imports by itself moves the store to the last branch that someone touched (OD-9).

## Human Experience Intent

Impact: `direct`

Affected humans: the `user` and `maintainer` Personas who direct agents in a Make Docs project, teammates who share that project through git, and people who read the work store through the CLI, an app, or a report.

Human goal or effect: Trust that the work store shows the current work, without a need to remember sync commands or to tell each agent to run them.

Experience promises:

- A person does not need to tell an agent to sync. After a commit or a merge in a project with hooks on, the work store has the file changes, or the person sees one line that says what waits and which command settles it. After a branch change, the person sees that line when files wait. This promise holds when the hook may read the Store. When an agent tool denies the hook all Store access, the hook prints nothing, and the next Make Docs command that may read the Store shows the reminder.
- One command, the checkpoint, tells the person or agent all that is due: what it synced, each conflict with its settle command, each claim that ended, and the next ready work.
- When work files changed and the store does not have them yet, the next Make Docs command says so in one line with the exact command to run.
- A git action never fails because of Make Docs. How much time a hook may add is a performance candidate below: the plan measures it and decides between a foreground run and a run that starts and returns. When no sync change and no conflict waits, the hooks print nothing. Ready work and an ended claim do not make a hook print.
- Setup shows each hook that it would install, where it goes, and what it runs, before it writes. `setup remove` takes out only what Make Docs put in.
- Without a Store, nothing new happens and nothing fails. The routers still say the true thing: the files are the authority.

Complexity kept out of the human path:

- The person does not need to know the event list, the adapters, the ledger, or the digests.
- The person does not need to know which trigger reached the agent. Every trigger leads to the same command.
- The person does not edit hook files by hand.

Evidence required:

- A two-checkout test in which one side edits a work file and commits, and the store has the edit after the commit with no work command run by hand.
- A test with two linked worktrees of one clone on different branches: a commit in one, then a checkpoint in the other. The test records what the store holds and what each worktree reports, with no silent overwrite.
- A test of `git pull --rebase` that shows which hook ran and what the store holds after it.
- A hook run with Store read access only, and a hook run with no Store access. The first prints the one line. The second prints nothing and exits 0.
- Installed runs of the checkpoint for these cases: nothing due, files imported, a conflict, a claim that ended, no Store, and a folder that is not a Make Docs project.
- A test that a hook exits 0 and prints nothing when the CLI is missing, when no Store exists, and when the project has no Make Docs install.
- A setup and `setup remove` test with an existing hook of another tool: the other tool's lines stay byte for byte.
- A recorded agent session for each first-party agent tool that starts cold, changes a work file, and reaches the checkpoint with no prompt from the person. The record names which trigger did it.
- A Human Experience Review of the checkpoint output, the reminder line, the setup hook review, and the router lines for a person who has not read this design.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| The change check that a Make Docs command runs before it prints the reminder line. | `create` | `characterize-now` | A Make Docs command does not become slower in a way that a person notices. | Whether the exact check of `PERF-004-R1` (about 250 ms over the floor) is acceptable on each command, or a stored signal is needed (OD-6). | The W35 plan, measured on this repository's 463 work files. It starts from `PERF-004-R1`. |
| The checkpoint that a git hook runs after a commit, a merge, a rewrite, and a branch change. | `create` | `characterize-now` | A git action stays as fast as before for the person. | Whether the hook runs the checkpoint in the foreground (about 300 ms over the floor with no change, by `PERF-004-R1`), or starts it and returns. | The W35 plan. It reuses the `PERF-004` method of W29 R0. |

## Decision

### Owner decisions

The owner decided these four points on 2026-11-27. Nothing else in this design is decided.

1. The next Wave implements the immediate ideas. Phase 1 is the checkpoint command, the CLI reminder, "sync on read", the router rule, and the MCP server instructions. Phase 2 is git hooks and the hooks of each agent tool. The event list with adapters is the design idea that holds it together.
2. The note at the point of use must hold when no work store is installed or available. The owner's example wording: "When the work store is present, it's the authority. Read it with this command."
3. The long-term ideas are captured in a roadmap document.
4. Git hooks are wanted. `make-docs setup` offers the git hooks for each project, and the person opts in. A machine preference can make "yes" the default answer for each new project. Make Docs sets no machine-wide git hooks path. The owner chose this on 2026-11-27 as option A of OD-1.

Two things follow from decisions 1 and 3, and they are not open. This Wave fixes the event names and the single command, and builds only the Phase 1 and Phase 2 adapters. The person-editable event registry in config belongs to the roadmap, not to this Wave.

### The idea that holds it together

Make Docs gets a small list of events. An event is a point in time at which stored data can be out of date. An adapter is a small piece that fires an event. Every adapter calls the same command: the checkpoint.

| Event | Meaning | Adapter in this Wave | How the adapter reaches the checkpoint |
| --- | --- | --- | --- |
| `session-start` | An agent starts or resumes work in the project. | MCP server instructions (Phase 1). | Text. The agent runs the checkpoint directly, with no `--event`. |
| `session-start` | The same. | An agent tool hook where the tool supports one (Phase 2). | The hook runs the checkpoint with `--event session-start`. |
| `files-changed` | Files that the store copies changed on disk. | The CLI reminder and the router rule (Phase 1). | Text. The agent runs the checkpoint directly, with no `--event`. |
| `turn-end` | An agent ends one turn of work. | An agent tool hook where the tool supports one (Phase 2). | The hook runs the checkpoint with `--event turn-end`. |
| `commit` | Git made a commit, finished a merge, or finished a rewrite of commits. | Git hooks (Phase 2). | The hook runs the checkpoint with `--event commit`. |
| `branch-change` | Git changed the branch of the checkout. | A git hook (Phase 2). | The hook runs the checkpoint with `--event branch-change`. |
| `phase-closed` | A work phase closed. | The router rule and the work store reference (Phase 1). | Text. The agent runs the checkpoint directly, with no `--event`. |

One rule covers every row. A run with `--event` is a trigger run, and only a hook starts one. A run with no `--event` is a direct run. An agent that obeys the router rule, the MCP instructions, or the reminder line types the command itself, so it makes a direct run. The section "One checkpoint command" says what each kind of run does.

This Wave fixes the event names and their meaning. It builds only the adapters in the table. The map from event to command is fixed in code: every event runs the checkpoint. A person cannot edit that map in this Wave. This scope follows from owner decisions 1 and 3. A later adapter, such as a file watcher or a gateway, fires the same events and calls the same command. The [roadmap](../assets/project/2026-11-27-checkpoint-events-and-store-first-roadmap.md) holds those stages.

### Phase 1

#### One checkpoint command

A new command does all that is due for the project, in this order:

1. It finds who is in charge, with the same rule as `work status`.
2. When the work store is in charge, it syncs the work files. It imports changed files. It reports each conflict with its settle commands, and it never settles one.
3. It lists each claim of the project that ended or ends soon, with the release or renew command. It never shows a claim ID, and it renews nothing, because only the holder has the claim ID (PRD 52 R-WORK-QUEUE-19).
4. It lists the next ready work, as a short form of `work next`.
5. It ends with one summary line. When nothing was due, the line says so.

"Nothing is due" has one meaning in this design: this run imported no file, no file waits for a write or a removal, and no conflict waits. Ready work and a claim that ended are not "due". A direct run still lists them. A trigger run does not print because of them.

The two kinds of run:

- A direct run has no `--event`. A person or an agent types it. It runs the same two-way sync as `work sync`: it imports, and it writes or removes repo copies under the sync table. It always prints its result.
- A trigger run has `--event <name>`. Only a hook starts one. It never writes or removes a project file. It imports only, and it reports each file that waits for a direct run (OD-5). It prints nothing when nothing is due. A trigger run with `--event branch-change` does not import. It does the read steps only and reports what waits (OD-9, option A).

So the event name does two things, and both follow from "a hook started this run": the run writes no project file, and the run is quiet when nothing is due.

Rules:

- It is safe to repeat. A second run right after the first changes nothing and says that nothing is due.
- It never fails because of a missing Store. Without a usable Store it says in one line that the `docs/work/` files are the authority, and it exits 0. In a folder that is not a Make Docs project it says so and exits 0.
- It is one registry operation with one MCP tool, so the CLI and MCP share one core. The sync step needs the same Store write and project write access as `work sync`. The other steps need only Store read and project read access, as `work next` does.
- A caller with read access only still gets a useful result. The checkpoint does step 1, the read-only sync check, step 3, and step 4. It says in one line that the sync waits, how many files wait, and that a caller with write access must run the checkpoint. It exits 0, because nothing failed, and the result has a field that says that the sync did not run. A caller with no Store access gets the "files are the authority" line and exit 0. The plan finds how the registry admits one operation whose sync step needs more access than its read steps.
- The result names the checkout that it synced. When the first sync of this checkout was not done before the run, the result says so. A trigger run can be that first sync. It then imports every work file of that branch (1,380 ms in `PERF-004-R1`), and no person chose that moment. The risk section names this case.
- It adds no Store table. It reads and writes only what `work sync`, `work status`, and `work next` already use. The reminder check is separate (OD-6).

The name and group are owner decision OD-7: `make-docs project checkpoint`.

#### The CLI reminds by itself

Some Make Docs commands check whether work files wait for sync. When they do, the command prints one line after its normal output, with the exact command:

`Work files wait for sync. Run: make-docs <checkpoint command>`

Rules:

- Exactly these commands show the reminder: each registry operation that runs in a Make Docs project and whose declared access already includes a Store read. The plan lists them from the registry. A command with no Store read in its declared access shows no reminder, so the check never opens a Store that the command may not open. `--help`, `mcp`, `update`, `uninstall`, `work status`, `work next`, `work sync`, and the checkpoint itself show no reminder line. `work status` and `work next` already say the same thing in their own result.
- The check runs the authority rule first. When the work store is not in charge, the check stops and prints nothing. Any error in the check is dropped and never fails the command.
- How the check finds a change is owner decision OD-6: the exact check. The compare of file change times with the ledger time `synced_at` is not an option, because the checked facts show that it does not work. The reminder counts one thing only: work files that the next checkpoint run would import. It does not count a sync conflict, and it does not count a file that waits for a write or a removal. `work status` and the checkpoint result report those. With this rule, a checkpoint run with write access clears the reminder, because both kinds of run import. OD-6 says how each option meets this rule.
- The line goes to standard error in the CLI, so JSON output on standard output does not change.
- In an MCP tool result the reminder is one field of the result object. That object is sent as text in `content` and as `structuredContent`, so a host that reads only one of the two still gets the reminder. A tool with an `mcpResultSchema` has a fixed result schema and another path in `formatMcpToolResult`. Such a tool shows no reminder in this Wave, unless the plan proves a way that keeps its schema valid.
- At most one reminder appears for each command run.

#### The read commands say what waits (the owner's "sync on read")

Owner decision 1 names this part "sync on read". With the recommended option A of OD-2, a read command does not sync. It keeps "Changes nothing", it detects the out-of-date state, and it names the checkpoint. This is a departure from the owner's words, and OD-2 asks the owner to accept it or to choose a real sync. The rest of this section describes option A:

- When the sync check finds files that wait for import, `work next` and `work status` put the checkpoint command first in their result, before the list.
- `work next` marks each listed unit whose file waits for import, so an agent does not act on an out-of-date line.
- A mark cannot show a unit that is not in the store. So when a new work file waits for import, or when the first sync of this checkout is not done, `work next` says in one line that the list is not complete, and names the checkpoint command.
- A project URI read names no checkout, and its code runs no sync and no sync check. That stays. Its text already says that it does not show sync conflicts. It gains one fixed sentence: the read does not know whether work files wait for sync in a checkout, and the checkpoint command there finds out.

#### One router rule

The managed block of the root router gains one short line. Proposed text:

"When the work store is in charge (`make-docs work status` says so), read work with `make-docs work next` and `make-docs resource read`, not with file searches, and run `make-docs <checkpoint command>` after you change files under `docs/work/` and after you close a phase. Without the CLI or a usable Store, the `docs/work/` files are the authority."

The command in this text has no `--event`, so an agent that obeys the rule makes a direct run.

Every text of this design that ships is written upstream first, in `packages/docs/template/`, and then copied to this repository's installed copy. That holds for the root router (`packages/docs/template/AGENTS.md` and `CLAUDE.md`), for the `docs/work/` router (`packages/docs/template/docs/work/AGENTS.md` and `CLAUDE.md`), and for the work store reference (`packages/docs/template/.make-docs/system/references/work-store.md`).

#### The note at the point of use

The `docs/work/` router gets the owner's conditional wording in its managed block (OD-3, option A). Proposed text, in place of today's work store line:

"When the work store is present, it is the authority (`make-docs work status` says which). Read it with `make-docs work next`, and run `make-docs <checkpoint command>` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, read `.make-docs/system/references/work-store.md` or `make-docs://system/reference/work-store.md`."

The note holds in both cases, as owner decision 2 requires. It keeps the owner's word "present". A Store can be present and still not be in charge: the checkout is not bound, the schema is old, the Store is not safe, or the caller is denied. So the note points to `make-docs work status`, which says who is in charge and why. The note changes no work file, so no digest changes and no sync starts.

#### MCP server instructions

The Make Docs MCP server sends short server instructions when an agent connects. Today it sends none. The text is the same rule as the router line, in the same conditional words. A profile that has no work tool sends no work rule.

Tool results carry the next step:

- Each work tool result that finds files waiting for sync names the checkpoint tool as its next step.
- The checkpoint result names the next ready unit and the claim command for it.
- This Wave adds no uniform next-step field to every operation. It uses the `lines` and `summary` fields that work results already have. These fields are part of the result object, so they reach a host through the `content` text and through `structuredContent`. The work tools have no `mcpResultSchema`, so they use the plain path. The plan confirms this for each tool that it changes.

#### The agent form

The checkpoint is deterministic logic, so it needs its agent form.

- `make-docs://system/reference/work-store.md` gains a "Checkpoint" section: when to run it, what it does, and what to do by hand when the CLI is missing.
- Each checkpoint rule gets a rule ID in the catalog `make-docs.work-store-rules.v1`. The existing test fails when a rule ID is on one side only.
- Without the CLI or a Store there is nothing to sync, and the agent form says so. The agent reads and edits the files and applies the readiness rules by hand, as today.
- The router lines and the MCP instructions are the agent form of the triggers. A test checks that each names the current checkpoint command from the name catalog (PRD 39 R-NAME-6).

### Phase 2

#### Git hooks

Setup offers to install four git hooks: after a commit (`post-commit`), after a merge (`post-merge`), after a rewrite of commits (`post-rewrite`), and after a branch change (`post-checkout`). The first three run the checkpoint with `--event commit`. The hook after a branch change runs it with `--event branch-change`. An agent that commits fires this trigger with any agent tool and with no agent memory. The hook after a branch change acts only on a branch change (third argument 1), and not on a file checkout. An amended commit fires two hooks, so the checkpoint runs two times. The second run finds nothing due.

The hook after a rewrite exists for one gap: `git pull --rebase` with local commits runs no hook after a merge. The hooks after a merge and after a rewrite mark the end of the git action, so they run the checkpoint also when git still shows its merge or rebase state. The plan proves this with a test. If the test fails on a platform, the plan names the gap in the hook review that setup shows, and the reminder and the next commit cover it.

Hook rules:

- A hook never blocks and never fails a git action. It always exits 0.
- A hook is fast and quiet. It prints nothing when nothing is due, in the meaning that "One checkpoint command" gives. When something waits for a person, it prints at most the summary line and the command.
- A hook does nothing when the `make-docs` command is not found, when no usable Store exists, when the folder is not a Make Docs project, or, for the hooks after a commit and after a branch change, while git is in the middle of a rebase, a merge, a cherry-pick, or a bisect. The hooks after a merge and after a rewrite do not use that rule, because they run at the end of the action.
- When the hook may read the Store but may not write it, the checkpoint does its read steps, and the hook prints the one line that says how many files wait and which command to run. When the hook may not use the Store at all, it prints nothing.
- A hook never writes a project file, so a commit never leaves the work tree changed (OD-5).
- The hook after a branch change does not import. It only reports (OD-9, option A).
- A hook lives with existing hooks. Make Docs adds a marked block to a hook file that is a shell script, and keeps every other byte. It refuses, with a clear reason and no change, when the hook file is not a shell script, when another tool owns the hooks, or when `core.hooksPath` points to another folder.
- Setup shows each hook path and the exact block before it writes, and the person selects it explicitly.
- The Store records the exact block that Make Docs wrote. Setup reports drift when the block changed. `setup remove` removes only a block that still matches, and keeps a changed block with a report.
- Every worktree of one clone shares the hook files. Removal in one worktree must not break the others. See "Who owns a shared hook block" below.

The scope of the offer is owner decision OD-1: `make-docs setup` offers the hooks for each project, the person opts in, and a machine preference can make "yes" the default answer for each new project.

##### Risk: one project store, many branches

The checked facts say that units belong to the project, and that the ledger belongs to one checkout. A clone can have many linked worktrees on different branches, and they share one set of hooks and one project store.

- Today an import happens only when someone runs a work write command. With hooks, an import happens after git actions, so it happens much more often and with no person who chose it.
- A hook that imports after each branch change would import that branch's work files into the one project store. A person who only looks at an old branch would move the store back to that branch. The store would follow the last branch that someone touched.
- Every other worktree then sees the store change in its next sync: as files that wait for a write, or as a conflict when its own file also changed. Sync never settles a conflict, so nothing is overwritten with no report. But the person gets pending writes and conflicts that no one asked for.
- A hook after a commit or a merge has the same effect in a smaller form. It imports the files that changed in that checkout since its last sync. When the checkout has no sync yet, it imports every work file of that branch, and no person chose that moment. A commit is a deliberate change of work, so this is the case that the owner wants.

This design reduces the risk with OD-9, option A: the hooks after a commit, a merge, and a rewrite import, and the hook after a branch change only reports.

The same risk exists without hooks. An agent that runs the checkpoint by hand in a worktree on another branch imports that branch's work files into the project store. This is not new: each work write command already syncs first in the same way. This design does not remove that risk. It does three things. The result of a checkpoint names the checkout that it synced. The sync rules keep each difference visible as a pending write or a conflict. And the plan records the risk in the [register](../prd/03-open-questions-and-risk-register.md), with the two-worktree test from the evidence list. A store that holds work for each branch is a larger change, and it is not part of this Wave.

##### Who owns a shared hook block

This is a design rule and a recommendation, not an owner decision. The clone owns the hook block. The Store records the block for the clone's shared git folder. `setup remove` in one checkout removes the block only when no other bound checkout of that clone remains. Until then it reports that the block stays, and why. The other form, in which each checkout owns the block, would stop the hooks for every other worktree with no report there, so this design does not offer it. The Store file ledger belongs to one checkout today, so this rule may need a new Store record for the clone. The plan checks whether an existing record fits. If none fits, that is a Store schema change, and the plan stops for schema authority under PRD 38 and asks the owner then.

#### Agent tool hooks

Each first-party adapter gains a hook method where its agent tool supports hooks. The method fires `session-start`, `turn-end`, or both, and runs the checkpoint.

- A hook method is added only with real capability evidence for that agent tool, as PRD 28 requires. The plan gathers this evidence for Codex, Claude Code, and GitHub Copilot CLI. This design claims no hook support for any of them.
- An agent tool with no proven hook support gets no hook method. The git hooks, the router rule, the MCP instructions, and the CLI reminder still cover it. The generic MCP client profile gets no hook method.
- Each method follows the adapter contract: one owned native entry, planning, apply, verification, repair, and removal (PRD 28 R-HARNESS-1), and a receipt that records its history (PRD 28 R-HARNESS-17).
- The person selects the hook method explicitly in setup. It is off by default.
- PRD 28 says today that Make Docs has no hook product. This design asks to change that sentence to admit these bounded hooks: the git hooks of owner decision 4, and the agent tool hooks. The owner approved that change on 2026-11-27, with a clarification that OD-10 records. Whether the change also admits agent tool hooks is open decision OD-10. PRD 30 keeps the admission boundary for anything further.

### Later stages

This Wave does not build these. The [roadmap](../assets/project/2026-11-27-checkpoint-events-and-store-first-roadmap.md) describes each one, what it depends on, and its risks. It records nothing as committed.

- A person-editable event registry in config, with more adapters.
- The planned server watches the folders and syncs by itself.
- Designs, plans, and archives move into the Store, and files become optional.
- A gateway service in the path of model traffic that fires events for any agent tool.

The event names and the single checkpoint command in this design are what those stages build on.

### Order

Phase 1 depends on nothing outside W29 R0, which is released, unless the owner takes OD-6 option B. That option needs a Store schema change first. Phase 2 depends on the Phase 1 checkpoint command. Phase 2 git hooks need OD-5 and OD-9 settled, and the ownership rule for a shared hook block proved. OD-1 is settled. Phase 2 agent tool hooks need the capability evidence first.

Phase 1 has no trigger that is free of agent memory. The router rule, the `docs/work/` note, and the MCP instructions are text that the agent must read and obey. The CLI reminder and the read command lines need a Make Docs command that the agent already runs. An agent that reads no router and runs no Make Docs command is not reached in Phase 1. The first trigger that needs no agent memory is the git hook of Phase 2. So Phase 1 alone lowers the problem, and Phase 2 is what closes it for agents that commit.

### New ideas in this design

These parts do not come from existing docs or from the owner's decisions. The owner should know they are new:

- The six event names and the `--event` input.
- The split into a direct run and a trigger run, with `--event` as the sign of a trigger run.
- The rule that a trigger run imports only and never writes a project file (OD-5).
- The rule that the hook after a branch change only reports (OD-9).
- The meaning of "nothing is due".
- The result of the checkpoint for a caller with read access only, and its exit code 0.
- The reminder on each command with Store read access, and both ways to find a change (OD-6).
- The reminder line on standard error, and as a field of the result object in MCP results.
- The mark on each `work next` unit whose file waits for import, and the line that says that the list is not complete.
- The fixed sentence in a project URI read that says it does not know whether files wait for sync.
- The hook after a rewrite of commits.
- The rule that the clone owns a shared hook block.
- The marked block in a shared hook file, and the refusal when another tool owns the hooks.
- The rule that the hooks after a commit and after a branch change do nothing while git is in the middle of a rebase, a merge, a cherry-pick, or a bisect, and that the hooks after a merge and after a rewrite still run.
- The rule that the reminder counts only files that the next checkpoint run would import.
- The rule that the hook after a branch change acts only on a branch change, and not on a file checkout.
- The list of claims that ended or end soon in the checkpoint output.
- The exact wording of the router lines and the MCP instructions.
- The request to change the PRD 28 sentence that says Make Docs has no hook product.

### Owner decisions with their options

Each decision has at most two options and one recommendation. The owner decided OD-1, and on 2026-11-27 also chose option A of OD-2, OD-3, OD-5, OD-6, OD-7, and OD-9. One decision is open: OD-10. The numbers OD-4 and OD-8 are not used any more: OD-4 follows from owner decisions 1 and 3, and OD-8 is now a design rule in "Who owns a shared hook block". A recommendation in this section is not a decision.

**OD-1: What is the scope of the git hooks?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): `make-docs setup` offers the git hooks for each project, and the person opts in. A machine preference can make "yes" the default answer for each new project. Make Docs sets no machine-wide git hooks path.
- B: a machine install that sets a machine-wide git hooks path, so that every repository on the computer runs the Make Docs hooks.

Facts: a machine-wide `core.hooksPath` replaces the hooks of every repository on the computer, also repositories that do not use Make Docs, and it collides with hook managers that use the same setting. Git does not copy hooks on clone, so each clone needs setup in both options. Linked worktrees share the hooks of the main checkout, so one project setup covers all worktrees of that clone.

Why A: it changes only the repositories that the person selected, it lives with other hook tools, and it follows the explicit selection rule of PRD 28. The machine preference gives the "install once" feeling without the machine-wide risk.

**OD-2: Do the read commands sync first?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): no. The read commands only detect the out-of-date state. They put the checkpoint command first in their result, mark the affected units, and say when the list is not complete. The checkpoint command does the write.
- B: `work next` syncs first and loses "Changes nothing". `work status` stays read-only.

Facts: owner decision 1 names "sync on read". Option A does not sync on read, so it departs from the owner's words. Option B does what the words say. `work next` and `work status` say "Changes nothing" in their help, in PRD 52 R-WORK-SYNC-8, and in work rule `WORK-RULE-052`. `work next` needs only Store read access, and sync needs Store write and project write access, so option B changes its access. The read commands already run the sync check and print the result.

Why A: the read commands promise "Changes nothing", and other text and agents rely on that promise. With A, the promise and the access stay as they are, and an agent with read access can still run `work next`. The agent still learns in the first line that the store is out of date and which command settles it. The code shows no safer path for B.

**OD-3: Where does the note at the point of use live?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): one conditional line in the managed block of `docs/work/AGENTS.md` and `docs/work/CLAUDE.md`.
- B: one line at the top of each work file.

Facts: the folder routers exist today and already have a work store line. A line in each work file changes user files, changes their digests, and starts a sync of every file. The parser and writer must round-trip each file byte for byte (PRD 52 R-WORK-SYNC-7), so a new line needs a format change. Old backlogs would need a rewrite. An agent that opens one work file directly, with no folder read, does not see the router.

Why A: it changes no user file, and it reaches every agent tool that reads folder routers. The root router line and the MCP instructions cover the direct-open case.

**OD-5: Does a trigger run write project files?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): no. A trigger run, which only a hook starts, imports files into the store and reports the rest. Only a direct run of the checkpoint or of `work sync` writes or removes repo copies.
- B: every checkpoint runs full two-way sync.

Facts: with option B, a hook after a commit can write a work file, so the work tree is changed right after the commit. PRD 52 R-WORK-SYNC-9 says today that each sync after the first writes and removes files under the sync table. Option A adds a second kind of sync that only imports, so that requirement changes. The first sync of a checkout already only imports. With option A, a file that waits for a write stays in that state until a direct run, and the hook prints one line for it after each commit until then.

Why A: a git action never leaves a surprise in the work tree. The store still gets every file edit, which is the main goal.

**OD-6: How does a command know that work files wait for sync?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): each command that shows the reminder runs the exact check that `work status` and `work next` run today. It reads and hashes each work file. No Store schema change.
- B: the Store keeps one "last check" record for each checkout: the count of work files and the newest file change time. Each sync and each checkpoint with write access writes the record when it ends. The reminder check reads no file bytes. It compares the count and the newest file time with the record. This is a Store schema change.

Facts:

- The form in the first draft, a compare of file change times with the ledger time `synced_at`, does not work, and neither option uses it. The checked facts give the reason.
- Cost of A: `PERF-004-R1` measured the exact check at about 250 ms over the 84 ms floor for each command, with 463 work files, at about 0.65 ms for each file. So a command of 84 ms becomes a command of about 330 ms. The cost grows with the count of work files.
- Cost of B: not measured. It reads the file data of each work file but no bytes, and one Store row.
- A is never wrong. B is a hint. B can miss an edit that keeps both the count and the newest file time, for example a file that is restored with an old time. B cannot stay on, because each checkpoint with write access writes the record again.
- A needs no Store schema change. B needs one: two new fields in `work_sync_checkouts` (schema version 10), a row in the PRD 38 field register, and a migration. Phase 1 then depends on that schema work.
- The reminder counts only files that the next checkpoint run would import. Option A gets that count from the exact check, which also finds conflicts and files that wait for a write. The reminder leaves those out, and `work status` and the checkpoint result report them. Option B sees only file changes. It cannot see a conflict or a change on the store side at all, so with B those appear only in `work status` and in a checkpoint result.
- With both options, a checkpoint with write access clears the reminder, because both kinds of run import. A caller with read access only cannot clear it. An open conflict does not hold the reminder on.
- Both options open the owner's decision of 2026-11-23 again, "Fast path: not now", with a look again at about 900 work files. Option A keeps "no fast path", but it puts the cost of the exact check on more commands than that decision covered. Option B is a fast path.

Why A: it is exact, it adds no stored data, and it needs no migration. Its cost is measured and is well under the 1 second line that the 2026-11-23 decision used. The plan measures it again on the commands that show the reminder. B is the next step when this repository holds about 900 work files, or when a person reports a slow command, as the earlier decision already says.

**OD-7: What is the name of the checkpoint command?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): `make-docs project checkpoint`, MCP `project_checkpoint` (18 characters), operation `project.checkpoint.run`.
- B: `make-docs project sync`, MCP `project_sync` (12 characters), operation `project.sync.run`.

Facts: both names follow PRD 39 R-NAME-1 to R-NAME-4, and `sync` is already an end word, in `work sync`. `make-docs lifecycle checkpoint` exists with another meaning, so option A shares a verb with it, and the help text of both must say how they differ. Option B shares no verb with it, but it is close to `work sync`, and the command does more than sync: it also lists ended claims and the next work. The command name is written into router blocks, hook files, and MCP instructions in every project. A later rename leaves an old name in those files, and the alias of R-MIG-1 lasts only two minor releases. The roadmap adds designs, plans, and archives to the Store, and they need the same command. Both options are in the `project` group for that reason.

Why A: the word says what the command is, a point at which all that is due gets done, and not only a sync. The name does not need to change when other data joins the Store. Today its only steps are work steps, and it says so.

**OD-9: Which git hooks import?** Decided on 2026-11-27: the owner chose option A.

- A (chosen): the hooks after a commit, a merge, and a rewrite import. The hook after a branch change only reports what waits.
- B: all four hooks import.

Facts: units belong to the project, and the ledger belongs to one checkout. One clone can have many linked worktrees on different branches over the same project store. With option B, each branch change imports that branch's work files, so the store follows the last branch that someone touched, also when the person only looked at an old branch. Other worktrees then see pending writes or conflicts. With option A, a branch change alone never changes the store. The store still gets the files at the next commit, merge, or direct run in that checkout. With option A, the store can stay out of date after a branch change until then, and the hook says so in one line. The section "Risk: one project store, many branches" gives the full facts, also for a checkpoint that an agent runs by hand.

Why A: a commit and a merge are deliberate changes of work. A branch change is often only a look. The store should not move because someone looked.

**Approval: the PRD 28 sentence about hooks.** Approved on 2026-11-27. The owner approved the change of the sentence "Make Docs has no general plugin, hook, extension, workflow-bundle, or Playbook-generated Skill product." The owner added one clarification: that sentence was meant for hooks that belong to one agent tool. Git hooks were not considered when it was written. The owner said that git hooks are an excellent way to solve something that the owner was reluctant to include.

**OD-10: Does this Wave build agent tool hooks?** Open.

- A (recommended): no. This Wave builds the git hooks only. The PRD 28 sentence changes to admit git hooks only. Agent tool hooks move to the roadmap as one more adapter, and each one needs real capability evidence first.
- B: yes. Phase 2 also builds a hook method for each agent tool that has capability evidence, as owner decision 1 first said.

Facts: owner decision 1 put "the hooks of each agent tool" in Phase 2. The owner's clarification of the PRD 28 approval says that the owner was reluctant to include hooks that belong to one agent tool. The two statements do not agree in full, so the orchestrator asks. Git hooks reach each agent that commits, with any agent tool. An agent tool hook reaches an agent that never commits, for example at the end of a turn. This design claims no hook support for any agent tool.

Why A: it follows the owner's clarification, it keeps the Wave small, and it keeps Make Docs free of code for one agent tool's hooks until evidence exists. Its cost: an agent that never commits is reached only by text and by the reminder.


## Alternatives Considered

- **Tell agents in a Skill.** Not chosen as the main path. A Skill loads only when its agent tool selects it, so it has the same memory problem. The router line and the MCP instructions reach the agent without a selection.
- **Sync inside every Make Docs command.** Rejected. Read commands would write, each command would need Store write access, and a failed sync would fail commands that have nothing to do with work.
- **A compare of file change times with the ledger time.** Rejected. The ledger time changes only for a file that sync applies, so the reminder would show on every command after a branch change, and no checkpoint would clear it. See OD-6.
- **A hook that imports after each branch change.** Not recommended. See OD-9.
- **A background file watcher in this Wave.** Not chosen. It needs a process that stays alive, with start, stop, and failure rules. The planned server is its natural home, so it is a roadmap item.
- **A gateway in the path of model traffic in this Wave.** Not chosen. It is a separate project with privacy, sign-in, and failure risks. With the event list, it is one more adapter later. The roadmap records it with its strengths and costs.
- **Several commands, one for each trigger.** Rejected. An agent must remember one command. One command also means one twin, one test set, and one name in every installed file.
- **A git hook before the commit that blocks it when the store is out of date.** Rejected. A hook must never block or fail a git action.
- **A note in every work file.** Not chosen. See OD-3.

## Consequences

- In Phase 1 an agent meets the same rule at four points: when it connects through MCP, when it reads the root router, when it reads the `docs/work/` router, and when it runs a Make Docs command that shows the reminder. Each of these needs the agent to read text or to run a Make Docs command. Phase 2 adds the fifth point, the commit, which needs no agent memory. No single point needs to work for every agent tool.
- These PRDs will change. The plan names the exact requirements, and this design edits none of them:
  - [PRD 52](../prd/52-work-store-and-work-queue.md): the checkpoint operation and its rules, the reminder, the `work next` marks and its "list is not complete" line, R-WORK-SYNC-8, R-WORK-SYNC-9, and R-WORK-URI-3. R-WORK-SYNC-9 says that each sync after the first writes and removes files, and an import-only trigger run changes that. R-WORK-URI-3 gains the new sentence of a project URI read.
  - [PRD 39](../prd/39-cli-command-model-and-operation-registry.md): the name catalog entry, R-TOP-1, R-RUN-1, and the reminder output rule.
  - [PRD 25](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): MCP server instructions, the new tool, and the twin.
  - [PRD 28](../prd/28-shared-agentics-installation-and-harness-exposure.md): the hook method of each adapter and the sentence about hooks. The owner approved the change of that sentence on 2026-11-27. OD-10 settles whether it admits agent tool hooks. [PRD 30](../prd/30-plugin-substrate-and-workflow-bundles.md) if the admission boundary moves.
  - [PRD 15](../prd/15-agent-instruction-ownership-and-managed-blocks.md) and [PRD 06](../prd/06-template-contracts-and-generated-assets.md): the new router lines and the work store reference.
  - [PRD 07](../prd/07-cli-command-surface-and-lifecycle.md): the git hook offer in setup, and its removal in `setup remove`.
  - [PRD 38](../prd/38-global-store-and-project-state.md): the hook ownership record and the machine preference, and the two "last check" fields if the owner takes OD-6 option B.
  - [PRD 24](../prd/24-project-configuration-and-convention-overlay.md) only if the plan puts a hook setting in project config.
- A managed router block changes in every installed project on the next update. Projects with a changed block go through the normal conflict review of PRD 15.
- Make Docs writes into `.git/hooks` for the first time. This is a new kind of owned file, outside the project tree for worktrees. The ownership and removal rules must be proved before release.
- The reminder check adds cost to each command that shows it: about 250 ms with OD-6 option A at 463 work files, by `PERF-004-R1`. The plan measures it.
- Either option of OD-6 opens the owner's decision "Fast path: not now" of 2026-11-23 again.
- Risk: one project store serves every branch and worktree. A hook or a hand-run checkpoint in a worktree on another branch imports that branch's work files, and other worktrees then see pending writes or conflicts. OD-9 reduces this for a branch change. The rest of the risk exists today for each work write command, and this design does not remove it. The plan records it in the register.
- Risk: a hook runs the CLI under an agent tool whose access rules deny Store writes. With Store read access, the hook prints the one line that says what waits. With no Store access, the hook prints nothing, and the CLI reminder and router rule remain. The plan tests a hook run from each first-party agent tool.
- Risk: `git pull --rebase` with local commits runs no hook after a merge. The hook after a rewrite covers it in the review test with git 2.47.1. The plan proves it on each supported platform or names the gap.
- Risk: a trigger run can be the first sync of a checkout. It then imports every work file of that branch at a moment that no person chose.
- Risk: the reminder becomes noise. It is one line, it appears only when the work store is in charge and files wait for import, and a checkpoint with write access clears it. A conflict or a file that waits for a write does not show it. A caller with read access only cannot clear it.
- Risk: the name is written into many files. OD-7 exists to choose it once.
- Risk: the agent form drifts from the checkpoint code. The shared rule IDs and the name catalog test catch a one-sided change.
- Without a Store, every part does nothing or says that the files are the authority. No existing no-Store behavior changes.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Work Store](2026-11-21-work-store.md), [Factory](2026-11-21-factory.md), [Command Tree and Tool Names](2026-11-22-command-tree-and-tool-names.md), [Unified Setup and Harness Access](2026-09-12-unified-setup-and-harness-access.md), and [Static Harness Adapters and Conformance Retirement](2026-09-14-static-harness-adapters-and-conformance-retirement.md).
- Reason: the work store design made sync run at the start of each work command. This design adds the triggers that make agents reach those commands. It keeps the sync rules, the read-only promise of the read commands, the name rules, and the adapter contract of those designs. It asks to change one sentence of PRD 28 about hooks, and it adds an import-only kind of sync that changes PRD 52 R-WORK-SYNC-9.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: the active PRD set owns the work queue, the command names, the MCP server, setup, and the router blocks. This design adds one operation and several triggers that change those owners. It adds no new PRD subject.
- Coordinate Handoff: Recommended W35 R0 as new work, by the outcome test. The related completed coordinate is W29 R0, which promised sync at the start of each work command and delivered it. No Wave promised that agents run those commands, or any hook. The owner said "the next Wave" on 2026-11-27, and W34 is the highest Wave in `docs/work/`, `docs/plans/`, and the register. The planner checks the choice under the wave-model decision procedure. On 2026-11-27 the owner chose option A of OD-1, OD-2, OD-3, OD-5, OD-6, OD-7, and OD-9, and approved the change to the PRD 28 sentence that says Make Docs has no hook product. OD-10 is open: whether this Wave builds agent tool hooks.
