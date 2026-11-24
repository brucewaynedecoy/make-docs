---
title: "53 Factory Setup and Orchestration"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/00-overview.md"
---

# 53 Factory Setup and Orchestration

## Purpose

Own the Make Docs factory: the opt-in capability that sets up a person's agent tools once, proves the wiring, saves it, and runs ready work through builders, reviewers, and corrections, with a human channel for the decisions that need a person. Make Docs plans the work, and its factory runs the work. The person's own tools do the work. Make Docs has no workflow engine.

## Scope

This capability covers:

- the standard roles and custom roles;
- capability matching between roles and tools;
- factory setup, its test task, and workflow readiness;
- workflow types and their limits;
- saved setup records, their location, and their generated local copies;
- the resolved workflow plan and its revisions;
- the never-log list and the reason codes;
- assignment records, their status moves and correction rounds, and their link to work claims and lifecycle runs;
- the run loop, waking, the human channel, the escalation floor, and acceptance;
- the working rules for builders, reviewers, and integration;
- file backups outside git;
- the `factory` operations and the `factory` MCP profile;
- the project scope of each factory operation and its result; and
- the factory URIs under the project-resource URI family.

This capability does not own the work queue, Store fields and migrations, config keys, Skill delivery, resource identity, the operation registry, lifecycle stages, or backlog review. Those remain with [PRD 52](52-work-store-and-work-queue.md), [PRD 38](38-global-store-and-project-state.md), [PRD 24](24-project-configuration-and-convention-overlay.md), [PRD 08](08-skills-catalog-and-distribution.md), [PRD 06](06-template-contracts-and-generated-assets.md), [PRD 39](39-cli-command-model-and-operation-registry.md), [PRD 14](14-lifecycle-workflow-and-coverage-passes.md), and [PRD 51](51-backlog-review-and-reporting.md).

Code anchors:

- `packages/skills/factory/`
- `packages/skills/factory-setup/`
- `packages/docs/template/`
- `packages/cli/src/operations/`
- `packages/cli/src/store/`

## Component and Capability Map

### Product boundary

- R-FACTORY-1 (MUST): the factory is tool-agnostic. No default, example, fixture, or required step assumes that a particular app, harness, provider, multiplexer, scheduler, or messaging tool is present.
- R-FACTORY-2 (MUST): the factory is opt-in. It stays off until a person runs factory setup. A project that does not use the factory sees no change.
- R-FACTORY-3 (MUST): the factory needs the CLI and a usable Store. Without either, setup stops, names what is missing, and names the setup step that fixes it. The factory has no zero-config mode.
- R-FACTORY-4 (MUST): v1 supports software, personal, and business work. A project folder does not need git.
- R-FACTORY-5 (MUST NOT): the CLI and MCP operations launch, schedule, message, or contact any tool. They check and record. Agents do the work through the tools that setup wired.

### Roles

- R-FACTORY-6 (MUST): the factory ships four standard roles. The front desk talks to the person through the human channel and turns requests into units or quick items. The foreman syncs the work store, checks assignments, takes ready work, chooses the team, assigns jobs, judges results, accepts units inside the given scope, and escalates. A builder does one bounded job and returns the actual result with evidence. A reviewer checks a candidate against the requirements.
- R-FACTORY-7 (MUST): a project can add a custom role. A custom role names its job, the capabilities it needs, what it returns, and its context kinds. Only a custom role, one that the project adds, must list its context kinds. The front desk and the foreman need no list, and a builder and a reviewer keep their default lists. The config check refuses a custom role without a list, with a plain message that names the role, for example: `The role "researcher" has no context list. A custom role must list its context kinds, for example [unit-record, requirements].`
- R-FACTORY-8 (MUST): in the smallest setup, one agent tool that can read files, write files, and run commands is the front desk and the foreman. Builders and reviewers are fresh subagents of that agent. A reviewer is never the session that built the work.

### Capability matching

- R-FACTORY-9 (MUST): setup gives a role to a tool because of what the tool can do, not because of its name. The capability catalog in `make-docs://system/contract/factory-contract.md` includes at least: read and write files, run commands, launch agents, wait for an agent, read an agent's result, wake on a schedule, wake on an event, message the person, receive the person's answer, isolate a working copy, and edit code.
- R-FACTORY-10 (MUST): setup records each capability it found, how it proved it, and the role it gave each tool. It records one proof for each capability of each bound tool: the tool, the capability ID, the tool version that the agent reported, the proof time, the result (`proved`, `unproved`, or `contradicted`), and a "does not cover" list of the parts that the proof did not test. A capability that a tool claims but setup could not prove is `unproved`. A capability whose proof failed is `contradicted`. A role never depends on an `unproved` or `contradicted` capability. A proof holds only for the tool version that it names. When an agent reports a different version of a bound tool, the workflow is `drifted` with the reason code `tool-version-changed`. To reach `ready` again, setup runs each proof of that tool again and saves the proofs, saves the workflow, which makes a new plan revision, and passes a new test task under that revision. If the old tool version comes back first, the plan matches the `ready` revision again, and the workflow is `ready` with no new step. The CLI compares reported versions. It never asks a tool for its version.
- R-FACTORY-53 (MUST): a capability ID uses lower-case letters and hyphens. An ID is only ever added. It is never removed, renamed, or given a new meaning. `factory tools save` and `factory workflow save` refuse an unknown capability ID with the reason code `unknown-capability`.

### Setup

