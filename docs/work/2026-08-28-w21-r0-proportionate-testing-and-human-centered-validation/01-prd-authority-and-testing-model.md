---
title: "Phase 1: PRD Authority and Testing Model"
kind: "work"
status: "active"
coordinate: "W21 R0 P1"
source:
  type: "prd"
  path: "docs/prd/50-proportionate-testing-and-human-centered-validation.md"
---

# Phase 1: PRD Authority and Testing Model

## Purpose

Lock the accepted testing model, the W20 dependency, implementation ownership, and proof boundaries before source edits begin.

## Overview

PRD reconciliation and W20 backlog revision are complete. This phase does not repeat them. It turns the accepted authority into an exact implementation trace.

The trace must retain the reason for the work. More testing is not always better. The correct amount is the smallest useful proof that can change a current decision. Human testing must help a person experience progress or reveal a real understanding gap. It must not ask the person to act as a slow test runner.

This phase also prevents an ownership error. PRD 50 owns the shared decision system. PRD 48 owns detailed performance evidence. PRD 46 owns detailed Unassisted Goal Testing. PRD 49 owns Human Experience Intent and the required Human Experience Review lens.

## Source PRD Docs

- [PRD 00 — Active PRD Index](../../prd/00-index.md)
- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 04 — Glossary](../../prd/04-glossary.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: `R-034` tracks insufficient proof and excessive, early, duplicate, unauthoritative, or needlessly difficult testing.
- Obligations: No W21-specific `O-###` item is active at backlog creation. A future obligation must have an accepted owed outcome, owner, trigger, target, exit, and reason.
- Performance: No W21 `PERF-###` profile is active at backlog creation. Performance Testing starts as `not-needed-now` for this implementation.
- Unassisted Goal Testing: No W21 `NUAT-###` scenario is active at backlog creation. Phase 4 decides whether a material current uncertainty justifies one.
- Findings: No W21 implementation finding is active at backlog creation. New material findings must receive an explicit disposition.

## Stage 1: Authority and Dependency Lock

### Tasks

- [ ] t1: Confirm that W20 R0 implementation and owner acceptance satisfy the Human Experience dependency before W21 source work starts.
- [ ] t2: Read PRD 50 as the shared testing authority and record the exact four testing types, their purposes, default executors, normal gate effects, and `not-needed-now` rule.
- [ ] t3: Confirm that PRD 48 retains `PERF-###` qualification and evidence authority, PRD 46 retains `NUAT-###` qualification and anti-coaching authority, and PRD 49 retains Human Experience Intent and Review authority.
- [ ] t4: Confirm that Human Experience Review is required acceptance work and a lens over suitable evidence. Record that it cannot become a fifth testing type, a forced run, or a duplicate verdict.
- [ ] t5: Confirm that the first release adds no mandatory Skill, no new CLI command, no new lifecycle stage, no new frontmatter, and no new system-resource type.
- [ ] t6: Read `R-034` and record the controls needed to reveal both under-testing and over-testing.
- [ ] t7: Stop and return to PRD authority if an owner conflict, missing requirement, or new product choice appears.

### Acceptance criteria

- W20 supplies the Human Experience capability that W21 consumes.
- Exactly four testing types are current.
- Shared and specialist owners do not overlap.
- Human Experience Review is required without becoming a testing type.
- No implementation starts while a material authority conflict remains.

### Dependencies

- Accepted testing design, W21 R0 plan, and reconciled PRD set.
- Revised W20 R0 plan and backlog.
- Implemented and accepted W20 Human Experience dependency.
- Owner authority to begin W21 implementation.

## Stage 2: Requirement-to-Surface Trace

### Tasks

- [ ] t8: Map `R-TEST-01` through `R-TEST-14` to one implementation phase, source resource, code or catalog owner, test owner, conformance scenario, and closeout result.
- [ ] t9: Map the common body record to design, plan, PRD, work, implementation preflight, phase close, human requests, and downstream handoffs without adding frontmatter.
- [ ] t10: Map automated levels and affected-first proof to shared resources, implementation workflow guidance, prompt consumers, and deterministic fixtures.
- [ ] t11: Map performance selection to PRD 48 resources and existing performance identities without copying the specialist model into the shared contract.
- [ ] t12: Map Guided Progress Review to safe preparation, goal-led instructions, owner choice, advisory results, feedback use, and cleanup.
- [ ] t13: Map Unassisted Goal Testing to PRD 46 activation, qualified executor, public path, anti-coaching, Persona routing, evidence, and advisory results.
- [ ] t14: Map Human Experience Review to W20 promises, suitable evidence reuse, `satisfied`, `material gap`, or `insufficient evidence`, and finding disposition.
- [ ] t15: Map gate effects and deferred outcomes to PRDs 14 and 45 so skipped advisory work cannot become a gate or false obligation.
- [ ] t16: Map conformance and support claims to PRDs 20, 43, and 44, including failure cases in both directions and the current supported harness set.

### Acceptance criteria

- Every `R-TEST-##` requirement has one implementation and evidence route.
- Each specialist rule has one owner.
- The trace carries the human reason for the change into prompts, scenarios, and installed-product proof.
- Every gate has current authority.
- A complete body record is necessary evidence, not proof that the testing choice was good.

### Dependencies

- Stage 1 authority and dependency lock.

## Stage 3: Resource Identity and Implementation Preflight

### Tasks

- [ ] t17: Inspect current contract, reference, template, prompt, router, catalog, manifest, provider, resolver, conformance, install, and package-smoke owners before naming an edit surface.
- [ ] t18: Settle one canonical filename and stable `make-docs://system/...` URI for the common testing contract within the existing contract family.
- [ ] t19: Settle one canonical filename and stable `make-docs://system/...` URI for the common testing reference within the existing reference family.
- [ ] t20: Record all compatibility paths that keep the stable naive-UAT filename or `NUAT-###` identities while using Unassisted Goal Testing in active human-facing language.
- [ ] t21: Identify the exact upstream files under `packages/docs/template/`, projected dogfood files, catalog entries, generated expectations, and package-delivery checks for each new or changed resource.
- [ ] t22: Verify current code owners before edits, including system-resource type directories, provider catalog loading, resource resolution, conformance scenario registry, installed prompt roots, consistency parity, and package-smoke assertions.
- [ ] t23: Verify the focused test owners and exact commands for resource consistency, template links, router preservation, conformance fixtures, install behavior, package smoke, PRD authority, link checks, and `git diff --check`.
- [ ] t24: Record the upstream-first write order. Do not edit dogfood system resources before the reviewed upstream source exists.

### Acceptance criteria

- Common resources have stable names and URIs before source edits.
- Every planned edit has a current source owner and test owner.
- Compatibility is explicit and does not preserve stale active language by accident.
- The write order begins upstream and ends with controlled projection and installed proof.
- No new runtime surface is introduced by assumption.

### Dependencies

- Stage 2 requirement-to-surface trace.
- Current documentation and code indexes.

## Stage 4: Testing Decision and Phase Close

### Tasks

- [ ] t25: Record focused Automated Implementation Testing as the default W21 implementation level, with affected scope, finite stop, retained evidence, and rerun trigger.
- [ ] t26: Record the reason that Phase 5 can use one expanded integration pass across resources, lifecycle routing, conformance, package delivery, and installed proof.
- [ ] t27: Record that release-grade testing is not authorized by this backlog.
- [ ] t28: Record Performance Testing as `not-needed-now` unless a current accepted performance decision appears.
- [ ] t29: Record Guided Progress Review as optional after a meaningful installed result and Unassisted Goal Testing as conditional on material current uncertainty.
- [ ] t30: Record Human Experience Review as required for the human testing instructions and installed result. Name the evidence that can be reused.
- [ ] t31: Review the full trace against the design, plan, PRD 50, specialist PRDs, `R-034`, and the revised W20 backlog.
- [ ] t32: Record the Phase 1 capability status and confirm that Phase 2 has no unresolved authority, identity, or ownership gap.

### Acceptance criteria

- Every testing type has a current selection result and reason.
- The effort budget and stop condition are finite.
- Expanded proof has a stated cross-cutting reason.
- No human activity is pre-activated to make the backlog appear complete.
- Phase 2 can proceed without inventing product policy in a prompt or implementation note.

### Dependencies

- Stages 1 through 3.

### Closeout Notes

- Testing decision(s): Use focused Automated Implementation Testing. Reserve one justified expanded integration pass for Phase 5. Keep Performance Testing `not-needed-now`. Keep Guided Progress Review optional and Unassisted Goal Testing conditional.
- Human Experience Review: Required against W21 human instructions and installed-product experience. It must reuse suitable evidence and must not create a duplicate verdict.
- Phase / capability status: Record the Phase 1 status and evidence before Phase 2 starts.
