---
title: "W26 R1 Clear MCP Tool Names Plan"
kind: "plan"
status: "draft"
coordinate: "W26 R1"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The owner requested a short, clear MCP catalog in this W26 checkout."
  coordinate_handoff: "Carry W26 R1 P1-P2 into the work package and evidence."
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "owner-directed-plan-to-build"
  reason: "The owner gave the naming intent and asked for a W26 R1 package and implementation in this worktree. The packet records the contract before source edits."
---

# W26 R1 Clear MCP Tool Names Plan

## Objective

Give each Make Docs MCP tool a short name that states its task. Keep one operation registry and one behavior path. Preserve the W26 R0 Store access change in this branch.

## Coordinate Decision

The owner selected W26 R1. This revision changes the MCP name projection that W26 R0 left outside its scope. The [W26 R0 plan](../2026-10-09-w26-r0-shared-access-and-data-foundation/00-overview.md) and its Store access work keep their own authority.

## Scope And Product Authority

- The [W26 R1 design](../../designs/2026-10-23-w26-r1-clear-mcp-tool-names.md) states the owner-directed decision and human effect.
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns the name rule and registry parity. Its R-MIG-3 rule must change before source edits.
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) owns MCP tool discovery and shared behavior. Its current surface must state the public name change.
- The [MCP profile design](../../designs/2026-09-24-mcp-tool-profiles.md) keeps its profile membership and one-server model. W26 R1 changes names in every profile together.
- The user and maintainer MCP guides need the new examples and a migration table or link.

Do not rename operation IDs, CLI commands, resource URIs, profile names, or connection settings. Do not change grants, Store rules, installed MCP entries, or the W25 widget.

## Human Experience Propagation

This is a direct tool-discovery change. A person or agent should read a short name and know which task it starts. [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) is the authority.

| Promise | Owning PRD | Surface | Work phase | Evidence | Obligation |
| --- | --- | --- | --- | --- | --- |
| The tool list uses short, distinct task names. | PRD 39 R-MIG-3 and PRD 25 MCP surface | MCP `tools/list` in each profile | P1 and P2 | Exact name inventory, collision check, profile tests | None |
| Calls reach the same operation and access checks. | PRD 25 shared behavior and PRD 39 registry parity | MCP `tools/call` | P2 | Dispatch, error, and parity tests | None |
| A caller can move from every old name to one new name. | PRD 39 compatibility rule | Migration table and guide | P1 and P2 | Complete old-to-new table and guide check | None |

No latency target is set. The static name-length comparison is a usability measure, not runtime performance proof.

## Phase Map

| Phase | Plan | Result |
| --- | --- | --- |
| P1 | [Name contract and PRD change](01-name-contract.md) | One exact map, compatibility rule, and current PRD text. |
| P2 | [Implementation and proof](02-implementation-and-proof.md) | One public catalog, updated callers and guides, and focused plus broad tests. |

## Output Contract

Use the existing worktree and branch `w26-r0-simplified-store-access`. Keep R1 documents in their own plan and work directories. Keep R0 source edits intact. Stage or commit nothing without the separate commit authority required by this repository. Do not push, publish, or change an installed connection.

## Execution Mode And Dependencies

Use one local implementation pass. P1 precedes P2. The source branch already has uncommitted W26 R0 work, so each test result must name whether it covers R0, R1, or both. No agent delegation is needed.

## Validation

Check the complete 43-name map, no duplicates, exact operation parity, profile union and filtering, call dispatch, Store access behavior, generated package output, docs examples, and direct use through a local test server. Run TypeScript checks and the relevant package suites. Report the old-name break before any release decision.

## Intended Follow-On

The [work package](../../work/2026-10-23-w26-r1-mcp-tool-names/00-index.md) carries implementation. A later release decision must set the package version and tell users how to update saved tool calls. An installed entry change still needs its own approval.