- R-FACTORY-11 (MUST): the `factory-setup` Skill finds the tools on the machine and in the project, reads the instructions those tools make available, interviews the person for preferences and permissions, wires roles to tools by capability, runs one small test task through the whole workflow, and saves the result.
- R-FACTORY-12 (MUST): a workflow has one readiness state: `draft`, `wired`, `ready`, or `drifted`. The CLI computes the current resolved plan each time from three live sources: the workflow's entry in the config file, the workflow type file, and the machine tool rows in the Store. The machine tool rows give each bound tool's state (`available`, `missing`, or `blocked`), its reported version, and its proof results; the CLI does not take these from the copy in the saved binding. The saved binding gives only the choices that setup saved, and those change only through a save. When the current plan's digest matches the `ready` revision, the workflow is `ready`. When it matches another saved revision, the workflow is `wired` if each needed role is bound and proved, and `draft` if one is not. When it matches no saved revision, the workflow is `drifted`, and the result lists each drift reason code. A lost tool (`missing`), a tool that lost a permission it needs (`blocked`), a new tool version, a contradicted proof, a config edit by hand, and a changed type file each make the workflow `drifted`. An agent reports `missing` and `blocked` through `factory tools save`. A fix that restores the exact plan of the `ready` revision makes the workflow `ready` again with no new test task, because the passed proof belongs to that digest. A fix that gives a new plan needs a save and a passed test task. Only a passed test task makes a revision the `ready` revision. An expired or spent grant never changes readiness. Only a `ready` workflow takes new work.
- R-FACTORY-13 (MUST): setup lists each one-time manual step with what the person must do, why, and what it unblocks.
- R-FACTORY-14 (MUST): setup ends with a summary of which tool fills each role, how the workflow wakes, how the factory reaches the person, what the test task proved, each known loss that the person accepted, and each open manual step. A known loss is something that the workflow runs without: a capability that no tool could prove, an item on a proof's "does not cover" list, or a missing way to wake on its own. Setup asks the person to accept each known loss and saves each accepted one in the Store.
- R-FACTORY-15 (MUST): the machine's tool list and capability proofs are saved once per machine and reused by every project on that machine. Each project saves its own workflow choices.
- R-FACTORY-16 (MUST): a rerun updates the same workflow, shows what changed, and proves again each boundary that changed.

### Workflow types

- R-FACTORY-17 (MUST): workflow types are system resources of the existing reference type. The shipped types are `build-then-review`, `lead-and-specialists`, and `staged-backlog`. Each type works for software, personal, and business work.
- R-FACTORY-18 (MUST): build then review uses one builder and a separate reviewer, with corrections inside the limit. Lead and specialists lets the foreman split one unit across specialists and integrate their results. Staged backlog works through ready units in dependency order, and each unit uses one of the other two types.
- R-FACTORY-19 (MUST): a project can add its own workflow type as a committed, project-owned file. A project type uses the same fields as a shipped type and never replaces a shipped type silently.
- R-FACTORY-20 (MUST): each workflow saves its limits. The defaults are three correction rounds before escalation and no more parallel workers than the wired tools allow.
- R-FACTORY-21 (MUST): a workflow can include the step "run preflight on the unit before claiming it". The person turns this step on at setup. Without it, the factory does not start preflight.

### Saved records and local copies

- R-FACTORY-22 (MUST): the portable definition of each workflow lives in the `factory:` block of project config, as listed in R-FACTORY-55 and [PRD 24](24-project-configuration-and-convention-overlay.md) R-CONFIG-WORK-2: the type name and type version; each role's job, capability IDs, returns, and context kinds; the round limit and other limits; the gates and added escalation events; the optional steps such as preflight; the integration owner role; and the human channel kind.
- R-FACTORY-23 (MUST): machine tools and their states, capability proofs, role bindings, human channel and wake bindings, accepted known losses, grants, resolved plan revisions, assignments, proof results, and backup records live in the Store. Machine IDs and paths stay in the Store.
- R-FACTORY-24 (MUST): a grant permits an action outside the default authority, for example a merge, a deploy, a publish, or spending money. A grant belongs to one person on one machine. It never appears in committed config, in a local copy, or in a resolved plan. Each grant records its action, its scope, an optional expiry time, who granted it, and when. The scope is `once` (one use; the first recorded use spends it), `run` (the one lifecycle run that it names, until that run ends), or `standing` (every run of the workflow, until the person revokes it). `factory workflow save` writes each grant, at setup and during a run. During a run, after the person answers an escalation, the foreman records the answer with a grant-only save, and a `run` grant names its lifecycle run. A grant-only save writes or revokes only the grant: it resolves no plan, saves no revision, and does not change readiness. `factory workflow show` lists grants beside the plan, never inside it. Before an action outside the default authority, the foreman records the use of a grant through `factory assignment update`. The CLI refuses the use with `grant-missing`, `grant-out-of-scope`, `grant-spent`, or `grant-expired`, and the foreman then asks the person again. Setup recommends the narrowest scope that does the job.
- R-FACTORY-25 (MUST): `.make-docs/factory/` holds generated, read-only copies of the saved setup. Each file states that it is generated and that edits are lost. The copy of the resolved plan prints the latest revision and says whether it is the `ready` revision. No copy holds a grant. Make Docs never reads a copy as input. `factory restore` writes the copies again from the Store. The copy reads the integration owner role and the human channel kind from the resolved plan. Make Docs keeps `.make-docs/factory/` and `.make-docs/backup/factory/` out of git with a `.gitignore` file inside each folder that holds one line, `*`. Make Docs never edits the project root `.gitignore`.
- R-FACTORY-26 (MUST NOT): a factory record holds file contents, prompts, briefs, environment values, transcripts, or credentials. Factory records are the `factory:` config block, every factory Store record, every resolved plan revision, every local copy, and every status history entry. Secrets stay in the tools that own them. The CLI checks every factory write: it accepts only the fields that the record defines, allows free text only as one line of at most 120 characters, and refuses a value that looks like a credential or an environment setting with the reason code `never-log-field`. The refusal names the field, never the value. The backup copies in `.make-docs/backup/factory/` are file copies, not records.
- R-FACTORY-54 (MUST): drift results, refusals, and status history entries use reason codes from the fixed lists in `make-docs://system/contract/factory-contract.md`. A reason code is lower-case kebab-case. A code is only ever added. It is never removed, renamed, or given a new meaning. A message to the person explains each code in plain words.

