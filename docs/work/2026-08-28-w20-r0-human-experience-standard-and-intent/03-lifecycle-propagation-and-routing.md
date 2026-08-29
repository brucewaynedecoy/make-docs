---
title: "Phase 3: Lifecycle Propagation and Routing"
kind: "work"
status: "active"
coordinate: "W20 R0 P3"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 3: Lifecycle Propagation and Routing

## Purpose

Keep the human reason visible from design through implementation, review, acceptance, and release.

## Overview

The originating failure happens when later work preserves technical detail but loses the human result. This phase makes Human Experience a cross-cutting lens. It does not add a new lifecycle stage. Each existing stage carries only the local context it needs and links back to the canonical authority.

The result must let an agent plan complex work without turning the backlog into a technical checklist. Each applicable phase must preserve the intended human outcome, the affected surface or material effect, observable acceptance, proof ownership, and a durable route for accepted deferral.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: `R-033` requires lifecycle evidence that can reveal a poor human result even when required text exists.
- Obligations: No active `O-###` item at phase start. All accepted deferrals must remain discoverable under PRD 45.
- Unassisted Goal Testing: No active `NUAT-###` item at phase start. This phase prepares Human Experience links only. Phase 4 makes the conditional current decision.
- Findings: Propagation gaps, copied policy, lost provenance, or overwritten user router text are material findings.

## Stage 1: Lifecycle Reference and Cross-Cutting Lens

### Tasks

- [ ] t1: Update `packages/docs/template/.make-docs/references/system/lifecycle.md` so Human Experience is a cross-cutting lens and not a new stage.
- [ ] t2: Define the local action at design, plan, PRD, work, implementation, review, coverage, acceptance, release, and retrospective points.
- [ ] t3: Require design to record impact and intent before product and architecture decisions.
- [ ] t4: Require planning to map each promise to PRD authority, a product or resource surface, a work phase, an evidence source or selected testing type, and a durable deferral route.
- [ ] t5: Require implementation and review to preserve the intended human path as well as technical correctness.
- [ ] t6: Require release and retrospective claims to stay within tested paths and to feed repeatable lessons back to the contract, reference, or owner PRD.
- [ ] t7: Review the lifecycle edit for conflict with PRD 50, Unassisted Goal Testing, architecture, accessibility, visual, security, privacy, and other specialist owners.

### Acceptance criteria

- The lifecycle contains one cross-cutting Human Experience lens and no new stage.
- Each lifecycle point has one clear local action.
- The human goal and observable promises survive beyond the design.
- Existing technical and specialist authorities keep their scope.
- The lifecycle cannot close poor human output only because the implementation is technically correct.

### Dependencies

- Phase 2 stable contract, reference, field names, and activation rules.

## Stage 2: Plan, PRD, and Work Propagation

### Tasks

- [ ] t8: Update upstream baseline-plan and change-plan guidance and templates so applicable promises map to authority, surface, phase, evidence, and deferral.
- [ ] t9: For `none`, require the plan to state the preserved human boundary and proof that it stays unchanged.
- [ ] t10: Update PRD generation and PRD maintenance guidance so observable experience requirements enter the PRD that owns the capability and link to PRD 49.
- [ ] t11: Prevent editorial experience PRDs, copied universal policy, and new experience frontmatter.
- [ ] t12: Update upstream work-index guidance and template so the backlog retains the source design, plan, owning PRDs, phase order, evidence decisions, and implementation gate.
- [ ] t13: Update upstream work-phase guidance and template so each applicable phase states the intended human outcome, affected surface or effect, implementation work, observable acceptance, evidence source or selected testing type, executor, and deferral route.
- [ ] t14: Add acceptance examples for subject orientation, relationship continuity, state distinction, next action, error recovery, progressive detail, and completion without internal identifiers.
- [ ] t15: Add guidance that rejects vague criteria such as `UX is good`, `easy to use`, or `intuitive` unless they are replaced by observable outcomes.

### Acceptance criteria

- Plans retain enough context to prevent a technical-checklist backlog.
- PRDs own current observable requirements and link to the universal standard.
- Work phases name the human outcome, surface or effect, proof mode, and executor.
- A valid none path preserves a stated boundary and proof.
- Deferred experience work cannot disappear between artifacts.
- The templates help a person see what the work is meant to improve, not only what files will change.

### Dependencies

- Stage 1 lifecycle lens.

## Stage 3: Prompts, Routers, and Handoffs

### Tasks

