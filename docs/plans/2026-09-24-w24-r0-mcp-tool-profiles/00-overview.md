---
title: "W24 R0 MCP Tool Profiles Plan"
kind: "plan"
status: "in-progress"
coordinate: "W24 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The current PRDs own profile requirements. The work backlog owns phase order and acceptance."
  coordinate_handoff: "W24 R0 P1, P2, and P3 are complete. P4 preparation is complete. The fixed compatibility baseline, canonical PERF-003 profile, finite unrun packet, and four testing decisions are ready. P4 implementation is next under separate authority. W24 remains incomplete. W25 owns UI registration and rendering."
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "none"
  reason: "The requested package follows the design, plan, PRD, and work order before implementation."
source:
  type: "design"
  path: "docs/designs/2026-09-24-mcp-tool-profiles.md"
---
# W24 R0 MCP Tool Profiles Plan

## Purpose

Plan filtered Make Docs MCP profiles while preserving the current full server contract.

## Objective

Ship one profile-aware MCP server factory. Give hosts a clear way to select task-focused tools and resources. Keep `make-docs mcp` compatible with current configurations.

## Human Experience Propagation

| Design promise | Product owner | Surface | Work phase | Evidence |
| --- | --- | --- | --- | --- |
| Clear task-named profile choice and out-of-profile error | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | CLI help, host configuration, MCP errors | P2 and P3 | Help review, profile list/read cases, unknown-profile case |
| Existing full connection still works | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | `make-docs mcp` stdio | P3 and P4 | Current config replay, tool and resource parity |
| Profile does not change permission or result meaning | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | MCP invocation and shared core | P1 and P4 | Cross-profile contract and access tests |
| Backlog app has a named place | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | `backlog` endpoint and UI resource | P2 and P3 | Resource scope and app dependency checks |

The agent records a Human Experience Review from the built CLI help, profile lists, errors, and host example. Human feedback remains optional. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) owns the review method.

## Performance Evidence Plan

Tool-description context and startup/discovery latency are `characterize-now` candidates from the [design](../../designs/2026-09-24-mcp-tool-profiles.md). Both bind to one canonical [PERF-003 v1 profile](04-compatibility-and-validation.md#perf-003-profile-context-and-stdio-discovery) in the P4 plan. The [P4 work packet](../../work/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-evidence.md#performance-execution-packet) binds the finite unrun execution without copying profile authority. Separate P4 implementation authority must activate the budget. Do not promote local measurements to a product target, model-token claim, installed-host acceptance, or wider support claim.

## Coordinate Decision

- Coordinate: `W24 R0`.
- Classification: `new-wave`.
- Evidence: W23 R0 covers backlog reporting. The plan and work inventories at HEAD `54fc805f` have no W24 entry. MCP exposure profiles are a distinct end-to-end initiative. The later Backlog Review MCP App package depends on this profile foundation.

## Repo Summary And Output Contract

The TypeScript CLI and MCP server live in `packages/cli/`. `packages/cli/src/mcp/server.ts` registers all ready tools and native resources. `packages/cli/src/mcp/tools.ts` combines hand-defined and registry-derived descriptors. `packages/cli/src/operations/registry.ts` owns the operation inventory and access facts. The shipped system-resource catalog starts at `packages/docs/template/.make-docs/system-resources.catalog.json`; its dogfood copy lives under `.make-docs/`. Source-owned assets are edited upstream first and then dogfooded.

The output is an authoritative PRD maintenance package. Keep current requirements inline in PRD 25 and PRD 39. Put sequencing in this plan and tasks in [work](../../work/2026-09-24-w24-r0-mcp-tool-profiles/00-index.md). Do not archive or replace the PRD set. Do not create a new PRD for a profile-routing edit.

## Execution Mode And Phase Map

PRD 25 and PRD 39 contain the profile rules. P1, P2, and P3 are complete as of 2026-10-03. Use the [work backlog](../../work/2026-09-24-w24-r0-mcp-tool-profiles/00-index.md) as the phase execution source. P4 preparation is complete. P4 implementation is next under separate authority. The full W24 capability remains incomplete.

| Phase | Plan | Result |
| --- | --- | --- |
| P1 | [Profile metadata and contracts](01-prd-and-authority-reconciliation.md) | Every ready tool has explicit profile fields and a checked assignment. |
| P2 | [Filtered tool discovery](02-profile-inventory-and-discovery.md) | The server and CLI select tools from P1's checked profile fields. |
| P3 | [Resources and transports](03-resources-and-transports.md) | Native resources, stdio, and needed HTTP paths use the same profile policy. |
| P4 | [Compatibility and evidence](04-compatibility-and-validation.md) | The old connection works; profile lists, access, context, and latency have evidence. |

## Dependencies And Write Scope

PRD authority checks precede P1 code work. P1 precedes P2. P2 precedes P3. P4 consumes P2 and P3. The separate Backlog Review MCP App package uses the `backlog` profile and UI resource seam after W24 makes them available. That package owns UI behavior and agent review logic. W24 owns profile routing only.

Implementation files are expected in `packages/cli/src/mcp/`, the operation descriptors, CLI argument/help handling, and source-owned resource catalog metadata. Tests own matching `packages/cli/tests/` files. Avoid W23 R0 files and the separate app package. If a shared PRD or source file changes during execution, reread it and preserve the other task's edits.

This package assigns one writer per file. Delegation is optional. A coordinator using parallel agents must give disjoint files and integrate their results. A single agent can execute the same phase order.

## MCP And Fallback Strategy

Use the existing stdio server and operation registry as the baseline. Use jcodemunch for code and jdocmunch for project docs where available. If an index is absent or stale, reindex before direct reads. Store access is not needed to write this package. If a Store-backed probe returns a typed access failure, stop that probe and continue Store-free checks.

## Validation

Require profile assignment completeness, exact `all` union, stable tool names and contracts, unchanged access and write behavior, scoped native resources, current configuration replay, and unknown-profile rejection. Measure profile counts, model-visible context in a stated host mode, and startup or discovery latency. Use the smallest meaningful test set and the PRD authority validator. [P4](04-compatibility-and-validation.md) defines the proof.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: implement [P4: Compatibility and evidence](../../work/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-evidence.md) when separately authorized. Bind the prepared packet before any measurement.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md)
- Why: The current PRDs own profile requirements. The work backlog owns phase order and acceptance.
- Coordinate Handoff: W24 R0 P1, P2, and P3 are complete. P4 preparation is complete. The fixed compatibility baseline, canonical PERF-003 profile, finite unrun packet, and four testing decisions are ready. P4 implementation is next under separate authority. W24 remains incomplete. W25 owns UI registration and rendering.