### Resolved workflow plan

- R-FACTORY-55 (MUST): each workflow keeps three sources: the portable definition in its `factory:` config entry, the machine binding in the Store, and the workflow type reference that the config names. The CLI generates one resolved plan that joins them. No person or agent writes it by hand. The portable definition holds the type name and type version; each role's job, capability IDs, returns, and context kinds; the round limit; the gates and added escalation events that only a person decides; the other limits; whether preflight is on; the integration owner role; and the human channel kind. The machine binding has two parts. The saved binding holds, for each role, the bound tool by tool ID, and, for the workflow, the wake method, the human channel account as a reference with no secret, the working-copy method, and each accepted known loss. The machine tool rows hold, for each bound tool, its state, the proved tool version, the proof result, and the "does not cover" list. The integration owner role and the human channel kind live only in the config entry. The saved binding keeps no copy of them. The human channel account reference stays in the Store. Grants stay in the Store but are not part of the resolved plan, so a new or spent grant never needs a new test task.
- R-FACTORY-56 (MUST): the CLI writes the resolved plan as canonical JSON (sorted keys, no extra spaces, UTF-8). The plan digest is the SHA-256 of those bytes. The plan records the type name, the type version, the type file digest, and the status move table version. The Store saves each plan as an immutable revision with the workflow name, the revision number, the plan digest, the plan JSON, the config digest, the binding digest, and the time it was made.
- R-FACTORY-57 (MUST): `factory workflow save` resolves the current plan and saves a new revision only when no kept revision has its digest. It never makes a revision the `ready` revision. `factory proof save` records a test task result for the plan digest that the test ran under, refuses with `plan-digest-mismatch` a digest that is not the current plan's digest or that has no saved revision, and on a pass makes that revision the `ready` revision. `factory workflow show` reads the latest (newest saved) revision or one named revision, with the current plan digest, the `ready` revision, and each drift reason code, lists the grants beside the plan, and writes nothing. For each workflow, the Store keeps the `ready` revision, each revision that an open assignment names, and the 10 newest other revisions. Each save removes older revisions in the same write.
- R-FACTORY-58 (MUST): `factory assignment start` records the revision number and digest of the `ready` revision, and refuses with `not-ready` when the workflow is not `ready`. A takeover loads the exact revision that each open assignment names. A new revision never changes an assignment that has already started.
- R-FACTORY-59 (MUST NOT): the resolved plan holds steps, conditions, branches, joins, or code. It is data: who does each job, with which tool, under which limits, and which move table version applies. The CLI checks writes against it, never reads it to decide what to do next, and never starts anything. The foreman runs the loop from the `factory` Skill and reads the plan as a reference. So the plan is not a workflow engine, and R-FACTORY-5 holds. The plan never holds an item that R-FACTORY-26 forbids.
- R-FACTORY-60 (MUST): each role's context is a list of context kinds from a fixed set: `unit-record`, `requirements`, `project-files`, `candidate-result`, `defect-list`, `evidence-links`, and `builder-summary`. A role sees only what it is handed. A builder and a reviewer have a default list. By default, a reviewer never gets `builder-summary`. The front desk and the foreman need no list. A custom role must list its context kinds (R-FACTORY-7). The list names kinds only. The content is handed over at run time and is never saved.
- R-FACTORY-61 (MUST): each workflow type states its version in its `## Purpose` section as `Type version: N`, and goes up by one when its rules change. The config names the type version that the person chose. `factory workflow save` refuses a version that does not match the type file with `type-version-mismatch`. A changed type file makes the current plan differ from the latest revision, so the workflow is `drifted` with `type-changed`.

### Assignments, claims, and lifecycle runs

