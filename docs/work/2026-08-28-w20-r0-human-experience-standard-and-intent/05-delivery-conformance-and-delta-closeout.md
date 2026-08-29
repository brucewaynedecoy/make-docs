---
title: "Phase 5: Delivery, Conformance, and Delta Closeout"
kind: "work"
status: "active"
coordinate: "W20 R0 P5"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 5: Delivery, Conformance, and Delta Closeout

## Purpose

Prove that the enhancement reaches supported agents and installed projects and changes a real human outcome.

## Overview

This phase cannot close with document parity alone. It must show that agents can apply the standard, installed projects can resolve its resources, upgrades preserve user content, and a realistic product path becomes easier for a person to understand or use.

The real outcome exercise must be product-neutral. It must not become an implementation task for the example project that exposed the problem. Use a bounded fixture product with relationships, state, internal identifiers, errors, or progressive detail. This lets the proof reveal the universal failure mode: technically valid output that makes a person reconstruct the internal model.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 09 — Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: Close `R-033` only if complete-field negative proof and real human outcome proof show that checklist compliance cannot hide a poor result.
- Obligations: Carry every active `O-###` item from Phases 2 through 4 into final disposition. Do not create an obligation for declined advisory work or a valid `not-needed-now` decision.
- Unassisted Goal Testing: Carry the Phase 4 current decision and any selected `NUAT-###` scenario into installed-product proof.
- Findings: Give every material finding a disposition. Complete remediation and affected proof, accept a bounded caveat or narrower claim, or record partial status. Create an obligation only when an accepted future outcome remains owed.
- Testing scope: Use focused automated checks during implementation and one justified expanded integration pass at closeout. Do not perform release-grade testing without separate authority. Keep Performance Testing `not-needed-now` unless a current performance decision appears.

## Stage 1: Package, Projection, and Dogfood Proof

### Tasks

- [ ] t1: Confirm that all reviewed system-resource and default-asset changes exist first under `packages/docs/template/`.
- [ ] t2: Confirm that rules, catalog, tool-directory behavior, resource discovery, validation, and manifest expectations include the new resources and changed consumers.
- [ ] t3: Build the CLI package projection through the supported package path.
- [ ] t4: Verify that the package contains the reviewed Human Experience contract, reference, templates, prompts, lifecycle edits, routers, and related defaults.
- [ ] t5: Reseed only affected template-owned dogfood files after upstream review.
- [ ] t6: Verify required byte or semantic parity between upstream, package projection, and dogfood copies.
- [ ] t7: Pack and install the CLI into a clean project. Verify the stable contract and reference URIs through supported list and read operations.
- [ ] t8: Update an existing project with historical designs and modified user-owned router text. Verify safe managed changes and preserved user content.
- [ ] t9: Verify offline behavior and recovery for unavailable or invalid resource requests.

### Acceptance criteria

- `packages/docs/template/` remains the upstream source.
- The package and dogfood instance contain the reviewed authority.
- Stable URIs resolve in a clean installed project.
- Modified user and project content survives update.
- Historical designs remain readable.
- Delivery proof shows that real agents can reach the standard and not only that source files exist.

### Dependencies

- Phases 2 through 4 complete with no material finding that lacks a disposition.

## Stage 2: Structural and Functional Validation Matrix

### Tasks

- [ ] t10: Include `npm run validate:defaults` in the one justified expanded integration pass. Record contract, template, catalog, manifest, and link results.
- [ ] t11: Run focused CLI tests for document validation, resource provider and resolver behavior, operation surfaces, consistency, template links, managed routers, update preservation, required Human Experience propagation, finding dispositions, and exact affected scope.
- [ ] t12: Include `npm run smoke:pack` in the expanded integration pass. Record clean install, update, package contents, stable resource access, and user-content preservation results.
- [ ] t13: Run `bash scripts/check-instruction-routers.sh` and record managed-block structure and preservation results.
- [ ] t14: Run the current path-hygiene and Markdown-link commands confirmed in Phase 1.
- [ ] t15: Run `git diff --check` and inspect generated state for unsupported manual edits.
- [ ] t16: Verify direct, indirect, none, missing, invalid, duplicate, unresolved, misleading, and historical validation cases.
- [ ] t17: Verify that no new resource type, mandatory Skill, experience frontmatter, repository-wide rewrite, or unexpected local projection exists.
- [ ] t18: Record command versions, relevant environment facts, outcomes, evidence paths, and the current decision for each testing type. Do not rerun unchanged checks without a new failure signal or changed implementation.

