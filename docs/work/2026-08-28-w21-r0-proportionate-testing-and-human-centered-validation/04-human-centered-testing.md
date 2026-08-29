---
title: "Phase 4: Human-Centered Testing"
kind: "work"
status: "active"
coordinate: "W21 R0 P4"
source:
  type: "prd"
  path: "docs/prd/50-proportionate-testing-and-human-centered-validation.md"
---

# Phase 4: Human-Centered Testing

## Purpose

Give guided and unassisted human activities distinct purposes, correct executor boundaries, and a short, safe, goal-led experience.

## Overview

Guided Progress Review helps the owner experience meaningful progress and give natural feedback. It is not a sign-off gate.

Unassisted Goal Testing reveals whether an intended person can understand and attempt a meaningful public goal without private coaching. It is conditional and diagnostic by default.

Human Experience Review checks the built result and evidence against accepted promises. It can guide either human activity, but it is not another type of test.

## Source PRD Docs

- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 22 — Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: `R-034` includes duplicate, obtuse, unauthoritative, and needlessly difficult human testing.
- Guided Progress Review: No scenario ID is required. It remains optional, advisory, and owner-controlled.
- Unassisted Goal Testing: No `NUAT-###` scenario is active at phase start. Activate one only for a material current uncertainty.
- Human Experience Review: Required for applicable W20 promises. It reuses evidence and records one review conclusion per promise.
- Obligations: Declined guided work, `not-needed-now`, invalid unassisted runs, and skipped advisory work do not create obligations by themselves.

## Stage 1: Guided Progress Review

### Tasks

- [ ] t1: Update the shared contract and reference with the distinct purpose, normal participant, advisory gate effect, and valid results for Guided Progress Review.
- [ ] t2: Define valid results as `experienced`, `feedback-recorded`, `declined`, `blocked-by-environment`, and `not-applicable`.
- [ ] t3: Require the agent to prepare a safe starting state before inviting the person.
- [ ] t4: Require one small realistic goal through the public product path, normally in one to five steps.
- [ ] t5: State what is worth noticing without telling the person what verdict to give.
- [ ] t6: Put optional troubleshooting after the normal path and provide cleanup or restoration when needed.
- [ ] t7: State that the review cannot duplicate automated assertions, demand formal sign-off, or block completion.
- [ ] t8: State that the person can decline without failed work, a negative acceptance result, or a deferred obligation.
- [ ] t9: Update active facilitator and lifecycle guidance so the owner experiences the product result instead of internal test machinery.

### Acceptance criteria

- Guided Progress Review has one clear purpose.
- The owner remains in control.
- The normal path is short and recognizable.
- The review does not repeat automation.
- Declining has no false gate or obligation effect.

### Dependencies

- Phase 2 common resources and human-request pattern.

## Stage 2: Unassisted Goal Testing Compatibility and Activation

### Tasks

- [ ] t10: Update active human-facing resource text from naive UAT to Unassisted Goal Testing while preserving the stable PRD filename, `NUAT-###` identities, and required compatibility paths.
- [ ] t11: Keep detailed activation, scenario identity, qualification, anti-coaching, public-path, evidence, and result rules in the PRD 46 contract and reference owners.
- [ ] t12: Activate Unassisted Goal Testing only when an unassisted attempt can reveal a material current uncertainty or explicit current acceptance authority requires it.
- [ ] t13: Recognize valid triggers such as a new mental model, discoverability risk, costly wrong assumption, weak recovery, hidden relationship, or new public goal without suitable evidence.
- [ ] t14: Define valid results as `clear`, `friction`, `blocked`, `invalid-run`, and `not-needed-now`.
- [ ] t15: Keep the result diagnostic and advisory unless explicit current product or release authority gives it a blocking effect.
- [ ] t16: Give the qualified person a realistic starting point, one or a few public goals, real safety limits, and no hidden path.
- [ ] t17: Mark a coached, privately informed, broken-environment, or otherwise invalid execution as `invalid-run` without turning it into product failure.
- [ ] t18: Preserve the canonical Persona evidence path and actual selected Persona slug without treating Persona as proof of tester qualification.
- [ ] t19: Do not add a new mandatory Skill or runtime command for the first release.

