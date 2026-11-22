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
- assignment records and their link to work claims and lifecycle runs;
- the run loop, waking, the human channel, the escalation floor, and acceptance;
- the working rules for builders, reviewers, and integration;
- file backups outside git; and
- the `run factory` operations and the `factory` MCP profile.

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
- R-FACTORY-7 (MUST): a project can add a custom role. A custom role names its job, the capabilities it needs, and what it returns.
- R-FACTORY-8 (MUST): in the smallest setup, one agent tool that can read files, write files, and run commands is the front desk and the foreman. Builders and reviewers are fresh subagents of that agent. A reviewer is never the session that built the work.

### Capability matching

- R-FACTORY-9 (MUST): setup gives a role to a tool because of what the tool can do, not because of its name. The capability catalog in `make-docs://system/contract/factory-contract.md` includes at least: read and write files, run commands, launch agents, wait for an agent, read an agent's result, wake on a schedule, wake on an event, message the person, receive the person's answer, isolate a working copy, and edit code.
- R-FACTORY-10 (MUST): setup records each capability it found, how it proved it, and the role it gave each tool. A capability that a tool claims but setup could not prove stays marked as unproved.

### Setup

- R-FACTORY-11 (MUST): the `factory-setup` Skill finds the tools on the machine and in the project, reads the instructions those tools make available, interviews the person for preferences and permissions, wires roles to tools by capability, runs one small test task through the whole workflow, and saves the result.
- R-FACTORY-12 (MUST): a workflow has one readiness state: `draft`, `wired`, `ready`, or `drifted`. Only a passed test task moves a workflow to `ready`. A workflow is `drifted` when a wired tool, capability proof, or permission no longer holds. Only a `ready` workflow takes new work.
- R-FACTORY-13 (MUST): setup lists each one-time manual step with what the person must do, why, and what it unblocks.
- R-FACTORY-14 (MUST): setup ends with a summary of which tool fills each role, how the workflow wakes, how the factory reaches the person, what the test task proved, and each open manual step.
- R-FACTORY-15 (MUST): the machine's tool list and capability proofs are saved once per machine and reused by every project on that machine. Each project saves its own workflow choices.
- R-FACTORY-16 (MUST): a rerun updates the same workflow, shows what changed, and proves again each boundary that changed.

### Workflow types

- R-FACTORY-17 (MUST): workflow types are system resources of the existing reference type. The shipped types are `build-then-review`, `lead-and-specialists`, and `staged-backlog`. Each type works for software, personal, and business work.
- R-FACTORY-18 (MUST): build then review uses one builder and a separate reviewer, with corrections inside the limit. Lead and specialists lets the foreman split one unit across specialists and integrate their results. Staged backlog works through ready units in dependency order, and each unit uses one of the other two types.
- R-FACTORY-19 (MUST): a project can add its own workflow type as a committed, project-owned file. A project type uses the same fields as a shipped type and never replaces a shipped type silently.
- R-FACTORY-20 (MUST): each workflow saves its limits. The defaults are three correction rounds before escalation and no more parallel workers than the wired tools allow.
- R-FACTORY-21 (MUST): a workflow can include the step "run preflight on the unit before claiming it". The person turns this step on at setup. Without it, the factory does not start preflight.

### Saved records and local copies

- R-FACTORY-22 (MUST): portable workflow choices live in the `factory:` block of project config: workflow type, roles needed, capability needs, limits, steps, and added escalation events.
- R-FACTORY-23 (MUST): machine tools, capability proofs, role bindings, human channel and wake bindings, grants, assignments, proof results, and backup records live in the Store. Machine IDs and paths stay in the Store.
- R-FACTORY-24 (MUST): a grant permits an action outside the default authority, for example a merge, a deploy, a publish, or spending money. A grant belongs to one person on one machine. It never appears in committed config or in a local copy.
- R-FACTORY-25 (MUST): `.make-docs/factory/` holds generated, read-only, gitignored copies of the saved setup. Each file states that it is generated and that edits are lost. Make Docs never reads a copy as input. `run factory restore` writes the copies again from the Store.
- R-FACTORY-26 (MUST NOT): config, a local copy, or a Store record holds a secret. Secrets stay in the tools that own them.

### Assignments, claims, and lifecycle runs

