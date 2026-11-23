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
| This contract | The shared rules for both setup and run. |
| CLI and MCP operations | Check and save setup, workflows, assignments, proofs, and backups. Write the local copies. |
| Store records | Machine tools, capability proofs, bindings, grants, assignments, proofs, and backups. |
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

The catalog can grow. A new capability names its ID, what it means, and how setup proves it.

Setup records each capability it found, the tool that has it, how setup proved it, the result, and the role it gave the tool. A capability that a tool's own docs claim but setup could not prove stays marked as `unproved`. A role never depends on an unproved capability. Every claim about a tool combination names the combination that was actually tested.

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
- each manual step that is still open.

## Readiness

A workflow has one readiness state.

| State | Meaning | Takes new work |
| --- | --- | --- |
| `draft` | The workflow choices are saved, but setup has not bound a tool to each needed role and proved the role's capabilities. | No |
| `wired` | Each needed role has a tool, and each capability that the role needs is proved. The test task has not passed since the last change. | No |
| `ready` | The test task passed through the whole workflow after the last change. | Yes |
| `drifted` | A wired tool, a capability proof, or a permission no longer holds. | No |

What moves a workflow:

- `draft` to `wired`: setup binds the last needed role and proves its capabilities.
- `wired` to `ready`: a test task passes, and setup saves the proof. Only a passed test task moves a workflow to `ready`.
- `ready` to `wired`: setup changes a role, a binding, a limit, or a step. The test task must pass again.
- `ready` or `wired` to `drifted`: a check finds that a wired tool is gone, a proof no longer holds, or a permission was taken away. A lost tool always moves the workflow to `drifted`, even when it was a role's only tool. The workflow then escalates.
- `drifted` to `wired`: the person or setup fixes the broken part, and setup proves the changed capability again. The test task must then pass to reach `ready`.
- Any state to `draft`: the person or setup removes a needed role's binding on purpose. Only a deliberate unbind moves a workflow to `draft`. A lost tool never does.

Only a `ready` workflow takes new work. A `drifted` workflow escalates before it takes new work. Its message names the broken part and the smallest step that fixes it.

## Saved Records

