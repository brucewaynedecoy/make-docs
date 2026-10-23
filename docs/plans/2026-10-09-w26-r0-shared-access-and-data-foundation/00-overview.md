---
title: "W26 R0 Shared Access and Data Foundation Plan"
kind: "plan"
status: "draft"
coordinate: "W26 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The foundation work queue starts with a bounded access trace and design gate."
  coordinate_handoff: "Carry W26 R0 P1-P3 into work, evidence, and history. W25 R0 consumes passed P3 checks."
source:
  type: "design"
  path: "docs/designs/2026-10-09-shared-access-and-data-foundation.md"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "conditional-prd-redline"
  reason: "P1 is read-only design work. Its exact access-policy choice must be approved before changing current PRD 25/38/39 rules or starting P2."
---

# W26 R0 Shared Access and Data Foundation Plan

## Purpose

Plan the shared access and data correction needed by W25 R0. Package F in the Bear coordinating plan maps to W26 R0. Its F1–F3 names are external planning labels only.

This record stands on the W24 local `main` baseline. The W26 branch carries its own plan and work records. It does not carry W25 widget or live app code. The P1 access design was accepted on 2026-10-09. Current policy and installed connections did not change with that decision.

## Objective

Make normal supported CLI and MCP setup reach allowed project and Store operations through one bounded policy. Keep explicit denial, Store safeguards, write gates, and shared identity and source-version rules. No policy implementation begins before the owner accepts the P1 design packet.

## Human Experience Propagation

The [design intent](../../designs/2026-10-09-shared-access-and-data-foundation.md#human-experience-intent) requires usable normal setup, exact refusal causes, and host-owned Store access for a sandboxed client. [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) owns operation access, [PRD 38](../../prd/38-global-store-and-project-state.md) owns Store identity, and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns the shared registry. P1 defines the proposed redline. P2 applies only approved authority. P3 proves the human and adapter outcomes.

## Performance Evidence Plan

No speed or scale claim is in this package. W25 A56 has a W25-only waiver. P3 tests functional access and parity; it does not convert the 73-record report into a performance result.

## Coordinate Decision

The active work-directory inventory reaches W25 R0 and contains no W26 R0. Use W26 R0 for this distinct shared foundation. Keep W25 R0 for app defects and closeout. Recheck coordinate collision before first authoring or implementation in another checkout.

## Product Authority Decision

| Subject | Route | Owner and gate |
| --- | --- | --- |
| Access admission, caller context, denial | `update-existing` after P1 approval | PRD 25; preserve old requirements in requirement history. |
| Project/checkout identity and Store safeguards | `update-existing` only for approved changed rules | PRD 38; retain existing stable IDs and safety checks. |
| Registry requirements and adapter parity | `update-existing` only for approved changed rules | PRD 39; retain one operation core. |
| W25 cache and live consumption | `link-only` here | PRD 51 and W25 R0 own app behavior. |
| Access risk and authority navigation | `update-existing` | PRD 03 and PRD 00. |

The owner accepted the exact P1 access design on 2026-10-09. The current PRD 25 caller-proof contract stays normative until separately approved P2 work updates the PRDs and implementation. P1 acceptance alone removes no live check.

This is a disclosed lifecycle departure. The P1 work record exists before the exact PRD access change because P1 must discover and present that change. After approval, P2 updates the owning PRDs before source implementation. P3 tests the accepted result.

## Phase Map

| Phase | Plan | Required result |
| --- | --- | --- |
| P1 | [Access trace and design](01-access-trace-and-design.md) | Call-path trace, check-purpose matrix, exact policy/config/schema/migration/redline packet, and owner decision. |
| P2 | [Shared core and setup](02-shared-core-and-setup.md) | Approved policy and setup change with focused source and package tests. |
| P3 | [Cross-interface proof](03-cross-interface-proof.md) | CLI/MCP grant, error, source-version, and sandbox proof W25 can consume. |

## Dependencies

- P1 reads the current PRDs, operation registry, setup path, and Store safeguards. It includes no policy edit.
- P2 has the P1 access-design decision. Before implementation, show the selected installed connection's enforced rules and differences from PRDs 25, 38, and 39. P2 work and its limit still need separate approval. Connection replacement is a separate W25 gate.
- P3 tests the exact P2 source and setup result. W25 R0 P9 may integrate approved source in parallel only with clear ownership. W25 R0 P11 waits for passed P3 checks.
- Later Q, U, H, and B packages are outside W26 R0. A future HTTP adapter must consume this core and policy.

## Work Limit and Stop Rules

The proposed first window is 90 active minutes for the P1 trace, inventory, affected-file list, tests, and approval packet. It is not an implementation grant. The proposed 12-hour W25 recovery ceiling must include the F work W25 requires. P1 must cost P2–P3 and W25 together before that ceiling is approved. Alert at 80 percent of an approved limit. Stop for a larger migration, new service, changed grant ceiling, or work beyond the approved file and test scope.

## Validation

- Verify the call path for snapshot, cache lookup/write, and refresh through CLI and MCP.
- Prove shared Store admission and cache behavior through the common operations. Trace the W25 Refresh call path, but leave visible app Refresh proof to W25 after it takes in the Store access change.
- Test allowed, missing, read-only, revoked, out-of-scope, and unsafe Store states with exact typed reasons.
- Test normal setup and migration without a private identity patch or grant widening.
- Test dirty-source version, project/checkout selection, and unknown-state parity.
- Test one sandboxed MCP client against a host-owned Store outside its filesystem access.
- Run PRD authority, links, metadata, and work-record validation after approved authority changes.

## Intended Follow-On

- Route: `implementation-loop`.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md).
- Why: P1 must produce the concrete design and separate policy decision before P2.
- Coordinate Handoff: Start W26 R0 P1. Link passed P3 evidence into W25 R0 P11.