- R-FACTORY-27 (MUST): an assignment links one job to the tool doing it. It holds the work unit, the role, the tool, the tool's task handle, the lifecycle run ID, the status, and the time of the last check. It holds no prompt, transcript, or task graph.
- R-FACTORY-28 (MUST): assignment status is one of `offered`, `running`, `returned`, `in-review`, `needs-correction`, `accepted`, `failed`, `cancelled`, or `unknown`. An `unknown` assignment is checked through its task handle before any other step.
- R-FACTORY-29 (MUST): the foreman can claim a wave, phase, stage, or task through the work queue. The default is a phase. It renews the claim at each check.
- R-FACTORY-30 (MUST): each claim opens one lifecycle run at stage `implementation`. Each assignment points to that run. Evidence is recorded through the existing evidence and lifecycle evidence operations.
- R-FACTORY-31 (MUST): a quick item from the front desk is routed by capability, like any other unit. A small job can still go to a separate agent.

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
- R-FACTORY-41 (MUST): the foreman stops a correction loop that repeats the same failure. It does not send work again after an unclear handoff; it checks the status first.
- R-FACTORY-42 (MUST): one writer works on a file in each working copy. When parallel workers change the same file in separate working copies, the workflow names one integration owner, who merges the work and settles conflicts.
- R-FACTORY-43 (MUST): the harness and the repository instructions own the worktree policy. Setup saves each workflow's worktree method. The factory obeys a repository or user rule that forbids worktrees.

### Backups outside git

- R-FACTORY-44 (MUST): in a folder without git, the factory copies a file to `.make-docs/backup/factory/` before a worker changes it. The Store records each backup with its file, its hash, and its assignment.
- R-FACTORY-45 (MUST): Make Docs deletes an assignment's backups when its work is accepted or closed, and deletes any backup older than 30 days. Cleanup runs during normal factory operations and never touches installation recovery backups.
- R-FACTORY-46 (MUST): a `README.md` in `.make-docs/backup/factory/` tells people and agents the cleanup rule and how to get a file back.

### Backlog review handoff

- R-FACTORY-47 (MUST): when a workflow is `ready`, the backlog review "Work on this wave" action sends the wave to the foreman through the front desk. Without a `ready` workflow, the action keeps its current behavior under [PRD 51](51-backlog-review-and-reporting.md).

### Skills

- R-FACTORY-48 (MUST): the `factory-setup` Skill and the `factory` run Skill are first-party, explicit-invocation-only Skills under [PRD 08](08-skills-catalog-and-distribution.md). A wake from a schedule or event invokes the `factory` Skill explicitly. Workflow config replaces the former Skill profiles.

## Contracts and Data

### Operations

| Operation | CLI path | Effect |
| --- | --- | --- |
| `factory.status` | `make-docs run factory status` | Reads workflows, readiness, claims, assignments, and open manual steps. |
| `factory.tools.save` | `make-docs run factory tools save` | Checks and saves the machine's tool list and capability proofs. |
| `factory.workflow.save`, `.show`, `.list` | `make-docs run factory workflow save \| show \| list` | Checks and saves a workflow, or reads workflows. |
| `factory.proof.save` | `make-docs run factory proof save` | Saves a test task result. Moves a workflow to `ready` when the proof passed. |
| `factory.assignment.start`, `.update`, `.list` | `make-docs run factory assignment start \| update \| list` | Records and reads assignments. |
| `factory.restore` | `make-docs run factory restore` | Writes the `.make-docs/factory/` copies again. |

- R-FACTORY-49 (MUST): each operation is also an MCP tool in the `factory` MCP profile under [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md). CLI and MCP results come from one core.
- R-FACTORY-50 (MUST): every write uses the existing write permission, `expectedVersion`, and Store-unavailable outcomes. `workflow save` refuses `ready` without a passed proof. `assignment start` and `update` check the work queue claim and refuse a caller that no longer holds it.
- R-FACTORY-51 (MUST): `run factory status` shows each claimed unit, its tool, its state, and the last check time in human words first, with exact detail in machine output.

### Shared rules

- R-FACTORY-52 (MUST): the factory contract holds the roles, capability catalog, readiness states, escalation floor, acceptance rule, working rules, limits, and the backup rule. Where the CLI checks a rule, the code and the contract give the same answer. A change to one form requires a review of the other.

## Integrations

- [PRD 52](52-work-store-and-work-queue.md) supplies next, claim, report, and close.
- [PRD 38](38-global-store-and-project-state.md) owns the factory Store fields, their classes, and the narrow rule that allows the `.make-docs/factory/` copies.
- [PRD 24](24-project-configuration-and-convention-overlay.md) owns the `factory:` config block.
- [PRD 21](21-project-tool-directory-and-resource-tiers.md) owns the `.make-docs/factory/` and `.make-docs/backup/factory/` paths.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle stages. The factory uses the existing `implementation` stage.

## Rebuild Notes

- Tool-agnostic means every proof names the tools it used, and no claim reaches past them. A tool that the factory has never seen must still fit if setup can prove its capabilities.
- The assignment record exists for recovery. Without it, a lost reply leads to duplicate work. Check the handle first.
- Grants are the main safety boundary. Keep them out of every committed or copied file.
- The factory must never grow into a scheduler or a relay. Waking and messaging belong to the person's tools.

## Source Anchors

- [Factory design](../designs/2026-11-21-factory.md)
- [W30 R0 plan](../plans/2026-11-21-w30-r0-factory/00-overview.md)
- `packages/skills/factory/SKILL.md`
- `packages/cli/src/operations/lifecycle/registry-ops.ts`
