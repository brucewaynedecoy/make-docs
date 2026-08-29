---
title: "Phase 2: System Resources and Lifecycle Routing"
kind: "work"
status: "active"
coordinate: "W21 R0 P2"
source:
  type: "prd"
  path: "docs/prd/50-proportionate-testing-and-human-centered-validation.md"
---

# Phase 2: System Resources and Lifecycle Routing

## Purpose

Make the accepted testing model easy for agents to find, interpret, record, and carry through normal Make Docs work.

## Overview

The shared rule must be small and discoverable. It must not become copied policy in every prompt. It must route an agent to the shared owner and the right specialist owner.

The body record keeps testing decisions visible to a person. It states why work is useful now, how much is enough, who does it, what it can block, what evidence remains useful, and when to reconsider it.

The implementation must begin in `packages/docs/template/`. Dogfood and installed copies are projections of the reviewed upstream source.

## Source PRD Docs

- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: Carry `R-034` into resource examples and failure fixtures.
- Obligations: Do not create an `O-###` item for `not-needed-now`, declined Guided Progress Review, or skipped advisory work.
- Compatibility: Preserve stable `NUAT-###` identities and required compatibility paths. Use current Unassisted Goal Testing language on active human-facing surfaces.
- Findings: Record any resource ownership or projection conflict. Do not resolve a product conflict through copied prompt text.

## Stage 1: Canonical Contract and Reference

### Tasks

- [ ] t1: Author the canonical common testing contract at the Phase 1 approved upstream path.
- [ ] t2: Define exactly four testing types and state that only types that can change the current decision are selected.
- [ ] t3: Define the common body record fields and plain-language expectations.
- [ ] t4: Define `focused`, `expanded`, and `release-grade` automated levels, their authority, and their default stop conditions.
- [ ] t5: Define shared gate effects: `blocking-current-work`, `blocking-claim-only`, `advisory`, `informational`, and `not-applicable`.
- [ ] t6: Define `not-needed-now`, evidence reuse, rerun triggers, and the rule against false obligations.
- [ ] t7: Define Human Experience Review as a required lens that can reuse evidence and cannot create a fifth testing type or duplicate verdict.
- [ ] t8: Author the companion testing reference with selection questions, short examples, counterexamples, result interpretation, and specialist-owner links.
- [ ] t9: Include examples for a small focused change, a justified expanded change, a rejected release-grade request, a valid `not-needed-now` result, and a skipped advisory human activity.
- [ ] t10: Keep detailed performance and unassisted-human procedures in their specialist resources.

### Acceptance criteria

- The contract is normative, concise, and complete.
- The reference helps an agent make a decision without copying the contract.
- Exactly four types appear as the common taxonomy.
- A skipped type is a valid decision result.
- Shared text does not duplicate specialist evidence models.

### Dependencies

- Phase 1 resource identities and requirement trace.

## Stage 2: Body Record and Lifecycle Consumers

### Tasks

- [ ] t11: Add the compact body record to the applicable work index, work phase, implementation preflight, and phase-close guidance without adding frontmatter.
- [ ] t12: Update lifecycle guidance so the agent identifies the current decision before it selects testing.
- [ ] t13: Require the agent to record maturity, scope, executor, gate effect, effort budget, stop condition, evidence, and rerun trigger only at the point where the record is useful.
- [ ] t14: Update design and planning guidance to preserve testing risks and specialist requirements without selecting implementation proof too early.
- [ ] t15: Update PRD-to-work guidance so the backlog derives test work from current PRD authority and current decisions rather than from a standard checklist.
- [ ] t16: Update implementation and phase-close guidance so affected proof can block only the claim it covers.
- [ ] t17: Update handoff guidance to preserve selected and skipped types, reasons, gate effects, valid evidence, accepted obligations, and rerun triggers when downstream work needs them.
- [ ] t18: Keep the common record in Markdown bodies. Reuse current metadata and links.
- [ ] t19: Add an orphan audit for selected testing, findings, evidence, and obligations at phase and capability close.
- [ ] t20: Ensure that a user-visible slice, phase number, or test candidate list does not activate all four types.

