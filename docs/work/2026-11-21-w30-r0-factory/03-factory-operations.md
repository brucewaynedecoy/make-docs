---
title: "Phase 3: Factory Operations"
kind: "work"
status: "completed"
coordinate: "W30 R0 P3"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/03-factory-operations.md"
---

# Phase 3: Factory Operations

## Purpose

Let Skills and people check and save factory state through one operation core. P4 and P5 use these operations.

## Overview

This phase admits the `factory` operations in the shared registry, with CLI and MCP parity, in a new `factory` MCP profile. The operations check and record. None of them launches, schedules, messages, or contacts a tool.

## Human Experience Outcome

- Impact and governing promise: `direct`. `factory status` shows each claimed unit, its tool, its state, and the last check, in human words first (R-FACTORY-51). A drifted workflow shows its state and the smallest fix (R-FACTORY-12, R-FACTORY-33).
- Intended human outcome: a person can tell, from one status call, what the factory is doing, what is stuck, and what to do next.
- Human-facing surface: `make-docs factory status` and the `factory_status` MCP tool.
- Implementation work: Stages 1 and 2.
- Evidence source: CLI and MCP parity fixtures, a drift fixture, and Guided Progress Review of status output.
- Executor: the implementing agent, with owner feedback invited.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-5, R-FACTORY-10, R-FACTORY-12, R-FACTORY-24 to R-FACTORY-28, R-FACTORY-33, R-FACTORY-41, R-FACTORY-49 to R-FACTORY-51, R-FACTORY-53 to R-FACTORY-61, and R-FACTORY-62 to R-FACTORY-68, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Operation-core tests without transport, CLI JSON and MCP parity, write permission and `expectedVersion` checks, and a no-process, no-network check. |
| Performance Testing | not-needed-now | No performance candidate applies. |
| Guided Progress Review | selected | Owner review of `factory status` output for a ready, a drifted, and a busy workflow. Feedback can change the output before closeout. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md) (R-REGISTER-2, the project register)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Save Operations

### Tasks

- [x] T1: Admit `factory tools save`, `workflow save | show | list`, `proof save`, `assignment start | save | list`, and `restore` in the registry, with MCP names such as `factory_tools_save` (R-FACTORY-49).
- [x] T2: `tools save` checks the shape of a tool list and its capability proofs. It does not run or contact any tool (R-FACTORY-5, R-FACTORY-10).
- [x] T3: `workflow save` checks a workflow against its type and the capability catalog, sets its readiness state, and refuses `ready` without a passed proof (R-FACTORY-12, R-FACTORY-50).
- [x] T4: `proof save` records a test task result and moves the workflow to `ready` only when the proof passed (R-FACTORY-12).
- [x] T5: `assignment start | save` checks the work queue claim before it writes, and refuses a caller that no longer holds the claim (R-FACTORY-50).
- [x] T6: `restore` writes the `.make-docs/factory/` copies from the Store (R-FACTORY-25).
- [x] T7: Use the existing write permission, `expectedVersion`, and Store-unavailable outcomes for every write (R-FACTORY-50).

### Acceptance criteria

- A19: CLI JSON and MCP results match for every save operation on the shared fixtures.
- A20: `workflow save` refuses `ready` when no passed proof exists, and the refusal names the missing proof.
- A21: `assignment save` from a caller without the claim is refused with a typed result.
- A22: No operation spawns a process or opens a network connection, as a test proves.

### Dependencies

- P2.
- An accepted command tree review under register D-065. The command paths and MCP names in this phase follow it.

## Stage 2 - Status and MCP Profile

### Tasks

- [x] T8: Admit `factory status`. It shows workflows, readiness, claims, assignments, and open manual steps in human words first, with exact detail in machine output. It shows one project, with one group for each running factory: grouped by checkout, then by lifecycle run. Each checkout group shows its own readiness from that checkout's config file and type file. `--run <run-id>` (MCP input `run`) shows one run. Updated on 2026-11-23 (register D-073) (R-FACTORY-51).
- [x] T9: Mark a workflow `drifted` in status when a bound tool's saved proof no longer holds, and name the smallest fix (R-FACTORY-12, R-FACTORY-33).
- [x] T10: Add the `factory` MCP profile. Keep the work queue tools in the `backlog` and `workflow` profiles, and include all of them in `all` (R-FACTORY-49).
- [x] T11: Run Guided Progress Review of status output for a ready, a drifted, and a busy workflow.

### Acceptance criteria