### Acceptance criteria

- Contract, template, validator, catalog, rules, resource operations, manifest, package, and dogfood results agree.
- Negative fixtures fail for the intended reason and give useful recovery.
- Historical compatibility and modified-content preservation pass.
- Structural proof stays within structural and functional claims.
- The validation matrix does not claim that passing checks proves an elegant or joyful human result.
- An automated failure blocks only the correctness claim that the check covers.
- The expanded pass remains bounded to W20 integration. It is not release-grade proof.

### Dependencies

- Stage 1 package and dogfood projection.

## Stage 3: Supported Agent Conformance

### Tasks

- [ ] t19: Define a conformance matrix for each supported harness against the installed Make Docs resource surface.
- [ ] t20: Ask each supported harness to create and explain one direct-impact design with a coherent goal, observable promises, hidden complexity, and evidence.
- [ ] t21: Ask each supported harness to create and explain one indirect-impact design with a measurable quality and material human effect.
- [ ] t22: Ask each supported harness to create and explain one valid none design with a preserved experience and boundary proof.
- [ ] t23: Test one misleading agent-facing or headless case where a real human effect still exists.
- [ ] t24: Test one missing-product-choice case where the agent stops instead of exposing the internal model as the default human path.
- [ ] t25: Run deterministic structure checks for each result.
- [ ] t26: Apply required Human Experience Review for interpretation coherence. Reuse structure and conformance evidence where suitable. Record `satisfied`, `material gap`, or `insufficient evidence` for each applicable promise.
- [ ] t27: Record each harness, model, provider, runtime, result, finding, and supported claim under current conformance authority.

### Acceptance criteria

- Supported harnesses can find and apply the installed contract and reference.
- Each harness distinguishes direct, indirect, none, misleading, and missing-choice cases.
- Direct designs name a human goal and observable promises before internal detail.
- None is not used to hide a material human effect.
- Agents stop for a real product choice when authority is missing.
- Human Experience Review, not deterministic checks alone, judges interpretation coherence.

### Dependencies

- Stage 2 validated installed resource surface.
- Current supported-harness claims and conformance contract.

## Stage 4: Real Human Outcome Exercise

### Tasks

- [ ] t28: Select a bounded, product-neutral fixture flow with meaningful relationships, state, internal identifiers, error recovery, or progressive detail.
- [ ] t29: Record the intended human, public goal, starting point, prior failure or risk, and local experience promises before implementation of the fixture change.
- [ ] t30: Use an installed Make Docs project and a supported agent to carry the fixture change through design, plan, PRD, work, implementation, review, and acceptance.
- [ ] t31: Ensure the fixture produces a real runnable or inspectable human surface. Do not accept documents alone as the outcome.
- [ ] t32: Capture the visible default result and optional detail path without requiring the reviewer to understand opaque IDs, revision internals, or storage structures.
- [ ] t33: Apply required Human Experience Review for orientation, continuity, meaning, information amount, next action, recovery, control, and terminology. Record a conclusion for every applicable promise.
- [ ] t34: Offer one optional Guided Progress Review. Separately carry the Phase 4 Unassisted Goal Testing decision and run its one bounded `NUAT-###` scenario with a qualified person only if selected.
- [ ] t35: Compare the result with the recorded prior failure or risk and state the observable change. Do not infer improvement from document completion.
- [ ] t36: Give each material finding a disposition. Remediate and repeat only affected proof, accept a bounded caveat or narrower claim, or record partial status. Create an `O-###` record only when an accepted future outcome remains owed.

### Acceptance criteria

