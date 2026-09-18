---
title: "Phase 3: Platform-Neutral Filesystem and Checkout Safety"
kind: "work"
status: "draft"
coordinate: "W22 R0 P3"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 3: Platform-Neutral Filesystem and Checkout Safety

## Purpose

Implement the accepted platform boundary and checkout model without weakening file safety.

## Overview

P3 creates one platform service for path and file behavior. It moves device and inode checks to short-lived guards where useful. It replaces their durable identity role. It proves the contract on real Windows, macOS, and Linux runners.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Apply HX-1 and HX-4. Preserve HX-3 and HX-5.
- Intended human outcome: A project can move and a valid package can update without an identity failure caused only by low-level file-system values.
- Human-facing surface or indirect effect: Checkout discovery, Store association, file mutation, locks, repair, and recovery on all supported platforms.
- Implementation work: Platform interface, path model, atomic replace, lock and liveness services, short-lived guards, durable schema change, and real-platform tests.
- Evidence source or testing type selected under current authority: Automated Implementation Testing and real-platform contract cases.
- Executor: Platform safety and Store model owners implement. Platform evidence owner runs real operating-system checks.
- Accepted obligation or deferral route: None. Missing required platform proof blocks the phase.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 16](../../prd/16-package-runtime-and-deployment-boundaries.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), and [PRD 38](../../prd/38-global-store-and-project-state.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required; blocking | Unit, integration, schema, interruption, concurrency, and real-platform contract cases decide whether the new safety boundary works. |
| Performance Testing | `not-needed-now` | Retry timing and lock expiry are functional safety cases. No performance target is open. |
| Guided Progress Review | `not-needed-now` | P3 changes foundations. P6 will review installed public behavior after all layers are complete. |
| Unassisted Goal Testing | `not-needed-now` | Automated file and platform proof can answer the current implementation decision. |

Human Experience Review is separate. Inspect moved-checkout and blocked-state results when the public surface becomes available. Record the limits of automated platform evidence.

## Source PRD Docs

- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

- P2 W22 platform and identity risk items.
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none.

## Stage 1 - Platform Contract and Durable Identity Removal

### Tasks

- [ ] t1: Add one platform interface for user data roots, path normalization and comparison, atomic replacement, locking, process liveness, executable discovery, and short-lived file guards.
- [ ] t2: Move direct operating-system branches out of Store, setup, harness, and resource business rules when the platform interface owns them.
- [ ] t3: Replace durable checkout device and inode identity with project ID, Store checkout ID, current normalized path, and accepted last-verified content facts.
- [ ] t4: Keep device and inode values only in bounded mutation guards where the platform supplies meaningful values. Define a safe alternate guard on platforms that do not.
- [ ] t5: Add compatible schema changes and dual-read support needed before P5 migration.
- [ ] t6: Add focused tests for path equality, case behavior, drive and UNC policy, separators, links or reparse points, absent leaves, and path moves.

### Acceptance criteria

- A13: Store and checkout business rules use the platform interface and contain no unowned operating-system path branch.
- A14: A valid checkout move preserves project association after project identity and content proof pass.
- A15: A device or inode change alone cannot break durable checkout identity.
- A16: A collision, unsafe link, ambiguous identity, or changed content blocks mutation and preserves all bytes and prior Store evidence.

### Dependencies

- Accepted P2 authority and separate implementation approval.
- P5 owns retirement of old durable fields after compatible proof.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing required; all other testing types `not-needed-now` for this stage.
- Human Experience Review: Prepare moved and blocked result observations for P6.
- Evidence report: Retain schema, move, collision, and byte-preservation results.
- Phase / capability status: P3 remains active.

## Stage 2 - Atomic Mutation, Locks, and Real-Platform Contract

### Tasks

- [ ] t7: Implement platform-owned atomic replacement and parent or target guards with clear fallback and failure behavior.
- [ ] t8: Implement platform-owned lock acquisition, stale-lock review, token verification, release, and process-liveness checks.
- [ ] t9: Add interruption, restart, concurrent writer, stale lock, dead process, symlink or reparse-point, and atomic replace failure tests.
- [ ] t10: Run the same platform contract suite on real Windows, macOS, and Linux runners.
- [ ] t11: Compare public error class, safety result, and next action across platforms. Fix product-level differences or record an owner-approved limit.
- [ ] t12: Run focused and full CLI tests plus default validation and diff checks.

### Acceptance criteria

- A17: Interrupted or failed file replacement leaves either the accepted old bytes or accepted new bytes. It never leaves an untracked partial result.
- A18: One live writer owns a lock. A stale or dead owner can be reviewed and recovered without deleting unrelated work.
- A19: Real Windows, macOS, and Linux results agree on public state, preservation, and next action for equivalent cases.

### Dependencies

- Stage 1 platform interface and schema support are complete.
- Real operating-system runners are available. A missing result blocks the required support claim.

### Closeout Notes

- Four testing decisions: Record final automated results. Performance, Guided Progress, and Unassisted Goal Testing remain `not-needed-now`.
- Human Experience Review: Record direct observations from the available result and the limits of runner evidence.
- Evidence report: Link all real-platform contract results.
- Phase / capability status: Close P3 only when all required platform families pass or the owner narrows product support in current authority.