- A23: For each claimed unit, status shows the unit, its tool, its state, and the last check time before any machine detail. Two checkouts of one project with one run each show two groups, each with its own readiness, and `--run` shows only one of them.
- A24: A drifted workflow shows the `drifted` state, the broken binding, and one next step.
- A25: The `factory` MCP profile lists every factory tool, and `all` includes them.

### Dependencies

- Stage 1.

## Stage 3 - Moves, Rounds, Proofs, and Grants

New on 2026-11-23. The owner approved these checks after P1 was done.

### Tasks

- [x] T12: `assignment save` allows only the moves in the status move table. It refuses any other move with `illegal-move`, and any change to an `accepted`, `failed`, or `cancelled` assignment with `final-status`. An update that changes only the last check time is not a move (R-FACTORY-28).
- [x] T13: `assignment save` adds one to the round count of the job (unit, role, and part label) on each move from `returned` or `in-review` to `needs-correction`, and on a move from `unknown` to `needs-correction` unless the status history shows that the status before `unknown` was already `needs-correction` (both rules about `unknown` are new on 2026-11-23), and refuses a move past the round limit of the assignment's plan revision with `round-limit-reached`. `assignment start` refuses a second open assignment for the same job with `assignment-open`, and allows open assignments for other part labels of the same unit. A new assignment for the same job starts at the count of the one before it. `assignment start` spends a `once` grant for `reset-correction-rounds` when the caller names it, and the new assignment then starts at 0 (R-FACTORY-27, R-FACTORY-41, register D-071).
- [x] T14: Each move adds a status history entry with the status, the time, and one reason code. The record keeps the 20 newest entries (R-FACTORY-27).
- [x] T15: `tools save` checks that each proof has a reported tool version, a proof time, a result of `proved`, `unproved`, or `contradicted`, and a "does not cover" list. It records each tool's state as `available`, `missing`, or `blocked`, as the agent reports it. A reported version that differs from the version in a bound tool's proof, a `missing` tool, and a `blocked` tool each change the current plan, so the workflow is `drifted` with `tool-version-changed`, `tool-missing`, or `permission-lost` (R-FACTORY-10, R-FACTORY-12).
- [x] T16: `tools save` and `workflow save` refuse an unknown capability ID with `unknown-capability`. A test fails when a released capability ID is removed or renamed (R-FACTORY-53).
- [x] T17: `assignment save` records the use of a grant. It refuses a use with `grant-missing`, `grant-out-of-scope`, `grant-spent`, or `grant-expired`, and marks a `once` grant as spent on its first use. A grant-only `workflow save` writes or revokes a grant during a run, with the lifecycle run for a `run` grant. It resolves no plan, saves no revision, and does not change readiness (R-FACTORY-24).

### Acceptance criteria

- A56: Each move in the table is accepted, every other move is refused with `illegal-move`, and every change to a final assignment is refused with `final-status`.
- A57: A fourth move to `needs-correction` under the default limit of 3 is refused with `round-limit-reached`. A move from `unknown` to `needs-correction` adds one round, but adds none when the status before `unknown` was `needs-correction`. After a takeover, the count goes on from where it was. A second open assignment for one job is refused, while two parts of one unit with different part labels run at the same time with separate counts. A spent reset grant starts the next assignment of that job at 0.
- A58: A changed tool version gives `drifted` with `tool-version-changed`, and an unknown capability ID is refused with `unknown-capability`.
- A59: A grant use is refused for each of the four codes, a `once` grant works only once, and a `run` grant works only in its own lifecycle run. A grant-only save during a run leaves the plan revisions and the readiness state unchanged.

### Dependencies

- Stage 1 and P2 T16 to T21.

## Stage 4 - Resolved Plan, Never-Log Check, and Reason Codes

New on 2026-11-23.

### Tasks