- The exercise uses the installed product and produces a real human surface.
- The proof is universal and does not turn into work on the originating example project.
- A person can understand the important subject, relationship, state, result, or next action without reconstructing the internal data model.
- Internal detail remains available when useful but is not forced into the normal path.
- Required Human Experience Review conclusions remain explicit against each applicable promise.
- Guided Progress Review is optional and cannot block completion.
- Unassisted Goal Testing is advisory unless explicit authority gives it a gate effect.
- The builder agent is not the only judge.
- Evidence can show failure. A technically successful but confusing result does not pass.

### Dependencies

- Stage 3 supported agent conformance.
- Phase 4 testing decisions and Human Experience Review conclusions.

## Stage 5: Prospective Adoption and Upgrade Proof

### Tasks

- [ ] t37: Test a new project created after activation.
- [ ] t38: Test an existing project that contains pre-activation historical designs.
- [ ] t39: Test a substantial design update that claims the new contract version.
- [ ] t40: Test a project with modified user-owned router text and project-owned documents.
- [ ] t41: Test a valid no-human-impact change with the short none form and preservation proof.
- [ ] t42: Test a direct or indirect change that activates full Human Experience Intent and downstream trace.
- [ ] t43: Verify that upgrade does not force repository-wide document rewriting or overwrite modified project content.
- [ ] t44: Verify that future qualifying work can discover the activation rule and the stable authority without a mandatory Skill.

### Acceptance criteria

- New projects use the standard after activation.
- Substantial qualifying updates adopt the standard.
- Historical documents stay readable and valid.
- User-owned content survives update.
- None and full-intent paths both work as designed.
- Adoption is prospective, discoverable, and does not create maintenance noise that works against human understanding.

### Dependencies

- Stages 1 through 4.

## Stage 6: Final Reconciliation and W20 R0 Closeout

### Tasks

- [ ] t45: Reconcile every `R-HX-01` through `R-HX-12` requirement to implementation, validation, and evidence or to an explicit accepted disposition.
- [ ] t46: Reconcile every applicable owner PRD requirement and `R-033` control.
- [ ] t47: Reconcile current decisions for Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing. Reconcile required Human Experience Review conclusions and all applicable specialist results.
- [ ] t48: Complete the finding and obligation audit. Ensure every material finding has a disposition. Ensure each accepted future outcome has a linked owner, trigger, coordinate, and remaining evidence need.
- [ ] t49: Bound product and release claims to the exact installed paths, harness tuples, and human evidence tested.
- [ ] t50: Update the backlog checkboxes and closeout notes with concise evidence links and final capability status.
- [ ] t51: Create one history record that preserves W20 R0 implementation outcome, source design and plan, current PRD authority, key evidence, findings, obligations, and final status.
- [ ] t52: Run final link, path, generated-state, and diff checks after the history update.
- [ ] t53: Present the closeout package for owner review. Do not stage, commit, publish, or release without separate authority.

### Acceptance criteria

- Every accepted requirement has implementation or an explicit accepted disposition.
- Every testing type has an explicit current decision. Every applicable experience promise has a Human Experience Review conclusion.
- No material finding or deferred human outcome is unowned.
- Package, dogfood, installed-project, agent-conformance, adoption, and real human outcome proof agree.
- The final evidence shows that technical success cannot hide an unresolved human finding.
- Direct-impact capability work cannot be complete when required evidence is absent or an accepted material finding remains unresolved.
- Claims do not exceed tested paths, supported harnesses, or human evidence.
- The history record preserves why this capability exists: agents must build technically sound products that people can understand and use with confidence and pleasure.

### Dependencies

- Stages 1 through 5.
- Owner review for final acceptance.

### Closeout Notes

- Testing decision(s): Record all four current testing decisions. Record Human Experience Review conclusions without a fifth testing type or duplicate verdict. Name the qualified executor for selected Unassisted Goal Testing.
- Phase / capability status: Record the final W20 R0 capability status, remaining obligations, and bounded release claim.
- Commit and release gate: Prepare evidence only. Wait for explicit owner authority before staging, commit, publication, or release.
