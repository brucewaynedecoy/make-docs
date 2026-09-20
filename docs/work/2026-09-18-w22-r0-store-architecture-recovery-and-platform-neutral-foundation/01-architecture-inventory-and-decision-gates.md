---
title: "Phase 1: Architecture Inventory and Decision Gates"
kind: "work"
status: "draft"
coordinate: "W22 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# Phase 1: Architecture Inventory and Decision Gates

## Purpose

Build the complete evidence base and settle the target decisions before current authority or code changes.

## Overview

P1 freezes additive growth in the affected shell. It inventories every mechanism and symptom. It traces current authority, code, public use, state, failure protection, platform behavior, and migration need. It ends with one owner decision package.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Apply HX-6 and preserve HX-1 through HX-5 while the target is unsettled.
- Intended human outcome: A maintainer can explain what each mechanism does, why it exists, and whether it should remain.
- Human-facing surface or indirect effect: Architecture decisions, future setup and recovery behavior, and confidence in platform support.
- Implementation work: Read-only inventory, call and data maps, symptom ledger, decision ledger, and recommendation package.
- Evidence source or testing type selected under current authority: Repository evidence, read-only diagnostics, and Guided Progress Review of one decision at a time.
- Executor: Architecture evidence owner prepares the packet. The owner accepts or changes product decisions.
- Accepted obligation or deferral route: None. An unresolved product choice keeps P1 open.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 03](../../prd/03-open-questions-and-risk-register.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), and [PRD 38](../../prd/38-global-store-and-project-state.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required for inventory consistency; no product implementation | Check that every discovered table, writer, public route, test, and authority link has one ledger row and no duplicate identity. |
| Performance Testing | `not-needed-now` | Code volume is a review signal. No performance target or performance decision is open. |
| Guided Progress Review | Required for target decisions | Present one product choice at a time with the recommendation, alternatives, effects, and affected behavior. |
| Unassisted Goal Testing | `not-needed-now` | The owner has the product context needed for the architecture decisions. Executor isolation would not answer the current question. |

Human Experience Review is separate. P1 records whether the proposed target can support each promise. It does not claim the future installed result.

## Source PRD Docs

- [02 Architecture Overview](../../prd/02-architecture-overview.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Existing related drift: D-033, D-034, D-035, and D-038 in [PRD 03](../../prd/03-open-questions-and-risk-register.md).
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none.
- New W22 findings: assign stable IDs during P2 after the P1 evidence review prevents duplicate items.

## Stage 1 - Freeze and Inventory

### Tasks

- [x] t1: Record the W22 R0 freeze rule and list allowed release-blocking containment exceptions.
- [x] t2: Inventory Store schemas, tables, fields, migrations, writers, readers, retention, privacy, and recovery use.
- [x] t3: Inventory project identity, checkout identity, path claims, file fingerprints, device and inode use, locks, process liveness, and file mutation guards.
- [x] t4: Inventory harness receipts, native entries, executable identity, caller identity, operation access, machine approval, and project approval.
- [x] t5: Inventory setup, system setup, status, verify, repair, recovery, resource selection, projection, CLI, JSON, and MCP paths.
- [x] t6: Inventory current tests, real-platform proof, public docs, PRD rules, prior packages, and current consumers for each mechanism.

### Acceptance criteria

- A1: Every in-scope durable field and public route has one inventory row with owner, writers, readers, purpose, authority class, platform assumptions, tests, and migration need.
- A2: Every device, inode, path, volume, file hash, package hash, receipt, and identity use is classified as durable identity, live fact, short-lived guard, historical evidence, or obsolete candidate.
- A3: The inventory identifies each fact with more than one claimed canonical home.

### Dependencies

- Read-only repository and history access.
- Later owner symptom details can append to the inventory.

### Closeout Notes

- Four testing decisions: Automated inventory checks required; Performance Testing `not-needed-now`; Guided Progress Review waits for Stage 2; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: Record promise risks only. Do not claim future behavior.
- Evidence report: [P1 architecture inventory and decision evidence](evidence.md).
- Phase / capability status: Stage 1 is complete. P1 continued through the required owner decisions in Stage 2.

## Stage 2 - Symptom Mapping and Decision Package

### Tasks

- [x] t7: Create one append-only symptom table with observed behavior, confidence, platform, code path, authority owner, human promise, and missing proof.
- [x] t8: Trace each mechanism to an accepted public capability or safety failure. Mark dependency-only justification as insufficient.
- [x] t9: Assign `keep`, `rework`, or `remove` to every mechanism. State the evidence, migration effect, and public behavior effect.
- [x] t10: Prepare the proposed minimal state and platform boundary map. Identify every conflict with current PRDs.
- [x] t11: Present repository authority, Store authority, checkout identity, harness trust, setup composition, resource projection, platform support, and compatibility decisions one at a time.
- [x] t12: Record owner decisions and update the P2 input matrix. Stop on any unresolved product choice.

### Acceptance criteria

- A4: Every known symptom maps to one or more inventory rows, one accepted promise, and one planned close case.
- A5: Every mechanism has one disposition with evidence. No item is kept only because current code depends on it.
- A6: The owner has accepted or explicitly deferred every target decision. Each deferral states which later work it blocks.

### Dependencies

- Stage 1 inventory is complete.
- Owner review is required for product decisions. It does not authorize P2 edits or implementation.

### Closeout Notes

- Four testing decisions: Automated inventory checks passed. Guided Progress Review completed with D1 through D8 accepted. Performance and Unassisted Goal Testing remain `not-needed-now`.
- Human Experience Review: The [P1 evidence report](evidence.md) records accepted target support, observations, conclusions, evidence limits, and next actions for HX-1 through HX-6.
- Evidence report: The [P1 evidence report](evidence.md) contains the decision ledger and the one append-only symptom table.
- Phase / capability status: P1 is complete as of 2026-09-18. P2 is unblocked by P1 authority, but it has not been authorized or started. Product implementation remains unauthorized.