- [x] T18: `workflow save` resolves the config entry, the saved binding, the machine tool rows, and the workflow type into canonical JSON (sorted keys, no extra spaces, UTF-8), with its plan, config, and binding digests. It saves a new revision only when no kept revision has that digest, and never makes a revision the `ready` revision. It leaves grants out of the plan (register D-072). The plan schema has no step, condition, or branch field. It refuses a type version that does not match the type file with `type-version-mismatch` (R-FACTORY-55, R-FACTORY-56, R-FACTORY-57, R-FACTORY-59, R-FACTORY-61).
- [x] T19: `proof save` names the plan digest that the test task ran under. It refuses with `plan-digest-mismatch` a digest that is not the current plan's digest or that has no saved revision. On a pass, it makes that revision the `ready` revision (R-FACTORY-12, R-FACTORY-57).
- [x] T20: `workflow show` reads the latest (newest saved) revision, or the revision that the caller names, with the current plan digest, the `ready` revision, and each drift reason code, explained in plain words. It lists the grants beside the plan and writes nothing (R-FACTORY-24, R-FACTORY-54, R-FACTORY-57).
- [x] T21: `status` and `workflow show` compute the current plan from three live sources (the config file, the workflow type file, and the machine tool rows), not from the copy in the saved binding. The state is `ready` when its digest matches the `ready` revision, `wired` or `draft` when it matches another saved revision, and `drifted` when it matches none, with each drift reason code in plain words. `assignment start` records the `ready` revision number and digest, and refuses with `not-ready` when the workflow is not `ready`. `assignment save` checks moves and rounds against the assignment's own revision (R-FACTORY-12, R-FACTORY-54, R-FACTORY-58).
- [x] T22: Every factory write runs one never-log check. It accepts only the defined fields, allows free text only as one line of at most 120 characters, and refuses a value that looks like a credential or an environment setting with `never-log-field`. The refusal names the field and never shows the value (R-FACTORY-26).
- [x] T23: Keep the reason codes in one list in code, matched to the contract lists. A test fails when a released code is removed or renamed (R-FACTORY-54).
- [x] T24: `assignment start` and `assignment save` take the private claim ID of the unit's live claim, as PRD 52 R-WORK-QUEUE-19 requires for a report or a close. They refuse a call without it, and never write the claim ID into a factory record or a result (R-FACTORY-50). New on 2026-11-23.

### Acceptance criteria

- A60: The same inputs in a different key order give the same plan digest. A save with no change makes no new revision. `proof save` with a digest that is not the current plan is refused with `plan-digest-mismatch`. `workflow show` lists grants beside the plan and writes nothing.
- A61: A fixture shows each state: `ready` when the current digest matches the `ready` revision, `wired` after a saved change, and `drifted` with `config-changed`, `tool-missing`, `permission-lost`, `tool-version-changed`, or `type-changed` after a change without a save. Undoing the change makes the workflow `ready` again with no new test task. `assignment start` on a workflow that is not `ready` is refused with `not-ready`. A takeover fixture loads the assignment's own revision after a newer revision exists.
- A62: The never-log check refuses a file body, a prompt, an environment setting, and a credential-like value in each kind of factory record, and the refusal never shows the value.
- A63: The reason code test fails when a code is removed or renamed, and the code list matches the contract.
- A73: `assignment start` and `assignment save` without the claim ID, or with a wrong one, are refused, and no factory record, result, or copy shows a claim ID.

### Dependencies

- Stage 3.

## Stage 5 - Project Scope and Factory URIs

New on 2026-11-23. The owner chose option A for project scope after P1 was done. All of this is new behavior.

### Tasks