- R-FACTORY-27 (MUST): an assignment links one job to the tool doing it. A job is one work unit, one role, and one part label. The part label is a short lower-case kebab-case name that the foreman gives each part of a unit; a unit with one part uses `main`. An assignment holds the work unit, the role, the part label, the tool, the tool's task handle, the lifecycle run ID, the checkout ID of the checkout that `assignment start` named, not a worker's working copy, the status, the time of the last check, the correction round count, the revision number and digest of the resolved plan that it runs under, and a status history. The status history keeps the 20 newest status changes. Each entry holds the status, the time, and one reason code, and no free text. An assignment holds no prompt, transcript, or task graph. `assignment start` refuses a checkout that is not a bound checkout of the project with `checkout-not-bound`. A unit with an open assignment does not close and does not leave the work store; the work queue refuses with `factory-assignment-open` ([PRD 52](52-work-store-and-work-queue.md) R-WORK-QUEUE-9 and R-WORK-SYNC-16).
- R-FACTORY-28 (MUST): assignment status is one of `offered`, `running`, `returned`, `in-review`, `needs-correction`, `accepted`, `failed`, `cancelled`, or `unknown`. An assignment moves only along the [status move table](#assignment-status-moves). `accepted`, `failed`, and `cancelled` are final and never change. The CLI refuses any other move with `illegal-move`, and any change to a final assignment with `final-status`. An update that changes only the last check time is not a move. An `unknown` assignment is checked through its task handle before any other step.
- R-FACTORY-29 (MUST): the foreman can claim a wave, phase, stage, or task through the work queue. The default is a phase. It renews the claim at each check.
- R-FACTORY-30 (MUST): each claim opens one lifecycle run at stage `implementation`. Each assignment points to that run. Evidence is recorded through the existing evidence and lifecycle evidence operations.
- R-FACTORY-31 (MUST): the front desk adds a quick item with `work add`. A quick item is routed by capability, like any other unit. A small job can still go to a separate agent.

### Run loop

- R-FACTORY-32 (MUST): each time the foreman wakes, it syncs the work store and reads the workflow's readiness, checks open assignments through their handles, renews claims, judges returned work, sends it to a reviewer who did not build it, returns defects within the limit, accepts and closes units inside the given scope, takes the next ready unit when the scope and limits allow, and escalates each floor event.
- R-FACTORY-33 (MUST): a `drifted` workflow escalates and takes no new work. Its message names the smallest fix.
- R-FACTORY-34 (MUST): worker completion returns control to the foreman. The person does not restart the run after each unit.

### Waking and the human channel

- R-FACTORY-35 (MUST): the selected tools wake the foreman. Setup saves how each workflow wakes: a schedule, an event, or a person. If no wired tool can wake on its own, the workflow runs only while a person keeps a session open, and setup says so.
- R-FACTORY-36 (MUST): each workflow saves one human channel: how the factory sends a message and how the person answers. The last resort is "wait in session", where the factory asks in the chat and waits for the person to return.

### Escalation and acceptance

- R-FACTORY-37 (MUST): these events always reach the person: an action outside the granted authority; a change to the outcome, scope, or acceptance criteria; a correction loop that fails the same way again or reaches its limit; a missing tool, a missing permission, or broken wiring; and work that is ready for the person to accept at the end of the given scope. A workflow can add events. It cannot remove these.
- R-FACTORY-38 (MUST): each escalation message says what happened, what the factory needs, whether the need is required or optional, what work it blocks, and what happens after the person answers. It follows the user action request rules of the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md).
- R-FACTORY-39 (MUST): the person accepts at the end of the scope they gave. Inside that scope, the foreman accepts each unit on the reviewer's evidence. A merge or a deploy still needs a grant. A Store receipt is never product acceptance.

### Working rules

- R-FACTORY-40 (MUST): the foreman judges the actual work, not the worker's summary. A reviewer never reviews work it built. A brief does not steer the reviewer toward the builder's conclusions. Green tests do not prove the right behavior, and requirements are not weakened to make a result pass.
- R-FACTORY-41 (MUST): the foreman stops a correction loop that repeats the same failure, even before the round limit. It does not send work again after an unclear handoff; it checks the status first. The CLI counts correction rounds for each job: the count starts at 0 and goes up by one on each move from `returned` or `in-review` to `needs-correction`. A move from `unknown` to `needs-correction` also adds one, except when the status before `unknown` was already `needs-correction`, as the status history shows. Then the move adds no round. The CLI refuses a move past the round limit of the assignment's plan revision with `round-limit-reached`, and the foreman escalates. The count belongs to the job, so it survives a takeover. Only one assignment for each job is open at a time, and `factory assignment start` refuses a second one with `assignment-open`. Parts of one unit with different part labels can run at the same time, each with its own count. A new assignment for the same job starts at the count of the one before it. Only the person can reset the count, through a `once` grant for the action `reset-correction-rounds`. `factory assignment start` spends that grant when it starts the new assignment, which then starts at 0.
- R-FACTORY-42 (MUST): one writer works on a file in each working copy. When parallel workers change the same file in separate working copies, the workflow names one integration owner, who merges the work and settles conflicts.
- R-FACTORY-43 (MUST): the harness and the repository instructions own the worktree policy. Setup saves each workflow's worktree method. The factory obeys a repository or user rule that forbids worktrees.

### Backups outside git

- R-FACTORY-44 (MUST): in a folder without git, the factory copies a file to `.make-docs/backup/factory/` before a worker changes it. The Store records each backup with its file, its hash, and its assignment.
- R-FACTORY-45 (MUST): Make Docs deletes an assignment's backups when its work is accepted or closed, and deletes any backup older than 30 days. Cleanup runs during normal factory operations and never touches installation recovery backups.
- R-FACTORY-46 (MUST): a `README.md` in `.make-docs/backup/factory/` tells people and agents the cleanup rule and how to get a file back. The folder's own `.gitignore` (R-FACTORY-25) keeps it out of git.

### Backlog review handoff

- R-FACTORY-47 (MUST): when a workflow is `ready`, the backlog review "Work on this wave" action sends the wave to the foreman through the front desk. Without a `ready` workflow, the action keeps its current behavior under [PRD 51](51-backlog-review-and-reporting.md).

### Skills

- R-FACTORY-48 (MUST): the `factory-setup` Skill and the `factory` run Skill are first-party, explicit-invocation-only Skills under [PRD 08](08-skills-catalog-and-distribution.md). A wake from a schedule or event invokes the `factory` Skill explicitly. Workflow config replaces the former Skill profiles.

## Contracts and Data

### Operations

| Operation | CLI path | Effect |
| --- | --- | --- |
| `factory.status` | `make-docs factory status` | Reads workflows, readiness, claims, assignments, and open manual steps. |
| `factory.tools.save` | `make-docs factory tools save` | Checks and saves the machine's tool list and capability proofs. |
| `factory.workflow.save`, `.show`, `.list` | `make-docs factory workflow save \| show \| list` | Checks and saves a workflow and a new resolved plan revision when the plan changed, or reads workflows and plan revisions. |
| `factory.proof.save` | `make-docs factory proof save` | Saves a test task result for one plan revision. Makes it the `ready` revision when the proof passed. |
| `factory.assignment.start`, `.update`, `.list` | `make-docs factory assignment start \| update \| list` | Records and reads assignments. Update checks status moves, correction rounds, and grant use. |
| `factory.restore` | `make-docs factory restore` | Writes the `.make-docs/factory/` copies again, with the latest resolved plan. |

