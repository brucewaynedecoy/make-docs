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

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-5, R-FACTORY-12, R-FACTORY-25, R-FACTORY-33, and R-FACTORY-49 to R-FACTORY-51, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

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

- [ ] t1: Admit `factory tools save`, `workflow save | show | list`, `proof save`, `assignment start | update | list`, and `restore` in the registry, with MCP names such as `factory_tools_save` (R-FACTORY-49).
- [ ] t2: `tools save` checks the shape of a tool list and its capability proofs. It does not run or contact any tool (R-FACTORY-5, R-FACTORY-10).
- [ ] t3: `workflow save` checks a workflow against its type and the capability catalog, sets its readiness state, and refuses `ready` without a passed proof (R-FACTORY-12, R-FACTORY-50).
- [ ] t4: `proof save` records a test task result and moves the workflow to `ready` only when the proof passed (R-FACTORY-12).
- [ ] t5: `assignment start | update` checks the work queue claim before it writes, and refuses a caller that no longer holds the claim (R-FACTORY-50).
- [ ] t6: `restore` writes the `.make-docs/factory/` copies from the Store (R-FACTORY-25).
- [ ] t7: Use the existing write permission, `expectedVersion`, and Store-unavailable outcomes for every write (R-FACTORY-50).

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

- [ ] t8: Admit `factory status`. It shows workflows, readiness, claims, assignments, and open manual steps in human words first, with exact detail in machine output (R-FACTORY-51).
- [ ] t9: Mark a workflow `drifted` in status when a bound tool's saved proof no longer holds, and name the smallest fix (R-FACTORY-12, R-FACTORY-33).
- [ ] t10: Add the `factory` MCP profile. Keep the work queue tools in the `backlog` and `workflow` profiles, and include all of them in `all` (R-FACTORY-49).
- [ ] t11: Run Guided Progress Review of status output for a ready, a drifted, and a busy workflow.

### Acceptance criteria

- A23: For each claimed unit, status shows the unit, its tool, its state, and the last check time before any machine detail.
- A24: A drifted workflow shows the `drifted` state, the broken binding, and one next step.
- A25: The `factory` MCP profile lists every factory tool, and `all` includes them.

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
