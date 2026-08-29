---
title: "Phase 2: Contract, Reference, and Design Entry"
kind: "work"
status: "active"
coordinate: "W20 R0 P2"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 2: Contract, Reference, and Design Entry

## Purpose

Create one canonical rule, one useful interpretation reference, and one small design entry point.

## Overview

The standard must help agents protect human understanding while they solve complex technical problems. It must not become a large copied checklist. This phase puts the universal policy in one contract. It puts adaptable guidance and examples in one reference. It makes each affected design state a local human goal, observable promises, hidden complexity, and required evidence.

The conditional section is necessary but not sufficient. Structural validation can prove that the right form exists. It cannot prove that a result is beautiful, intuitive, coherent, or joyful. Later phases must inspect the built human path.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: Apply the `R-033` control that field presence cannot replace a coherent human result.
- Obligations: None active at phase start. Create an `O-###` record only for an accepted deferral.
- Unassisted Goal Testing: `not-needed-now` in this phase. Phase 4 decides whether one bounded scenario can answer a material current uncertainty.
- Findings: Structural or interpretation defects found here remain open until fixed or given durable ownership.

## Stage 1: Canonical Upstream Resources

### Tasks

- [ ] t1: Add `packages/docs/template/.make-docs/contracts/system/human-experience-contract.md` as the sole normative source for the Human Experience Standard.
- [ ] t2: Define `direct`, `indirect`, and `none`, the conditional section forms, field order, design position, lifecycle propagation, evidence levels, validation limits, and prospective activation in the contract.
- [ ] t3: Add `packages/docs/template/.make-docs/references/system/human-experience.md` with adaptable guidance for commands, interfaces, documents, APIs, workflows, file trees, and indirect effects.
- [ ] t4: Add examples and counterexamples for orientation, continuity, meaning, information amount, next action, recovery, control, terminology, human-and-machine separation, and valid `none` cases.
- [ ] t5: Review the reference to ensure that it explains the contract without adding a second policy source.

### Acceptance criteria

- One contract owns the universal standard.
- One reference helps agents apply the standard across different product types.
- The resources protect the human result without reducing it to style, preference, or field presence.
- Direct, indirect, and none cases are clear and mutually usable.
- The reference does not claim that an agent can certify a person's lived experience.

### Dependencies

- Phase 1 authority and requirement trace.

## Stage 2: Design Contract, Template, Workflow, and Prompt

### Tasks

- [ ] t6: Update the upstream design contract so each activated design has exactly one `## Human Experience Intent` section after `## Context` and before `## Decision`.
- [ ] t7: Update the upstream design template with the direct or indirect fields: `Impact`, `Affected humans`, `Human goal or effect`, `Experience promises`, `Complexity kept out of the human path`, and `Evidence required`.
- [ ] t8: Add the short `none` form with `Impact`, `Reason`, `Preserved experience`, and `Evidence required`.
- [ ] t9: Update the design workflow so the agent evaluates the change's human effect, not the fact that a person can read the design document.
- [ ] t10: Update the request-to-design prompt so the agent resolves Persona or human roles, states the goal before implementation detail, states observable promises, and stops for a missing product choice.
- [ ] t11: Keep Human Experience data in the document body. Do not add first-release frontmatter fields.
- [ ] t12: Add direct, indirect, none, misleading headless or agent-facing, and missing-product-choice examples to the design-generation fixture set.

### Acceptance criteria

- The section has one stable position and one valid conditional form.
- A direct or indirect design starts with the person or material human effect and not the internal data model.
- A valid none design names the preserved experience and boundary proof without invented interaction.
- The prompt can stop when authority does not support a coherent human path.
- The section remains useful context for later plan, PRD, work, review, and acceptance work.

### Dependencies

- Stage 1 canonical resources.

## Stage 3: Structural Validation and Fixtures

### Tasks