- R-FACTORY-49 (MUST): each operation is also an MCP tool in the `factory` MCP profile under [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md). CLI and MCP results come from one core.
- R-FACTORY-50 (MUST): every write uses the existing write permission, `expectedVersion`, and Store-unavailable outcomes. `workflow save` refuses `ready` without a passed proof. `assignment start` and `update` take the private claim ID of the unit's live claim, as [PRD 52](52-work-store-and-work-queue.md) R-WORK-QUEUE-19 requires, and refuse a caller that no longer holds the claim. No factory record, note, or message holds a claim ID.
- R-FACTORY-51 (MUST): `factory status` shows one project: the named project, or the project of the current folder. Its output names the project. It shows one group for each running factory: grouped by checkout, then by lifecycle run. Each checkout group shows its own readiness, from that checkout's config file and type file. A checkout that has an open assignment gets a group, and so does the checkout that the call named or ran in. A checkout that cannot be read shows its readiness as unknown and says why. Each run group shows each claimed unit, its tool, its state, and the last check time. `--run <run-id>` (MCP input `run`) shows one lifecycle run. The output gives human words first, with exact detail in machine output.

### Project scope

| Command | Scope | Kind | How it finds the project |
| --- | --- | --- | --- |
| `make-docs factory tools save` | Machine | Write | It takes no project. |
| `make-docs factory workflow save` | Project | Write | Named project only, also for a grant-only save. |
| `make-docs factory proof save` | Project | Write | Named project only. |
| `make-docs factory assignment start` | Project | Write | Named project only. |
| `make-docs factory assignment update` | Project | Write | Named project only. |
| `make-docs factory restore` | Project | Write | Named project only. |
| `make-docs factory workflow show` | Project | Read | The named project, or the project of the current folder. |
| `make-docs factory workflow list` | Project | Read | The named project, or the project of the current folder. |
| `make-docs factory assignment list` | Project | Read | The named project, or the project of the current folder. |
| `make-docs factory status` | Project | Read | The named project, or the project of the current folder, with one group for each running factory (R-FACTORY-51). |

- R-FACTORY-62 (MUST): each factory operation has the scope in the project scope table. The machine tool list, the tool states, and the capability proofs are machine records. Every other factory record belongs to one project. A machine-level operation takes no project, and the current folder never ties it to a project.
- R-FACTORY-63 (MUST): every project-scoped factory write names its project, with `--target-root <path>` or `--project <name>` in the CLI, and with the `targetRoot` or `project` input in MCP. A project name resolves only through `project_register` under [PRD 38](38-global-store-and-project-state.md) R-REGISTER-2. A write never falls back to the current folder, even when that folder is a project. The CLI refuses the write and changes nothing when no project is named (`project-missing`), when the name is not in `project_register` (`project-not-found`), when the path and the name give two different projects (`project-mismatch`), or when the write must read or write project files and the named project has no bound checkout or more than one (`project-checkout-unclear`). `workflow save`, `proof save`, and `assignment start` read project files to find the current plan, and `restore` writes the copies into one checkout. A `--target-root` path that is not a bound project gets the existing typed Store outcome. A `project-missing` refusal names both ways to name a project.
- R-FACTORY-64 (MUST): every factory result, in the CLI and in MCP, says what it acted on. A project-scoped result names the project by its project name and project ID. A machine-level result says that it acted on this machine. A refusal names the project it refused, or says that no project was named. The human words come first.
- R-FACTORY-65 (MUST): a project-scoped read can use the project of the current folder when no project is named. Its output names the project it read and says whether the project was named or taken from the current folder. A read in a folder that is not a project, with no project named, is refused with `project-missing`. `factory status` is a project-scoped read under this rule. A view of every project on this machine is not part of it. It may come later as a separate option, and that option would be new behavior.

### Factory URIs

- R-FACTORY-66 (MUST): factory URIs are the `factory` family of the project-resource URI family of [PRD 52](52-work-store-and-work-queue.md) R-WORK-URI-1. They name the project in full. `<project>` resolves only through `project_register`. Nothing in a factory URI resolves from the current folder, a target path, or a checkout. The paths are: `make-docs://project/<project>/factory/` lists the project's workflows, each with its latest and `ready` revision numbers; `factory/workflows/<name>` shows the latest saved resolved plan revision of one workflow, with its number, its digest, and whether it is the `ready` revision; `factory/workflows/<name>/revisions/` lists the kept revisions with each number, digest, time, and which one is `ready`; `factory/workflows/<name>/revisions/<n>` shows one revision; and `factory/assignments/` lists the open assignments, each with its unit, role, part label, tool, status, round count, last check time, plan revision, and lifecycle run ID. No path shows one job, no path uses an `@<digest>` form, and machine records have no URI. A factory URI read shows only saved records. It never reads a project file, so it never shows the live readiness state. Each read ends with a note to run `factory status` in a checkout for the live readiness state. The resolver refuses any other path under `factory/` with `resource-not-found`.
- R-FACTORY-67 (MUST): an MCP read of a factory URI follows [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md) R-ACCESS-2: the harness grant of the folder where the agent works decides, never the grant of the project that the URI names, and a Store read grant there allows every project URI. A folder that is not a Make Docs project is refused as `store-not-configured`, and the refusal does not tell the person to set that folder up. This rule covers factory URI reads only. Factory MCP tools, reads and writes, keep the PRD 25 R-ACCESS-6 check of the current machine and project grants and the target scope. The target is the project that the call acts on, also when it is not the project of the folder where the agent works. That project's own grant admits the call: a Store read grant for a read, and a Store write grant for a write. For example, `factory_status` for another project needs that project's read grant, also when it reads the files of that project's other checkouts. Without the grant, the call is refused as `store-denied`, and the message names the project and says how to grant the access. The direct CLI route needs no harness grant.
- R-FACTORY-68 (MUST NOT): a factory URI read shows a grant, a private claim ID, file contents, a prompt, a secret, or any other item that R-FACTORY-26 forbids in a record. A factory URI read is read-only. It opens a read-only Store session, and it never creates or migrates a Store. Without a usable Store, it returns the existing typed Store outcome, and its next step says to read the `.make-docs/factory/` copies in a checkout of the project.

