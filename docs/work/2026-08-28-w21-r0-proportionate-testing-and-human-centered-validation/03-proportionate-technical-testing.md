---
title: "Phase 3: Proportionate Technical Testing"
kind: "work"
status: "active"
coordinate: "W21 R0 P3"
source:
  type: "prd"
  path: "docs/prd/50-proportionate-testing-and-human-centered-validation.md"
---

# Phase 3: Proportionate Technical Testing

## Purpose

Make automated and performance testing affected-first, maturity-qualified, finite, evidence-aware, and bound to current authority.

## Overview

Automated testing should answer the nearest correctness question and stop when the justified boundary is clear. It should not grow into repeated broad proof for reassurance.

Performance Testing needs an even stronger decision check. A measurable value is not automatically important. An MVP can have a real feasibility cliff, but MVP status does not justify production-grade targets by itself.

This phase changes guidance and conformance behavior. It does not create a benchmark runner. It does not define hard product targets that no current PRD owns.

## Source PRD Docs

- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: `R-034` requires proof that agents can stop too little work and too much work.
- Performance: Preserve all valid `PERF-###` identities and PRD 48 applicability states.
- Obligations: `defer-required` can create an `O-###` item only when the future proof remains an accepted owed outcome.
- Findings: A failed check can block only the covered correctness claim or an explicitly owned hard outcome.

## Stage 1: Automated Level and Affected-First Rules

### Tasks

- [ ] t1: Update the shared contract and reference with the affected-first order: changed behavior, nearest meaningful integration boundary, smallest relevant regression set, then broader proof only after a stated trigger.
- [ ] t2: Define `focused` as the normal default that an agent can run without owner interruption.
- [ ] t3: Define `expanded` as bounded broader proof with a short reason tied to blast radius, coupling, failure cost, or an observed regression signal.
- [ ] t4: Define `release-grade` as proof that needs explicit accepted product or release authority.
- [ ] t5: Define a finite normal stop: affected proof passes, the justified regression boundary passes, and no material failure remains unexplained.
- [ ] t6: State that test count, suite size, elapsed effort, and repeated green runs are not quality measures by themselves.
- [ ] t7: State that unchanged broad suites are not rerun for reassurance when valid evidence and scope remain unchanged.
- [ ] t8: Define when a changed implementation, affected dependency, environment drift, expired evidence, or changed claim triggers a rerun.

### Acceptance criteria

- Focused proof is the normal path.
- Expanded proof always has a current reason.
- Release-grade proof cannot appear from agent preference alone.
- Stop conditions are observable and finite.
- Evidence scope matches the claim it can block.

### Dependencies

- Phase 2 common contract, reference, and lifecycle routing.

## Stage 2: Implementation Workflow Integration

### Tasks

- [ ] t9: Update implementation preflight guidance to select an automated level from current change scope and failure cost.
- [ ] t10: Update work and phase-close guidance to record the affected boundary, selected level, reason, effort budget, stop, evidence, and rerun trigger.
- [ ] t11: Add a path for an agent to expand proof after a failing focused check, discovered coupling, or material blast-radius change.
- [ ] t12: Require the agent to stop and seek authority before release-grade proof or a materially larger external-state test.
- [ ] t13: Keep routine focused checks inside the implementation flow without asking the owner to approve each test command.
- [ ] t14: Prevent an agent from asking a person to repeat automated assertions as a Guided Progress Review.
- [ ] t15: Add examples for a local template edit, a cross-cutting resource change, a migration-sensitive update, and an unsupported release-grade proposal.
- [ ] t16: Add phase-close checks that distinguish a failed covered claim from unrelated product or support claims.

### Acceptance criteria

- Implementation work can proceed with proportionate focused checks.
- Scope expansion has an explicit trigger and reason.
- Human review does not duplicate automation.
- A passed suite cannot create unrelated support authority.
- The owner is interrupted only for a real authority or scope decision.

### Dependencies

- Stage 1 automated rules.

## Stage 3: Performance Qualification and Specialist Routing

### Tasks

- [ ] t17: Route every performance candidate through PRD 48 qualification before a target, benchmark, or blocking criterion is adopted.
- [ ] t18: Preserve `required-now`, `characterize-now`, `defer-required`, `not-needed`, and `reject-unsupported` specialist results while allowing the shared `not-needed-now` explanation in current decision records.
- [ ] t19: Require a maturity decision based on current outcome, failure cost, reversibility, support scope, stability, and baseline value before sophisticated proof.
- [ ] t20: Reject copied numbers, round targets, words such as `fast`, and production-grade expectations that lack an owning current requirement.
- [ ] t21: Permit bounded proof for an MVP only when it protects a real feasibility cliff, user harm, resource boundary, external mandate, or current architecture decision.
- [ ] t22: Bind a performance gate only to an owner-approved hard outcome or a bounded claim that the evidence actually covers.
- [ ] t23: Reuse valid performance evidence while workload, build, environment, comparison, expiry, and claim remain suitable.
- [ ] t24: Retain only enough evidence for the decision. Keep large raw output only when its owner contract or a current finding needs it.
- [ ] t25: Route `defer-required` through PRD 45. Do not create an obligation for `not-needed` or `reject-unsupported`.

### Acceptance criteria

- Performance work begins only when it can change a current decision.
- Maturity changes the proof burden.
- No numeric target becomes authority through repetition.
- Valid evidence is reused.
- Deferred proof has a real owner and trigger.

### Dependencies

- Phase 2 shared routing.
- Current PRD 48 resources and identities.

## Stage 4: Failure Fixtures, Validation, and Close

### Tasks

- [ ] t26: Add deterministic fixtures where a small change stops after focused proof and a cross-cutting change justifies expanded proof.
- [ ] t27: Add a failure fixture where an agent proposes release-grade work without authority.
- [ ] t28: Add a failure fixture where an unstable MVP path rejects a copied performance target.
- [ ] t29: Add a passing fixture where a real feasibility cliff activates bounded performance proof.
- [ ] t30: Add a failure fixture where a passed suite is used to claim unsupported product quality or harness support.
- [ ] t31: Add a passing fixture where unchanged valid evidence prevents an unnecessary rerun.
- [ ] t32: Add a failure fixture where testing has no finite budget or stop condition.
- [ ] t33: Run focused checks for every changed technical-testing resource, prompt, fixture, and conformance parser or registry owner.
- [ ] t34: Confirm that W21 Performance Testing remains `not-needed-now` unless a current decision activated it during implementation.
- [ ] t35: Record Phase 3 evidence, material findings, accepted obligations, and capability status for Phase 5 conformance assembly.

### Acceptance criteria

- Fixtures reveal both insufficient and excessive technical proof.
- Focused, expanded, and release-grade boundaries are deterministic enough for conformance.
- Performance choices retain PRD 48 authority.
- No broad suite is repeated without a rerun trigger.
- Phase 5 receives clear technical scenario and evidence needs.

### Dependencies

- Stages 1 through 3.

### Closeout Notes

- Testing decision(s): Use focused Automated Implementation Testing for affected files and fixtures. Carry one justified expanded integration pass to Phase 5. Keep W21 Performance Testing `not-needed-now` unless a current decision activates it.
- Human Experience Review: Check that examples explain the reason, scope, and stop in plain language. Do not create a human test for technical rules alone.
- Phase / capability status: Record the Phase 3 status and evidence before joint conformance.
