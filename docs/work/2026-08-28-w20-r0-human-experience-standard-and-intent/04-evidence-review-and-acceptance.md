---
title: "Phase 4: Evidence, Review, and Acceptance"
kind: "work"
status: "active"
coordinate: "W20 R0 P4"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 4: Evidence, Review, and Acceptance

## Purpose

Require proof that matches the human effect without claiming that a checklist can prove beauty, elegance, intuition, or joy.

## Overview

This phase protects Make Docs from the original failure mode. Valid JSON, complete records, a successful command, and passing template checks can all coexist with a poor human result. Evidence must be able to show that the experience is wrong.

Human Experience Review is required acceptance work against every applicable experience promise. It reuses suitable evidence from the four testing types and specialist review. It is not a fifth testing type and does not require a duplicate run or verdict. If evidence is insufficient, PRD 50 selects the smallest additional testing activity that can answer the current question.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: `R-033` remains active until evidence proves that complete fields cannot hide an incoherent path.
- Obligations: None active at phase start. Create or update an `O-###` record only when the owner accepts a future outcome that remains owed.
- Unassisted Goal Testing: No active `NUAT-###` at phase start. Select at most one bounded scenario only if a material current uncertainty remains.
- Findings: Human Experience findings retain their severity, evidence, disposition, and completion effect.

## Stage 1: Evidence Levels and Human Experience Review Contract

### Tasks

- [ ] t1: Update the canonical Human Experience contract so Human Experience Review is required acceptance work against every applicable promise. Do not change shared testing contracts that W21 owns.
- [ ] t2: Define minimum evidence for `direct`: structural and functional checks plus review of the real human surface. Select Unassisted Goal Testing only when it can answer a material current uncertainty.
- [ ] t3: Define minimum evidence for `indirect`: technical proof for the affected quality plus a stated material human effect. Add human activity only when current evidence cannot support the acceptance conclusion.
- [ ] t4: Define minimum evidence for `none`: proof that the boundary remains internal and that existing human behavior or quality is preserved.
- [ ] t5: Define the direct-path review questions for orientation, continuity, meaning, information amount, next action, recovery, control, and terminology.
- [ ] t6: Define the Human Experience Review conclusions as `satisfied`, `material gap`, or `insufficient evidence`. State the completion effect for each conclusion.
- [ ] t7: State that expert Human Experience Review cannot certify unassisted success.

### Acceptance criteria

- Human Experience Review is explicit and required for every applicable promise.
- Direct, indirect, and none evidence is proportionate to the human effect.
- The review can reject a technically correct result that hides meaning, continuity, state, or recovery.
- No automated check or agent-only review claims to prove a person's lived experience.
- The review is not a fifth testing type and does not require a duplicate verdict.
- Existing specialist and Unassisted Goal Testing owners retain authority.

### Dependencies

- Phase 3 lifecycle trace and evidence inputs.

## Stage 2: Proportionate Testing Decisions and Evidence Reuse

### Tasks

- [ ] t8: Record the W20 R0 automated scope decision. Use focused Automated Implementation Testing during work and one justified expanded integration pass at closeout. Do not select release-grade testing without separate authority.
- [ ] t9: Record current decisions for Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing. Keep architecture, accessibility, visual, security, privacy, and other specialist authority separate.
- [ ] t10: For each selected testing type, record the reason, question, scope, executor, effort budget, stop rule, evidence, gate effect, and rerun trigger.
- [ ] t11: Reuse one activity as evidence for more than one question when suitable. Preserve each authority's scope and sufficiency rule without requiring a duplicate run or verdict.
- [ ] t12: Apply the default gate rules. An automated failure blocks only the correctness claim it covers. Guided Progress Review never blocks. Unassisted Goal Testing is advisory unless explicit authority says otherwise. PRD 49 blocks completion when required evidence is absent or an unresolved material gap remains.
- [ ] t13: Add decision fixtures for direct, indirect, none, evidence reuse, specialist escalation, and valid `not-needed-now` cases.
- [ ] t14: Add a negative fixture where automated checks pass but required Human Experience Review records a material gap.

### Acceptance criteria

- Each of the four testing types has an explicit current decision.
- Technical success cannot overwrite or hide a Human Experience finding.
- Reused evidence remains traceable and does not merge authority or executor rules.
- Performance, accessibility, visual, security, privacy, and other evidence remains independently visible.
- Performance Testing starts as `not-needed-now` unless implementation reveals a current performance decision.
- The output helps a person understand what was proved, what remains uncertain, and what happens next.

### Dependencies

- Stage 1 evidence and verdict contract.

## Stage 3: Guided and Unassisted Human Decisions