| Record | Where | Why |
| --- | --- | --- |
| Workflow choices: type, roles needed, capability needs, limits, steps such as preflight, and added escalation events | `factory:` block in `.make-docs/config.yaml` | Portable. Teammates and other machines can rebuild the same workflow. |
| Machine tools, capability proofs, and role bindings | Store | Machine-specific. Holds paths and IDs. |
| Grants | Store | A grant is one person's permission on one machine. It is never committed. |
| Human channel binding and wake binding | Store | Machine-specific and account-specific. |
| Assignments | Store | The durable run record. See [Assignments](#assignments). |
| Proof results | Store | The evidence that a workflow is ready. |
| File backups | Store record and `.make-docs/backup/factory/` | Undo outside git. See [Backups Outside Git](#backups-outside-git). |

A grant permits one action outside the default authority, for example a merge, a deploy, a publish, or spending money. A grant never appears in committed config or in a local copy.

`.make-docs/factory/` holds read-only, gitignored copies of the saved setup. Only Make Docs writes them. Each file starts with a note that it is generated and that edits are lost. `make-docs factory restore` (MCP `factory_restore`, planned) writes them again from the Store. An agent or a person can read the wiring from the copies without a CLI call. Make Docs never reads a copy as input.

No secret is saved in config, in a local copy, or in a Store record. Secrets stay in the tools that own them.

## Assignments

An assignment links one job to the tool doing it. It holds:

- the work unit;
- the role;
- the tool;
- the tool's task handle, for example a thread ID or a run ID;
- the lifecycle run ID;
- the status;
- the time of the last check.

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

## Claims and Lifecycle Runs

The foreman claims work through the work queue (`make-docs work claim`, MCP `work_claim`, planned). It can claim a wave, a phase, a stage, or a task. The default is a phase.

Each claim opens one lifecycle run at stage `implementation` (operation `lifecycle.start`). Each assignment points to that run. Evidence goes in through the existing evidence operations, `work.evidence.record` and `lifecycle.attach-evidence`.

Only the holder of a live claim starts or updates the unit's assignments. A caller that no longer holds the claim is refused.

The foreman renews the claim at each check. The work queue rules set the timing: the claimant checks at least every 10 minutes, and a claim lasts 30 minutes by default. So the foreman's wake interval must be shorter than the claim time limit. A wake that comes less often lets the claim expire while the work still runs.

If a foreman stops and its claim expires, another foreman can take the unit only after it checks every open task handle of that unit. Takeover follows the work queue rules in `make-docs://system/reference/work-store.md` (planned). A takeover is refused while a handle shows the work still running. When the old claim has no task handle, a takeover is refused, and a person releases the claim instead (`make-docs work release`, MCP `work_release`, planned).

A quick item comes straight from a request through the front desk. The front desk adds it with `make-docs work add` (MCP `work_add`, planned). It is a task-level unit with no design, plan, or PRD. The foreman still routes it by capability, so a small job can still go to a separate agent. Large work goes through the full lifecycle.

## The Loop

Each time the foreman wakes, it runs these steps in order:

1. Sync the work queue and read the workflow's readiness. If the workflow is `drifted`, escalate and take no new work.
2. Check each open assignment through its task handle. Settle `unknown` assignments first. Renew claims.
3. Judge returned work. Inspect the actual result. Send it to a reviewer who did not build it. Return defects for correction within the limit.
4. Accept each unit inside the given scope on the reviewer's evidence. Close it in the work queue (`make-docs work close`, MCP `work_close`, planned). Integrate it.
5. Take the next ready unit (`make-docs work next`, MCP `work_next`, planned) if the scope and the limits allow. Run preflight first when the workflow turns that step on. Choose the team and assign the jobs.
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
- Stop a correction loop that repeats the same failure.
- Do not send work again after an unclear handoff. Check its status through the task handle first.
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

A limit that the person sets can be lower or higher than the default. A limit never removes a floor event.

## Backups Outside Git

In a folder without git, the factory copies a file to `.make-docs/backup/factory/` before a worker changes it. The Store records each backup with its file, its hash, and its assignment.

Make Docs deletes the backups of an assignment when its work is accepted or closed. It deletes any backup older than 30 days. Cleanup runs during normal factory commands. Cleanup never touches installation recovery backups.

A `README.md` in `.make-docs/backup/factory/` tells people and agents the cleanup rule and how to get a file back.

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
| `## Purpose` | What the type is for, in one or two sentences. |
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
| `make-docs factory workflow save` | `factory_workflow_save` | Checks and saves one workflow's choices and bindings. |
| `make-docs factory workflow show` | `factory_workflow_show` | Reads one workflow. |
| `make-docs factory workflow list` | `factory_workflow_list` | Reads all workflows. |
| `make-docs factory proof save` | `factory_proof_save` | Saves a test task result. Moves a workflow to `ready` when the proof passed. |
| `make-docs factory assignment start` | `factory_assignment_start` | Records a new assignment. |
| `make-docs factory assignment update` | `factory_assignment_update` | Changes an assignment's status or last check time. |
| `make-docs factory assignment list` | `factory_assignment_list` | Reads assignments. |
| `make-docs factory restore` | `factory_restore` | Writes the `.make-docs/factory/` copies again. |

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
| `unproved-stays-visible` | A capability setup could not prove stays `unproved`. | [Capability Catalog](#capability-catalog) | Planned in W30 R0 P3 T2: `factory.tools.save` checks the shape of each capability proof. |
| `machine-records-shared` | The machine's tool list and proofs are saved once and reused by every project on that machine. | [Setup](#setup) | Planned in W30 R0 P2 T4: the Store saves the tool list once per machine. |
| `rerun-same-workflow` | A rerun updates the same workflow, shows what changed, and proves each changed part again. | [Setup](#setup) | Contract-only. The setup Skill applies it (W30 R0 P4 T12). |
| `manual-steps-listed` | Setup lists each manual step with what the person must do, why, whether it is required or optional, and what it unblocks. | [Manual Steps](#manual-steps) | Planned in W30 R0 P3 T8: `factory.status` lists open manual steps. |
| `setup-summary` | Setup ends with a summary of the roles, the wake method, the channel, the test result, and open manual steps. | [Setup Summary](#setup-summary) | Contract-only. The setup Skill writes it (W30 R0 P4 T11). |
| `ready-needs-proof` | Only a passed test task moves a workflow to `ready`. | [Readiness](#readiness) | Planned in W30 R0 P3 T3 and T4: `factory.workflow.save` refuses `ready` without a passed proof, and `factory.proof.save` moves to `ready` only on a pass. |
| `only-ready-takes-work` | Only a `ready` workflow takes new work. | [Readiness](#readiness), [The Loop](#the-loop) | Contract-only. No factory operation checks readiness before work starts. The run Skill refuses a workflow that is not `ready` (W30 R0 P5 T1). |
| `lost-tool-drifts` | A lost tool always moves the workflow to `drifted`. Only a deliberate unbind moves it to `draft`. | [Readiness](#readiness) | Planned in W30 R0 P3 T9: `factory.status` marks a workflow `drifted` when a bound tool's saved proof no longer holds. |
| `drift-escalates` | A `drifted` workflow escalates, takes no new work, and names the smallest fix. | [Readiness](#readiness) | Planned in W30 R0 P3 T9: `factory.status` shows `drifted` and the smallest fix. |
| `grants-not-committed` | A grant never appears in committed config or a local copy. | [Saved Records](#saved-records) | Planned in W30 R0 P2 T8: config validation refuses a grant in the `factory:` block. |
| `no-secrets` | No secret in config, a local copy, or a Store record. | [Saved Records](#saved-records) | Planned in W30 R0 P2 T8: config validation refuses a secret in the `factory:` block. Copies and Store records have no check. |
| `copies-not-input` | Make Docs writes the local copies and never reads them as input. | [Saved Records](#saved-records) | Planned in W30 R0 P2 T9 and T10, and P3 T6: Make Docs writes the copies from the Store and reads none of them. |
| `assignment-fields` | An assignment holds its fields and no prompt, transcript, or task graph. | [Assignments](#assignments) | Planned in W30 R0 P2 T3: the Store assignment record has only these fields. |
| `assignment-status` | Status is one of the nine values. | [Assignments](#assignments) | Planned in W30 R0 P2 T3: the Store assignment record accepts only these values. |
| `unknown-first` | Check an `unknown` assignment's handle before any other step. | [Assignments](#assignments), [The Loop](#the-loop) | Contract-only. Only an agent can check a task handle. The run Skill applies it (W30 R0 P5 T5). |
| `claim-held` | Only the holder of a live claim starts or updates the unit's assignments. | [Claims and Lifecycle Runs](#claims-and-lifecycle-runs) | Planned in W30 R0 P3 T5: `factory.assignment.start` and `.update` refuse a caller that no longer holds the claim. |
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
| `limits-saved` | Each workflow saves its limits. The defaults are 3 correction rounds and no more parallel workers than the tools allow. | [Limits](#limits) | Planned in W30 R0 P2 T7: config validation checks the limits in the `factory:` block. The defaults have no check. |
| `backup-before-change` | Outside git, copy a file and record its hash before a worker changes it. | [Backups Outside Git](#backups-outside-git) | Planned in W30 R0 P2 T12: Make Docs records each backup in the Store. |
| `backup-cleanup` | Delete backups on accept or close, and after 30 days. Never touch installation recovery backups. | [Backups Outside Git](#backups-outside-git) | Planned in W30 R0 P2 T13: normal factory commands run the cleanup. |
| `backup-readme` | The backup folder has a `README.md` with the cleanup rule and the recovery steps. | [Backups Outside Git](#backups-outside-git) | Planned in W30 R0 P2 T14: Make Docs writes the `README.md`. |
| `type-fields` | Every workflow type has the standard sections. | [Workflow Type Fields](#workflow-type-fields) | Contract-only. W30 R0 P3 T3 checks a workflow against its type, but no W30 task checks the sections of a type file. |
| `no-silent-replace` | A project type never replaces a shipped type silently. A clash stops setup and escalates in a run. | [Project-Owned Types](#project-owned-types) | Contract-only. No W30 task checks type names. Setup and the run Skill apply it. |
| `backlog-review-handoff` | With a `ready` workflow, "Work on this wave" sends the wave to the foreman. Without one, the action works as before. | [Commands](#commands) | Planned in W30 R0 P5 T13 and T14: the backlog review action changes only when a workflow is `ready` (P5 A41, A42). |
| `status-human-first` | `factory status` shows each claimed unit, its tool, its state, and the last check time in human words first. | [Commands](#commands) | Planned in W30 R0 P3 T8: `factory.status` puts human words before machine detail (P3 A23). |
