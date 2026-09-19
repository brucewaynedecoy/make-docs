---
title: "Phase 2: Product Authority and Minimal State Model"
kind: "work"
status: "draft"
coordinate: "W22 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# Phase 2: Product Authority and Minimal State Model

## Purpose

Make the accepted P1 target the current product contract before implementation begins.

## Overview

P2 updates each existing PRD owner. It adds living risk items, preserves material former contracts in requirement history, and proves that each durable fact has one canonical home.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Carry HX-1 through HX-6 into current authority.
- Intended human outcome: Future implementation has one clear contract for platform parity, Store-free work, identity, setup, and recovery.
- Human-facing surface or indirect effect: All later installed behavior and maintainer rebuild decisions.
- Implementation work: Surgical PRD updates, risk items, requirement history, link reconciliation, and authority validation.
- Evidence source or testing type selected under current authority: Document validators, cross-owner consistency review, and owner review of material product choices.
- Executor: Product authority owner writes assigned PRDs. Validation owner checks the assembled set.
- Accepted obligation or deferral route: None. A material unsettled choice returns to P1.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) and [PRD Authority Maintenance](../../../.make-docs/system/references/prd-change-management.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required for documentation authority | Run PRD authority, link, path, metadata, and consistency checks. |
| Performance Testing | `not-needed-now` | P2 sets no performance target. |
| Guided Progress Review | Required for material authority changes | Review the final state and identity rules in normal product language before acceptance. |
| Unassisted Goal Testing | `not-needed-now` | This is a product-authority task for informed maintainers. |

Human Experience Review is separate. Review each promise against the current normative text. Do not treat structural validity as proof of a good future experience.

## Source PRD Docs

- All PRDs listed in [P1 Source PRD Docs](01-architecture-inventory-and-decision-gates.md#source-prd-docs).
- [49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Accepted P1 decision ledger and symptom table.
- Existing related PRD 03 items plus new stable W22 items assigned in this phase.
- Accepted obligations: none unless the owner explicitly accepts a future outcome during P2.
- Activated Unassisted Goal Test scenarios: none.

## Stage 1 - State Model and Owner Updates

### Tasks

- [x] t1: Convert every accepted P1 fact into repository-canonical, Store-canonical, Store-cached, live-machine, short-lived guard, historical, or obsolete state.
- [x] t2: Update PRDs 02 and 38 with one repository and Store boundary and one project and checkout identity model.
- [x] t3: Update PRDs 18 and 38 with one operation journal, lock, interruption, recovery, and compatibility rule.
- [x] t4: Update PRDs 28 and 38 with separate native-entry ownership, current executable proof, operation access, machine approval, and project approval.
- [x] t5: Update PRDs 06, 07, 24, 25, and 39 with thin setup, Store-free work, one recovery path, and minimal resource projection state.
- [x] t6: Update PRDs 10 and 16 with equal Windows, macOS, and Linux proof and the bounded platform layer.

### Acceptance criteria

- A7: Every accepted P1 decision appears as current normative text in its existing owner.
- A8: No durable fact has two canonical homes or two independent recovery writers.
- A9: Device, inode, volume identity, and exact package hash are not permanent project, checkout, or caller identity in current authority.

### Dependencies

- P1 target decisions are accepted.
- Preserve concurrent PRD edits. Rebase the planned text on current files instead of restoring an older version.

### Closeout Notes

- Four testing decisions: Automated document checks passed; Performance Testing `not-needed-now`; Guided Progress Review is ready in Stage 2; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: HX-1 through HX-6 map to current owning requirements in [evidence.md](evidence.md#human-experience-review-1).
- Evidence report: The authority decision, state register, history, risks, and validator results are in [evidence.md](evidence.md#p2-product-authority-and-minimal-state-model).
- Phase / capability status: Stage 1 is complete. P2 remains active until owner acceptance. Code work is still not authorized.

## Stage 2 - Risk, History, and Validation

### Tasks

- [x] t7: Add or update numbered PRD 03 items for confirmed drift, open choices, and rebuild risks. Do not duplicate existing items.
- [x] t8: Add `2026-09-18 — W22 R0` requirement-history entries to materially changed product PRDs.
- [x] t9: Update PRD 00 links only where the accepted owner relationships changed.
- [x] t10: Validate every PRD owner, source link, history entry, risk item, and Human Experience promise mapping.
- [x] t11: Run PRD authority validation, links, path hygiene, metadata checks, and `git diff --check`.
- [x] t12: Present the final current-authority change for owner acceptance and record any limit that blocks implementation.

### Acceptance criteria

- A10: Current authority states which work remains possible when the Store is absent, denied, unsafe, or unavailable and gives the affected operation one safe result.
- A11: PRD 03 contains stable non-duplicate records for the accepted W22 drift, questions, and risks.
- A12: All authority, link, path, metadata, and diff checks pass. The owner accepts the current contract before P3 starts.

### Dependencies

- Stage 1 owner updates are complete.
- Separate implementation approval is still required after P2 acceptance.

### Closeout Notes

- Four testing decisions: Automated document checks passed. Guided Progress Review passed through owner acceptance on 2026-09-19. Performance and Unassisted Goal Testing remain `not-needed-now`.
- Human Experience Review: Per-promise authority coverage, observations, conclusions, reviewer, and limits are recorded in [evidence.md](evidence.md#human-experience-review-1).
- Evidence report: Validator results and the accepted owner decision are recorded in [evidence.md](evidence.md#validation-evidence).
- Phase / capability status: Tasks t1 through t12 are complete. P2 is closed. P3 and later code work still require separate explicit implementation approval.
