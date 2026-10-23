---
title: "W26 R1 Clear MCP Tool Names Work Backlog"
kind: "work"
status: "active"
coordinate: "W26 R1"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The owner asked for the R1 package and local rename implementation."
  coordinate_handoff: "Use W26 R1 P1-P2 for task evidence and any later phase record."
---

# W26 R1 Clear MCP Tool Names Work Backlog

## Purpose

Apply the [W26 R1 design](../../designs/2026-10-23-w26-r1-clear-mcp-tool-names.md) and [plan](../../plans/2026-10-23-w26-r1-mcp-tool-names/00-overview.md) in the current W26 branch. The owner directed this extra revision. It does not rewrite the W26 R0 Store plan.

## Human Experience Trace

The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) governs the direct tool-discovery promise. A person or agent sees shorter, distinct tool names and can use the exact migration table. The tests prove that the name changes do not change the operation result or access check.

## Phase Map

| Phase | Work | Outcome |
| --- | --- | --- |
| P1 | [Name contract and authority](01-name-contract.md) | Complete map and current PRD rule. |
| P2 | [Source and proof](02-source-and-proof.md) | Renamed tool catalog, guides, and local evidence. |

## Usage Notes

Keep W26 R0 and R1 test claims distinct. No task here authorizes an installed connection change, publish, push, PR, merge, or local commit. The W26 R0 source edits remain uncommitted in this checkout.

## Intended Follow-On

Review the local diff and test record. Decide the release version and migration notice before publishing a package. Run installed-host proof only after the separate approval for the selected entry.
