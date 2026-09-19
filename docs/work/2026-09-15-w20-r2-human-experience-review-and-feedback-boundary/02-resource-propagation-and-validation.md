---
title: "Phase 2: Resource Propagation and Validation"
kind: "work"
status: "complete"
coordinate: "W20 R2 P2"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 2: Resource Propagation and Validation

## Purpose

Ship the corrected boundary through upstream resources, package copies, dogfood copies, and focused tests.

## Overview

Change only resource text that repeats the old gate. Keep router-only discovery and runtime interfaces unchanged.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Shipped guidance must make the optional and explicit paths easy to distinguish.
- Intended human outcome: Agents perform the review and offer useful feedback steps without asking for routine approval.
- Human-facing surface or indirect effect: Installed contracts, references, templates, and generated work guidance.
- Implementation work: Update eight upstream resources, refresh package and dogfood copies, and add focused tests and cases.
- Evidence source or testing type selected under current authority: Focused Automated Implementation Testing, parity checks, and agent Human Experience Review.
- Executor: The implementation agent.
- Accepted obligation or deferral route: None.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Selected | Resource, propagation, parity, path, build, and package checks can reveal current defects. |
| Performance Testing | `not-needed-now` | Resource wording has no performance outcome. |
| Guided Progress Review | `not-needed-now` | The optional handoff behavior is proved by authority and fixtures. No owner session can change the accepted product choice. |
| Unassisted Goal Testing | `not-needed-now` | The correction does not make a new unassisted-use claim. |

Human Experience Review is required agent review work. The optional handoff remains completion communication. No human acceptance gate applies.

## Source PRD Docs

- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Obligations: None.
- Scenarios: Default direct completion, explicit gate, indirect, `none`, insufficient evidence, and later feedback.
- Finding: [D-037](../../prd/03-open-questions-and-risk-register.md#d-037-human-experience-review-creates-a-default-owner-close-gate).

## Stage 1 - Upstream Resources

### Tasks

- [x] t1: Update the Human Experience Contract and Reference upstream.
- [x] t2: Update lifecycle, design, and execution references upstream.
- [x] t3: Update coverage, output, and work-phase resources upstream.
- [x] t4: Refresh package and dogfood copies from upstream.

### Acceptance criteria

- A5: Current upstream resources contain no default owner-approval or owner-response rule.
- A6: The contract preserves agent review, real-surface inspection, conclusions, and evidence limits.

### Dependencies

- P1 current authority.

## Stage 2 - Focused and Full Validation

### Tasks

- [x] t5: Replace focused owner-approval assertions with the new boundary assertions.
- [x] t6: Add cases for direct, explicit-gate, indirect, `none`, insufficient-evidence, and later-feedback behavior.
- [x] t7: Run focused tests and resource parity.
- [x] t8: Run the full CLI tests, build, package smoke tests, defaults, PRD authority, paths, links, and diff checks.

### Acceptance criteria

- A7: Upstream, package, and dogfood bytes match for every changed resource.
- A8: Focused and full validation passes or records an exact unrelated baseline failure.

### Dependencies

- Stage 1 resource changes.

### Closeout Notes

- Four testing decisions: Automated selected; Performance, Guided, and Unassisted `not-needed-now`.
- Human Experience Review: `satisfied`. The real shipped resources and their upstream, package, and dogfood copies were inspected.
- Optional experience handoff: Prepared for the completion response. It is optional and creates no response duty.
- Explicit human acceptance gate: None for this phase.
- Evidence report: [evidence.md](evidence.md).
- Phase / capability status: Complete.
