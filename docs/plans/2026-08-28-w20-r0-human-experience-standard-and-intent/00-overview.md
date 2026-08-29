---
title: "W20 R0 Human Experience Standard and Intent"
kind: "plan"
status: "draft"
coordinate: "W20 R0"
source:
  type: "design"
  path: "docs/designs/2026-08-28-human-experience-standard-and-intent.md"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "The Human Experience Standard must become current product authority before implementation work changes contracts, templates, lifecycle routing, validation, or installed projects."
  coordinate_handoff: "Carry W20 R0 into maintained PRD requirement history, source links, and one downstream W20 R0 delta backlog."
---

# W20 R0 Human Experience Standard and Intent

> In v2, plans are directories. This file is the `00-overview.md` entry point. Phase detail lives in the numbered files beside it.

**Date:** 2026-08-28

**Repository:** `make-docs`

**Purpose:** Produce a reviewable authority-maintenance plan that makes human understanding and a good human experience a normal Make Docs product requirement.

## Purpose

Make Docs helps people and agents organize difficult work. It preserves facts, choices, requirements, plans, evidence, and gates. This is a major product strength.

The same strength can produce a serious failure. An agent can build a result that is technically correct and complete, but hard for a person to understand or use. The agent can expose records, fields, identifiers, states, and internal relationships because those items are easy to state and prove. The result can function while the human remains unsure about meaning, continuity, current state, or the next useful action.

This failure is not limited to a command-line interface. It can occur in a graphical interface, document, report, API, SDK, workflow, error message, configuration file, or project directory. It can also occur in a system that has no direct interface but changes a person's wait, risk, cost, privacy, recovery, or confidence.

Current Make Docs authority can tell an agent what to build and what evidence to keep. It can identify the audience through Personas. The W21 design and PRDs 46 and 50 now define four testing types and their selection rules. Make Docs does not yet give every agent one shared rule for the quality of the human experience.

This plan closes that gap. It keeps the solution small. It adds one durable standard, one local design interpretation, lifecycle trace, and proof that fits the actual human effect.

## Objective

Make the accepted [Human Experience Standard and Intent design](../../designs/2026-08-28-human-experience-standard-and-intent.md) decision-complete for PRD maintenance and later backlog generation.

The resulting authority must let an owner state one durable expectation for human quality. An agent must then apply that expectation to the product, audience, and work at hand. The owner must not need to provide a separate usability checklist for every technology.

The plan must preserve these outcomes through the later PRD and backlog gates:

- Human goals and effects shape product decisions before implementation begins.
- The normal human path shows meaning, relationships, state, next actions, and recovery when they matter.
- Internal complexity remains available without becoming required human knowledge.
- Technical correctness remains necessary but is not treated as sufficient proof of a good human result.
- Machine-readable surfaces remain exact and complete.
- Human-readable surfaces are shaped for human goals instead of mirroring the machine contract.
- Work with no human effect receives a short, evidence-backed `none` result instead of an invented user flow.
- Agents use judgment. They do not satisfy the standard through keywords or a score.

## Governing Invariant

Every human-facing result must help a person complete a real goal without needless thought, effort, or doubt. The normal path must preserve context, reveal meaning and relationships, make state and next actions clear, and hide internal detail until it is useful. A person must not need to understand the system's internal model. Agents must shape a coherent experience, not merely expose correct capabilities. Work is not complete until proportionate evidence shows that the intended human remains oriented, capable, and in control.

This invariant applies across technologies. It does not prescribe one interface, visual style, information layout, command grammar, or aesthetic.

## Coordinate Decision

Use `W20 R0`.

The accepted design does not revise a prior W/R initiative. It creates a new product-wide capability and a new primary PRD. The highest active plan wave is W19. Under the wave model, a new end-to-end initiative increments the wave and starts at revision zero.

The downstream PRD maintenance and delta backlog must carry W20 R0 in source links and requirement-history entries. Product PRD filenames and titles remain free of W/R coordinates.

## 2026-08-28 W21 Testing Alignment

