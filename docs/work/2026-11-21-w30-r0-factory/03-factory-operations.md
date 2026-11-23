---
title: "Phase 3: Factory Operations"
kind: "work"
status: "active"
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

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-5, R-FACTORY-10, R-FACTORY-12, R-FACTORY-24 to R-FACTORY-28, R-FACTORY-33, R-FACTORY-41, R-FACTORY-49 to R-FACTORY-51, and R-FACTORY-53 to R-FACTORY-61, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

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

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Save Operations

### Tasks

- [ ] T1: Admit `factory tools save`, `workflow save | show | list`, `proof save`, `assignment start | update | list`, and `restore` in the registry, with MCP names such as `factory_tools_save` (R-FACTORY-49).
- [ ] T2: `tools save` checks the shape of a tool list and its capability proofs. It does not run or contact any tool (R-FACTORY-5, R-FACTORY-10).
- [ ] T3: `workflow save` checks a workflow against its type and the capability catalog, sets its readiness state, and refuses `ready` without a passed proof (R-FACTORY-12, R-FACTORY-50).
- [ ] T4: `proof save` records a test task result and moves the workflow to `ready` only when the proof passed (R-FACTORY-12).
- [ ] T5: `assignment start | update` checks the work queue claim before it writes, and refuses a caller that no longer holds the claim (R-FACTORY-50).
- [ ] T6: `restore` writes the `.make-docs/factory/` copies from the Store (R-FACTORY-25).
- [ ] T7: Use the existing write permission, `expectedVersion`, and Store-unavailable outcomes for every write (R-FACTORY-50).

### Acceptance criteria

- A19: CLI JSON and MCP results match for every save operation on the shared fixtures.
- A20: `workflow save` refuses `ready` when no passed proof exists, and the refusal names the missing proof.
- A21: `assignment update` from a caller without the claim is refused with a typed result.
- A22: No operation spawns a process or opens a network connection, as a test proves.

### Dependencies

- P2.
- An accepted command tree review under register D-065. The command paths and MCP names in this phase follow it.

## Stage 2 - Status and MCP Profile

### Tasks

- [ ] T8: Admit `factory status`. It shows workflows, readiness, claims, assignments, and open manual steps in human words first, with exact detail in machine output (R-FACTORY-51).
- [ ] T9: Mark a workflow `drifted` in status when a bound tool's saved proof no longer holds, and name the smallest fix (R-FACTORY-12, R-FACTORY-33).
- [ ] T10: Add the `factory` MCP profile. Keep the work queue tools in the `backlog` and `workflow` profiles, and include all of them in `all` (R-FACTORY-49).
- [ ] T11: Run Guided Progress Review of status output for a ready, a drifted, and a busy workflow.

### Acceptance criteria

- A23: For each claimed unit, status shows the unit, its tool, its state, and the last check time before any machine detail.
- A24: A drifted workflow shows the `drifted` state, the broken binding, and one next step.
- A25: The `factory` MCP profile lists every factory tool, and `all` includes them.

### Dependencies

- Stage 1.

## Stage 3 - Moves, Rounds, Proofs, and Grants

New on 2026-11-23. The owner approved these checks after P1 was done.

### Tasks

- [ ] T12: `assignment update` allows only the moves in the status move table. It refuses any other move with `illegal-move`, and any change to an `accepted`, `failed`, or `cancelled` assignment with `final-status`. An update that changes only the last check time is not a move (R-FACTORY-28).
- [ ] T13: `assignment update` adds one to the round count of the job (unit, role, and part label) on each move from `returned` or `in-review` to `needs-correction`, and refuses a move past the round limit of the assignment's plan revision with `round-limit-reached`. `assignment start` refuses a second open assignment for the same job with `assignment-open`, and allows open assignments for other part labels of the same unit. A new assignment for the same job starts at the count of the one before it. `assignment start` spends a `once` grant for `reset-correction-rounds` when the caller names it, and the new assignment then starts at 0 (R-FACTORY-27, R-FACTORY-41, register D-071).
- [ ] T14: Each move adds a status history entry with the status, the time, and one reason code. The record keeps the 20 newest entries (R-FACTORY-27).
- [ ] T15: `tools save` checks that each proof has a reported tool version, a proof time, a result of `proved`, `unproved`, or `contradicted`, and a "does not cover" list. It records each tool's state as `available`, `missing`, or `blocked`, as the agent reports it. A reported version that differs from the version in a bound tool's proof, a `missing` tool, and a `blocked` tool each change the current plan, so the workflow is `drifted` with `tool-version-changed`, `tool-missing`, or `permission-lost` (R-FACTORY-10, R-FACTORY-12).
- [ ] T16: `tools save` and `workflow save` refuse an unknown capability ID with `unknown-capability`. A test fails when a released capability ID is removed or renamed (R-FACTORY-53).
- [ ] T17: `assignment update` records the use of a grant. It refuses a use with `grant-missing`, `grant-out-of-scope`, `grant-spent`, or `grant-expired`, and marks a `once` grant as spent on its first use. A grant-only `workflow save` writes or revokes a grant during a run, with the lifecycle run for a `run` grant. It resolves no plan, saves no revision, and does not change readiness (R-FACTORY-24).