- [ ] t13: Extend the current document-validation owner around `validateGeneratedDocumentMetadata` or add the smallest dedicated design-body validator if separation is clearer.
- [ ] t14: Validate one section in the required position, one allowed impact value, the correct conditional fields, duplicate sections, empty values, and unresolved template placeholders.
- [ ] t15: Implement prospective activation so pre-activation historical designs remain readable and valid.
- [ ] t16: Add passing fixtures for direct, indirect, none, and historical cases.
- [ ] t17: Add failing fixtures for missing fields, invalid impact, duplicate section, wrong section order, unresolved placeholder, and a misleading `none` claim with a material human effect.
- [ ] t18: Ensure validator messages state structural facts and useful recovery. Do not report that a design is beautiful, intuitive, joyful, or coherent.
- [ ] t19: Add focused tests for all validator outcomes and for compatibility with existing document metadata validation.

### Acceptance criteria

- Valid conditional forms pass and invalid forms fail with clear recovery.
- Historical designs do not fail only because they predate activation.
- A headless or agent-facing label does not make a real human effect disappear.
- Structural checks do not claim to judge the quality of the lived experience.
- The original failure can still be found later even when every required field is present.

### Dependencies

- Stage 2 settled section form.
- Current document-validation preflight from Phase 1.

## Stage 4: Catalog, Rules, Stable URIs, and Projection

### Tasks

- [ ] t20: Add the contract and reference to `packages/docs/template/.make-docs/system-resources.catalog.json` with stable URIs `make-docs://system/contract/human-experience-contract.md` and `make-docs://system/reference/human-experience.md`.
- [ ] t21: Update `packages/cli/src/rules.ts` so applicable install profiles include the new resource paths without creating a new resource family.
- [ ] t22: Verify `packages/cli/src/tool-directory.ts`, provider catalog validation, and resource resolution accept and discover the new files through existing system-resource behavior.
- [ ] t23: Extend resource-provider, resolver, operation-surface, consistency, and template-link tests for list and read behavior, stable identity, local paths, and offline use.
- [ ] t24: Update manifest and package-projection expectations through the supported generation path. Do not hand-author generated manifest state.
- [ ] t25: Project the reviewed upstream files into the repository dogfood instance only after upstream tests pass.
- [ ] t26: Verify upstream, package projection, and dogfood parity under the current source-of-truth contract.

### Acceptance criteria

- Supported agents can discover and read both stable URIs.
- The existing contract and reference resource types remain sufficient.
- Profile selection, provider inventory, resolution, manifest, and template links agree.
- Dogfood files derive from reviewed upstream authority.
- No project-owned content is treated as upstream source.

### Dependencies

- Stages 1 through 3.

## Stage 5: Review, Validation, and Phase Closeout

### Tasks

- [ ] t27: Run focused contract, template, validator, catalog, resource, consistency, and link tests.
- [ ] t28: Run the current `npm run validate:defaults` command and record the result.
- [ ] t29: Review direct, indirect, none, misleading, and historical fixtures against PRD 49 and the canonical contract.
- [ ] t30: Apply required Human Experience Review to the design-entry promises. Reuse the fixture and validator evidence. Record `satisfied`, `material gap`, or `insufficient evidence` for each applicable promise.
- [ ] t31: Give each material finding a disposition. Remediate and repeat affected proof, accept a bounded caveat or narrower claim, or record partial status. Create a durable obligation only when an accepted future outcome remains owed.
- [ ] t32: Record Phase 2 requirement dispositions and capability status with evidence.

### Acceptance criteria

- The contract is normative, and the reference remains explanatory.
- The template and validator agree on position, impact values, conditional fields, and activation.
- Stable URIs work through supported resource access.
- The entry keeps the human goal and promises visible without forcing internal complexity into the normal path.
- A complete section is not accepted as proof that the final human result is good.
- Phase 3 receives stable resources and no unresolved material finding.

### Dependencies

- Stages 1 through 4.

### Closeout Notes

- Testing decision(s): Use focused Automated Implementation Testing. Keep Performance Testing, Guided Progress Review, and Unassisted Goal Testing `not-needed-now`. Record Human Experience Review conclusions without creating a fifth testing type or duplicate verdict.
- Phase / capability status: Record the Phase 2 status and evidence before Phase 3 starts.