- [x] T25: Tag each factory operation as machine-level or project-scoped, as the PRD 53 project scope table lists. `factory tools save` takes no project input, and the current folder never ties it to a project (R-FACTORY-62).
- [x] T26: Every project-scoped write (`workflow save`, also a grant-only save, `proof save`, `assignment start`, `assignment save`, and `restore`) takes `--target-root <path>` or the new `--project <name>` option, and the `targetRoot` or `project` MCP input. Resolve a name only through `project_register`. Never fall back to the current folder, even when it is a project (R-FACTORY-63).
- [x] T27: Refuse a project write and change nothing with `project-missing` (no project named), `project-not-found` (a name that `project_register` does not know), `project-mismatch` (a path and a name that give two projects), or `project-checkout-unclear` (a write that needs project files when the name gives no bound checkout or more than one). A `--target-root` path that is not a bound project keeps the existing typed Store outcome. A `project-missing` refusal names both ways to name a project. Add the four codes to the reason code list of T23 (R-FACTORY-54, R-FACTORY-63).
- [x] T28: Every factory result, in the CLI and in MCP, says what it acted on: the project name and project ID, or this machine. A refusal names the project it refused, or says that no project was named. The human words come first (R-FACTORY-64).
- [x] T29: `workflow show`, `workflow list`, and `assignment list` can use the project of the current folder when no project is named. Their output names the project and says whether it was named or taken from the current folder. A read in a folder that is not a project, with no project named, is refused with `project-missing`. `factory status` follows the same rule: one project, named or taken from the current folder. A checkout that cannot be read shows its readiness as unknown and says why (R-FACTORY-51, R-FACTORY-65, register D-073).
- [x] T30: Resolve the approved factory URI paths through the shared resolver and `project_register`: `factory/`, `factory/workflows/<name>`, `factory/workflows/<name>/revisions/`, `factory/workflows/<name>/revisions/<n>`, and `factory/assignments/`, where each row also shows its lifecycle run ID. Refuse any other path under `factory/` with `resource-not-found`. Read nothing from the current folder, a target path, or a checkout. Show only saved records, and end each read with a note to run `factory status` in a checkout for the live readiness state (R-FACTORY-66, register D-074).
- [x] T31: Apply the PRD 25 R-ACCESS-2 grant rule to factory URI reads only: the harness grant of the folder where the agent works decides, and a Store read grant there allows every project URI. A folder that is not a Make Docs project is refused as `store-not-configured`, with no setup step for that folder. Factory MCP tools, reads and writes, keep the PRD 25 R-ACCESS-6 check of project grants and target scope. The target is the project that the call acts on, also when it is not the project of the agent's folder. That project's own grant admits the call: a Store read grant for a read, and a Store write grant for a write. Without it, refuse the call as `store-denied`, name the project, and say how to grant the access (R-FACTORY-67, register D-075).
- [x] T32: A factory URI read never shows a grant, a private claim ID, file contents, a prompt, a secret, or any other never-log item. It opens a read-only Store session and never creates or migrates a Store. Without a usable Store, it returns the typed Store outcome and names the `.make-docs/factory/` copies as the next step (R-FACTORY-68).
- [x] T33: `assignment start` records the checkout ID of the checkout that it named, not a worker's working copy. The write already needs that one bound checkout (R-FACTORY-27, register D-073). New on 2026-11-23.
- [ ] T34: Moved to [P6 T15](06-proofs-and-acceptance.md) on 2026-11-23, so the work queue still offers it after this phase closed.

### Acceptance criteria

- A74: Each project write with no project named is refused with `project-missing`, also when it runs inside a project folder, and the Store and the checkout are unchanged.
- A75: A write named by `--project` and the same write named by `--target-root` act on the same project. An unknown name gives `project-not-found`, a path and a name for two projects give `project-mismatch`, and a name with two bound checkouts gives `project-checkout-unclear` for `workflow save`. Each refusal changes nothing.
- A76: Every CLI and MCP result fixture names the project name and project ID, or says that `tools save` acted on this machine, and the CLI and MCP results match.
- A77: A read with no project named shows the project it read and says that it came from the current folder. The same read with `--project` says that the project was named.
- A78: Each approved factory URI gives the same answer from any folder, ends with the `factory status` note, and shows the lifecycle run ID on each assignment row. An unknown project and an unlisted path under `factory/` give `resource-not-found`, and a read with no Store creates no Store.
- A79: From a project folder with a Store read grant, an agent reads a factory URI of another project. From a folder that is not a project, the read is refused as `store-not-configured`, with no setup step for that folder. A factory MCP read and a factory MCP write for another project each work with that project's own read or write grant, and each is refused as `store-denied` without it, with a message that says how to grant it.
- A80: Factory URI read fixtures over records with grants, a live claim, and backups show no grant, no claim ID, no file contents, and no prompt.
- A83: Each new assignment records the checkout ID of its checkout, and status puts it in that checkout's group.

### Dependencies

- Stage 1, Stage 4 (T23 holds the reason code list), and P2 for the checkout ID field on the assignment record (T33).

### Closeout Notes

