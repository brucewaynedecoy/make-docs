---
title: "Phase 1: PRD Authority and Requirement Trace"
kind: "work"
status: "active"
coordinate: "W20 R0 P1"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 1: PRD Authority and Requirement Trace

## Purpose

Lock the accepted product authority and map it to implementation and proof owners before source edits begin.

## Overview

This phase keeps the original problem intact. Technical correctness is not enough when a person cannot understand the subject, relationship, state, result, or next action. The implementation must therefore start from the human goal and observable promises, not from a new heading or validator alone.

PRD reconciliation is complete. This phase does not repeat it. It verifies that the accepted PRDs are coherent, creates the implementation trace, and returns any new product decision to PRD authority before code or shipped-resource work starts.

The boundary is important. A Persona identifies the human. Human Experience Intent states the local goal and promises. Human Experience Review is required acceptance work against those promises. PRD 50 owns the four testing types. Unassisted Goal Testing is conditional and uses a qualified person without private help.

## Source PRD Docs

- [PRD 00 — Active PRD Index](../../prd/00-index.md)
- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: `R-033` tracks the risk that agents satisfy the new section as a checklist while preserving a poor human result.
- Obligations: No `O-###` item is active at backlog creation. Any accepted deferral must use the current deferred-obligation contract.
- Unassisted Goal Testing: No `NUAT-###` scenario is active at backlog creation. Phase 4 can select at most one bounded scenario when material current uncertainty remains.
- Findings: No implementation finding is active at backlog creation. Record new material findings without hiding them behind technical success.

## Stage 1: Authority Lock

### Tasks

- [ ] t1: Read PRD 49 as the canonical Human Experience product authority and record the accepted meanings of `direct`, `indirect`, and `none` in the phase implementation notes.
- [ ] t2: Confirm that PRD 01 owns the product promise, PRD 06 owns shipped resource delivery, PRD 14 owns lifecycle review and closeout, PRD 15 owns router discovery, PRD 23 owns body-versus-metadata authority, PRD 46 owns Unassisted Goal Testing, PRD 47 owns Persona linkage, PRD 49 owns Human Experience, and PRD 50 owns the shared testing system.
- [ ] t3: Confirm that the first release adds no Human Experience frontmatter, no new lifecycle stage, no mandatory Skill, and no new resource type.
- [ ] t4: Check PRD 03 for the current `R-033` wording and record its required controls in the requirement trace.
- [ ] t5: Stop and return to PRD reconciliation if a requirement conflict, missing owner, or new product choice appears.

### Acceptance criteria

- PRD 49 is the single current owner of the universal standard.
- Each integration concern has one current owner PRD.
- The trace preserves the original concern that technically valid output can still be hard for a person to understand or use.
- The work does not convert beauty, elegance, intuition, or joy into a field-presence claim.
- No implementation task starts while a material authority conflict remains.

### Dependencies

- Accepted design, W20 R0 plan, and reconciled current PRDs.
- Owner authority to begin implementation.

## Stage 2: Requirement-to-Surface Trace

### Tasks

- [ ] t6: Map `R-HX-01` through `R-HX-12` to the exact phase, source resource, code owner, test owner, evidence source or selected testing type, and closeout result that will satisfy each requirement.
- [ ] t7: Map the conditional design section to the upstream design contract, design template, design workflow, request-to-design prompt, document validation, fixtures, and installed projection.
- [ ] t8: Map stable resource discovery to `packages/cli/src/rules.ts`, `packages/cli/src/tool-directory.ts`, the provider catalog, resource resolver, catalog tests, and template-link tests.
- [ ] t9: Map lifecycle propagation to the plan, PRD, work, coverage, UAT, router, prompt, and handoff owners without copying the canonical standard into each consumer.
- [ ] t10: Map required Human Experience Review to applicable promises, suitable evidence, `satisfied`, `material gap`, or `insufficient evidence` conclusions, finding dispositions, completion effects, and release claims. Do not create a fifth testing type or duplicate verdict.
- [ ] t11: Map prospective adoption to new projects, substantial design updates, historical designs, modified user-owned routers, package update behavior, and no-impact changes.

### Acceptance criteria

- Every `R-HX-##` requirement has implementation and evidence ownership.
- Every observable experience promise reaches an owning PRD, product or resource surface, work phase, evidence source or selected testing type, and durable deferral route.
- The map distinguishes direct, indirect, and none work.
- The map names the real human surface for direct work and the material human effect for indirect work.
- The map does not treat the existence of the new section as proof of a good result.

### Dependencies

- Stage 1 authority lock.

## Stage 3: Implementation and Validation Preflight

### Tasks

- [ ] t12: Verify the current symbol-level owners before editing, including `REQUIRED_REFERENCE_PATHS`, `ALWAYS_REFERENCE_PATHS`, `getReferencePaths`, tool-resource path helpers, `validateGeneratedDocumentMetadata`, provider catalog loading, resource resolution, and managed-block update behavior.
- [ ] t13: Verify the current test owners, including `packages/cli/tests/consistency.test.ts`, `packages/cli/tests/template-links.test.ts`, document-metadata tests, resource-provider and resolver tests, router-preservation tests, and `scripts/smoke-pack.mjs`.
- [ ] t14: Confirm the exact repository commands for focused tests, `npm run validate:defaults`, package smoke, path hygiene, link checks, and `git diff --check`.
- [ ] t15: Record the upstream-first write order and the affected dogfood projection paths. Do not edit dogfood system resources before their reviewed upstream source.
- [ ] t16: Define the executor, scope, effort budget, stop rule, evidence, and gate effect for each selected testing type. Define the Human Experience reviewer without treating the review as a testing type.
- [ ] t17: Define the finding and deferral route. Give every material finding a disposition. Create an `O-###` record only when the owner accepts a future outcome that remains owed.

### Acceptance criteria

- Each planned edit has a current source owner and a current test owner.
- Exact validation commands are known before implementation changes them.
- The source order starts in `packages/docs/template/` and ends with controlled projection and dogfood proof.
- Human judgment and deterministic validation have separate executors and claims.
- A technically passing result cannot close a material human finding.

### Dependencies

- Stage 2 requirement-to-surface trace.
- Current code and documentation indexes.

## Stage 4: Phase Close

### Tasks

- [ ] t18: Review the completed requirement trace against the design, plan, PRD 49, all applicable owner PRDs, and `R-033`.
- [ ] t19: Record any accepted scope change in current PRD authority before it enters implementation.
- [ ] t20: Record the Phase 1 capability status as `implemented`, `partially-implemented`, `not-implemented`, or `blocked`, with evidence.
- [ ] t21: Confirm that Phase 2 can start with no unresolved authority conflict and no unowned requirement.

### Acceptance criteria

- The trace is complete enough to implement without inventing product policy in code or prompts.
- The trace retains the human reason, the observable promises, and the internal complexity that must stay out of the normal human path.
- Product authority, implementation ownership, and evidence ownership agree.
- No material decision is hidden in implementation notes.
- Phase 2 receives stable impact values, section forms, resource names, activation rules, and proof boundaries.

### Dependencies

- Stages 1 through 3.

### Closeout Notes

- Testing decision(s): Record a current decision for each of the four testing types. Record Human Experience Review as required acceptance work over suitable evidence.
- Phase / capability status: Record the Phase 1 status and evidence before Phase 2 starts.