This plan keeps the W20 R0 coordinate and all downstream task IDs. The W21 testing design, plan, and reconciled PRDs refine the testing authority that W20 must use. They do not replace the W20 Human Experience capability.

W20 owns Human Experience Intent, propagation, and required Human Experience Review. W21 owns the four testing types, selection, scope, executor, cost, stop rules, evidence reuse, and gate effect. Human Experience Review is required acceptance work. It is not a fifth testing type and does not require a duplicate test verdict.

The W20 design remains unchanged. This plan and the W20 backlog record the later testing authority. After both backlogs are ready, implement W20 first. Then implement W21 against the Human Experience capability that W20 supplies.

## Change Classification

This is authoritative PRD maintenance with one genuinely new product capability.

- Create one new product-authority PRD.
- Update seven existing PRD owners.
- Update the PRD index.
- Add one current rebuild risk to the canonical risk register.
- Keep all other subsystem PRDs unchanged until they are created or materially updated for another reason.
- Generate one scoped W20 R0 delta backlog after the PRD set is approved.
- Do not regenerate the full PRD set or the full work backlog.
- Do not archive or renumber existing PRDs.

## Maintenance Inputs

Primary authority:

- [Human Experience Standard and Intent design](../../designs/2026-08-28-human-experience-standard-and-intent.md)

Current product owners:

