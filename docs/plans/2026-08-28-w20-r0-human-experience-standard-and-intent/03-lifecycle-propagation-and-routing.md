---
title: "W20 R0 Phase 3 Lifecycle Propagation and Routing"
kind: "plan"
status: "draft"
coordinate: "W20 R0 P3"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md"
---

# W20 R0 Phase 3: Lifecycle Propagation and Routing

## Purpose

Keep the human reason visible from design through acceptance.

This phase prevents later documents from preserving only technical requirements while losing the intended human result.

## Sources

- [Plan overview](00-overview.md)
- [Phase 1](01-prd-authority-and-requirement-trace.md)
- [Phase 2](02-contract-reference-and-design-entry.md)
- Approved PRDs 14, 15, 23, 46, 47, 49, and 50

## Preconditions

- The Human Experience Contract and Reference have stable names and fields.
- The design entry point and prospective activation rule are settled.
- PRD owners and lifecycle boundaries are approved.

## Lifecycle Lens

Update the lifecycle reference so Human Experience is a cross-cutting lens. Do not add a new linear stage.

The lens must apply as follows:

| Lifecycle point | Required action |
| --- | --- |
| Design | Record impact and local intent before product and architecture decisions. |
| Plan | Map each promise to PRD owner, product or resource surface, work phase, evidence source or selected testing type, and durable deferral. |
| PRD | Put observable normative requirements in the owning current PRD. |
| Work backlog | Trace tasks and acceptance to current PRDs and applicable promises. |
| Implementation | Preserve technical correctness and the intended human path. |
| Review | Inspect the real human surface for direct impact. |
| Coverage and acceptance | Apply required Human Experience Review to each applicable promise. Reuse suitable evidence and select the smallest added testing activity only when evidence is insufficient. |
| Release | Bound claims to tested human paths and evidence. |
| Retrospective | Feed repeatable lessons into the contract, reference, or owning PRD. |

## Planning Propagation

Update planning references and templates.

Every baseline or change plan with direct or indirect impact must map local experience promises to:

- current or planned PRD authority;
- the planned system resource, product surface, or project artifact;
- a work phase;
- an evidence source or selected testing type;
- a durable obligation when work is deferred.

Plans must not repeat the complete design intent in every phase. They must preserve enough context to prevent the backlog from treating the change as a technical checklist.

For `none`, the plan must confirm the preserved human boundary and the proof that it remains unchanged.

## PRD Propagation

Update PRD generation and change-management guidance.

- Put current experience requirements in the PRD that owns the product capability.
- Use observable outcomes and boundaries.
- Link to PRD 49 instead of copying the universal standard.
- Do not create editorial experience PRDs.
- Do not add experience frontmatter fields.
- Add requirement history only for material replacement or boundary change.

## Work Backlog Propagation

Update work-index and work-phase guidance and templates.

Each applicable phase must:

- cite current PRD requirements;
- state the intended human outcome for the phase;
- identify the human-facing or indirect product surface;
- include implementation and acceptance tasks;
- state the evidence source or selected testing type and executor;
- route accepted deferral through the existing obligation contract;
- avoid vague criteria such as `UX is good`, `easy to use`, or `intuitive`.

Acceptance criteria must be observable. Examples include whether a person can identify the current subject, understand a relationship, distinguish state, find the next action, recover from an error, or complete a goal without learning internal identifiers.

## Router Integration

Update only the managed router blocks that own discovery for designs, plans, PRDs, work, coverage, and testing.

Each pointer must be short. It must state when the contract applies and how to resolve it. It must not copy the canonical standard, conditional forms, or examples.

Managed updates must preserve user-owned text. The router must not make an optional Skill mandatory.

## Prompt Integration

Update the smallest prompt set that creates or transforms affected artifacts:

- request to design;
- design to baseline plan;
- design to change plan;
- plan to PRD generation and PRD maintenance;
- PRD to full or delta work backlog;
- W20 lifecycle and consumer links to current testing authority.

W21 owns shared testing prompts, testing contracts, and facilitator behavior. W20 must not create a second testing model.

Prompts must tell agents to read the governing resources. They must not restate the full policy.

## Metadata And Handoff Boundary

Update handoff guidance so the source design, owning PRD, planned work, evidence, and W/R coordinate remain traceable.

The first release must not add new Human Experience Intent fields to frontmatter. The body remains authority. Existing `source`, `follow_on`, `coordinate`, and relationship fields carry provenance and routing only when their current contract permits them.

## Prospective Adoption

- New generated designs use the section after activation.
- Substantial design updates use the section when they claim the new contract version.
- Historical designs remain readable and valid.
- Existing projects adopt the standard at the first qualifying change.
- Modified project-owned files are not overwritten.
- No repository-wide rewrite is required.

## Acceptance

- The lifecycle shows one cross-cutting lens and no new stage.
- A fixture traces one direct promise from design to PRD, work, review, and evidence.
- A fixture traces one indirect effect through the same authorities.
- A valid none fixture preserves its human boundary without invented interaction.
- The backlog templates require observable acceptance.
- Deferred experience work cannot disappear from authority.
- Router text stays short and resolves to the contract and reference.
- User-owned router text survives update.
- No first-version metadata schema is added.
- No copied standard appears across prompts and routers.

## Handoff

Phase 4 uses the settled lifecycle trace to apply required Human Experience Review and record proportionate testing decisions. It must inspect the real product path, not only the document chain.
