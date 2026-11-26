---
title: "Phase 2: Command Tree and Tool Names"
kind: "work"
status: "completed"
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

- [x] T1: Move each registry operation's CLI projection to its new path from the P1 table, and retire `run` as a root.
- [x] T2: Derive each MCP name from its CLI path by R-NAME-3, and remove the hand-picked name map.
- [x] T3: Name the hand-defined tools by the P1 table.
- [x] T4: Rewrite `make-docs --help` and each group's help to list commands by capability, in plain words.
- [x] T5: Update profile lists in code to the new names with the same membership by operation.
- [x] T6: Rename the W31 R0 and W32 R0 commands if the P1 table changes them.

### Acceptance criteria

- A4: Every operation has CLI and MCP parity under its new name.
- A5: The naming-rule test passes on the live registry.
- A6: Profile membership is the same as before, by operation.

### Dependencies

- P1, W31 R0 P3, and W32 R0 P4.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. The name-catalog test has 42 tests, and the live registry passes the naming rules (A5). The CLI group, MCP derivation, reorganization parity, and profile tests pass under the new names (A4, A6). A new help snapshot pins `make-docs --help`, and a group test checks that each group's help lists every command in the group. The type check passed. The full suite has 2368 tests: 2359 passed, 3 failed, and 6 skipped. The 3 failures are the known ones: two `tests/mcp-app-contract.test.ts` stdio tests and the sandbox-only `tests/p5-migration-safety.test.ts` fixture 11 ([evidence](evidence.md#p2-command-tree-and-tool-names)). Performance Testing `not-needed-now`: command names do not change run time. Guided Progress Review `not-needed-now`: the owner reviews help output in P5. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: `make-docs --help` lists the eleven groups, each with one plain-words line about its capability. `make-docs <group> --help` lists each command in the group. The `work`, `backlog`, `lifecycle`, `factory`, and `check` help comes from the registry, so it cannot miss a command. `factory` says that it has no commands yet. Every MCP tool name is its CLI path with underscores. Limit: old names do not work until P3 adds the aliases, and shipped Skills and routers still name the old commands until P4.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: not needed for this phase. The owner reviews help output in P5.
- Evidence report: [P2 Command Tree and Tool Names](evidence.md#p2-command-tree-and-tool-names).
- Phase / capability status: Phase complete on commit. T1 to T6, A4, A5, and A6 are done. T6 needed no rename: the W31 R0 and W32 R0 commands already had their catalog names. Capability partial: aliases (P3), shipped text and Skills (P4), and acceptance (P5) remain.
