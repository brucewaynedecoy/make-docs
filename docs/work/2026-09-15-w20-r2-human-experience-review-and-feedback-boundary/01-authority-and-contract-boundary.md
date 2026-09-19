---
title: "Phase 1: Authority and Contract Boundary"
kind: "work"
status: "complete"
coordinate: "W20 R2 P1"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 1: Authority and Contract Boundary

## Purpose

Make the current authority separate agent review, optional feedback, and explicit human acceptance.

## Overview

Record the defect first. Then update the three current PRD owners and preserve all earlier requirement history.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. The process for protecting human experience must not become a poor human experience.
- Intended human outcome: The owner can receive useful try-it steps and give feedback without becoming a required closeout actor for every human-facing change.
- Human-facing surface or indirect effect: Agent completion replies, review records, phase-close decisions, and optional feedback.
- Implementation work: Update D-037 and R-033, PRDs 49, 14, and 50, and their requirement history.
- Evidence source or testing type selected under current authority: Focused Automated Implementation Testing and agent Human Experience Review.
- Executor: The implementation agent updates and reviews the authority. A human response is not required because no explicit human acceptance gate applies to this phase.
- Accepted obligation or deferral route: None.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Selected | Focused text, link, history, and authority checks can reveal a current defect. |
| Performance Testing | `not-needed-now` | The phase makes no performance claim. |
| Guided Progress Review | `not-needed-now` | The owner already selected the product direction. A review session cannot change the current implementation decision. |
| Unassisted Goal Testing | `not-needed-now` | The phase changes authority and needs no unassisted product-use claim. |

Human Experience Review is required agent review work. The completion response will include an optional experience handoff. No human acceptance gate applies.

## Source PRD Docs

- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Obligations: None.
- Scenarios: Default direct completion, explicit human gate, indirect handoff, `none`, and later feedback.
- Finding: [D-037](../../prd/03-open-questions-and-risk-register.md#d-037-human-experience-review-creates-a-default-owner-close-gate).

## Stage 1 - Current Authority

### Tasks

- [x] t1: Record D-037 before applying the correction.
- [x] t2: Update PRD 49 terms and requirements without changing prior history entries.
- [x] t3: Update PRD 14 phase-close rules and add W20 R2 history.
- [x] t4: Update PRD 50 testing and gate rules and add W20 R2 history.
- [x] t5: Confirm PRD 46 and PRD 15 contain no direct contradiction and remain unchanged.

### Acceptance criteria

- A1: The normal path requires an agent review and no owner response.
- A2: The optional experience handoff is not a test, gate, or obligation.
- A3: An explicit human acceptance gate names scope, human reviewer, surface, acceptance question, and gate effect.
- A4: Earlier W20 and W21 requirement-history entries remain unchanged.

### Dependencies

- The accepted W20 R2 design and implementation request.

### Closeout Notes

- Four testing decisions: Automated selected; Performance, Guided, and Unassisted `not-needed-now`.
- Human Experience Review: `satisfied`. Current authority keeps agent review required, normal feedback optional, and human acceptance explicit and scoped.
- Optional experience handoff: Prepared for the completion response. It is optional and creates no response duty.
- Explicit human acceptance gate: None.
- Evidence report: [evidence.md](evidence.md).
- Phase / capability status: Complete.
