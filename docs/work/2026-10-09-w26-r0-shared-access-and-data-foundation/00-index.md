---
title: "W26 R0 Shared Access and Data Foundation Work Backlog"
kind: "work"
status: "complete"
coordinate: "W26 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "P1–P3 source and proof are complete. The W26 PR merged, and W25 tested the saved connection later."
  coordinate_handoff: "Use W26 R0 P1-P3 for tasks and history. W25 R0 consumes only passed P3 evidence after integration."
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---

# W26 R0 Shared Access and Data Foundation Work Backlog

## Purpose

Execute the shared access and data work needed by W25 R0. The Bear coordinating plan calls this Package F. F1–F3 are mapping labels only; the phase records use W26 R0 P1–P3.

## Human Experience Trace

The [design](../../designs/2026-10-09-shared-access-and-data-foundation.md#human-experience-intent) promises usable normal setup, precise refusal, and safe host-owned Store access. [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) owns access, [PRD 38](../../prd/38-global-store-and-project-state.md) owns identity and Store safeguards, and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns the shared core. P1 makes the policy choice reviewable. P2 applies only accepted authority. P3 checks the real result.

## Phase Map

| Phase | Status | Work | Exit |
| --- | --- | --- | --- |
| P1 | Design accepted; no live policy change | [Access trace and design](01-access-trace-and-design.md) | Owner accepted the design on 2026-10-09. |
| P2 | Complete for merged source and setup | [Shared core and setup](02-shared-core-and-setup.md) | Approved source and setup changes passed focused checks. |
| P3 | Complete for shared proof | [Cross-interface proof](03-cross-interface-proof.md) | Normal CLI/MCP, denial, grant-change, source-version, migration, rollback, and sandbox proofs passed. |

## Usage Notes

- Recheck branch, HEAD, dirty files, connection, active candidate, and unrelated work before each phase.
- P1 is a bounded read-only design window. It grants no policy edit or candidate installation.
- Current PRD 25 caller-proof rules stay in force until separately approved P2 work changes them. P1 design acceptance alone changes no live rule.
- The proposed 90-minute P1 window and 12-hour combined W25/F recovery ceiling still require scope review. Count F time that W25 needs; alert at 80 percent of an approved limit.
- Before P2 implementation, show the selected installed connection's enforced rules and differences from PRDs 25, 38, and 39. Keep P2 work and limit approval separate from exact W25 connection replacement. Preserve unrelated settings and grants.
- Facts, cached judgment, and fresh agent judgment remain separate. Store refusal cannot authorize a private cache.
- W25 R0 P11 may use only passed P3 evidence. Q, U, H, and B get separate later work records.
- P3 owns shared Store and cache proof. W25 owns visible app Refresh proof after it takes in the Store access change.

## Intended Follow-On

- Route: `implementation-loop`.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md).
- Why: W26 PR #41 merged. W25 later proved the saved MCP connection, Store access, and visible Refresh in its accepted macOS scope.
- Coordinate Handoff: Use the [W26 PR packet](pr-review-packet.md) and [W25 installed record](../2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence/p13/closeout-review.md) for their separate proof scopes.