- Four testing decisions: Automated Implementation Testing is selected and done: 36 new tests in `packages/cli/tests/w30-r0-p3-factory-operations.test.ts` cover the registry, names, MCP profile, and scope tags (T1, T10, T25, A25); the reason code and capability lists against the contract (T16, T23, A63); project scope refusals and results (A74 to A77); the save operations (A19 to A21, A58, A60); the never-log check in every kind of record (A62); live readiness and drift, also per checkout and per run (A23, A24, A61, A83); moves, rounds, the open-job rule, the reset grant, and grant uses (A56, A57, A59); the private claim ID (A73); the factory URIs (A78, A80); the MCP grant rule and CLI and MCP parity (A19, A76, A79); no process or network use (A22); the seven review fixes; and the native command rule for `factory assignment save`. Guided Progress Review is selected and passed: on 2026-11-23 the owner found the `factory status` output for a ready, a busy, and a drifted workflow clear (option A, T11). Performance Testing and Unassisted Goal Testing stay `not-needed-now`.
- Performance evidence: none. No performance candidate applies.
- Human Experience Review: every result starts with plain words that name the project, or this machine. Read output ends with "Changes nothing.". A refusal names its reason code, says that nothing changed, and gives one next step. A drifted workflow names each broken part and one fix for each. Status puts the unit, its tool, its state, and the last check before any machine detail. The owner's review of status output (T11) passed on 2026-11-23.
- Optional experience handoff: none.
- Explicit human acceptance gate: closed. The owner passed the T11 Guided Progress Review on 2026-11-23 (option A), and every owner choice of P3 is closed (register D-073, D-074, D-075, and D-076).
- Evidence report: [W30 R0 Evidence Report, P3](evidence.md#p3-factory-operations).
- Phase / capability status: Phase complete on commit. T1 to T33 are done, and A19 to A25, A56 to A63, A73 to A80, and A83 are met. Capability partial: the setup Skill (P4), the run Skill and handoffs (P5), and the proofs and acceptance (P6) remain. T34, workflow removal, is a follow-up that this phase does not build; the work queue reads this phase as closed, so T34 needs a later phase or a quick item to be scheduled.
- Independent review: seven items are fixed and tested: the role and tool of `assignment start` come from the `ready` plan, with no substitute tool; `workflow save` checks the type's standard roles; a config-only change gives only `config-changed`; `assignment start` needs a lifecycle run of the project that has not ended; a workflow removed from the config says plainly that removal is not built yet; a `--project` name with no single checkout is `project-checkout-unclear`, because a grant belongs to one checkout; and the contract notes that the "Planned in W30 R0 P3" rows are built (P6 T14 updates the column). See [Review Fixes](evidence.md#review-fixes).
- Owner decision 2026-11-23, register D-076 option C: the assignment command is `factory assignment save` (MCP `factory_assignment_save`). It is a native command rule candidate again, and setup admits it. See [Rename (Register D-076)](evidence.md#rename-register-d-076).
- P2 notes for P3: P3 adds no command that removes a workflow or a pruned project's workflow rows, so neither note needed code here. T34 records both as a follow-up (see the evidence report, Left for a Follow-Up).
- Shared changes outside the factory: the registry has a `resolveTarget` hook and a `handler` Store admission kind, the shared option parser takes per-command value flags (`factory status --run <run-id>`), the `factory` MCP profile is in the resource schema, the factory contract and its three workflow types are also in the `factory` profile, the project URI parser has the `factory` family, and the factory contract no longer calls the shipped work queue and factory commands planned.

## Change History

### 2026-11-23 — W30 R0 P3

- Kind: `edit`
- Affected scope: new Stage 5, tasks T25 to T32 and acceptance A74 to A80, the governing requirements, and the Source PRD Docs list.
- Previous scope: P3 did not say how a factory operation finds its project, what a result names, or how a factory URI resolves.
- Replacement scope: P3 tags each operation as machine-level or project-scoped, makes every project write name its project with typed refusals that change nothing, names the project or the machine in every result, shows the project in read output, and builds factory URI reads under the W29 rules. T29 waits for register D-073 for the `factory status` scope. T30 waits for register D-074 for the URI paths. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: one Store serves every project on a machine, and an agent often works in a folder other than the project it runs.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-52 and new R-FACTORY-62 to R-FACTORY-68; PRD 52 R-WORK-URI-1 names the pending `factory` family. PRD 25 R-ACCESS-2: `none`, because it already covers every project URI read.
- Owner approval: the owner's decision on 2026-11-23 (option A). D-073 and D-074 stay open.
- Source: [Factory design](../../designs/2026-11-21-factory.md#project-scope)

### 2026-11-23 — W30 R0 P3 Owner Answers

- Kind: `edit`
- Affected scope: T8, T13, T29, T30, T31, new T33, A23, A57, A78, A79, new A83, and the Stage 5 dependencies.
- Previous scope: T29 and T30 waited for registers D-073 and D-074. T31 applied the folder grant rule to factory MCP tools. The round count did not count a move from `unknown`.
- Replacement scope: status shows one project, grouped by checkout and then by lifecycle run, with each checkout's own readiness and a `--run` option. `assignment start` records the checkout ID (T33). T30 builds the approved URI paths. T31 keeps the folder rule for URI reads only, keeps the R-ACCESS-6 check for factory MCP writes, and waits for register D-075 for factory MCP tool calls, reads and writes, that name another project. A move from `unknown` to `needs-correction` counts a round. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: the owner's answers to seven open W30 choices on 2026-11-23.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-27, -41, -51, -65 to -67; PRD 52 R-WORK-URI-1. Registers D-073 and D-074 are closed. D-075 is open.
- Owner approval: the owner's answers on 2026-11-23 (`A, A, B, A, A, A, A`).
- Source: [Factory design](../../designs/2026-11-21-factory.md#project-scope)

### 2026-11-23 — W30 R0 P3 Last Owner Decisions

- Kind: `edit`
- Affected scope: T13, T31, A57, A79, and the Stage 5 dependencies.
- Previous scope: every move from `unknown` to `needs-correction` added a round. T31 waited for register D-075.
- Replacement scope: a move from `unknown` to `needs-correction` adds no round when the status before `unknown` was already `needs-correction`. T31 checks each factory MCP tool call, read or write, against the grant of the project that it acts on, and refuses it as `store-denied` without that grant. T31 no longer waits for D-075. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: the owner's decisions on 2026-11-23 on the three open W30 items.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-7, -41, -60, and -67. Register D-075 is closed.
- Owner approval: the owner's decisions on 2026-11-23 (option A for all three).
- Source: [Factory design](../../designs/2026-11-21-factory.md#context)

### 2026-11-23 — W30 R0 P3 Review Follow-Up

- Kind: `edit`
- Affected scope: new T34.
- Previous scope: P3 had no task for removing a saved workflow, and the P2 notes on workflow removal had no owner task.
- Replacement scope: T34 records a reviewed workflow removal as a P3 follow-up that this pass does not build. A workflow removed from the config says that removal is not built yet and what the person can do now. Existing task and acceptance IDs do not change.
- Rationale: an independent review of W30 R0 P3 on 2026-11-23 (item 6).
- PRD decision: `none`. PRD 53 does not require a removal command.
- Owner approval: none needed for a follow-up record; the owner schedules T34.
- Source: [W30 R0 P3 evidence](evidence.md#review-fixes)

### 2026-11-23 — W30 R0 P3 Assignment Save

- Kind: `edit`
- Affected scope: T1, T5, T12 to T14, T17, T24, T26, T34, A21, A56, A57, A59, and A73, and the Closeout Notes.
- Previous scope: the command that moves an assignment, records a check, or records a grant use was named with the end word `update`.
- Replacement scope: the command is `factory assignment save` (`factory.assignment.save`, MCP `factory_assignment_save`), with the same behavior. Task and acceptance IDs do not change. This is new behavior: the name.
- Rationale: a native command rule refuses the word `update`, so setup failed for every project while the command ended with it.
- PRD decision: `update-existing` — PRD 53 (Operations table, R-FACTORY-24, R-FACTORY-50, project scope table), PRD 39 R-RUN-1, and PRD 38 (factory grants R-MIN row). Register D-076 is closed.
- Owner approval: the owner's decision on 2026-11-23 (register D-076, option C).
- Source: [register](../../prd/03-open-questions-and-risk-register.md)

### 2026-11-23 — W30 R0 P3 Guided Progress Review Passed

- Kind: `edit`
- Affected scope: T11, the Closeout Notes, and the phase status.
- Previous scope: T11 waited for the owner's Guided Progress Review of `factory status` output, and the phase was `active`.
- Replacement scope: T11 is done: the owner found the output clear (option A). The phase status is `completed`, as for the other finished phases. T34 stays an unscheduled follow-up. Task and acceptance IDs do not change.
- Rationale: the owner's decision on 2026-11-23.
- PRD decision: `none`.
- Owner approval: the owner's decision on 2026-11-23 (option A).
- Source: [W30 R0 P3 evidence](evidence.md#guided-progress-review-samples-t11-passed)

### 2026-11-23 — W30 R0 P3 T34 Moved to P6 T15

- Kind: `edit`
- Affected scope: P3 T34 and new P6 T15.
- Previous scope: P3 T34 held the reviewed workflow removal follow-up, but P3 is completed, so the work queue reads it as closed and would not offer T34.
- Replacement scope: P6 T15 holds the same follow-up, and P3 T34 points to it.
- Rationale: keep the follow-up on the work queue after P3 closed (W30 R0 P3 integration).
- PRD decision: `none`.
- Owner approval: none needed for a move of an unscheduled follow-up.
- Source: [W30 R0 P3 evidence](evidence.md#review-fixes)
