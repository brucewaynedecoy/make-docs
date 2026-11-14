---
title: "Phase 1: State and Store Binding"
kind: "work"
status: "active"
coordinate: "W22 R2 P1"
source:
  type: "prd"
  path: "../../prd/38-global-store-and-project-state.md"
---

# Phase 1: State and Store Binding

## Purpose

Give a clone one safe state before setup changes files or Store ownership.

## Overview

Classify a valid saved project ID with no verified target ledger as `portable-unregistered`. Keep binding presence separate from installed ownership. Add the distinct-checkout Store operation behind explicit `setup --adopt` review.

## Human Experience Outcome

- Impact and governing promise: The person sees that this is a known project on a new machine. [PRD 38](../../prd/38-global-store-and-project-state.md#stable-project-identity-r-id) owns the promise.
- Intended human outcome: Status and checkout preview name `make-docs setup --adopt` for the same target state.
- Human-facing surface or indirect effect: Setup state screen, status JSON and text, and checkout registration preview.
- Implementation work: Shared state classification, binding and ledger read, separate-checkout Store operation, and typed result.
- Evidence source or testing type: Automated two-Store state cases and agent Human Experience Review under the [contract](../../../.make-docs/system/contracts/human-experience-contract.md).
- Executor: Implementing agent.
- Accepted obligation or deferral route: None.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Activate | Two-Store state and Store-operation cases can change the adoption decision. |
| Performance Testing | `not-needed-now` | No performance target or changed hot path is in this slice. |
| Guided Progress Review | `not-needed-now` | The agent can inspect the status and preview result in this phase. |
| Unassisted Goal Testing | `not-needed-now` | The state read alone is not a complete end-user goal. |

- Base maintenance action: `none`.
- Performance applicability: `not-needed`.
- Canonical `PERF-###` profile link or `none`: none.
- Finite evidence budget and stop-rule reference or `not-applicable`: `not-applicable`.
- Execution packet link or `not-applicable`: `not-applicable`.
- Outcome and evidence handoff or `none`: none.
- Gate disposition and supported-scope limit or `not-applicable`: `not-applicable`.

Human Experience Review is required for the named outputs. The agent records what a person can tell about identity, state, and next action in [evidence.md](evidence.md).

## Source PRD Docs

- [PRD 18: classification](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 24: project identity](../../prd/24-project-configuration-and-convention-overlay.md)
- [PRD 38: Store and checkout identity](../../prd/38-global-store-and-project-state.md)
- [PRD 39: status and setup commands](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Obligations: none active.
- Unassisted Goal Testing scenarios: none active.
- Finding: [D-050](../../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout).

## Stage 1 - Shared State

### Tasks

- [ ] t1: Add a portable unregistered classification before generic missing-manifest fallback. Keep project ID, binding row, and ledger trust as separate fields.
- [ ] t2: Make status and checkout registration preview use that classification. Give both the same adopt action. Keep both reads free of durable writes.
- [ ] t3: Add cases for an absent binding, a binding without a ledger, a competing same-project checkout, malformed config, and an unsafe target path.

### Acceptance criteria

- A1: A valid clone with no local ledger reports portable unregistered identity and names `make-docs setup --adopt` in status and checkout preview.
- A2: A binding without a ledger reports incomplete local ownership. Neither read reports an installed project or changes the Store.
- A3: Invalid identity, unsafe paths, and competing claims stop with typed facts and no new checkout.

### Dependencies

- The current PRD 18, 24, 38, and 39 contracts are validated.

### Closeout Notes

- Four testing decisions: Automated active; performance, guided review, and unassisted testing `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: Record observations, limits, and next action in [evidence.md](evidence.md).
- Optional experience handoff: Save for the complete P3 command flow.
- Explicit human acceptance gate: none.
- Evidence report: [P1 result](evidence.md#next-evidence).
- Phase / capability status: Open until the state and safety cases pass.

## Stage 2 - Distinct Checkout Operation

### Tasks

- [ ] t4: Add reviewed Store admission for `setup --adopt`. Preserve the saved project ID and create or complete only this target's distinct checkout and ledger.
- [ ] t5: Bind the operation to a frozen target and source version. Make retry idempotent after a lost reply. Leave an incomplete result recoverable.

### Acceptance criteria

- A4: A reviewed adoption registers one new checkout under the existing project ID. Retry does not create a second checkout or copy another checkout's ledger.

### Dependencies

- Stage 1 provides the shared target state.

### Closeout Notes

- Four testing decisions: Use the phase table.
- Performance evidence: none.
- Human Experience Review: Show the distinct checkout and next action in [evidence.md](evidence.md).
- Optional experience handoff: Save for P3.
- Explicit human acceptance gate: none.
- Evidence report: [P1 result](evidence.md#next-evidence).
- Phase / capability status: Open until the Store operation and retry cases pass.