### Assignment status moves

| From | Allowed next status |
| --- | --- |
| `offered` | `running`, `unknown`, `failed`, `cancelled` |
| `running` | `returned`, `unknown`, `failed`, `cancelled` |
| `returned` | `in-review`, `needs-correction`, `unknown`, `failed`, `cancelled` |
| `in-review` | `accepted`, `needs-correction`, `unknown`, `failed`, `cancelled` |
| `needs-correction` | `offered`, `running`, `unknown`, `failed`, `cancelled` |
| `unknown` | `offered`, `running`, `returned`, `in-review`, `needs-correction`, `failed`, `cancelled` |
| `accepted`, `failed`, `cancelled` | None. These are final. |

This is move table version 1. Every workflow uses it. A workflow cannot change it.

### Shared rules

- R-FACTORY-52 (MUST): the factory contract holds the roles, capability catalog, readiness states, grant scopes, resolved plan, status moves, correction rounds, escalation floor, acceptance rule, working rules, limits, the backup rule, the never-log list, the reason codes, and the project scope. Where the CLI checks a rule, the code and the contract give the same answer. A change to one form requires a review of the other.

## Integrations

- [PRD 52](52-work-store-and-work-queue.md) supplies next, claim, report, and close. Its R-WORK-URI-1 owns the shared project-resource URI rule that factory URIs follow.
- [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md) R-ACCESS-2 owns the harness grant rule for project URI reads. Factory URI reads follow it. Factory MCP tools keep R-ACCESS-6, and the project that a call acts on must grant its access.
- [PRD 38](38-global-store-and-project-state.md) owns the factory Store fields, their classes, and the narrow rule that allows the `.make-docs/factory/` copies.
- [PRD 24](24-project-configuration-and-convention-overlay.md) owns the `factory:` config block.
- [PRD 21](21-project-tool-directory-and-resource-tiers.md) owns the `.make-docs/factory/` and `.make-docs/backup/factory/` paths.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle stages. The factory uses the existing `implementation` stage.

## Rebuild Notes

- Tool-agnostic means every proof names the tools it used, and no claim reaches past them. A tool that the factory has never seen must still fit if setup can prove its capabilities.
- The assignment record exists for recovery. Without it, a lost reply leads to duplicate work. Check the handle first.
- Grants are the main safety boundary. Keep them out of every committed or copied file.
- The factory must never grow into a scheduler or a relay. Waking and messaging belong to the person's tools.
- The resolved plan is a record, not a program. If a change would add a step, a condition, or a branch to it, the change belongs in the Skill or the workflow type instead.
- Status moves, rounds, and grant scopes are checked by the CLI because an agent can lose count across a crash or a takeover. Judgment, such as whether two failures are the same, stays with the agent.
- One Store serves every project on a machine, and an agent often works in a folder other than the project it runs. So a write names its project, and a result says what it acted on.

## Requirement History

### 2026-11-23 — W30 R0 Assignment Status Moves and Correction Rounds

- Affected requirement or section: R-FACTORY-27, R-FACTORY-28, R-FACTORY-41, R-FACTORY-50, and the assignment status move table.
- Previous contract: an assignment had nine status values with no rule on which moves were allowed. The round limit was a saved setting that only the foreman applied. An assignment had no history.
- Replacement contract: a fixed move table with three final states that never change; a round count on each job that the CLI enforces against the plan's round limit and that survives a takeover; one open assignment for each job (unit, role, and part label), so parts of one unit can run at the same time; a status history of the 20 newest changes with a reason code each. `factory assignment start` spends a `once` grant for `reset-correction-rounds`. On 2026-11-23 the owner confirmed option A of register D-071: a new try of the same job keeps the count, and only that grant resets it. `assignment start` and `update` take the private claim ID. This is new behavior.
- Rationale: an agent can lose count of rounds or move a finished job back after a crash or a takeover. The CLI holds the count so that the limit holds.
- Source: the owner's approval on 2026-11-23, recorded in the [factory design](../designs/2026-11-21-factory.md).

### 2026-11-23 — W30 R0 Capability Proof Validity

- Affected requirement or section: R-FACTORY-10, R-FACTORY-14, and the new R-FACTORY-53.
- Previous contract: setup recorded a capability as proved or unproved, with no tool version, no failed state, and no list of what the proof left out. The summary did not list accepted losses.
- Replacement contract: each proof records the reported tool version, the time, a result of `proved`, `unproved`, or `contradicted`, and a "does not cover" list. A changed tool version means the proofs of that tool run again, and the workflow is `drifted` until then. The summary lists each accepted known loss. Capability IDs are lower-case, only added, and never given a new meaning. This is new behavior.
- Rationale: a proof against one tool version says nothing about the next one, and a person must see what the workflow runs without.
- Source: the owner's approval on 2026-11-23, recorded in the [factory design](../designs/2026-11-21-factory.md).