### Tasks

- [ ] t15: Design one optional Guided Progress Review for the owner after a meaningful installed-product result exists.
- [ ] t16: Prepare a safe starting state, one small realistic goal, one result worth noticing, no more than five clear steps, optional troubleshooting, and cleanup. Do not ask the owner to repeat automated assertions.
- [ ] t17: State that Guided Progress Review is advisory, can be declined, and cannot certify capability completion.
- [ ] t18: Decide whether one bounded Unassisted Goal Testing scenario can answer a material current uncertainty that other evidence cannot answer well enough. Record the reason either way.
- [ ] t19: If selected, create the scenario through PRD 46 authority. Link its setup, public goal, observations, finding rules, qualified executor, and consumption tasks.
- [ ] t20: If not selected, record `not-needed-now`. Do not create a future trigger or durable obligation unless the owner accepts a future outcome that remains owed.

### Acceptance criteria

- Guided Progress Review is brief, optional, safe, and non-blocking.
- Human Experience Intent can shape a meaningful unassisted goal without coaching the executor.
- A qualified person remains the only Unassisted Goal Testing executor.
- Installed or public-product scope stays separate from source-tree or builder-only evidence.
- Selection or `not-needed-now` has a clear current reason.
- Human Experience Review can reuse results from either human testing type without becoming another testing type or verdict.

### Dependencies

- Stage 2 testing decisions and evidence-reuse rules.
- PRD 46 scenario authority.

## Stage 4: Failure-Revealing Fixtures, Findings, and Obligations

### Tasks

- [ ] t21: Add a fixture in which every required Human Experience Intent field exists but the built human path is incoherent.
- [ ] t22: Add a fixture where a person cannot connect a relationship without reading raw internal identifiers.
- [ ] t23: Add a fixture where current state and history are technically present but visually or textually indistinguishable.
- [ ] t24: Add a fixture where an invalid input returns an error but gives no usable recovery path.
- [ ] t25: Add a valid indirect fixture with measurable reliability, wait, cost, or risk evidence tied to a material human effect.
- [ ] t26: Add a valid none fixture with explicit boundary and preservation proof.
- [ ] t27: Test finding severity and disposition. Support remediation and repeated proof, accepted bounded caveat or narrowed claim, or partial status. Test durable obligation fields only when an accepted future outcome remains owed.
- [ ] t28: Ensure a finding cannot close merely because the underlying operation returns success.

### Acceptance criteria

- At least one complete-field fixture fails because the human path is incoherent.
- Evidence can reveal hidden relationships, unclear state, missing recovery, overload, or forced internal knowledge.
- Indirect and none evidence proves the correct kind of effect or preserved boundary.
- Every material finding has a disposition. Not every finding becomes a durable obligation.
- Release claims remain within the exact paths and evidence tested.

### Dependencies

- Stages 1 through 3.

## Stage 5: Review, Validation, and Phase Closeout

### Tasks

- [ ] t29: Run the focused automated checks defined by the current testing decision. Do not expand into release-grade testing.
- [ ] t30: Apply required Human Experience Review to every applicable promise in the direct and indirect fixtures. Use a reviewer who is not the sole builder when practical. Record a conclusion for each promise.
- [ ] t31: Offer the optional Guided Progress Review. Run the one bounded Unassisted Goal Testing scenario with a qualified human only if t18 selected it. Otherwise record `not-needed-now`.
- [ ] t32: Reconcile every finding and Human Experience Review conclusion. Do not allow an automated pass to mask a material human gap.
- [ ] t33: Review `R-033` and update its disposition only when the failure-revealing proof supports the change.
- [ ] t34: Record Phase 4 requirement dispositions and capability status with evidence.

### Acceptance criteria

- Human Experience Review inspects the real surface or material effect and records one clear conclusion for each applicable promise.
- Guided Progress Review stays optional and non-blocking.
- Unassisted Goal Testing uses a qualified person when selected and stays advisory unless explicit authority gives it a gate effect.
- The evidence package states what passed, what failed, what was not tested, and what must happen next.
- Technical correctness cannot hide an unresolved material human finding.
- No claim says that a validator or agent proved beauty, elegance, intuition, or joy.
- Phase 5 receives finding dispositions, Human Experience Review conclusions, and a complete current testing decision record.

### Dependencies

- Stages 1 through 4.

### Closeout Notes

- Testing decision(s): Record all four current testing decisions. Record required Human Experience Review conclusions. Name the qualified executor when Unassisted Goal Testing is selected.
- Phase / capability status: Record the Phase 4 status, findings, obligations, and evidence before Phase 5 starts.