- [ ] t16: Update the smallest upstream prompt set that creates or transforms designs, baseline plans, change plans, PRDs, PRD changes, full work backlogs, and delta work backlogs.
- [ ] t17: Update only W20-owned lifecycle and consumer links to current testing authority. Leave shared testing prompts, contracts, facilitator behavior, and testing selection rules to W21.
- [ ] t18: Make each prompt resolve the canonical contract and reference. Do not copy the full standard, conditional forms, or examples into prompts.
- [ ] t19: Update only the managed router blocks that own discovery for designs, plans, PRDs, work, coverage, and testing.
- [ ] t20: Keep each router pointer short. State when the contract applies and how the agent can resolve it.
- [ ] t21: Use the existing managed-block path around `parseManagedBlock` and `upsertManagedBlock` so user-owned router text remains unchanged.
- [ ] t22: Update handoff guidance so source design, owner PRD, planned work, evidence, and W/R coordinate remain traceable through existing metadata and body links.
- [ ] t23: Confirm that `source`, `follow_on`, `coordinate`, and relationship fields carry provenance only where current contracts allow them.
- [ ] t24: Confirm that the router does not make an optional Skill mandatory.

### Acceptance criteria

- Agents can discover the standard at each applicable lifecycle entry point.
- Prompts and routers point to authority instead of becoming copies of it.
- User-owned text survives router creation and update.
- Handoffs preserve source, owner, work, evidence, and coordinate trace.
- No new Human Experience metadata schema appears.
- No optional Skill becomes required for correct Make Docs use.

### Dependencies

- Stage 2 settled propagation rules.
- Existing managed-block and router-preservation behavior.

## Stage 4: Prospective Adoption and Propagation Fixtures

### Tasks

- [ ] t25: Implement prospective rules so new designs use the section after activation and substantial updates use it when they claim the new contract version.
- [ ] t26: Keep historical designs readable without a repository-wide rewrite.
- [ ] t27: Preserve modified project-owned files and user-owned router text during update.
- [ ] t28: Add a direct fixture that traces one promise from design to PRD, work, required Human Experience Review conclusion, and supporting evidence.
- [ ] t29: Add an indirect fixture that traces a measurable reliability, wait, cost, or risk effect through the same authorities.
- [ ] t30: Add a none fixture that preserves its human boundary without invented interaction.
- [ ] t31: Add a deferred fixture that creates or links a durable obligation only when the owner accepts a future outcome that remains owed. Include its owner, trigger, coordinate, and remaining evidence.
- [ ] t32: Add a negative fixture in which copied fields exist but the human goal or evidence link is lost.

### Acceptance criteria

- New and qualifying changed designs adopt the standard.
- Historical documents remain valid and readable.
- Direct and indirect promises can be traced to a built surface and proof.
- None remains a reasoned boundary decision and not an escape from human impact.
- A copied checklist with lost meaning fails review even when its fields are complete.
- Modified user and project content is preserved.

### Dependencies

- Stages 1 through 3.

## Stage 5: Review, Validation, and Phase Closeout

### Tasks

- [ ] t33: Run focused template, prompt, router, managed-block, update, and propagation tests.
- [ ] t34: Run instruction-router validation and confirm one valid managed block with preserved surrounding text.
- [ ] t35: Apply required Human Experience Review to every applicable promise in the direct and indirect propagation fixtures. Record a clear conclusion for each promise.
- [ ] t36: Confirm that generated work records current decisions for Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing. Confirm that Human Experience Review remains a required acceptance lens and not a fifth testing type.
- [ ] t37: Give each material finding a disposition. Remediate it, accept a bounded caveat or narrower claim, or record partial status. Use PRD 45 only when an accepted future outcome remains owed.
- [ ] t38: Record Phase 3 requirement dispositions and capability status with evidence.

### Acceptance criteria

- The complete trace retains the original reason that technical success can still produce an opaque human result.
- A later agent can find the intended person, goal, promise, surface, proof, and next action without reconstructing the internal system model.
- Routers, prompts, and templates remain small and point to one authority.
- Prospective adoption works without forced historical rewrites.
- No unowned material propagation finding remains.
- Phase 4 receives stable candidates, evidence inputs, and finding routes.

### Dependencies

- Stages 1 through 4.

### Closeout Notes

- Testing decision(s): Record the four PRD 50 testing decisions. Apply Human Experience Review to applicable promises by reusing suitable evidence. Phase 4 owns the conditional Unassisted Goal Testing decision.
- Phase / capability status: Record the Phase 3 status and evidence before Phase 4 starts.