### 2026-11-23 — W30 R0 Never-Log List and Reason Codes

- Affected requirement or section: R-FACTORY-26 and the new R-FACTORY-54.
- Previous contract: config, copies, and Store records held no secret. No check covered copies or Store records. Results had no fixed reason codes.
- Replacement contract: factory records never hold file contents, prompts, briefs, environment values, transcripts, or credentials, and the CLI checks every factory write. Drift results, refusals, and status history use stable kebab-case reason codes that are only added. This is new behavior.
- Rationale: a record that can hold free text will one day hold a secret or a prompt. Stable codes let agents and tests rely on results.
- Source: the owner's approval on 2026-11-23, recorded in the [factory design](../designs/2026-11-21-factory.md).

### 2026-11-23 — W30 R0 Scoped Grants

- Affected requirement or section: R-FACTORY-24.
- Previous contract: a grant named an action with no scope or expiry.
- Replacement contract: each grant records its action, a scope of `once`, `run`, or `standing`, and an optional expiry. `factory workflow save` writes each grant, also during a run as a grant-only save that changes nothing else. `workflow show` lists grants beside the plan, and no copy holds a grant. On 2026-11-23 the owner confirmed option A of register D-072: grants stay outside the plan digest. The CLI refuses a grant use outside the scope or after the expiry, and the foreman asks the person again. This is new behavior.
- Rationale: a person who allows one merge has not allowed every merge.
- Source: the owner's approval on 2026-11-23, recorded in the [factory design](../designs/2026-11-21-factory.md).

### 2026-11-23 — W30 R0 Resolved Workflow Plan

- Affected requirement or section: R-FACTORY-10, R-FACTORY-12, R-FACTORY-22, R-FACTORY-23, R-FACTORY-25, R-FACTORY-52, the operations table, and the new R-FACTORY-55 to R-FACTORY-61.
- Previous contract: a workflow lived in three parts (config, Store bindings, and the type) with no single joined record. Drift meant that a wired tool, proof, or permission no longer held, and the check was not exact. An assignment did not record which setup it ran under.
- Replacement contract: the CLI generates one resolved plan from the three parts as canonical JSON with a digest, and the Store keeps it as immutable revisions under a bounded rule. Each assignment records its plan revision and digest, and a takeover loads that exact revision. The CLI computes the current plan from three live sources (the config file, the type file, and the machine tool rows). It is `ready` when its digest matches the `ready` revision, `wired` or `draft` when it matches another saved revision, and `drifted` when it matches none, so a fix that restores the `ready` digest needs no new test task. R-FACTORY-22 now lists the full portable definition, and R-FACTORY-23 adds tool states, known losses, and plan revisions to the Store. Workflow types state a type version. The plan is data, not a program, so R-FACTORY-5 holds. This is new behavior.
- Rationale: a takeover or a recovery must run under the exact setup that the work started with, and a person must be able to see exactly what changed.
- Source: the owner's approval on 2026-11-23, recorded in the [factory design](../designs/2026-11-21-factory.md).

### 2026-11-23 — W30 R0 Project Scope and Factory URIs

- Affected requirement or section: the Scope list, R-FACTORY-52, Integrations, and the new Project scope and Factory URIs sections with R-FACTORY-62 to R-FACTORY-68.
- Previous contract: no requirement said how a factory command finds its project, whether a command is machine-level or project-scoped, or what a result names. No factory URI existed.
- Replacement contract: the owner chose option A on 2026-11-23. `factory tools save` is machine-level and takes no project. Every project-scoped write names its project with `--target-root` or the new `--project` option, never falls back to the current folder, and refuses with `project-missing`, `project-not-found`, `project-mismatch`, or `project-checkout-unclear` and changes nothing. Every result names its project or the machine. Reads keep the current folder default and show which project they read. Factory URIs live under `make-docs://project/<project>/factory/`, resolve only through `project_register`, follow the R-ACCESS-2 grant rule, and never show a grant, a claim ID, file contents, a prompt, or a secret. The scope of `factory status` (register D-073) and the factory URI paths (register D-074) are pending owner decisions. This is new behavior.
- Rationale: one Store serves every project on a machine, and an agent often works in a folder other than the project it runs. A write that falls back to the current folder can change the wrong project.
- Source: the owner's decision on 2026-11-23 (option A), recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope).

### 2026-11-23 — W30 R0 Factory Status for Each Running Factory

- Affected requirement or section: R-FACTORY-27, R-FACTORY-51, R-FACTORY-65, and the project scope table.
- Previous contract: the scope of `factory status` was pending (register D-073). An assignment did not record its checkout.
- Replacement contract: `factory status` shows one project, named or taken from the current folder, with one group for each running factory: by checkout, then by lifecycle run. Each checkout group shows its own readiness from that checkout's config file and type file. `--run <run-id>` shows one run. Each assignment records the checkout ID of the checkout that `assignment start` named, not a worker's working copy. The owner chose option A of D-073 and closed it. A view of every project on this machine may come later as a separate option. This is new behavior.
- Rationale: Several factories can run in one project at once, each in its own worktree, and each can have its own readiness.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Factory URI Paths

