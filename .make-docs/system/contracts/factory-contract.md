# Factory Contract

## Purpose

Use this contract when you set up or run the Make Docs factory.

The factory takes ready work, gives it to agents, has the result reviewed and corrected, and brings results and decisions back to the person. Make Docs plans the work, and its factory runs the work.

The factory has no workflow engine. The person's own tools do the work. Make Docs teaches agents how to use those tools, saves the setup and the assignment records, and supplies the work queue.

This contract is the agent form of the factory rules. Where the CLI checks a rule, the code and this contract must give the same answer. A change to one form needs a review of the other. The [Rule Catalog](#rule-catalog) names each rule and its check.

## Boundary

- The factory is tool-agnostic. It works with any tool that setup can prove. It never assumes that a particular app, harness, model provider, terminal multiplexer, scheduler, or messaging tool is present. Describe every tool by what it can do, never by its name, in any default, example, or required step.
- The factory is opt-in. It stays off until a person runs factory setup. A project that does not use the factory sees no change.
- The factory needs the Make Docs CLI and a usable Store, because setup and assignments live in the Store. Without either one, setup stops, names what is missing, and names the setup step that fixes it. The factory has no zero-config mode.
- The factory supports software work, personal work, and business work. A project folder does not need git.
- The CLI and MCP operations never launch, schedule, message, or contact a tool. They check and record. An agent does the work through the tools that setup wired.
- Waking and messaging belong to the person's tools. The factory never grows into a scheduler or a relay.

The factory commands and the work queue commands in this contract are planned. They are not in the CLI yet. A reader who tries them gets an unknown-command error until they ship.

## Parts

| Part | What it is |
| --- | --- |
| Factory setup | Finds the tools, reads their instructions, interviews the person, wires roles to tools, runs one test task, and saves the result. |
| Factory run | Loads one saved workflow and its type, then runs [the loop](#the-loop). |
| Workflow types | Reference resources that give the shape of a workflow. See [Workflow Types](#workflow-types). |
| Resolved plan | One generated record for each saved version of a workflow. It joins the config choices, the machine bindings, and the workflow type. See [Resolved Plan](#resolved-plan). |
| This contract | The shared rules for both setup and run. |
| CLI and MCP operations | Check and save setup, workflows, resolved plans, assignments, proofs, and backups. Write the local copies. |
| Store records | Machine tools, capability proofs, bindings, grants, resolved plans, assignments, proofs, and backups. |
| Work queue | `make-docs work next`, `claim`, `release`, `report`, `close`, and `add` (MCP `work_next`, `work_claim`, `work_release`, `work_report`, `work_close`, `work_add`). The factory uses it to find and hold work. |

## Smallest Setup

The smallest setup is one agent tool that can read files, write files, run commands, and start its own subagents.

In that setup, the one agent is the front desk and the foreman. It also starts its own subagents. Builders and reviewers are fresh subagents of that agent. A reviewer is never the session that built the work. The human channel is "wait in session".

So the one tool needs these capabilities: `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, and `read-agent-result`. With all five proved, the smallest setup can reach `wired`, and then `ready` after its test task.

When more tools are present, setup uses them.

## Roles

The factory ships four standard roles.

| Role | Job | Returns |
| --- | --- | --- |
| Front desk | Talks to the person through the workflow's human channel. Turns a request into a work unit or a quick item, and passes it to the foreman. | The unit or quick item, and the person's answers. |
| Foreman | Syncs the work queue, checks open assignments, takes ready work, chooses the team for each unit, assigns jobs, judges results, accepts units inside the given scope, and escalates. | Accepted units, escalations, and the acceptance request. |
| Builder | Does one bounded job. | The actual result and its evidence. |
| Reviewer | Checks a candidate against the requirements. Never reviews its own work. | A pass, or a list of defects with evidence. |

One tool can fill more than one role. The reviewer of a unit must never be the session that built that unit.

### Custom Roles

A project can add its own role, for example a researcher, an analyst, or a writer. A custom role names:

- `job`: what the role does, in one or two sentences;
- `capabilities`: the capability IDs it needs, from the [Capability Catalog](#capability-catalog);
- `returns`: what it hands back, and the evidence that comes with it.

A custom role uses a new name. It never replaces a standard role.

## Capability Catalog

Setup gives a role to a tool because of what the tool can do, not because of its name.

| Capability ID | What it means | How setup proves it |
| --- | --- | --- |
| `read-write-files` | Read a file and write a file in the project. | Write a small test file with known text, read it back, compare the text, and delete the file. |
| `run-commands` | Run a command and read its output and exit status. | Run a harmless command with a known output. Check the output and the exit status. |
| `launch-agent` | Start a fresh agent with a brief and get back a task handle. | Start one agent with a tiny brief. Record the task handle that comes back. |
| `wait-for-agent` | Wait until a launched agent finishes, without a person's help. | Wait on the handle from `launch-agent` until the agent reports that it is done. |
| `read-agent-result` | Read what a launched agent returned. | Read the result through the handle. Check that it holds a code word that the brief asked for. |
| `wake-on-schedule` | Start the foreman at a set time. | Set one wake a short time ahead. Check that the foreman started and recorded the wake. Remove the test wake. |
| `wake-on-event` | Start the foreman when an event happens, such as a finished agent or a new message. | Cause one test event. Check that the foreman started and recorded the event. |
| `message-person` | Send a message to the person outside the session. | Send one test message through the channel. The person says that they got it. |
| `receive-answer` | Get the person's answer back from the channel. | The person answers the test message with a code word. Check that the exact code word came back. |
| `isolate-working-copy` | Make a separate working copy for a worker. | Make a working copy, change a file in it, show that the main copy did not change, and remove the working copy. |
| `edit-code` | Make a precise change to source files and run the project's checks. | Make one given small change. Show that the diff holds only that change and that the project's checks ran. |

The catalog can grow. A new capability names its ID, what it means, and how setup proves it. A capability ID uses lower-case letters and hyphens. An ID is only ever added. It is never removed, renamed, or given a new meaning.

Setup records each capability it found, the tool that has it, how setup proved it, and the role it gave the tool. Setup records one proof for each capability of each tool that it binds to a role. Each proof holds:

- the tool and the capability ID;
- the tool version that the agent reported when it ran the proof;
- the proof time;
- the result: `proved`, `unproved`, or `contradicted`;
- a "does not cover" list: each part of the capability that the proof did not test, as one short line.

`proved` means that the proof passed. `unproved` means that a tool's own docs claim the capability, but setup could not run the proof. `contradicted` means that setup ran the proof and the tool failed it. A role never depends on an `unproved` or `contradicted` capability.

A proof holds only for the tool version that it names. When an agent reports a different version of a bound tool, the workflow is `drifted` with the reason code `tool-version-changed`. To reach `ready` again, setup does three steps: it runs each proof of that tool again and saves the proofs, it saves the workflow, which makes a new plan revision, and it passes a new test task under that revision. If the old tool version comes back first, the plan matches the `ready` revision again, and the workflow is `ready` with no new step. The CLI compares the versions that agents report. It never asks a tool for its version.

Every claim about a tool combination names the combination that was actually tested.

## Setup

Setup runs these steps:

1. Find the agent tools on the machine and in the project. Look for each kind of tool: agent harnesses, model providers, terminal multiplexers, MCP servers, schedulers, and messaging tools.
2. Read the instructions those tools make available: their help, their docs, their MCP tool lists, and their Skills.
3. Interview the person for preferences: the workflow type, the human channel, the wake method, the limits, the optional steps, and the permissions to grant.
4. Wire each needed role to a tool by capability. Prove each capability that a role needs.
5. Run one small test task through the whole workflow, from intake to return.
6. Save the choices in project config, save the machine records in the Store, and write the local copies.

The person does not need to know tool names, adapters, task handles, or Store tables. Setup finds the tools and asks only for preferences and permissions.

The machine's tool list and capability proofs are saved once per machine and reused by every project on that machine. Each project saves only its own workflow choices.

A rerun of setup updates the same workflow. It shows what changed. It proves again each capability and binding that changed.

### Manual Steps

A one-time manual step is allowed, for example a sign-in or a permission that only the person can give. Setup lists each one with:

- what the person must do;
- why it is needed;
- whether it is required or optional;
- what it unblocks.

### Setup Summary

Setup ends with a plain summary:

- which tool fills each role;
- how the workflow wakes;
- how the factory reaches the person;
- what the test task proved, and each capability that stays unproved;
- each known loss that the person accepted;
- each manual step that is still open.

A known loss is something that the workflow runs without: a capability that no tool could prove, an item on a proof's "does not cover" list, or a missing way to wake on its own. Setup names each known loss and asks the person to accept it. Setup saves each accepted known loss in the Store.

## Readiness

A workflow has one readiness state.

| State | Meaning | Takes new work |
| --- | --- | --- |
| `draft` | The workflow choices are saved, but setup has not bound a tool to each needed role and proved the role's capabilities. | No |
| `wired` | The current [resolved plan](#resolved-plan) is saved, each needed role has a tool, and each capability that the role needs is proved. No test task has passed under this plan. | No |
| `ready` | A test task passed under a saved plan revision, and the current plan has that same digest. | Yes |
| `drifted` | No saved revision has the current plan's digest, because something changed without a save: a lost or blocked tool, a new tool version, a contradicted proof, a config edit by hand, or a changed type file. | No |

What moves a workflow:

- `draft` to `wired`: setup binds the last needed role, proves its capabilities, and saves the workflow.
- `wired` to `ready`: a test task passes under the current plan, and setup saves the proof. Only a passed test task makes a plan revision the `ready` revision.
- `ready` to `wired`: setup changes and saves a role, a binding, a limit, or a step. The new plan needs its own passed test task.
- `ready` or `wired` to `drifted`: a check finds that a wired tool is gone or blocked, a tool has a new version, a proof was contradicted, the config was edited by hand, or the type file changed. A lost tool always moves the workflow to `drifted`, even when it was a role's only tool. The workflow then escalates.
- `drifted` to `ready`: a fix restores the exact plan of the `ready` revision, for example the old tool version comes back or a hand edit is undone. No new test task is needed, because the passed proof belongs to that exact digest.
- `drifted` to `wired`: a fix gives a new plan. Setup proves each changed capability again and saves the workflow. The new plan needs a passed test task to reach `ready`.
- Any state to `draft`: the person or setup removes a needed role's binding on purpose. Only a deliberate unbind moves a workflow to `draft`. A lost tool never does.

### How the CLI Finds the State

The CLI computes the current plan each time from three live sources:

- the workflow's entry in the `factory:` block of the config file;
- the workflow type file;
- the machine tool rows in the Store.

The machine tool rows give each bound tool's state (`available`, `missing`, or `blocked`), its reported version, and its proof results. The CLI does not take these facts from the copy in the saved binding. The saved binding gives only the choices that setup saved: which tool fills each role, the wake method, the channel account, the working-copy method, and the accepted known losses. Those choices change only through a save. So drift comes from the config file, the type file, or the machine tool rows.

The CLI then compares the current plan's digest with the saved revisions:

- It matches the `ready` revision: the workflow is `ready`.
- It matches another saved revision: the workflow is `wired` when each needed role is bound and proved, and `draft` when one is not.
- It matches no saved revision: the workflow is `drifted`. The result lists each drift reason code from [Reason Codes](#reason-codes).

The CLI never contacts a tool. An agent reports tool facts through `make-docs factory tools save` (planned). It records a gone tool as `missing`. It records a tool that lost a permission it needs, such as an app permission or a sign-in, as `blocked`. Both change the current plan, so they give the drift codes `tool-missing` and `permission-lost`. A grant is not this kind of permission. An expired or spent grant never changes readiness. It only makes the foreman ask the person again.

Only a `ready` workflow takes new work. A `drifted` workflow escalates before it takes new work. Its message names the broken part and the smallest step that fixes it.

## Saved Records

| Record | Where | Why |
| --- | --- | --- |
| Workflow choices: the [portable definition](#portable-definition) of each workflow | `factory:` block in `.make-docs/config.yaml` | Portable. Teammates and other machines can rebuild the same workflow. |
| Machine tools, capability proofs, and role bindings | Store | Machine-specific. Holds paths and IDs. |
| Grants | Store | A grant is one person's permission on one machine. It is never committed. See [Grants](#grants). |
| Human channel binding and wake binding | Store | Machine-specific and account-specific. |
| Resolved plan revisions | Store | The exact plan that each assignment runs under. See [Resolved Plan](#resolved-plan). |
| Assignments | Store | The durable run record. See [Assignments](#assignments). |
| Proof results | Store | The evidence that a workflow is ready. |
| File backups | Store record and `.make-docs/backup/factory/` | Undo outside git. See [Backups Outside Git](#backups-outside-git). |

`.make-docs/factory/` holds read-only, gitignored copies of the saved setup. Only Make Docs writes them. Each file starts with a note that it is generated and that edits are lost. The copy of the resolved plan prints the latest revision and says whether it is the `ready` revision. No copy ever holds a grant. `make-docs factory restore` (MCP `factory_restore`, planned) writes them again from the Store. An agent or a person can read the wiring from the copies without a CLI call. Make Docs never reads a copy as input.

No factory record holds a secret or any other item on the [Never-Log List](#never-log-list). Secrets stay in the tools that own them.

## Grants

A grant permits one action outside the default authority, for example a merge, a deploy, a publish, or spending money. A grant never appears in committed config, in a local copy, or in a resolved plan.

Each grant records:

- the action, as a lower-case name such as `merge`, `deploy`, `publish`, or `spend`;
- the scope: `once`, `run`, or `standing`;
- an expiry time, when the person sets one;
- who granted it, and when.

| Scope | The grant holds for |
| --- | --- |
| `once` | One use. The first recorded use spends it. |
| `run` | The one lifecycle run that the grant names, until that run ends. |
| `standing` | Every run of the workflow, until the person revokes it. |

Before an action outside the default authority, the foreman records the use of a grant (`make-docs factory assignment update`, planned). The CLI refuses the use when no grant names the action, when the planned use is outside the grant's scope, when a `once` grant is spent, or after the expiry time. After a refusal, the foreman asks the person again through the human channel. That request is floor event 1.

`make-docs factory workflow save` (planned) writes each grant, at setup and during a run. During a run, after the person answers an escalation, the foreman records the person's answer with a grant-only save. A `run` grant names its lifecycle run. A grant-only save writes or revokes only the grant. It does not resolve the plan, save a revision, or change readiness.

Setup recommends the narrowest scope that does the job. Grants are not part of the resolved plan, so a new or spent grant never needs a new test task. `make-docs factory workflow show` lists the grants beside the plan, never inside it.

## Resolved Plan

A workflow has three sources:

- the portable definition: the workflow's entry in the `factory:` block of `.make-docs/config.yaml`;
- the machine binding: the workflow's saved binding and the machine tool rows in the Store on this machine;
- the workflow type reference that the config names, shipped or project-owned.

The resolved plan joins the three sources into one record. The CLI generates it. No person or agent writes it by hand.

### Portable Definition

The config entry holds:

- the type name and the type version;
- each role: its job, the capability IDs it needs, what it returns, and the context it gets;
- the round limit;
- the gates and the added escalation events that only a person decides;
- the other limits;
- whether the preflight step is on;
- the integration owner role;
- the human channel kind, for example a messaging tool or "wait in session".

Each workflow type states its version in its `## Purpose` section, as `Type version: 1`. A type's version goes up by one when its rules change. The config names the type version that the person chose. `make-docs factory workflow save` refuses a version that does not match the type file.

The context of a role is a list of context kinds from this fixed set: `unit-record`, `requirements`, `project-files`, `candidate-result`, `defect-list`, `evidence-links`, and `builder-summary`. A role sees only what it is handed. By default, a builder gets `unit-record`, `requirements`, `project-files`, and `defect-list`. A reviewer gets `unit-record`, `requirements`, `project-files`, `candidate-result`, and `evidence-links`, and never `builder-summary`, so the brief does not steer the reviewer. The list names kinds only. The content is handed over at run time and is never saved.

The [status moves](#status-moves) are the same for every workflow. A workflow cannot change them. The resolved plan records the version of the move table, so a later change to this contract never changes the moves of a running assignment.

### Machine Binding

The saved binding holds the choices that setup saved:

- for each role, the bound tool, by its tool ID, never by a path;
- the wake method;
- the human channel account, as a reference that holds no secret;
- the working-copy method;
- each known loss that the person accepted.

The machine tool rows hold the live tool facts. For each bound tool and each capability that its role needs, the plan takes from them the tool's state (`available`, `missing`, or `blocked`), the proved tool version, the proof result, and the "does not cover" list. See [How the CLI Finds the State](#how-the-cli-finds-the-state).

Grants are in the Store too, but they are not part of the resolved plan. See [Grants](#grants).

### Plan Record

The CLI writes the resolved plan as canonical JSON: keys in sorted order, no extra spaces, and UTF-8 text. The plan digest is the SHA-256 of those bytes. The plan also records the type name, the type version, the digest of the type file, and the move table version. The CLI also records two more digests: the config digest of the portable definition, and the binding digest of the machine binding.

The Store saves each plan as a revision. A revision holds the workflow name, its revision number, the plan digest, the plan JSON, the config digest, the binding digest, and the time it was made. A saved revision never changes. The latest revision is the newest saved one.

| Command | What it does with revisions |
| --- | --- |
| `make-docs factory workflow save` | Resolves the current plan. Saves a new revision only when no kept revision has its digest. Never makes a revision the `ready` revision. A grant-only save resolves nothing. |
| `make-docs factory proof save` | Records a test task result for the plan digest that the test ran under. Refuses a digest that is not the current plan's digest, or that has no saved revision. On a pass, makes that revision the `ready` revision. |
| `make-docs factory workflow show` | Reads the latest revision, or one named revision, with the current plan digest, the `ready` revision, and each drift reason code. Lists the grants beside the plan. Writes nothing. |
| `make-docs factory restore` | Prints the latest revision to `.make-docs/factory/`, with no grant. |

For each workflow, the Store keeps the `ready` revision, each revision that an open assignment names, and the 10 newest other revisions. Each save removes the older revisions in the same write.

Each assignment records the revision number and the digest of the plan that it runs under. `make-docs factory assignment start` uses the `ready` revision, and it refuses when the workflow is not `ready`. A takeover loads the exact revision that each open assignment names. A new revision never changes an assignment that has already started.

### Data, Not a Program

The resolved plan is data. It says who does each job, with which tool, under which limits, and which move table version applies. It has no steps, conditions, branches, joins, or code.

The CLI checks writes against the plan. It never reads the plan to decide what to do next, and it never starts anything. The foreman runs [the loop](#the-loop) from the factory Skill and reads the plan as a reference. So the plan is not a workflow engine, and the rules in [Boundary](#boundary) still hold.

The plan never holds a prompt, a file's contents, or a secret. See [Never-Log List](#never-log-list).

## Assignments

An assignment links one job to the tool doing it. A job is one work unit, one role, and one part label. The part label is a short lower-case kebab-case name that the foreman gives each part of a unit, such as `research` or `draft`. A unit with one part uses the label `main`. An assignment holds:

- the work unit;
- the role;
- the part label;
- the tool;
- the tool's task handle, for example a thread ID or a run ID;
- the lifecycle run ID;
- the status;
- the time of the last check;
- the correction round count;
- the revision number and the digest of the resolved plan that it runs under;
- a short status history.

It holds no prompt, no transcript, and no task graph. The tool keeps those.

| Status | Meaning |
| --- | --- |
| `offered` | The job was sent. The tool has not started it. |
| `running` | The tool is working on the job. |
| `returned` | The tool returned a result. The foreman has not judged it yet. |
| `in-review` | A reviewer is checking the result. |
| `needs-correction` | The reviewer found defects. The job went back for correction. |
| `accepted` | The foreman accepted the result on the reviewer's evidence. |
| `failed` | The job cannot finish. The foreman escalates or reassigns it. |
| `cancelled` | The job was stopped on purpose. |
| `unknown` | The factory lost track of the job. Check its task handle before any other step. |

### Status Moves

An assignment moves only along this table. `accepted`, `failed`, and `cancelled` are final. A final status never changes.

| From | Allowed next status |
| --- | --- |
| `offered` | `running`, `unknown`, `failed`, `cancelled` |
| `running` | `returned`, `unknown`, `failed`, `cancelled` |
| `returned` | `in-review`, `needs-correction`, `unknown`, `failed`, `cancelled` |
| `in-review` | `accepted`, `needs-correction`, `unknown`, `failed`, `cancelled` |
| `needs-correction` | `offered`, `running`, `unknown`, `failed`, `cancelled` |
| `unknown` | `offered`, `running`, `returned`, `in-review`, `needs-correction`, `failed`, `cancelled` |
| `accepted`, `failed`, `cancelled` | None |

This is move table version 1. An update that keeps the same status and changes only the last check time is not a move. The CLI refuses any other move with the reason code `illegal-move`, and any change to a final assignment with `final-status`. A job that must run again after a final status gets a new assignment.

### Correction Rounds

Each assignment has a round count that starts at 0. The count goes up by one on each move from `returned` or `in-review` to `needs-correction`. The CLI refuses a move that would take the count past the round limit of the assignment's plan revision, with the reason code `round-limit-reached`. The foreman then escalates floor event 3.

The round count belongs to the job, not to the claim, so it survives a takeover. Only one assignment for each job is open at a time. Parts of one unit with different part labels can run at the same time, and each part has its own count. A new assignment for the same job starts at the round count of the one before it. Only the person can reset the count, through a `once` grant for the action `reset-correction-rounds`. `make-docs factory assignment start` (planned) spends that grant when it starts the new assignment, and the new assignment then starts at 0.

### Status History

Each assignment keeps its 20 newest status changes. Each entry holds the status, the time, and one reason code from [Reason Codes](#reason-codes). An entry holds no free text.

## Claims and Lifecycle Runs

The foreman claims work through the work queue (`make-docs work claim`, MCP `work_claim`, planned). It can claim a wave, a phase, a stage, or a task. The default is a phase.

Each claim opens one lifecycle run at stage `implementation` (operation `lifecycle.start`). Each assignment points to that run. Evidence goes in through the existing evidence operations, `work.evidence.record` and `lifecycle.attach-evidence`.

Only the holder of a live claim starts or updates the unit's assignments. `make-docs factory assignment start` and `make-docs factory assignment update` (planned) take the claim's private claim ID, as the work queue rules require for a report or a close. A caller that no longer holds the claim is refused. Never write a claim ID into a factory record, a note, or a message.

The foreman renews the claim at each check. The work queue rules set the timing: the claimant checks at least every 10 minutes, and a claim lasts 30 minutes by default. So the foreman's wake interval must be shorter than the claim time limit. A wake that comes less often lets the claim expire while the work still runs.

If a foreman stops and its claim expires, another foreman can take the unit only after it checks every open task handle of that unit. Takeover follows the work queue rules in `make-docs://system/reference/work-store.md` (planned). A takeover is refused while a handle shows the work still running. When the old claim has no task handle, a takeover is refused, and a person releases the claim instead (`make-docs work release`, MCP `work_release`, planned). A takeover keeps each assignment of the unit, with its round count and its plan revision.

A quick item comes straight from a request through the front desk. The front desk adds it with `make-docs work add` (MCP `work_add`, planned). It is a task-level unit with no design, plan, or PRD. The foreman still routes it by capability, so a small job can still go to a separate agent. Large work goes through the full lifecycle.

## The Loop

Each time the foreman wakes, it runs these steps in order:

1. Sync the work queue and read the workflow's readiness. If the workflow is `drifted`, escalate and take no new work.
2. Check each open assignment through its task handle. Settle `unknown` assignments first. Renew claims.
3. Judge returned work. Inspect the actual result. Send it to a reviewer who did not build it. Return defects for correction within the limit.
4. Accept each unit inside the given scope on the reviewer's evidence. Close it in the work queue (`make-docs work close`, MCP `work_close`, planned). Integrate it.
5. Take the next ready unit (`make-docs work next`, MCP `work_next`, planned) if the scope and the limits allow. Run preflight first when the workflow turns that step on. Choose the team and assign the jobs under the `ready` plan revision.
6. Escalate each floor event. At the end of the given scope, ask the person to accept.

Worker completion returns control to the foreman. The person does not restart the run after each unit.

## Waking

The selected tools wake the foreman. Make Docs never does.

Setup saves how each workflow wakes:

- on a schedule, through a tool with `wake-on-schedule`;
- on an event, through a tool with `wake-on-event`;
- by a person, who starts the run in a session.

If no wired tool can wake on its own, the workflow runs only while a person keeps a session open. Setup says so in the summary. A wake starts the factory run explicitly.

A wake on a schedule must come more often than the claim time limit. See [Claims and Lifecycle Runs](#claims-and-lifecycle-runs).

## Human Channel

Each workflow saves one human channel: how the factory sends a message (`message-person`) and how the person answers (`receive-answer`). A channel can be any tool that setup proved can send and receive, for example a messaging tool or an agent app that the person follows from a phone.

The last resort is "wait in session": the factory asks in the chat and waits for the person to come back.

## Escalation

### Escalation Floor

These five events always go to the person:

1. An action outside the granted authority, for example a merge, a deploy, a publish, or spending money.
2. A scope change: a change to the outcome, the scope, or the acceptance criteria.
3. A correction loop that stops, because it fails the same way again or reaches its round limit.
4. A missing tool, a missing permission, or wiring that has broken.
5. Work that is ready for the person to accept at the end of the given scope.

A workflow can add events. It can never remove a floor event. During a run, the person hears only the floor events and the events the workflow added.

### Message Rules

Each escalation message is a self-contained request. The person must not need to open a link or read a transcript to understand it. Each message says:

- what happened;
- what the factory needs from the person;
- whether the need is required or optional;
- what work it blocks;
- what happens after the person answers.

Explain each internal term and identifier. A link can add detail. Follow the user action request rules in `make-docs://system/contract/human-experience-contract.md`.

For example, a drift message can say: "The tool that reviews work is no longer available, so the factory cannot check new results. This is required. It blocks the next two units in phase 3. Reconnect the reviewing tool or pick another tool that can launch agents and read their results. After that, the factory runs its test task again and goes on with phase 3."

## Acceptance

The person accepts at the end of the scope they gave, for example a whole wave.

Inside that scope, the foreman accepts each unit on the reviewer's evidence. A merge or a deploy still needs a grant.

At the end of the scope, the person gets one acceptance request with the reviewed result and its evidence.

A Store receipt is never product acceptance.

## Working Rules

- Judge the actual work, not the worker's summary.
- A reviewer never reviews work it built. The brief does not steer the reviewer toward the builder's conclusions.
- Stop a correction loop that repeats the same failure, even before it reaches the round limit.
- Do not send work again after an unclear handoff. Check its status through the task handle first.
- Hand each role only the context kinds that its plan lists.
- Never write an item on the [Never-Log List](#never-log-list) into a factory record. The same list applies to the progress note of `make-docs work report --note`, which is one line of free text of at most 256 characters.
- Green tests do not prove the right behavior. Do not weaken requirements to make a result pass.
- One writer works on a file in each working copy. When parallel workers change the same file in separate working copies, the workflow names one integration owner. The integration owner merges the work and settles conflicts.
- The harness and the repository instructions own the worktree policy. The factory has no worktree rule of its own. Setup saves each workflow's worktree method. The factory obeys a repository or user rule that forbids worktrees.
- The factory starts preflight only when the workflow turns on the preflight step. See [Optional Steps](#optional-steps).
- Workflow config replaces the former factory Skill profiles.
- The factory cannot authorize implementation by itself. Authority comes from the person's grants and the accepted backlog.

## Limits

Each workflow saves its limits. A person can change them at setup.

| Limit | Default |
| --- | --- |
| Correction rounds before the foreman escalates | 3 |
| Parallel workers | No more than the wired tools allow |
| Claim size | A phase |

A limit that the person sets can be lower or higher than the default. A limit never removes a floor event. The CLI counts correction rounds and enforces the round limit. See [Correction Rounds](#correction-rounds).

## Backups Outside Git

In a folder without git, the factory copies a file to `.make-docs/backup/factory/` before a worker changes it. The Store records each backup with its file, its hash, and its assignment.

Make Docs deletes the backups of an assignment when its work is accepted or closed. It deletes any backup older than 30 days. Cleanup runs during normal factory commands. Cleanup never touches installation recovery backups.

A `README.md` in `.make-docs/backup/factory/` tells people and agents the cleanup rule and how to get a file back.

## Never-Log List

Factory records never hold:

- file contents;
- prompts or briefs;
- environment values;
- transcripts;
- credentials, such as keys, tokens, or passwords.

This rule covers the `factory:` config block, every Store record, every resolved plan, every local copy, and every status history entry. A record holds IDs, short labels, times, digests, and reason codes instead. A secret stays in the tool that owns it. The backup copies in `.make-docs/backup/factory/` are file copies, not records. Their Store records hold only the paths, the digest, and the assignment.

The CLI checks every factory write. It accepts only the fields that the record defines. A free-text field is one line of at most 120 characters. The CLI refuses a value that looks like a credential or an environment setting, with the reason code `never-log-field`. The refusal names the field, never the value.

## Reason Codes

Drift results, refusals, and status history entries use reason codes. A reason code is lower-case kebab-case. A code is only ever added. It is never removed, renamed, or given a new meaning. A message to the person explains each code in plain words.

Drift codes: `config-changed`, `binding-changed`, `type-changed`, `type-name-clash`, `tool-missing`, `tool-version-changed`, `proof-contradicted`, and `permission-lost`.

Refusal codes: `not-ready`, `claim-not-held`, `illegal-move`, `final-status`, `round-limit-reached`, `assignment-open`, `plan-digest-mismatch`, `proof-missing`, `unknown-capability`, `type-version-mismatch`, `grant-missing`, `grant-out-of-scope`, `grant-spent`, `grant-expired`, and `never-log-field`.

Status history codes: `assigned`, `tool-started`, `result-returned`, `sent-to-review`, `review-passed`, `defects-found`, `correction-sent`, `handle-not-found`, `handle-checked`, `taken-over`, `stopped-by-person`, `stopped-by-foreman`, `tool-failed`, `round-limit-reached`, and `scope-changed`.

## Workflow Types

A workflow type gives the shape of a workflow. Make Docs ships three types as references:

- `make-docs://system/reference/factory/workflows/build-then-review.md`: one builder does the job, and a separate reviewer checks it.
- `make-docs://system/reference/factory/workflows/lead-and-specialists.md`: the foreman splits one unit across specialists and integrates their results.
- `make-docs://system/reference/factory/workflows/staged-backlog.md`: the foreman works through ready units in dependency order, and each unit uses one of the other two types.

Each type works for software work, personal work, and business work.

### Workflow Type Fields

Each workflow type, shipped or project-owned, has these sections:

| Section | What it holds |
| --- | --- |
| `## Purpose` | What the type is for, in one or two sentences, and its `Type version: N` line. |
| `## When to Use` | The kind of unit that fits, and the kind that does not. |
| `## Roles` | Each role the type needs, its job, and the capability IDs it needs. |
| `## Steps` | The ordered steps from a claimed unit to its return. |
| `## Optional Steps` | Steps that the person can turn on at setup, such as preflight. |
| `## Limits` | The limits the type uses and their defaults. |
| `## Parallel Work` | How parallel workers split the work, and the integration owner rule. |
| `## Returns` | What the type hands back to the foreman, and its evidence. |
| `## Examples` | One software, one personal, and one business example, each described by capability. |

A type can add escalation events in an `## Added Escalation Events` section. It can never remove a floor event.

### Optional Steps

A workflow can turn on the step "run preflight on the unit before claiming it". Preflight reviews the unit and settles the owner choices it needs before work starts. The person turns this step on at setup, so the permission is explicit. Without that step, the factory does not start preflight.

### Project-Owned Types

A project can add its own workflow type as a committed, project-owned file at:

`docs/assets/project/factory/workflows/<type-name>.md`

`<type-name>` uses lower-case letters, digits, and hyphens. It is the name that the `factory:` config block uses for the type.

A project type uses the same [fields](#workflow-type-fields) as a shipped type. It never replaces a shipped type silently. The names `build-then-review`, `lead-and-specialists`, and `staged-backlog` belong to the shipped types. If a project type uses one of those names, setup stops, names both files, and asks the person to rename the project type. Setup saves nothing until the clash is fixed. A run that finds a clash escalates it as floor event 4, broken wiring, and takes no new work. To change a shipped shape, copy it to a project type with a new name.

## Commands

These commands are planned. They are not in the CLI yet. Each command is also an MCP tool in the `factory` MCP profile. The MCP name is the command path joined by underscores.

| Command | MCP tool | Effect |
| --- | --- | --- |
| `make-docs factory status` | `factory_status` | Reads workflows, readiness, claims, assignments, and open manual steps. |
| `make-docs factory tools save` | `factory_tools_save` | Checks and saves the machine's tool list and capability proofs. |
| `make-docs factory workflow save` | `factory_workflow_save` | Checks and saves one workflow's choices and bindings. Saves a new resolved plan revision when the plan changed. |
| `make-docs factory workflow show` | `factory_workflow_show` | Reads one workflow and its latest or named resolved plan revision, with its drift reason codes. |
| `make-docs factory workflow list` | `factory_workflow_list` | Reads all workflows. |
| `make-docs factory proof save` | `factory_proof_save` | Saves a test task result for one plan revision. Makes it the `ready` revision when the proof passed. |
| `make-docs factory assignment start` | `factory_assignment_start` | Records a new assignment under the `ready` plan revision. |
| `make-docs factory assignment update` | `factory_assignment_update` | Changes an assignment's status, round count, or last check time, or records the use of a grant. |
| `make-docs factory assignment list` | `factory_assignment_list` | Reads assignments. |
| `make-docs factory restore` | `factory_restore` | Writes the `.make-docs/factory/` copies again, with the latest resolved plan. |

Writes use the existing write permission, `expectedVersion`, and Store-unavailable rules.

`make-docs factory status` shows each claimed unit, the tool working on it, its state, and the last check time, in human words first.

When a workflow is `ready`, the backlog review "Work on this wave" action sends the wave to the foreman through the front desk. Without a `ready` workflow, that action works as it does today.

## Rule Catalog

Each rule has one row. A planned check names the backlog phase and task that builds it. A planned check is not built yet. Until it ships, the agent follows the contract text. A contract-only row says why no check applies.

| Rule ID | Rule | Contract section | Check |
| --- | --- | --- | --- |
| `tool-agnostic` | Describe tools by capability, never by name. | [Boundary](#boundary) | Contract-only. It is a writing rule. W30 R0 P6 T8 searches the shipped files for tool names. |
| `opt-in` | The factory is off until setup runs. | [Boundary](#boundary) | Contract-only. A project without setup has no factory record to check. |
| `needs-cli-and-store` | Setup stops without the CLI or a usable Store. | [Boundary](#boundary) | Planned in W30 R0 P3 T7: every factory write returns the Store-unavailable outcome. |
| `never-launches` | The CLI and MCP operations check and record. They never launch, schedule, or message. | [Boundary](#boundary) | Planned in W30 R0 P3 T2: `factory.tools.save` runs and contacts no tool. P3 A22 tests that no operation starts a process or opens a network connection. |
| `smallest-setup` | One tool with `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, and `read-agent-result` fills every role, with fresh subagents as builders and reviewers. | [Smallest Setup](#smallest-setup) | Contract-only. The setup Skill applies it (W30 R0 P4 T8). |
| `reviewer-not-builder` | A reviewer never reviews work it built. | [Roles](#roles), [Working Rules](#working-rules) | Contract-only. No record names the session that built a candidate. |
| `custom-role-fields` | A custom role names its job, capabilities, and returns. | [Custom Roles](#custom-roles) | Planned in W30 R0 P3 T3: `factory.workflow.save` checks a workflow against its type and the capability catalog. |
| `custom-role-new-name` | A custom role uses a new name and never replaces a standard role. | [Custom Roles](#custom-roles) | Contract-only. No W30 task checks role names. |
| `match-by-capability` | A role is given to a tool for its proved capabilities. | [Capability Catalog](#capability-catalog) | Planned in W30 R0 P3 T3: `factory.workflow.save` checks a workflow against the capability catalog. |
| `unproved-stays-visible` | A capability setup could not prove stays `unproved`. A failed proof is `contradicted`. | [Capability Catalog](#capability-catalog) | Planned in W30 R0 P3 T2: `factory.tools.save` checks the shape of each capability proof. |
| `capability-ids-stable` | A capability ID is lower-case, only added, and never given a new meaning. | [Capability Catalog](#capability-catalog) | Planned in W30 R0 P3 T16: `factory.tools.save` and `factory.workflow.save` refuse an unknown capability ID, and a test fails when a released ID is removed or renamed. |
| `proof-record` | Each proof records the tool version, the time, its result, and its "does not cover" list. | [Capability Catalog](#capability-catalog) | Planned in W30 R0 P3 T15: `factory.tools.save` checks these fields on each proof. |
| `reprove-on-version-change` | A new tool version makes the workflow `drifted`. To reach `ready` again: prove again, save the workflow, and pass a new test task. If the old version comes back, the workflow is `ready` again with no new step. | [Capability Catalog](#capability-catalog) | Planned in W30 R0 P3 T15: a reported version that differs from the proof's version gives the drift code `tool-version-changed`. |
| `known-losses-listed` | The setup summary lists each known loss that the person accepted. | [Setup Summary](#setup-summary) | Contract-only. The setup Skill writes the summary (W30 R0 P4 T15). |
| `machine-records-shared` | The machine's tool list and proofs are saved once and reused by every project on that machine. | [Setup](#setup) | Planned in W30 R0 P2 T4: the Store saves the tool list once per machine. |
| `rerun-same-workflow` | A rerun updates the same workflow, shows what changed, and proves each changed part again. | [Setup](#setup) | Contract-only. The setup Skill applies it (W30 R0 P4 T12). |
| `manual-steps-listed` | Setup lists each manual step with what the person must do, why, whether it is required or optional, and what it unblocks. | [Manual Steps](#manual-steps) | Planned in W30 R0 P3 T8: `factory.status` lists open manual steps. |
| `setup-summary` | Setup ends with a summary of the roles, the wake method, the channel, the test result, and open manual steps. | [Setup Summary](#setup-summary) | Contract-only. The setup Skill writes it (W30 R0 P4 T11). |
| `ready-needs-proof` | Only a passed test task moves a workflow to `ready`. | [Readiness](#readiness) | Planned in W30 R0 P3 T3 and T4: `factory.workflow.save` refuses `ready` without a passed proof, and `factory.proof.save` moves to `ready` only on a pass. |
| `only-ready-takes-work` | Only a `ready` workflow takes new work. | [Readiness](#readiness), [The Loop](#the-loop) | Contract-only. No factory operation checks readiness before work starts. The run Skill refuses a workflow that is not `ready` (W30 R0 P5 T1). |
| `lost-tool-drifts` | A lost tool always moves the workflow to `drifted`. Only a deliberate unbind moves it to `draft`. | [Readiness](#readiness) | Planned in W30 R0 P3 T9: `factory.status` marks a workflow `drifted` when a bound tool's saved proof no longer holds. |
| `drift-escalates` | A `drifted` workflow escalates, takes no new work, and names the smallest fix. | [Readiness](#readiness) | Planned in W30 R0 P3 T9: `factory.status` shows `drifted` and the smallest fix. |
| `grants-not-committed` | A grant never appears in committed config, a local copy, or a resolved plan. | [Saved Records](#saved-records), [Grants](#grants) | Planned in W30 R0 P2 T8: config validation refuses a grant in the `factory:` block. W30 R0 P3 T18 leaves grants out of the plan. |
| `grant-scope` | A grant use must match the grant's action, scope, and expiry. Outside them, the foreman asks the person again. | [Grants](#grants) | Planned in W30 R0 P3 T17: `factory.assignment.update` refuses a grant use outside its scope, after its expiry, or after a `once` grant is spent. |
| `grant-written` | `factory workflow save` writes each grant, at setup and during a run. A grant-only save changes nothing else. `workflow show` lists grants beside the plan, and no copy holds a grant. | [Grants](#grants) | Planned in W30 R0 P3 T17: a grant-only `factory.workflow.save` writes the grant and saves no plan revision. |
| `no-secrets` | No secret in config, a local copy, a resolved plan, or a Store record. | [Saved Records](#saved-records) | Planned in W30 R0 P2 T8: config validation refuses a secret in the `factory:` block. W30 R0 P3 T22 checks every factory write. |
| `copies-not-input` | Make Docs writes the local copies and never reads them as input. | [Saved Records](#saved-records) | Planned in W30 R0 P2 T9 and T10, and P3 T6: Make Docs writes the copies from the Store and reads none of them. |
| `plan-generated` | The CLI generates the resolved plan from the config entry, the machine binding, and the type. Nobody writes it by hand. | [Resolved Plan](#resolved-plan) | Planned in W30 R0 P3 T18: `factory.workflow.save` resolves the plan and saves a revision when its digest changed. |
| `type-version` | Each workflow type states its version, and the config names it. | [Portable Definition](#portable-definition) | Planned in W30 R0 P3 T18: `factory.workflow.save` refuses a type version that does not match the type file. |
| `role-context` | A role sees only the context kinds that its plan lists. | [Portable Definition](#portable-definition) | Planned in W30 R0 P2 T20: config validation accepts only the fixed context kinds. The run Skill hands each role only its list (W30 R0 P5 T19). |
| `plan-revision-kept` | A saved plan revision never changes. The Store keeps the `ready` revision, each revision that an open assignment names, and the 10 newest others. | [Plan Record](#plan-record) | Planned in W30 R0 P2 T16: the Store refuses a change to a saved revision and removes older revisions on save. |
| `drift-by-digest` | The CLI computes the current plan from the config file, the type file, and the machine tool rows. It is `ready` when its digest matches the `ready` revision, `wired` or `draft` when it matches another saved revision, and `drifted` when it matches none. | [Readiness](#readiness), [How the CLI Finds the State](#how-the-cli-finds-the-state) | Planned in W30 R0 P3 T21: `factory.status` and `factory.workflow.show` compute the current plan, compare its digest with the saved revisions, and list the drift codes. |
| `assignment-plan-revision` | Each assignment records its plan revision and digest. A takeover loads that exact revision. | [Plan Record](#plan-record) | Planned in W30 R0 P3 T21: `factory.assignment.start` records the `ready` revision and refuses a workflow that is not `ready`. |
| `plan-is-data` | The resolved plan has no steps, conditions, joins, or code. The CLI never reads it to decide what to do next. | [Data, Not a Program](#data-not-a-program) | Contract-only. It is a design rule. The plan schema in W30 R0 P3 T18 has no step fields to check. |
| `assignment-fields` | An assignment holds its fields and no prompt, transcript, or task graph. | [Assignments](#assignments) | Planned in W30 R0 P2 T3 and T17: the Store assignment record has only these fields. |
| `assignment-status` | Status is one of the nine values. | [Assignments](#assignments) | Planned in W30 R0 P2 T3: the Store assignment record accepts only these values. |
| `status-moves` | An assignment moves only along the move table. A final status never changes. | [Status Moves](#status-moves) | Planned in W30 R0 P3 T12: `factory.assignment.update` refuses other moves with `illegal-move` and `final-status`. |
| `round-limit` | The CLI counts correction rounds for each job (unit, role, and part label) and refuses a move past the limit. The count survives a takeover. | [Correction Rounds](#correction-rounds) | Planned in W30 R0 P3 T13: `factory.assignment.update` refuses with `round-limit-reached`, and `factory.assignment.start` refuses a second open assignment for one job and spends a reset grant. |
| `status-history` | Each assignment keeps its 20 newest status changes, each with a reason code and no free text. | [Status History](#status-history) | Planned in W30 R0 P3 T14: `factory.assignment.update` adds the entry and keeps the 20 newest. |
| `unknown-first` | Check an `unknown` assignment's handle before any other step. | [Assignments](#assignments), [The Loop](#the-loop) | Contract-only. Only an agent can check a task handle. The run Skill applies it (W30 R0 P5 T5). |
| `claim-held` | Only the holder of a live claim starts or updates the unit's assignments. | [Claims and Lifecycle Runs](#claims-and-lifecycle-runs) | Planned in W30 R0 P3 T5 and T24: `factory.assignment.start` and `.update` take the private claim ID and refuse a caller that no longer holds the claim. |
| `claim-opens-run` | Each claim opens one lifecycle run at stage `implementation`. | [Claims and Lifecycle Runs](#claims-and-lifecycle-runs) | Contract-only. The run Skill opens the run (W30 R0 P5 T4). No W30 task makes `factory.assignment.start` check the run's stage. |
| `wake-before-expiry` | The foreman's wake interval is shorter than the claim time limit. | [Claims and Lifecycle Runs](#claims-and-lifecycle-runs), [Waking](#waking) | Contract-only. The work queue enforces the claim time limit (W29 R0 P4 T4), but no task checks a wake interval. |
| `check-handles-before-takeover` | A foreman takes an expired claim only after it checks every open task handle. | [Claims and Lifecycle Runs](#claims-and-lifecycle-runs) | Planned in W29 R0 P4 T4: `work claim` refuses a takeover until the caller confirms the handle check, refuses it while the handle shows the work running, and refuses it when the old claim has no handle. |
| `loop-order` | The foreman runs the loop steps in order. | [The Loop](#the-loop) | Contract-only. The run Skill follows it (W30 R0 P5 T3). |
| `completion-returns-control` | Worker completion returns control to the foreman. | [The Loop](#the-loop) | Contract-only. The selected tools deliver the completion. No operation sees it. |
| `tools-wake` | The selected tools wake the foreman, never Make Docs. | [Waking](#waking) | Contract-only. Make Docs has no scheduler to check. |
| `no-wake-said` | When no wired tool can wake on its own, setup says so. | [Waking](#waking) | Contract-only. The setup Skill says so in the summary (W30 R0 P4 T11). |
| `one-human-channel` | Each workflow saves one human channel. The last resort is "wait in session". | [Human Channel](#human-channel) | Contract-only. W30 R0 P3 T3 checks a workflow against its type and the capability catalog only. No W30 task checks for a channel binding. |
| `escalation-floor` | The five floor events always reach the person. A workflow cannot remove them. | [Escalation Floor](#escalation-floor) | Planned in W30 R0 P5 T11: a workflow config that removes a floor event is refused (P5 A38). |
| `message-rules` | Each escalation message is a self-contained request. | [Message Rules](#message-rules) | Contract-only. The run Skill writes the messages (W30 R0 P5 T11), and a review checks them (P5 A39). |
| `scope-acceptance` | The person accepts at the end of the given scope. The foreman accepts units inside it. | [Acceptance](#acceptance) | Contract-only. The run Skill applies it (W30 R0 P5 T12). |
| `grant-for-merge-deploy` | A merge or a deploy still needs a grant, even inside the given scope. | [Acceptance](#acceptance) | Contract-only. The run Skill asks for a grant first (W30 R0 P5 T12). No W30 task checks a grant before a merge or a deploy. |
| `receipt-not-acceptance` | A Store receipt is never product acceptance. | [Acceptance](#acceptance) | Contract-only. A Store receipt has no acceptance field to check. |
| `judge-actual-work` | Judge the actual work, not the summary. Green tests do not prove the right behavior. | [Working Rules](#working-rules) | Contract-only. Judgment needs an agent (W30 R0 P5 T8). |
| `stop-repeat-failure` | Stop a correction loop that repeats the same failure. | [Working Rules](#working-rules) | Contract-only. Only an agent can tell that two failures are the same (W30 R0 P5 T8). |
| `check-before-resend` | Do not send work again after an unclear handoff. Check status first. | [Working Rules](#working-rules) | Contract-only. Only an agent can check a task handle (W30 R0 P5 T5). |
| `one-writer` | One writer per file in each working copy. Parallel work names one integration owner. | [Working Rules](#working-rules) | Contract-only. No record lists which files a worker changes (W30 R0 P5 T9). |
| `worktree-policy` | The harness and repository instructions own the worktree policy. | [Working Rules](#working-rules) | Contract-only. The policy belongs to the harness and the repository. Setup saves the method (W30 R0 P4 T6). |
| `no-self-authority` | The factory cannot authorize implementation by itself. | [Working Rules](#working-rules) | Contract-only. Authority comes from the person's grants and the accepted backlog. |
| `preflight-opt-in` | Preflight runs only when the workflow turns it on. | [Optional Steps](#optional-steps) | Contract-only. The run Skill applies it (W30 R0 P5 T7). |
| `limits-saved` | Each workflow saves its limits. The defaults are 3 correction rounds and no more parallel workers than the tools allow. | [Limits](#limits) | Planned in W30 R0 P2 T7: config validation checks the limits in the `factory:` block. W30 R0 P3 T13 enforces the round limit. The other defaults have no check. |
| `backup-before-change` | Outside git, copy a file and record its hash before a worker changes it. | [Backups Outside Git](#backups-outside-git) | Planned in W30 R0 P2 T12: Make Docs records each backup in the Store. |
| `backup-cleanup` | Delete backups on accept or close, and after 30 days. Never touch installation recovery backups. | [Backups Outside Git](#backups-outside-git) | Planned in W30 R0 P2 T13: normal factory commands run the cleanup. |
| `backup-readme` | The backup folder has a `README.md` with the cleanup rule and the recovery steps. | [Backups Outside Git](#backups-outside-git) | Planned in W30 R0 P2 T14: Make Docs writes the `README.md`. |
| `never-log` | Factory records never hold file contents, prompts, briefs, environment values, transcripts, or credentials. | [Never-Log List](#never-log-list) | Planned in W30 R0 P3 T22: every factory write runs the never-log check and refuses with `never-log-field`. |
| `work-note-never-log` | The progress note of `work report --note` follows the never-log list. | [Working Rules](#working-rules) | Contract-only. The work queue checks only the note's length and line form. The run Skill applies it (W30 R0 P5 T19). |
| `reason-codes-stable` | Reason codes are kebab-case, only added, and never changed. | [Reason Codes](#reason-codes) | Planned in W30 R0 P3 T23: a test fails when a released code is removed or renamed. |
| `type-fields` | Every workflow type has the standard sections. | [Workflow Type Fields](#workflow-type-fields) | Contract-only. W30 R0 P3 T3 checks a workflow against its type, but no W30 task checks the sections of a type file. |
| `no-silent-replace` | A project type never replaces a shipped type silently. A clash stops setup and escalates in a run. | [Project-Owned Types](#project-owned-types) | Contract-only. No W30 task checks type names. Setup and the run Skill apply it. |
| `backlog-review-handoff` | With a `ready` workflow, "Work on this wave" sends the wave to the foreman. Without one, the action works as before. | [Commands](#commands) | Planned in W30 R0 P5 T13 and T14: the backlog review action changes only when a workflow is `ready` (P5 A41, A42). |
| `status-human-first` | `factory status` shows each claimed unit, its tool, its state, and the last check time in human words first. | [Commands](#commands) | Planned in W30 R0 P3 T8: `factory.status` puts human words before machine detail (P3 A23). |