### Acceptance criteria

- Active language uses Unassisted Goal Testing.
- Stable identities and compatibility remain valid.
- A user-visible slice can validly select `not-needed-now`.
- Qualified execution remains separate from Persona selection.
- Coaching cannot produce a valid result.

### Dependencies

- Stage 1.
- Current PRD 46, PRD 47, and evidence-path authority.

## Stage 3: Human Experience Review and Request Quality

### Tasks

- [ ] t20: Connect the W20 Human Experience Review lens to Guided Progress Review, Unassisted Goal Testing, expert review, indirect evidence, and remediation without creating another test run.
- [ ] t21: Reuse suitable W20 or implementation evidence for each applicable experience promise before selecting more testing.
- [ ] t22: Record one `satisfied`, `material gap`, or `insufficient evidence` review conclusion per applicable promise.
- [ ] t23: If evidence is insufficient, select the smallest testing type that can answer the current question.
- [ ] t24: Require every human request to explain why it is useful now, the goal, expected time and effort, what the agent prepared, what to notice, gate effect, stop or cleanup, and feedback use.
- [ ] t25: Start instructions from the person's goal and public product path.
- [ ] t26: Keep raw payloads, long IDs, internal commands, hidden setup, and technical detail out of the normal path unless the goal needs them.
- [ ] t27: Keep optional help clearly separate so it does not coach an unassisted result.
- [ ] t28: Make feedback use explicit without manufacturing approval or asking the person to validate agent-owned assertions.
- [ ] t29: Preserve the person's right to stop safely and report confusion in their own words.

### Acceptance criteria

- Human Experience Review is required and non-duplicative.
- Human requests state purpose, effort, gate, and control plainly.
- The public goal comes before setup detail.
- Evidence reuse is normal.
- A material experience gap cannot hide behind technical success.

### Dependencies

- Stages 1 and 2.
- Implemented W20 Human Experience capability.

## Stage 4: Human Failure Fixtures and Phase Close

### Tasks

- [ ] t30: Add a passing fixture where a guided review produces a recognizable result without duplicate technical checks.
- [ ] t31: Add a passing fixture where the owner declines and the phase remains valid.
- [ ] t32: Add a passing diagnostic fixture where an unassisted attempt reveals a hidden relationship or mental-model gap.
- [ ] t33: Add a failure fixture where coaching invalidates an unassisted run.
- [ ] t34: Add a passing fixture where a user-visible slice selects `not-needed-now` because the activity cannot change a current decision.
- [ ] t35: Add a passing fixture where Human Experience Review reuses existing evidence instead of creating a fifth run.
- [ ] t36: Add a failure fixture where technically correct instructions are too long, too internal, or too difficult for the stated person and goal.
- [ ] t37: Add a failure fixture where Guided Progress Review or default Unassisted Goal Testing is made a hard sign-off gate.
- [ ] t38: Run focused checks for affected contracts, references, prompts, templates, Persona routing, evidence routing, and human scenario fixtures.
- [ ] t39: Decide whether one W21 Unassisted Goal Test can answer a material current uncertainty. If not, record `not-needed-now` without an obligation.
- [ ] t40: Record Phase 4 evidence, review conclusions, findings, obligations, and capability status for Phase 5.

### Acceptance criteria

- Fixtures distinguish guided and unassisted purposes and executors.
- Human Experience Review does not create a duplicate type or verdict.
- Poor human instructions fail even when their technical commands are correct.
- Skipped advisory work creates no false obligation.
- Phase 5 receives a safe installed-product exercise candidate.

### Dependencies

- Stages 1 through 3.

### Closeout Notes

- Testing decision(s): Use focused Automated Implementation Testing for affected resources and fixtures. Keep Performance Testing `not-needed-now`. Carry one optional Guided Progress Review candidate to Phase 5. Activate at most one Unassisted Goal Test only if t39 finds material current uncertainty.
- Human Experience Review: Required for the human request pattern and exercise candidate. Reuse evidence from W20 and this phase.
- Phase / capability status: Record the Phase 4 status and evidence before joint conformance.