- Affected requirement or section: R-FACTORY-66.
- Previous contract: the factory URI paths were proposed and pending (register D-074). No factory URI path was current.
- Replacement contract: the paths `factory/`, `factory/workflows/<name>`, `factory/workflows/<name>/revisions/`, `factory/workflows/<name>/revisions/<n>`, and `factory/assignments/` are current. Each assignment row also shows its lifecycle run ID. No path shows one job, no path uses an `@<digest>` form, and machine records have no URI. A read shows saved records only and ends with a note to run `factory status` in a checkout. The owner chose option A of D-074 and closed it. This is new behavior.
- Rationale: A URI is a stable identity, so the owner chose the smallest path set that covers the need.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Factory MCP Access

- Affected requirement or section: R-FACTORY-67.
- Previous contract: a draft of this same change applied the W29 rule, where the Store read grant of the agent's folder allows every project URI, to factory MCP tools too.
- Replacement contract: the W29 rule applies to factory URI reads only. Factory MCP tools, and factory MCP writes above all, keep the PRD 25 R-ACCESS-6 check of project grants and target scope. How a factory MCP tool call, read or write, that names another project is admitted is an open question (register D-075). The owner chose option B for the extra scoping ideas: keep the four refusal codes and saved-records-only URI reads, and limit the grant rule. This is new behavior.
- Rationale: A read grant in one folder must not let an agent write to another project.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Printouts Out of Git

- Affected requirement or section: R-FACTORY-25 and R-FACTORY-46.
- Previous contract: the `.make-docs/factory/` copies were gitignored, with no rule on how.
- Replacement contract: a `.gitignore` file with the one line `*` inside `.make-docs/factory/` and inside `.make-docs/backup/factory/` keeps each folder out of git. Make Docs never edits the project root `.gitignore`. The owner chose option A. This is new behavior.
- Rationale: The project root `.gitignore` belongs to the person. A file inside each folder needs no edit to it.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Portable Fields Stay in Config

- Affected requirement or section: R-FACTORY-25 and R-FACTORY-55.
- Previous contract: R-FACTORY-55 did not say whether the saved binding also kept the integration owner role and the human channel kind.
- Replacement contract: the integration owner role and the human channel kind live only in the config entry. The saved binding keeps no copy. The local copy reads them from the resolved plan. The human channel account reference stays in the Store. The owner chose option A. This is new behavior.
- Rationale: One source for each field means no copy can drift.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 A Move From Unknown to Needs-Correction Counts a Round

- Affected requirement or section: R-FACTORY-41.
- Previous contract: the round count went up only on a move from `returned` or `in-review` to `needs-correction`.
- Replacement contract: a move from `unknown` to `needs-correction` also adds one to the count. The owner chose option A. This is new behavior.
- Rationale: A foreman that lost track and then finds defects is still sending the work back. Without the count, a loop through `unknown` could pass the round limit.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Context Kinds for Custom Roles

- Affected requirement or section: R-FACTORY-7 and R-FACTORY-60.
- Previous contract: a custom role named its job, capabilities, and returns. A role's context list had no rule for roles without a default.
- Replacement contract: a role other than builder or reviewer must list its context kinds, and the config check refuses one without a list with a plain message that names the role. The owner chose option A. This is new behavior.
- Rationale: Only the builder and the reviewer have a default list. Any other role without a list would get no context, or the wrong context.
- Source: the owner's answers on 2026-11-23 to the seven open W30 decisions, recorded in the [factory design](../designs/2026-11-21-factory.md#project-scope) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 No Round for a Return to Needs-Correction

- Affected requirement or section: R-FACTORY-41.
- Previous contract: every move from `unknown` to `needs-correction` added one round.
- Replacement contract: a move from `unknown` to `needs-correction` adds no round when the status before `unknown` was already `needs-correction`, as the status history shows. Every other move from `unknown` to `needs-correction` still adds one. The owner chose option A. This is new behavior.
- Rationale: when the factory loses track of a job that was already sent back, finding it again in the same state is not a new correction.
- Source: the owner's decisions on 2026-11-23 on the three open W30 items, recorded in the [factory design](../designs/2026-11-21-factory.md#context) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Context Lists Only for Custom Roles

- Affected requirement or section: R-FACTORY-7 and R-FACTORY-60.
- Previous contract: a role other than builder or reviewer had to list its context kinds, which also took in the front desk and the foreman.
- Replacement contract: only a custom role, one that the project adds, must list its context kinds. The front desk and the foreman need no list. A builder and a reviewer keep their default lists. The refusal message says "A custom role must list its context kinds". The owner chose option A. This is new behavior.
- Rationale: the front desk and the foreman run the loop and are not handed a bounded brief.
- Source: the owner's decisions on 2026-11-23 on the three open W30 items, recorded in the [factory design](../designs/2026-11-21-factory.md#context) and the [register](03-open-questions-and-risk-register.md).

### 2026-11-23 — W30 R0 Factory MCP Calls for Another Project

- Affected requirement or section: R-FACTORY-67 and Integrations.
- Previous contract: how the R-ACCESS-6 check admits a factory MCP tool call that names another project was an open question (register D-075).
- Replacement contract: the project that the call acts on is the target. That project's own grant admits the call: a Store read grant for a read, and a Store write grant for a write. Without it, the call is refused as `store-denied`, and the message says how to grant the access. The owner chose option A of D-075 and closed it. This is new behavior.
- Rationale: one policy decides every factory MCP call, and a foreman can serve a project from another folder after the person grants it.
- Source: the owner's decisions on 2026-11-23 on the three open W30 items, recorded in the [factory design](../designs/2026-11-21-factory.md#context) and the [register](03-open-questions-and-risk-register.md).

## Source Anchors

- [Factory design](../designs/2026-11-21-factory.md)
- [W30 R0 plan](../plans/2026-11-21-w30-r0-factory/00-overview.md)
- `packages/skills/factory/SKILL.md`
- `packages/cli/src/operations/lifecycle/registry-ops.ts`
