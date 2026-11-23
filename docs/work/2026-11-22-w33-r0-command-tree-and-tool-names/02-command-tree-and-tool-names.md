---
title: "Phase 2: Command Tree and Tool Names"
kind: "work"
status: "active"
coordinate: "W33 R0 P2"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 2: Command Tree and Tool Names

## Purpose

Build the new tree and the derived MCP names.

## Overview

Each operation moves to its new CLI path. MCP names are derived from the paths, and the hand-picked map is removed. Help lists groups by capability.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Commands sit in their capability group, tool names match commands, and help lists groups in plain words ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-TOP-1, R-NAME-3).
- Intended human outcome: a person or agent can guess a command or tool name from the capability.
- Human-facing surface or indirect effect: the CLI tree, `make-docs --help`, and `tools/list`.
- Implementation work: registry projections, the derived name function, help text, and profile lists.
- Evidence source or testing type selected under current authority: naming-rule test on the live registry, parity tests, help snapshot.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Naming-rule test on the live registry, CLI and MCP parity under new names, unchanged profile membership, and a help snapshot. |
| Performance Testing | not-needed-now | Command names do not change run time. |
| Guided Progress Review | not-needed-now | The owner reviews help output in P5. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Tree and names

### Tasks

- [ ] T1: Move each registry operation's CLI projection to its new path from the P1 table, and retire `run` as a root.
- [ ] T2: Derive each MCP name from its CLI path by R-NAME-3, and remove the hand-picked name map.
- [ ] T3: Name the hand-defined tools by the P1 table.
- [ ] T4: Rewrite `make-docs --help` and each group's help to list commands by capability, in plain words.
- [ ] T5: Update profile lists in code to the new names with the same membership by operation.
- [ ] T6: Rename the W31 R0 and W32 R0 commands if the P1 table changes them.

### Acceptance criteria

- A4: Every operation has CLI and MCP parity under its new name.
- A5: The naming-rule test passes on the live registry.
- A6: Profile membership is the same as before, by operation.

### Dependencies

- P1, W31 R0 P3, and W32 R0 P4.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