### Acceptance criteria

- The decision record appears where an agent needs it.
- No first-release frontmatter growth occurs.
- Lifecycle stages carry decisions without turning advisory work into gates.
- Handoffs preserve current useful evidence and do not carry dead obligations.
- Closeout can distinguish a partial phase from a completed capability.

### Dependencies

- Stage 1 canonical resources.

## Stage 3: Prompts, Routers, and Human Requests

### Tasks

- [ ] t21: Update only the prompts that make or carry testing decisions. Route them to the common contract and reference.
- [ ] t22: Add short prompt guidance for design, plan, implementation preflight, phase close, testing coverage, and human testing requests.
- [ ] t23: Require human requests to state why the activity is useful now, the goal, expected time and effort, agent preparation, what to notice, gate effect, stop or cleanup, and feedback use.
- [ ] t24: Put optional setup and troubleshooting after the normal human path.
- [ ] t25: Remove or revise active prompt text that asks a person to repeat agent-run assertions or inspect raw internal payloads without a human reason.
- [ ] t26: Add one short universal testing rule and common resource pointer to managed agent router sources.
- [ ] t27: Route Performance Testing to PRD 48 resources, Unassisted Goal Testing to PRD 46 resources, Persona to PRD 47, and Human Experience to PRD 49.
- [ ] t28: Do not copy the full common contract into `AGENTS.md`, `CLAUDE.md`, or any harness-specific router.
- [ ] t29: Preserve user-authored router text and unmanaged content during managed-block updates.
- [ ] t30: Distinguish the normal Guided Progress Review participant from the qualified Unassisted Goal Test executor in every affected prompt and router.

### Acceptance criteria

- Normal routers make the common rule easy to find.
- Prompts do not make all testing mandatory.
- Human requests are short and goal-led.
- Specialist routing is exact.
- Managed updates preserve user content.

### Dependencies

- Stages 1 and 2.

## Stage 4: Catalog, Projection, and Focused Validation

### Tasks

- [ ] t31: Add the approved contract and reference to the upstream system-resource catalog and generated-asset expectations.
- [ ] t32: Update resource identity, stable URI, provider, resolver, and link expectations without creating a new resource type.
- [ ] t33: Update package template inclusion and prepack expectations for the new resources.
- [ ] t34: Materialize reviewed upstream changes into this repository's `.make-docs/` dogfood instance through the normal controlled path.
- [ ] t35: Compare each dogfood resource with its upstream authority and document any allowed projection difference.
- [ ] t36: Run focused resource-provider, resolver, catalog, consistency, template-link, router-preservation, and document-shape checks.
- [ ] t37: Add failure fixtures for a missing shared resource, copied full policy in a router, an advisory activity made blocking, and a body record that omits a stop condition.
- [ ] t38: Verify that the resource can be found from supported router paths and by stable identity.
- [ ] t39: Review all human-facing examples with the required Human Experience lens. Record `satisfied`, `material gap`, or `insufficient evidence` for each applicable promise.
- [ ] t40: Record the Phase 2 capability status, evidence, findings, obligations, and current testing decisions before Phase 3 starts.

### Acceptance criteria

- Upstream resources, catalog entries, package expectations, and dogfood copies agree.
- Stable identities resolve through current providers.
- Focused checks fail for important resource and routing drift.
- Human-facing examples are understandable without reading internal policy first.
- Phase 3 and Phase 4 receive one stable common model.

### Dependencies

- Stages 1 through 3.
- Upstream-first template authority.

### Closeout Notes

- Testing decision(s): Use focused Automated Implementation Testing for affected resources, routing, catalog, and projection. Keep Performance Testing, Guided Progress Review, and Unassisted Goal Testing `not-needed-now` in this phase.
- Human Experience Review: Required for human request patterns and examples. Reuse review evidence in Phase 4 and Phase 5.
- Phase / capability status: Record the Phase 2 status and evidence before specialist integrations begin.
