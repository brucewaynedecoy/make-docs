---
title: "W26 R0 Shared Access and Data Foundation Work Backlog"
kind: "work"
status: "draft"
coordinate: "W26 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "P1 must produce a bounded access-design packet before policy implementation."
  coordinate_handoff: "Use W26 R0 P1-P3 for tasks and history. W25 R0 consumes passed P3 evidence."
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
| P1 | Planned; design approval required | [Access trace and design](01-access-trace-and-design.md) | Owner decides the exact policy, PRD, schema, migration, and test redline. |
| P2 | Blocked on P1 approval | [Shared core and setup](02-shared-core-and-setup.md) | Approved source and setup changes pass focused checks. |
| P3 | Blocked on P2 | [Cross-interface proof](03-cross-interface-proof.md) | Normal CLI/MCP, denial, grant-change, and sandbox proofs pass. |

## Usage Notes

- Recheck branch, HEAD, dirty files, connection, active candidate, and unrelated work before each phase.
- P1 is a bounded read-only design window. It grants no policy edit or candidate installation.
- Current PRD 25 caller-proof rules stay in force until the owner accepts a concrete P1 redline. No task checkbox overrides that gate.
- The proposed 90-minute P1 window and 12-hour combined W25/F recovery ceiling still require scope review. Count F time that W25 needs; alert at 80 percent of an approved limit.
- Keep setup and access-policy approval separate from W25 connection approval. Preserve unrelated settings and grants.
- Facts, cached judgment, and fresh agent judgment remain separate. Store refusal cannot authorize a private cache.
- W25 R0 P11 may use only passed P3 evidence. Q, U, H, and B get separate later work records.

## Intended Follow-On

- Route: `implementation-loop`.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md).
- Why: The owner needs the P1 design packet before any shared access change.
- Coordinate Handoff: Start W26 R0 P1 under its approved read-only scope.