- [00 Make Docs PRD Index](../../prd/00-index.md)
- [01 Product Overview](../../prd/01-product-overview.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [15 Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [23 Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [46 Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [47 Persona Model](../../prd/47-persona-model.md)
- [49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

Later testing authority:

- [Proportionate Testing and Human-Centered Validation design](../../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- [W21 R0 Proportionate Testing and Human-Centered Validation plan](../2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

Required system authority:

- `.make-docs/contracts/system/design-contract.md`
- `.make-docs/contracts/system/output-contract.md`
- `.make-docs/contracts/system/coverage-pass-contract.md`
- `.make-docs/contracts/system/naive-uat-contract.md`
- `.make-docs/references/system/lifecycle.md`
- `.make-docs/references/system/design-workflow.md`
- `.make-docs/references/system/planning-workflow.md`
- `.make-docs/references/system/prd-change-management.md`
- `.make-docs/references/system/execution-workflow.md`
- the design, plan, PRD, work, coverage, and UAT templates and prompts that route these authorities

Delivery authority:

- [Template package and dogfood source-of-truth contract](../../designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Make Docs v2 product boundary and migration recovery](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Background and Justification

The enhancement exists because a correct internal model is not the same as a coherent human experience.

A human normally approaches a tool with a goal. The person needs the tool to reveal the meaning that supports that goal. The system may need long identifiers, revision chains, receipts, schemas, confidence records, and other exact data. Those details can remain valuable. They must not automatically become the primary human presentation.

Without shared authority, each feature must rediscover this rule. The owner must repeatedly explain that output should show continuity, relationships, useful state, and the next action. Agents can still interpret those requests as local polish. Later phases can remove or weaken them because the PRD and backlog preserve only technical behavior.

The design therefore treats human experience as product authority. It starts during design. It becomes observable requirements in the owning PRDs. It shapes work acceptance. It receives required Human Experience Review against each applicable promise. That review uses suitable existing evidence and invokes the smallest needed testing activity only when the evidence is insufficient.

The design also avoids a large policy system. The first release has one contract, one reference, one conditional design section, lifecycle propagation, router pointers, structural checks, and real-use proof. It does not add a generic workflow engine, mandatory Skill, numerical score, repository-wide migration, or agent-only certification.

## Human Experience Through-Line

The plan must carry the accepted design promises without copying the full design section into each phase.

| Experience promise | PRD authority | Planned surface | Work phase | Required proof |
| --- | --- | --- | --- | --- |
| One short and memorable shared standard | New PRD 49 | Human Experience Contract and Reference | [Phase 2](02-contract-reference-and-design-entry.md) | Contract review and agent interpretation examples |
| Every design records `direct`, `indirect`, or `none` | New PRD 49, PRD 06, PRD 14 | Design contract, template, workflow, prompt, and validator | [Phase 2](02-contract-reference-and-design-entry.md) | Valid and invalid fixture coverage |
| Direct and indirect work states the human goal or effect before implementation detail | New PRD 49 and PRD 14 | Design and planning flow | [Phase 2](02-contract-reference-and-design-entry.md) and [Phase 3](03-lifecycle-propagation-and-routing.md) | Generated-design and plan trace review |
| Valid `none` stays brief and does not invent interaction | New PRD 49 and PRD 14 | Conditional design form and coverage routing | [Phase 2](02-contract-reference-and-design-entry.md) and [Phase 4](04-evidence-review-and-acceptance.md) | Headless and internal-slice fixtures |
| Intent remains visible from design through acceptance | New PRD 49, PRD 14, and PRD 23 | Plan, PRD, work, review, handoff, and history guidance | [Phase 3](03-lifecycle-propagation-and-routing.md) | Cross-artifact trace fixture |
| Machine detail remains available without dominating the human path | New PRD 49 and PRD 01 | Product-specific human and machine presentation boundary | [Phase 3](03-lifecycle-propagation-and-routing.md) | One realistic human and machine dual-surface example |
| The owner can see the source intent, owning requirement, planned work, and acceptance evidence | New PRD 49 and PRD 14 | Source links, plan mapping, backlog trace, and review records | [Phase 3](03-lifecycle-propagation-and-routing.md) and [Phase 4](04-evidence-review-and-acceptance.md) | End-to-end trace audit |
| Human review evaluates the real surface when a direct path exists | PRD 49, PRD 14, PRD 46, and PRD 50 | Required Human Experience Review with proportionate testing support | [Phase 4](04-evidence-review-and-acceptance.md) | One acceptance conclusion per applicable promise, with reused real-surface evidence |
| Routers point to authority without copying it | PRD 15 | Managed router blocks | [Phase 3](03-lifecycle-propagation-and-routing.md) | Router brevity, resolution, and preservation tests |
| Existing projects adopt the standard safely and prospectively | New PRD 49, PRD 06, and PRD 46 | Install, update, dogfood, and activation rules | [Phase 5](05-delivery-conformance-and-delta-handoff.md) | Clean install, update, modified-file preservation, and adoption fixtures |

## Original Authority Baseline At Plan Creation

This section records why the plan was created. PRDs 49 and 50 and the revised PRD 46 now replace its earlier testing interpretation.

The active PRD set has no product-wide Human Experience Standard.

- PRD 01 describes the product, users, capabilities, and system boundaries. It does not state human experience as a product quality boundary.
- PRD 06 owns template contracts, generated assets, upstream mutation order, package projection, and dogfood. It does not own Human Experience Contract or Reference resources.
- PRD 14 owns lifecycle workflow and coverage passes. It does not make human intent a cross-cutting lifecycle lens or define Human Experience Review.
- PRD 15 owns router and managed-block behavior. It does not route agents to a human experience authority.
- PRD 23 owns frontmatter and lifecycle handoffs. It does not state that Human Experience Intent is body authority and adds no first-version metadata fields.
- At plan creation, PRD 46 owned qualified naive UAT. It did not consume experience promises as scenario inputs. Current PRDs 46 and 50 replace that earlier testing model.
- PRD 47 owns Personas. It identifies who receives an experience. It does not define the quality or goal of that experience.
- The current risk register does not name the risk that structural compliance can replace human judgment.

## Candidate Decision Matrix

| Candidate requirement | Decision | Owning authority | Reason |
| --- | --- | --- | --- |
| Canonical Human Experience Standard | `create` | New PRD 49 | This is a coherent new product capability with no current owner. |
| `direct`, `indirect`, and `none` impact meanings | `create` | New PRD 49 | The values form part of the new capability contract. |
| Conditional `Human Experience Intent` section | `create` | New PRD 49 | The new PRD owns its meaning and stable body form. |
| Product-wide human quality boundary | `update-existing` | PRD 01 | Product overview owns product capabilities and boundaries. |
| New contract and reference resource delivery | `update-existing` | PRD 06 | PRD 06 owns shipped templates, mutation order, projection, dogfood, and parity. |
| Cross-cutting lifecycle propagation | `update-existing` | PRD 14 | PRD 14 owns lifecycle stages, coverage candidates, phase state, and close rules. |
| Router discovery and managed-block pointer | `update-existing` | PRD 15 | PRD 15 owns agent instruction routing and safe managed updates. |
| Body authority with no first-version frontmatter keys | `update-existing` | PRD 23 | PRD 23 owns generated metadata and handoff boundaries. |
| Experience promises as conditional Unassisted Goal Testing inputs | `update-existing` | PRD 46 | PRD 46 owns qualified human execution, unassisted public goals, evidence, findings, and advisory results. |
| Persona-to-affected-human link | `update-existing` | PRD 47 | PRD 47 owns Persona identity and selection, but not experience quality. |
| PRD navigation for the new authority | `link-only` | PRD 00 | The index must expose the new current product authority and related owners. |
| Checklist-compliance risk | `update-existing` | PRD 03 | This is a real rebuild risk with a defined mitigation and acceptance consequence. |
| First-version metadata schema for experience intent | `none` | PRD 23 and PRD 49 | The design keeps the section in the document body. |
| Mandatory human experience Skill | `none` | PRD 49 | A Skill remains optional and subordinate to the contract. |
| Numerical experience score | `none` | PRD 49 | A score would reward keyword compliance and claim more than it can prove. |
| Full active-PRD migration | `none` | New PRD 49 | Adoption is prospective. Existing documents remain valid until qualifying change. |
| Full backlog regeneration | `none` | This plan | A scoped W20 R0 delta backlog is sufficient. |

## Existing PRDs To Update

### PRD 01: Product Overview

Update `Purpose`, `Key Capabilities`, `System Boundaries`, and `Current Limitations`.

- State that Make Docs preserves technical rigor while also requiring coherent human outcomes.
- Add the Human Experience Standard as a key capability.
- State that correct machine contracts do not define the default human presentation.
- Add the current limitation that the capability is prospective and cannot certify beauty or intuition through structure alone.
- Add one W20 R0 requirement-history entry for the product boundary change.

### PRD 06: Template Contracts and Generated Assets

Update `Component and Capability Map`, `Template Ownership and Mutation Order`, `Contracts and Data`, `Integrations`, `Reference`, `Template Source Authority`, and `Requirement History`.

- Add Human Experience Contract and Human Experience Reference as peer system resources.
- Add the changed design, plan, PRD, work, coverage, and UAT resources to the owned delivery surface.
- Preserve the W19 R1 stable URI and optional-projection model.
- Require upstream-first authoring in `packages/docs/template/`.
- Require package projection, affected dogfood reseed, and installed-package proof.
- Add one W20 R0 requirement-history entry for the new resource family and delivery scope.

### PRD 14: Lifecycle Workflow and Coverage Passes

Update `Purpose`, `Scope`, `Component and Capability Map`, `Requirements`, `Contracts and Data`, `Integrations`, `Phase-Close Obligation and UAT Gates`, and `Requirement History`.

- Add Human Experience as a cross-cutting lifecycle lens, not a new linear stage.
- Require the plan to map promises to PRD owner, planned surface, work phase, evidence source or selected testing type, and durable deferral.
- Require work acceptance to use observable human outcomes.
- Require Human Experience Review against every applicable promise and record `satisfied`, `material gap`, or `insufficient evidence`.
- Keep Human Experience Review as an acceptance lens over suitable evidence. Do not create a fifth testing type or a duplicate verdict.
- Use PRD 50 to select the smallest additional testing activity when evidence is insufficient.
- Require direct-impact review to inspect the real human surface.
- Add one W20 R0 requirement-history entry for lifecycle and coverage expansion.

### PRD 15: Agent Instruction Ownership and Managed Blocks

Update `Component and Capability Map`, `Requirements`, `Initialization and Adoption Safety`, `Integrations`, and `Requirement History`.

- Add short router pointers that tell agents when to read the Human Experience Contract and Reference.
- Keep the complete standard out of router files.
- Preserve user-owned text during managed-block updates.
- Do not make a Skill or router a second source of authority.
- Add one W20 R0 requirement-history entry for router discovery.

### PRD 23: Generated Document Metadata and Lifecycle Handoffs

Update `Conditional Fields`, `Handoff Metadata`, `Configuration Boundary`, `Non-Requirements`, `Acceptance Criteria`, `Integrations`, and `Requirement History`.

- State that Human Experience Intent is body authority in the first version.
- Do not add `impact`, `affected_humans`, experience promises, or evidence fields to YAML frontmatter.
- Require handoffs to preserve source links and W/R lineage without copying the full intent block.
- Prevent configuration overlays from renaming the canonical body fields or impact values.
- Add one W20 R0 requirement-history entry for the body-versus-metadata boundary.

### PRD 46: Unassisted Goal Testing

Update `Component and Capability Map`, `R-NUAT-MODES`, `R-NUAT-GOAL`, `R-NUAT-SCENARIO`, `R-NUAT-EVIDENCE`, `R-NUAT-COVERAGE`, `R-NUAT-GATE`, `R-NUAT-COMPAT`, `Integrations`, and `Requirement History`.

- Allow applicable experience promises to shape one realistic public goal and its observation points when a material current uncertainty remains.
- Keep Unassisted Goal Testing conditional and advisory unless explicit current authority assigns a blocking effect.
- Preserve the qualified human executor, installed or public path, anti-coaching, finding, and reproducibility rules.
- Require each material finding to receive a disposition. Create a durable obligation only when an accepted future outcome is owed.
- Preserve prospective adoption and valid `not-needed-now` decisions.
- Add one W20 R0 requirement-history entry for the new scenario input and review relationship.

### PRD 47: Persona Model

Update `Scope`, `Component and Capability Map`, `Requirements`, `Configuration and Metadata Boundary`, `Integrations`, and `Requirement History`.

- State that Persona selection can identify `Affected humans`.
- State that Persona answers who, while Human Experience Intent answers the goal, effect, promises, hidden complexity, and proof.
- Do not change the Persona schema, primitives, frontmatter, or testing path rules.
- Add one W20 R0 requirement-history entry for the cross-authority relationship.

## Genuinely New Product PRD

Create `docs/prd/49-human-experience-standard-and-intent.md`.

Use the title `49 Human Experience Standard and Intent` and the product-oriented kind `capability` in the PRD index.

The new PRD must own:

- purpose, scope, terms, and non-goals;
- the canonical Human Experience Standard;
- direct, indirect, and none impact classification;
- the exact conditional Human Experience Intent body contract;
- universal principles for orientation, continuity, meaning, information amount, next action, recovery, and human control;
- the human-versus-machine presentation boundary;
- the distinct roles of Persona, specialist review, the four testing types, and required Human Experience Review;
- lifecycle propagation from design through release and retrospective;
- evidence levels and agent self-certification limits;
- structural validation limits;
- optional and subordinate Skill behavior;
- prospective adoption and compatibility;
- acceptance scenarios and source anchors.

The new PRD must not describe an editorial operation. It must describe the current product capability.

## Requirement History Entries

Add one dated `2026-08-28 — W20 R0` entry to each materially updated PRD.

Each entry must state the affected section, previous contract, replacement contract, rationale, and source link to this plan or its governing design. The updated normative body remains authoritative.

Do not add a requirement-history entry to the new PRD solely to describe its creation. Do not use history to carry unresolved risk.

## Affected Links, Risks, Plans, And Work

### PRD index

Update `docs/prd/00-index.md`.

- Add PRD 49 to reading order where human experience and lifecycle authority can be found early enough to shape product work.
- Add PRD 49 to the document map as a current capability.
- Link PRD 49 to PRDs 01, 06, 14, 15, 23, 46, and 47.
- Add the governing design and this plan to source anchors.
- Keep editorial language out of the product kind and focus fields.

### Risk register

Add the next available rebuild risk as `R-033 Human Experience Structure Could Become Checklist Compliance`.

The risk must state that an agent or validator can produce the required fields without producing a coherent human path. The mitigation must keep structural checks narrow, require observable promises and failure-revealing evidence, inspect the real human surface for direct impact, and forbid agent-only certification of beauty, intuition, or joy.

No new open question is required. The accepted design resolves the first-release policy choices.

### Downstream work

After PRD approval, create one delta backlog at:

`docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/`

The backlog must cite current PRD authority. It must preserve the five plan phases unless later PRD maintenance reveals a real dependency that requires a split. It must not create a full replacement backlog.

## Repo Summary And Execution Mode

This repository is both the Make Docs maintainer source and a dogfood project.

- Product system resources are authored upstream in `packages/docs/template/`.
- The repository root `.make-docs/` and `docs/` system assets are downstream dogfood projections.
- Project designs, plans, PRDs, work backlogs, and history remain project-owned and are edited in place.
- PRD generation is the next authorized operation after this plan is accepted.
- Implementation is not authorized by plan or PRD approval.
- Later execution should use disjoint worker scopes when delegation is available.
- The coordinator must not write product files when delegated workers are available.

## Output Contract

PRD-generation output:

- new `docs/prd/49-human-experience-standard-and-intent.md`;
- bounded updates to PRDs 01, 06, 14, 15, 23, 46, and 47;
- navigation updates to PRD 00;
- risk `R-033` in PRD 03;
- W20 R0 requirement-history entries in each materially updated owner;
- resolving relative links across all affected PRDs;
- no implementation files, system-resource changes, dogfood reseed, or backlog during the PRD-only gate.

Later delta-backlog output:

- one `00-index.md`;
- one phase file for each of the five phases in this bundle;
- ordinal task IDs across each phase file;
- acceptance criteria tied to current PRD requirements and observable results;
- explicit human-review, UAT, automated, delivery, and conformance evidence tasks;
- durable obligation routing for any accepted deferral;
- no generic criterion such as `UX is good` or `the experience is intuitive`.

## Phase Map

| Phase | File | Outcome | Primary dependency |
| --- | --- | --- | --- |
| 1 | [PRD Authority and Requirement Trace](01-prd-authority-and-requirement-trace.md) | Establish the new PRD and bounded owner updates before implementation. | Plan acceptance |
| 2 | [Contract, Reference, and Design Entry](02-contract-reference-and-design-entry.md) | Add the canonical resources and the conditional design entry point. | Approved PRDs |
| 3 | [Lifecycle Propagation and Routing](03-lifecycle-propagation-and-routing.md) | Carry intent through plans, PRDs, work, review, routers, and handoffs. | Phase 2 authority |
| 4 | [Evidence, Review, and Acceptance](04-evidence-review-and-acceptance.md) | Apply required Human Experience Review and select only proportionate testing needed for current decisions. | Phases 2 and 3 |
| 5 | [Delivery, Conformance, and Delta Handoff](05-delivery-conformance-and-delta-handoff.md) | Prove package, dogfood, installed-project, agent, and human outcomes and close the delta. | Phases 2 through 4 |

## Worker Ownership

The saved plan defines roles, not harness-specific agent names.

| Workstream | Write scope | Dependency | Merge order |
| --- | --- | --- | --- |
| PRD authority worker | New PRD 49 and PRDs 01, 06, 14, 15, 23, 46, and 47 | Accepted plan | First |
| Shared-authority assembly worker | PRD 00, PRD 03, cross-links, history shape, and source anchors | PRD authority draft | Second |
| Contract and template worker | Upstream contract, reference, design, and validation resources | Approved PRDs | After PRD gate |
| Lifecycle and routing worker | Planning, PRD, work, review, prompts, and router resources | Contract names and stable fields | After Phase 2 authority |
| Evidence worker | Required Human Experience Review, proportionate testing decisions, fixtures, findings, and conclusions | Lifecycle routing | After Phase 3 |
| Delivery and conformance worker | Catalog, package projection, dogfood, installed fixtures, and harness conformance | All resource work | Last implementation phase |
| Validation worker | Cross-document, path, contract, package, and human-outcome checks | Each assembled phase | At every gate and final close |

When parallel workers are available, the coordinator write scope is `none`. Workers must not overlap source files without an explicit assembly boundary.

## MCP Strategy

- Use `jdocmunch` to inspect and read project documentation, current PRD owners, headings, links, and resource authority.
- Refresh the documentation index when source hashes are stale.
- Use `jcodemunch` to inspect catalog, rules, tool-directory, validation, renderer, and test symbols before implementation.
- Refresh the code index when changed code is outside the current snapshot.
- Use direct file reads only when indexed retrieval cannot provide the required current source.
- Use repository checks for final filesystem, package, link, and installed-project evidence.

## Dependencies

- Owner acceptance of the governing design is satisfied by the request to generate this plan.
- Owner acceptance of this plan is required before PRD generation.
- Approved current PRDs are required before work backlog generation.
- Approved backlog is required before implementation.
- Phase 2 must settle stable resource names and section fields before Phase 3 updates consumers.
- Phase 3 must settle propagation and routing before Phase 4 defines final evidence fixtures.
- Package projection and dogfood must follow reviewed upstream files.
- Real human outcome proof requires a meaningful installed or public human-facing path.

## Validation

### Plan validation

- The bundle contains `00-overview.md` and five numbered phase files.
- Every phase links back to the governing design and this overview.
- The coordinate is W20 R0 in filenames, titles, frontmatter, and handoffs.
- Every accepted experience promise maps to a PRD owner, planned surface, phase, and evidence source or selected testing type.
- Every candidate requirement has `create`, `update-existing`, `link-only`, or `none` with a reason.
- The plan names exact current PRD owners and sections.
- The plan creates one new capability PRD, not an editorial PRD.
- The plan keeps the backlog scoped as a delta.

### PRD validation

- Current normative requirements appear in owning PRD bodies.
- PRD 49 owns the shared standard without copying it into every PRD.
- Existing PRDs preserve unrelated text, links, anchors, numbers, and identities.
- Requirement-history entries are non-normative and complete.
- PRD 00 uses a product-oriented kind and current links.
- PRD 03 uses `R-033` and does not add a duplicate risk.
- No new experience frontmatter fields appear.

### Later implementation validation

- Contract and template structure checks cover direct, indirect, none, missing, duplicate, and malformed sections.
- Propagation fixtures trace promises from design to PRD, work, and evidence without copying the full design section.
- Upstream source, package projection, and dogfood agree where ownership requires parity.
- Installed projects can resolve the stable contract and reference URIs.
- Managed updates preserve user-owned router text.
- Supported harnesses produce coherent direct, indirect, and none interpretations.
- One realistic installed-product flow proves a material change to a human-facing result.
- Human review checks orientation, continuity, meaning, information amount, next action, recovery, and control where applicable.
- Validators do not claim that structure proves beauty, elegance, intuition, or joy.

## Unresolved Questions

No product choice is unresolved for this plan.

Implementation discovery may refine the exact validator symbol or test file that owns a check. It must not change the standard, impact values, body fields, lifecycle boundary, first-release scope, or evidence rules without new product authority.

## Approval State

This plan bundle is a draft until the owner accepts it.

Plan acceptance authorizes the PRD-maintenance gate only when the owner separately asks to proceed. It does not authorize implementation, staging, commit, push, publication, dogfood reseed, or installed-project mutation.

## Intended Follow-On

Route: `prd-generation`

Next Prompt: [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md) (`make-docs://system/prompt/plan-to-prd-change.prompt.md`)

Next step: Create PRD 49 and apply the bounded current-authority updates listed in this plan.

Why: The human experience standard must become current product authority before a backlog can turn it into contract, template, lifecycle, validation, delivery, and conformance work. This order preserves the reason for the enhancement and prevents later tasks from reducing it to document structure.

Coordinate Handoff: Carry W20 R0 into requirement-history entries, source links, and one downstream W20 R0 delta backlog.
