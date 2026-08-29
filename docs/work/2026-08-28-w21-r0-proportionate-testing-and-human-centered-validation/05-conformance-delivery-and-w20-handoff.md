---
title: "Phase 5: Conformance, Delivery, and W20 Handoff"
kind: "work"
status: "active"
coordinate: "W21 R0 P5"
source:
  type: "prd"
  path: "docs/prd/50-proportionate-testing-and-human-centered-validation.md"
---

# Phase 5: Conformance, Delivery, and W20 Handoff

## Purpose

Prove that supported agents make proportionate testing decisions, deliver the accepted resources, and give a person a shorter and more meaningful installed-product experience.

## Overview

Happy paths are not enough. Conformance must fail when an agent does too little proof and when it does too much, too early, for the wrong claim, with the wrong executor, or in a needlessly difficult way.

This phase also proves the delivery chain. Shipped resources begin upstream. Dogfood and clean installed projects must receive the accepted form without loss of user-owned content.

The W20 review and backlog revision are already complete. This phase validates the dependency and preserves the agreed order. It does not reopen W20 or move W21 work into W20.

## Source PRD Docs

- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 09 — Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 22 — Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: Close `R-034` only with evidence that supported agents reject both insufficient and excessive testing.
- W20 dependency: Use the implemented W20 Human Experience capability and revised backlog as accepted input. Do not revise W20 in this phase.
- Scenarios: Preserve the Phase 3 and Phase 4 scenario needs. Use current conformance scenario and lab owners.
- Performance: Keep W21 Performance Testing `not-needed-now` unless an active current decision says otherwise.
- Human work: Guided Progress Review is optional. Unassisted Goal Testing is conditional. Human Experience Review is required.
- Obligations and findings: Carry all accepted Phase 1 through Phase 4 items to a final disposition. Do not create an obligation from a skipped advisory activity.

## Stage 1: Conformance Scenario Assembly

### Tasks

- [ ] t1: Add or update the canonical conformance scenario domain for testing decisions under the current scenario architecture.
- [ ] t2: Give every scenario product maturity, current decision, available authority, selected and skipped types, executor boundaries, effort budget, stop, evidence and reuse state, gate effect, and expected failure.
- [ ] t3: Add an under-testing case where an agent stops without evidence for a material current correctness decision.
- [ ] t4: Add an over-testing case where a small change triggers broad or release-grade work without authority.
- [ ] t5: Add a performance case that rejects a production-grade target for an unstable path and one that accepts bounded proof for a real feasibility cliff.
- [ ] t6: Add an evidence case that reuses valid proof and rejects reuse after a material scope, build, environment, claim, or expiry change.
- [ ] t7: Add a gate case that rejects a guided review, default unassisted result, or unowned performance target as a hard completion gate.
- [ ] t8: Add an executor case that distinguishes agent-run proof, guided owner activity, and qualified unassisted human activity.
- [ ] t9: Add a deferred-work case that rejects obligations made from `not-needed-now`, declined guided review, or skipped advisory work.
- [ ] t10: Add a human-instruction case that fails for duplicate assertions, internal IDs, needless setup, unclear effort, hidden gate effect, or no safe stop.
- [ ] t11: Add a Human Experience Review case that reuses evidence and rejects a fifth testing type or duplicate verdict.
- [ ] t12: Keep scenario assertions tied to current PRD requirements and supported claims.

### Acceptance criteria

- Conformance reveals under-testing and over-testing.
- Every scenario states the current decision and authority.
- Executor and gate errors fail.
- Evidence reuse and invalidation both receive proof.
- Human difficulty can fail conformance even when commands are technically valid.

### Dependencies

- Completed Phase 3 and Phase 4 scenario handoffs.
- Current conformance scenario architecture.

## Stage 2: Lab Execution and Supported Harness Proof

### Tasks

- [ ] t13: Update conformance scenario parsing, registry, kits, operator guidance, or fixtures only where the current architecture needs the new testing scenarios.
- [ ] t14: Keep agent-run Automated and Performance Testing distinct from human-run Guided Progress Review and Unassisted Goal Testing in lab records.
- [ ] t15: Record the qualified Unassisted Goal Test executor, environment, anti-coaching state, Persona route, and evidence integrity when that type is selected.
- [ ] t16: Require every observed gate effect to match current authority. Reject unsupported blocking behavior.
- [ ] t17: Run the failure-revealing scenario set against each currently supported executable harness, including Codex and Claude Code where the current support tuple requires them.
- [ ] t18: Record agent behavior in plain language. Do not infer support from a prompt file, tool card, or happy path alone.
- [ ] t19: Preserve raw observations only when needed to support the result, finding, or support claim.
- [ ] t20: Give every conformance failure one disposition: fix now, accepted bounded limitation, accepted future obligation, invalid run, or rejected claim.
- [ ] t21: Rerun only scenarios affected by a fix, shared harness change, evidence invalidation, or claim change.
- [ ] t22: Confirm that passing results support only the exact harness, version, surface, operation, and scenario tuple tested.

### Acceptance criteria

- Supported agents select the smallest useful proof.
- Labs distinguish agent and human executors.
- Conformance does not manufacture human approval.
- Failed behavior cannot hide behind an overall happy path.
- Support claims do not exceed evidence.

### Dependencies

- Stage 1 scenario assembly.
- Current supported-harness authority and available lab environments.

## Stage 3: Installed-Product Human Exercise

### Tasks

