---
title: "Phase 5: Factory Run Skill and Handoffs"
kind: "work"
status: "active"
coordinate: "W30 R0 P5"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/05-factory-run-skill-and-handoffs.md"
---

# Phase 5: Factory Run Skill and Handoffs

## Purpose

Rewrite the `factory` Skill so that it runs a saved workflow, and connect backlog review to it. This phase depends on the P1 contract and the P3 operations.

## Overview

The `factory` Skill in `packages/skills/factory/` loads one `ready` workflow and its type and runs the loop from the design. Its old profiles and Store references are replaced. The backlog review "Work on this wave" action sends a wave to the foreman when a workflow is ready, and keeps today's behavior otherwise.

## Human Experience Outcome

- Impact and governing promise: `direct`. The person hears only floor events and added events, each as a self-contained message (R-FACTORY-37, R-FACTORY-38). At the end of the given scope, the person gets one acceptance request with the reviewed result and evidence (R-FACTORY-39). A drifted workflow says so first (R-FACTORY-33).
- Intended human outcome: the person can leave while the work runs, and each message they get tells them what happened, what is needed, and what happens after they answer.
- Human-facing surface: human channel messages, the acceptance request, and the backlog review action.
- Implementation work: Stages 1 to 3.
- Evidence source: fixture runs, escalation fixtures, and Guided Progress Review of real messages and the acceptance request.
- Executor: the implementing agent, with owner feedback invited.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-12, R-FACTORY-21, R-FACTORY-29 to R-FACTORY-48, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Skill bundle tests and fixture runs for each workflow type, a correction loop at its limit, an `unknown` assignment, an expired claim, and a scope-end acceptance request; backlog review handoff tests. |
| Performance Testing | not-needed-now | No performance candidate applies. |
| Guided Progress Review | selected | Owner review of real escalation messages and the acceptance request. Feedback can change their wording before closeout. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [25 TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Load and Loop

### Tasks

- [ ] T1: Replace the `factory` Skill text. It loads the workflow, its type, and the factory contract. It refuses a workflow that is not `ready` and names the fix (R-FACTORY-12, R-FACTORY-33).
- [ ] T2: Remove the profiles reference and the old Store reference. Keep the Skill explicit-invocation-only (R-FACTORY-48).
- [ ] T3: Run the loop: sync, check assignments through their handles, renew claims, judge returned work, review with a separate reviewer, correct within the limit, accept units inside the given scope, close them, take the next ready unit, and escalate (R-FACTORY-32, R-FACTORY-34).
- [ ] T4: Claim a wave, phase, stage, or task, with phase as the default. Open one lifecycle run at stage `implementation` per claim. Record evidence through the existing evidence and lifecycle evidence operations (R-FACTORY-29, R-FACTORY-30).
- [ ] T5: Check an `unknown` assignment through its handle before any other step. Never send work again after an unclear handoff (R-FACTORY-28, R-FACTORY-41).
- [ ] T6: Route quick items from the front desk by capability, like any other unit (R-FACTORY-31).
- [ ] T7: Run preflight before a claim only when the workflow turns that step on (R-FACTORY-21).

### Acceptance criteria

- A33: A workflow that is not `ready` is refused, and the refusal names the fix.
- A34: Fixture runs complete one unit with each of the three workflow types.
- A35: After a simulated lost reply, the foreman checks the handle and sends no duplicate job.
- A36: An expired claim is taken over only after the old handle is checked.

### Dependencies

- P1 and P3. This phase can run in parallel with P4.

## Stage 2 - Working Rules, Escalation, and Acceptance

### Tasks

- [ ] T8: Apply the working rules: judge the actual work, never let a reviewer review its own work, do not steer the reviewer, and stop a loop that repeats the same failure (R-FACTORY-40, R-FACTORY-41).
- [ ] T9: Apply one writer per file in each working copy, and name an integration owner for parallel work. Follow the harness's worktree policy and any repository rule that forbids worktrees (R-FACTORY-42, R-FACTORY-43).
- [ ] T10: Back up files before a change in a folder without git, through the P2 records (R-FACTORY-44).
- [ ] T11: Send each floor event and each added event to the human channel. Each message says what happened, what is needed, whether it is required, what it blocks, and what happens next (R-FACTORY-37, R-FACTORY-38).
- [ ] T12: Accept each unit inside the given scope on the reviewer's evidence. At the end of the scope, send one acceptance request with the reviewed result and its evidence. Ask for a grant before a merge or deploy (R-FACTORY-39).

### Acceptance criteria

- A37: A correction loop that reaches its limit, or repeats the same failure, stops and escalates with the evidence.
- A38: Each floor event in a fixture run reaches the human channel, and a workflow config that tries to remove one is refused.
- A39: Each escalation message states what happened, what is needed, whether it is required, what it blocks, and what happens next.
- A40: The scope-end acceptance request lists each accepted unit and links its evidence.

### Dependencies

- Stage 1.

## Stage 3 - Backlog Review Handoff

### Tasks

- [ ] T13: Update the backlog review "Work on this wave" action so that it sends the wave to the foreman through the front desk when a workflow is `ready` (R-FACTORY-47).
- [ ] T14: Keep the action's current behavior when no workflow is `ready`.
- [ ] T15: Regenerate the affected Skill bundles and app assets, and add tests for both paths.

### Acceptance criteria

- A41: With a `ready` workflow, the action hands the wave to the foreman.
- A42: Without a `ready` workflow, the action behaves exactly as before this phase.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