### Acceptance criteria

- A56: Each move in the table is accepted, every other move is refused with `illegal-move`, and every change to a final assignment is refused with `final-status`.
- A57: A fourth move to `needs-correction` under the default limit of 3 is refused with `round-limit-reached`. After a takeover, the count goes on from where it was. A second open assignment for one job is refused, while two parts of one unit with different part labels run at the same time with separate counts. A spent reset grant starts the next assignment of that job at 0.
- A58: A changed tool version gives `drifted` with `tool-version-changed`, and an unknown capability ID is refused with `unknown-capability`.
- A59: A grant use is refused for each of the four codes, a `once` grant works only once, and a `run` grant works only in its own lifecycle run. A grant-only save during a run leaves the plan revisions and the readiness state unchanged.

### Dependencies

- Stage 1 and P2 T16 to T21.

## Stage 4 - Resolved Plan, Never-Log Check, and Reason Codes

New on 2026-11-23.

### Tasks

- [ ] T18: `workflow save` resolves the config entry, the saved binding, the machine tool rows, and the workflow type into canonical JSON (sorted keys, no extra spaces, UTF-8), with its plan, config, and binding digests. It saves a new revision only when no kept revision has that digest, and never makes a revision the `ready` revision. It leaves grants out of the plan (register D-072). The plan schema has no step, condition, or branch field. It refuses a type version that does not match the type file with `type-version-mismatch` (R-FACTORY-55, R-FACTORY-56, R-FACTORY-57, R-FACTORY-59, R-FACTORY-61).
- [ ] T19: `proof save` names the plan digest that the test task ran under. It refuses with `plan-digest-mismatch` a digest that is not the current plan's digest or that has no saved revision. On a pass, it makes that revision the `ready` revision (R-FACTORY-12, R-FACTORY-57).
- [ ] T20: `workflow show` reads the latest (newest saved) revision, or the revision that the caller names, with the current plan digest, the `ready` revision, and each drift reason code, explained in plain words. It lists the grants beside the plan and writes nothing (R-FACTORY-24, R-FACTORY-54, R-FACTORY-57).
- [ ] T21: `status` and `workflow show` compute the current plan from three live sources (the config file, the workflow type file, and the machine tool rows), not from the copy in the saved binding. The state is `ready` when its digest matches the `ready` revision, `wired` or `draft` when it matches another saved revision, and `drifted` when it matches none, with each drift reason code in plain words. `assignment start` records the `ready` revision number and digest, and refuses with `not-ready` when the workflow is not `ready`. `assignment update` checks moves and rounds against the assignment's own revision (R-FACTORY-12, R-FACTORY-54, R-FACTORY-58).
- [ ] T22: Every factory write runs one never-log check. It accepts only the defined fields, allows free text only as one line of at most 120 characters, and refuses a value that looks like a credential or an environment setting with `never-log-field`. The refusal names the field and never shows the value (R-FACTORY-26).
- [ ] T23: Keep the reason codes in one list in code, matched to the contract lists. A test fails when a released code is removed or renamed (R-FACTORY-54).
- [ ] T24: `assignment start` and `assignment update` take the private claim ID of the unit's live claim, as PRD 52 R-WORK-QUEUE-19 requires for a report or a close. They refuse a call without it, and never write the claim ID into a factory record or a result (R-FACTORY-50). New on 2026-11-23.

### Acceptance criteria

- A60: The same inputs in a different key order give the same plan digest. A save with no change makes no new revision. `proof save` with a digest that is not the current plan is refused with `plan-digest-mismatch`. `workflow show` lists grants beside the plan and writes nothing.
- A61: A fixture shows each state: `ready` when the current digest matches the `ready` revision, `wired` after a saved change, and `drifted` with `config-changed`, `tool-missing`, `permission-lost`, `tool-version-changed`, or `type-changed` after a change without a save. Undoing the change makes the workflow `ready` again with no new test task. `assignment start` on a workflow that is not `ready` is refused with `not-ready`. A takeover fixture loads the assignment's own revision after a newer revision exists.
- A62: The never-log check refuses a file body, a prompt, an environment setting, and a credential-like value in each kind of factory record, and the refusal never shows the value.
- A63: The reason code test fails when a code is removed or renamed, and the code list matches the contract.
- A73: `assignment start` and `assignment update` without the claim ID, or with a wrong one, are refused, and no factory record, result, or copy shows a claim ID.

### Dependencies

- Stage 3.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
