---
title: "W24 R0 MCP Tool Profiles Work Backlog"
kind: "work"
status: "in-progress"
coordinate: "W24 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The work is dependency ordered and each phase has observable acceptance."
  coordinate_handoff: "W24 R0 P1, P2, and P3 are complete. Tool selection and native resource scoping have retained local evidence. W24 remains incomplete. P4 preflight is next under separate authority; P4 implementation also needs separate authority. W25 owns UI registration and rendering."
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---
# W24 R0 MCP Tool Profiles Work Backlog

## Purpose

Implement the [MCP profile design](../../designs/2026-09-24-mcp-tool-profiles.md) under the current requirements in [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md). The [plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md) owns order and scope.

P1 and P2 are complete. The user authorized P2 implementation, closeout, and a local commit on 2026-10-03. P3 implementation needs separate authorization. A host configuration change, push, or release also needs separate authorization.

## Human Experience Trace

| Promise | Owning requirement | Phase | Result to review | Evidence |
| --- | --- | --- | --- | --- |
| Choose a task-named profile | PRD 25 MCP profile exposure | [P2](02-filtered-tool-discovery.md) | CLI help and filtered tool list | Help and list capture |
| Keep the full connection | PRD 25 default `all` | [P4](04-compatibility-and-evidence.md) | Existing `make-docs mcp` config works | Same-config replay |
| Keep permission and result meaning | PRD 25 access; PRD 39 registry contract | [P1](01-profile-metadata-and-contracts.md), [P4](04-compatibility-and-evidence.md) | Same allowed call and denial across profiles | Cross-profile assertions |
| Put Backlog Review in one clear group | PRD 25 backlog profile | [P3](03-resources-and-transports.md) | `backlog` contains snapshot/cache seam and app UI resource when that package lands | Resource list/read and app dependency checks |

The agent reviews the actual help, configuration example, lists, and errors under the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md). It records observations and limits. Human feedback is optional.

## Phase Map

1. [P1: Profile metadata and contracts](01-profile-metadata-and-contracts.md) — define explicit assignment and invariants.
2. [P2: Filtered tool discovery](02-filtered-tool-discovery.md) — route tools and CLI profile selection.
3. [P3: Resources and transports](03-resources-and-transports.md) — scope native resources and support required paths.
4. [P4: Compatibility and evidence](04-compatibility-and-evidence.md) — prove parity, access, and measured effects.

## Usage Notes

P1, P2, and P3 are complete. Their checks and limits are in the central evidence for [P1](evidence.md#w24-r0-p1-profile-metadata-and-contracts), [P2](evidence.md#w24-r0-p2-filtered-tool-discovery), and [P3](evidence.md#w24-r0-p3-resources-and-transports). P4 preflight is next under separate authority. The full W24 capability remains incomplete.

Complete phases in order. Use phase-local `t` numbers. Check the branch, HEAD, and dirty state before implementation. A second task owns the Backlog Review MCP App package and its UI behavior. W24 owns only MCP profile routing and resource scoping. Do not edit W23 R0 files. If another task changes a shared PRD or source file, reread it before writing and preserve its edits.

P4 owns the bounded context and latency characterization. It does not set a hard product target. Record all four current testing decisions in each phase and keep agent Human Experience Review separate.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: check [P4: Compatibility and evidence](04-compatibility-and-evidence.md) preflight when authorized. Implement P4 only under separate implementation authority.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md)
- Why: The work is dependency ordered and each phase has observable acceptance.
- Coordinate Handoff: W24 R0 P1, P2, and P3 are complete. Tool selection and native resource scoping have retained local evidence. W24 remains incomplete. P4 preflight is next under separate authority; P4 implementation also needs separate authority. W25 owns UI registration and rendering.
