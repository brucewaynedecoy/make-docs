---
title: "Phase 4: Harness Trust, Setup, and Resource Simplification"
kind: "work"
status: "draft"
coordinate: "W22 R0 P4"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 4: Harness Trust, Setup, and Resource Simplification

## Purpose

Separate trust facts and reduce the setup, Store access, and resource projection shell.

## Overview

P4 makes a harness receipt prove managed native ownership. It makes current executable verification prove the current caller. It makes operation policy decide access. It makes setup a thin coordinator. It removes duplicate projection authority.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Apply HX-2, HX-3, and HX-5. Preserve HX-1 and HX-4.
- Intended human outcome: A person sees the project state and one valid next action. They can keep doing independent work when the Store is not available.
- Human-facing surface or indirect effect: Setup, system setup, status, verify, repair, recovery, resource reads, CLI, JSON, and MCP.
- Implementation work: Receipt reduction, current execution proof, access policy, setup service split, early admission, one recovery path, and projection state reduction.
- Evidence source or testing type selected under current authority: Automated Implementation Testing, output parity checks, interruption/restart proof, and Human Experience Review.
- Executor: Harness and setup owner implements. Store model and validation owners review boundaries.
- Accepted obligation or deferral route: None. A missing supported platform or access path blocks the phase.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 06](../../prd/06-template-contracts-and-generated-assets.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required; blocking | Verify trust separation, access policy, setup state transitions, Store-free behavior, projection ownership, and CLI/JSON/MCP parity. |
| Performance Testing | `not-needed-now` | The phase has no accepted performance target. |
| Guided Progress Review | Useful after installed P6 candidate; not needed for P4 source close | The complete public flow is meaningful only after the compatibility bridge and package matrix exist. |
| Unassisted Goal Testing | `not-needed-now` | Automated and maintainer review can answer the current architecture and safety decision. |

Human Experience Review is separate. Inspect every complete, partial, blocked, failed, and Store-unavailable result. Keep exact detail available after the human account.

## Source PRD Docs

- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Existing D-033, D-034, D-035, and D-038 plus the P2 W22 trust and setup items.
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none.

## Stage 1 - Harness Ownership and Current Execution Proof

### Tasks

- [x] t1: Reduce harness receipts to managed entry identity, method and scope, before and after value evidence, ownership, applied version, verification result, and recovery facts required by current authority.
- [x] t2: Separate current executable and package verification from the historical receipt. Verify current execution at each Store-backed call.
- [x] t3: Keep machine approval, project approval, caller identity, and operation access as distinct decisions with one policy service.
- [x] t4: Implement the accepted Windows method or enforce the owner-approved support limit across help, setup, adapters, tests, and release claims.
- [x] t5: Add valid update, changed entry, moved executable, changed package, revoked approval, forged identity, and cross-project tests.
- [x] t6: Prove that a valid package update does not fail only because the old executable hash differs.

### Acceptance criteria

- A20: A receipt proves managed native ownership without serving as permanent proof of the current executable.
- A21: Each Store-backed call verifies the current caller and applies machine, project, and operation policy before access.
- A22: A valid package update preserves a valid managed entry. A changed or unowned entry blocks mutation and stays intact.
- A23: Windows support is implemented and proved, or current authority and every public surface state the accepted narrower limit without contradiction.

### Dependencies

- P3 platform services and accepted P2 trust contract.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing is complete. Performance and Unassisted Goal Testing remain `not-needed-now`. Guided Progress Review waits for P6.
- Human Experience Review: The agent review found that current caller proof is separate from entry history. A Store-backed denial names the stopped operation and one next action. Store-free resource work continues. This is local source-build evidence, not lived-human or installed-package proof.
- Evidence report: Receipt, caller, approval, package-update, moved-launch-path, Store-state, and platform-boundary results are recorded in [evidence.md](evidence.md#p4-harness-trust-setup-and-resource-simplification).
- Phase / capability status: Stage 1 is complete. P4 closes through the Stage 2 gate below.

## Stage 2 - Thin Setup, One Recovery Path, and Minimal Projection State

### Tasks

- [x] t7: Split setup into bounded read, plan, review, apply, verify, and recover services. Keep the interactive shell as a coordinator.
- [x] t8: Make interactive, non-interactive, JSON, and MCP surfaces call the same operation services and return the same facts.
- [x] t9: Read pending operation and Store access state before editable questions. Stop only the action that requires the unavailable Store.
- [x] t10: Remove the closed recovery loop. Give one action that the current saved evidence permits and that the named command accepts.
- [x] t11: Keep desired resource selections in project config, provider identity in the provider, live projected bytes in the project, and only minimum applied ownership in the Store.
- [x] t12: Remove or stop writing duplicate projection facts after compatibility support exists.
- [x] t13: Add complete, partial, blocked, failed, pending, Store-absent, denied, unsafe, unavailable, repeat, repair, and removal tests across CLI, JSON, and MCP.

### Acceptance criteria

- A24: Store-free project and resource reads continue when Store access is absent, denied, unsafe, or unavailable.
- A25: Every setup entry checks pending work before the first editable question and creates no write on that stop.
- A26: Setup, status, verify, repair, and recover give one compatible next action from one saved operation state.
- A27: Desired selection, source resource identity, live project bytes, and applied ownership each have one canonical owner. Repeat setup does not create duplicate state.

### Dependencies

- Stage 1 trust services are complete.
- P5 retains compatible reads until old active fields can be retired.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing is complete. Performance and Unassisted Goal Testing remain `not-needed-now`. Guided Progress Review waits for P6.
- Human Experience Review: HX-2, HX-3, and HX-5 are satisfied for the P4 source boundary. Complete, planned, blocked, failed, pending, and Store-unavailable results keep exact state and one compatible next action. Store-free resource reads remain available. The review does not claim lived-human acceptance.
- Evidence report: Store-free behavior, state transitions, CLI/JSON/MCP parity, recovery, repeat, removal, and minimal projection cases are recorded in [evidence.md](evidence.md#p4-harness-trust-setup-and-resource-simplification).
- Phase / capability status: Tasks t1 through t13 are complete. Acceptance criteria A20 through A27 are satisfied within the recorded evidence and limits. The owner authorized closeout on 2026-09-19. P4 is closed. P5 requires separate implementation approval.