- [ ] t23: Select one realistic installed-product goal that demonstrates the new testing experience through the public product path.
- [ ] t24: Prepare the environment, safe starting state, expected time, cleanup, and any agent-run checks before inviting the person.
- [ ] t25: Keep the normal human path to one small goal and normally one to five steps.
- [ ] t26: Remove duplicate automated assertions, internal payload inspection, long identifiers, and technical setup that do not help the goal.
- [ ] t27: State what is worth noticing, the advisory gate effect, the safe stop, and how feedback will be used.
- [ ] t28: Compare the request with the prior technical walkthrough pattern and record why it is shorter, easier to understand, and more meaningful.
- [ ] t29: Apply Human Experience Review to the request and installed result before offering it.
- [ ] t30: Offer the Guided Progress Review. Record `experienced`, `feedback-recorded`, `declined`, `blocked-by-environment`, or `not-applicable` without making it a sign-off gate.
- [ ] t31: Run one Unassisted Goal Test only if Phase 4 selected a material current uncertainty and a qualified person is available. Otherwise record `not-needed-now`.
- [ ] t32: Convert material feedback into a finding with a clear disposition. Do not create an obligation from a decline or advisory skip.

### Acceptance criteria

- The public exercise is shorter and more meaningful than the prior walkthrough pattern.
- The person sees a recognizable product result.
- Agent preparation keeps technical machinery out of the normal path.
- Gate effect and control are honest.
- Human evidence informs the product without becoming manufactured approval.

### Dependencies

- Stages 1 and 2.
- A clean installed-product candidate.
- Owner choice to participate in the optional Guided Progress Review.
- A qualified person only if Unassisted Goal Testing is activated.

## Stage 4: Upstream Delivery, Dogfood, and Clean Install

### Tasks

- [ ] t33: Validate all changed upstream contracts, references, templates, prompts, routers, catalog entries, manifests, and generated expectations before projection.
- [ ] t34: Materialize the accepted upstream resource set into the repository dogfood instance through the normal controlled path.
- [ ] t35: Verify upstream and dogfood parity for all W21-owned resources and managed router pointers.
- [ ] t36: Build the package and run the clean-install smoke path in a temporary project.
- [ ] t37: Verify that the installed provider lists and resolves the new common contract and reference by stable identity.
- [ ] t38: Verify that a clean installed project receives the accepted templates, prompts, lifecycle guidance, and managed router pointers.
- [ ] t39: Verify update and reconfigure behavior against a project with user-authored router content and project-owned documents.
- [ ] t40: Confirm that stale naive-UAT wording is absent from active generated human-facing paths except where compatibility requires it.
- [ ] t41: Confirm that no mandatory Skill, new CLI command, new lifecycle stage, new frontmatter field, or new resource type entered the first release.
- [ ] t42: Record exact package, dogfood, install, update, and resource-resolution evidence.

### Acceptance criteria

- All shipped resources come from upstream template authority.
- Dogfood and clean installs receive the accepted resources.
- Stable resource identities resolve.
- User-owned content survives updates.
- Compatibility does not preserve stale active language.

### Dependencies

- Stages 1 through 3.
- Reviewed upstream source set.

## Stage 5: Expanded Validation and W21 Closeout

### Tasks

- [ ] t43: Run the justified expanded integration pass across affected resource, lifecycle, prompt, router, conformance, install, update, package, and public-path boundaries.
- [ ] t44: Run PRD authority validation, default-resource validation, path and link checks, package smoke, and `git diff --check`.
- [ ] t45: Run the required W20 Human Experience Review over every applicable W21 promise using the best available Phase 2 through Phase 5 evidence.
- [ ] t46: Reconcile every `R-TEST-##` requirement to implementation evidence, conformance evidence, Human Experience Review, or an accepted bounded gap.
- [ ] t47: Reconcile every selected and skipped testing type, material finding, `PERF-###`, `NUAT-###`, and `O-###` item. Confirm that none is orphaned.
- [ ] t48: Confirm that no advisory result, decline, `not-needed-now`, or invalid run changed a capability status without current authority.
- [ ] t49: Confirm that W21 consumed W20 without changing W20 task IDs, evidence, or ownership.
- [ ] t50: Record phase and capability status as `implemented`, `partially-implemented`, `not-implemented`, or `blocked`, with evidence and exact remaining gaps.
- [ ] t51: Update required history and closeout records only after the evidence and findings agree with the claimed status.
- [ ] t52: Stop before staging, commit, publication, release, or support-claim expansion unless the owner gives separate authority.

### Acceptance criteria

- The expanded pass is finite and tied to W21's cross-cutting delivery risk.
- Every current requirement has evidence or an honest bounded status.
- Human Experience Review is complete without a fifth test type or duplicate verdict.
- No material finding, scenario, evidence item, or accepted obligation is orphaned.
- W20 and W21 ownership remains clear.
- W21 closes without an unauthorized release or support claim.

### Dependencies

- Stages 1 through 4.
- Completed Phase 1 through Phase 4 closeout records.

### Closeout Notes

- Testing decision(s): Use the one justified expanded Automated Implementation Testing pass. Keep Performance Testing `not-needed-now` unless an active current decision changed it. Guided Progress Review remains optional. Unassisted Goal Testing remains conditional and advisory unless explicit authority states otherwise.
- Human Experience Review: Required across human testing instructions, installed-product use, evidence interpretation, and applicable W21 promises. It must reuse evidence and must not create a duplicate verdict.
- Phase / capability status: Record the final W21 phase and capability status with evidence, findings, obligations, and exact claim boundaries.
