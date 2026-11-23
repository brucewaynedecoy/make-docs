---
title: "Phase 3: Aliases and Migration Window"
kind: "work"
status: "active"
coordinate: "W33 R0 P3"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Aliases and Migration Window

## Purpose

Keep every current name working through the migration window.

## Overview

Old CLI paths and MCP names become hidden aliases for two minor releases, then return `command-renamed` for one more minor release, then go away.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A current name keeps working for the window and names the new one ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-MIG-1).
- Intended human outcome: an upgrade breaks no script, Skill, or saved MCP call during the window, and each old call shows its new name.
- Human-facing surface or indirect effect: old CLI paths, old MCP calls, `renamedTo`, and `command-renamed`.
- Implementation work: the alias layer, the window tracking, and tests.
- Evidence source or testing type selected under current authority: alias tests for every current name.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | An alias test for every current CLI path and MCP name, in window and after it, and a `tools/list` test. |
| Performance Testing | not-needed-now | Command names do not change run time. |
| Guided Progress Review | not-needed-now | Alias output is a fixed line and field; P5 reviews the help. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Aliases

### Tasks

- [ ] T1: Add each old CLI path as a hidden alias that runs the same operation, prints one line naming the new command, and adds `renamedTo` to JSON output.
- [ ] T2: Add each old MCP name as a hidden alias that is not in `tools/list`, runs the same operation, and adds `renamedTo` to the result. An alias works only in its operation's profiles.
- [ ] T3: Record the release that introduced each rename. After two minor releases, an alias returns a typed `command-renamed` result naming the new command. After one more, it is removed.
- [ ] T4: Add no alias for a name that never shipped.

### Acceptance criteria

- A7: Every old name runs the same operation and returns `renamedTo` during the window.
- A8: After the window every old name returns `command-renamed`, and after one more release it is gone.
- A9: `tools/list` shows only new names.

### Dependencies

- P2.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
