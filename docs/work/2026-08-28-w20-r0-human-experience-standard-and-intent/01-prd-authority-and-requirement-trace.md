---
title: "Phase 1: PRD Authority and Requirement Trace"
kind: "work"
status: "completed"
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

- [x] t1: Read PRD 49 as the canonical Human Experience product authority and record the accepted meanings of `direct`, `indirect`, and `none` in the phase implementation notes.
- [x] t2: Confirm that PRD 01 owns the product promise, PRD 06 owns shipped resource delivery, PRD 14 owns lifecycle review and closeout, PRD 15 owns router discovery, PRD 23 owns body-versus-metadata authority, PRD 46 owns Unassisted Goal Testing, PRD 47 owns Persona linkage, PRD 49 owns Human Experience, and PRD 50 owns the shared testing system.
- [x] t3: Confirm that the first release adds no Human Experience frontmatter, no new lifecycle stage, no mandatory Skill, and no new resource type.
- [x] t4: Check PRD 03 for the current `R-033` wording and record its required controls in the requirement trace.
- [x] t5: Stop and return to PRD reconciliation if a requirement conflict, missing owner, or new product choice appears.

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

- [x] t6: Map `R-HX-01` through `R-HX-12` to the exact phase, source resource, code owner, test owner, evidence source or selected testing type, and closeout result that will satisfy each requirement.
- [x] t7: Map the conditional design section to the upstream design contract, design template, design workflow, request-to-design prompt, document validation, fixtures, and installed projection.
- [x] t8: Map stable resource discovery to `packages/cli/src/rules.ts`, `packages/cli/src/tool-directory.ts`, the provider catalog, resource resolver, catalog tests, and template-link tests.
- [x] t9: Map lifecycle propagation to the plan, PRD, work, coverage, UAT, router, prompt, and handoff owners without copying the canonical standard into each consumer.
- [x] t10: Map required Human Experience Review to applicable promises, suitable evidence, `satisfied`, `material gap`, or `insufficient evidence` conclusions, finding dispositions, completion effects, and release claims. Do not create a fifth testing type or duplicate verdict.
- [x] t11: Map prospective adoption to new projects, substantial design updates, historical designs, modified user-owned routers, package update behavior, and no-impact changes.

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

- [x] t12: Verify the current symbol-level owners before editing, including `REQUIRED_REFERENCE_PATHS`, `ALWAYS_REFERENCE_PATHS`, `getReferencePaths`, tool-resource path helpers, `validateGeneratedDocumentMetadata`, provider catalog loading, resource resolution, and managed-block update behavior.
- [x] t13: Verify the current test owners, including `packages/cli/tests/consistency.test.ts`, `packages/cli/tests/template-links.test.ts`, document-metadata tests, resource-provider and resolver tests, router-preservation tests, and `scripts/smoke-pack.mjs`.
- [x] t14: Confirm the exact repository commands for focused tests, `npm run validate:defaults`, package smoke, path hygiene, link checks, and `git diff --check`.
- [x] t15: Record the upstream-first write order and the affected dogfood projection paths. Do not edit dogfood system resources before their reviewed upstream source.
- [x] t16: Define the executor, scope, effort budget, stop rule, evidence, and gate effect for each selected testing type. Define the Human Experience reviewer without treating the review as a testing type.
- [x] t17: Define the finding and deferral route. Give every material finding a disposition. Create an `O-###` record only when the owner accepts a future outcome that remains owed.

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

- [x] t18: Review the completed requirement trace against the design, plan, PRD 49, all applicable owner PRDs, and `R-033`.
- [x] t19: Record any accepted scope change in current PRD authority before it enters implementation.
- [x] t20: Record the Phase 1 capability status as `implemented`, `partially-implemented`, `not-implemented`, or `blocked`, with evidence.
- [x] t21: Confirm that Phase 2 can start with no unresolved authority conflict and no unowned requirement.

### Acceptance criteria

- The trace is complete enough to implement without inventing product policy in code or prompts.
- The trace retains the human reason, the observable promises, and the internal complexity that must stay out of the normal human path.
- Product authority, implementation ownership, and evidence ownership agree.
- No material decision is hidden in implementation notes.
- Phase 2 receives stable impact values, section forms, resource names, activation rules, and proof boundaries.

### Dependencies

- Stages 1 through 3.

### Closeout Notes

- Testing decision(s): See the [four P1 decisions](#p1-testing-decisions), [validation evidence](#validation-commands-and-results), and [bounded Human Experience Review](#p1-human-experience-review).
- Phase / capability status: P1 document work is `implemented`; the shipped Human Experience capability is `not-implemented`. See [closeout and P2 readiness](#coverage-and-closeout).

## Implementation Notes

### Read This First

P1 is implemented as the authority and implementation map. It does not ship the Human Experience capability. Start with the requirement table below. Follow its named surface owner for exact files and tests. P2 through P5 retain all implementation and product-proof work.

The owner authorized P1 on 2026-09-08 after the plan-mode plan. The inspected baseline is `make-docs-v2` at `5ce429eb` with no changed files. No branch, worktree, Store record, or parallel state file is needed. The code and document MCP indexes were unavailable in this task. Local file and symbol reads supplied the evidence; this is not a claim that an empty index proves absence. The session policy does not authorize delegated agents, so one agent performs the work and reports its review limits.

The live PRDs already contain the accepted W20 and W21 changes. Their current bodies govern. The older plan's instruction to create PRD 49 is completed planning history, not another creation task. The originating design remains useful for intent; later PRD 49 and PRD 50 testing rules replace its earlier testing model. There is no new product choice. W19 R1 P9/P10 and W19 R2 retain their own open work. This P1 document map does not close those phases or claim their package proof.

### Accepted Meaning and Scope

| Impact | Meaning | Minimum proof boundary |
| --- | --- | --- |
| `direct` | The change affects a surface that a person perceives or uses. | Structural and functional evidence plus review of the real surface when it exists. |
| `indirect` | Normal interaction stays the same, but the change affects a person's wait, reliability, accuracy, safety, privacy, recovery, cost, effort, or risk. | Technical evidence tied to the stated human effect; human review when the effect is perceivable or important to a human decision. |
| `none` | The change has no direct or indirect human effect. | A named preserved experience and evidence that its boundary stays unchanged. |

Classify the effect of the proposed change, not merely the fact that someone can read its design. Headless or agent-facing work is not automatically `none`. A Persona identifies the audience. Human Experience Intent states the goal and promises. Human Experience Review checks those promises. PRD 50 selects the testing activity only when more evidence can change a current decision.

The full section belongs after Context and before Decision. It uses `Impact`, `Affected humans`, `Human goal or effect`, `Experience promises`, `Complexity kept out of the human path`, and `Evidence required`. The short `none` form uses `Impact`, `Reason`, `Preserved experience`, and `Evidence required`. There is exactly one section. Both forms are document-body content.

The first release adds no Human Experience frontmatter, Persona schema change, resource type, lifecycle stage, mandatory Skill, numerical experience score, automatic gate on each commit, or repository-wide backfill. Existing resource access and optional projection remain in force.

### Current PRD Owners

| Concern | Current owner and accepted boundary |
| --- | --- |
| Navigation | [PRD 00](../../prd/00-index.md) links the current capability and its related owners. No new PRD or index identity is needed. |
| Product promise | [PRD 01](../../prd/01-product-overview.md) requires technically correct results that fit human goals. |
| Risk and findings | [PRD 03](../../prd/03-open-questions-and-risk-register.md#r-033-human-experience-structure-could-become-checklist-compliance) keeps R-033 open until failure-revealing and real human proof exists. |
| Shipped resources | [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) owns source, package, optional projection, and preservation. |
| Lifecycle and closeout | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) carries promises, evidence, review conclusions, and completion limits. |
| Router discovery | [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) owns short managed pointers and preserved user text. |
| Body and metadata | [PRD 23](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md) keeps intent in the body and uses existing source and handoff metadata. |
| Unassisted goal | [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md) owns qualified human execution, public paths, anti-coaching, findings, and advisory defaults. |
| Audience | [PRD 47](../../prd/47-persona-model.md) owns Persona linkage. Clear human roles are also valid. Do not invent a Persona to fill a field. |
| Human Experience | [PRD 49](../../prd/49-human-experience-standard-and-intent.md) is the single product owner of the standard, impact, intent, review, and adoption rules. |
| Testing system | [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md) owns four testing types, selection, budgets, stops, evidence reuse, and gate effects. |
| Supporting boundaries | [PRD 09](../../prd/09-dogfood-and-maintainer-operations.md) and [PRD 10](../../prd/10-packaging-validation-and-release-reference.md) own delivery proof. [PRD 22](../../prd/22-project-documentation-asset-model.md) owns current paths. [PRD 45](../../prd/45-deferred-obligation-governance.md) owns accepted future outcomes. [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md), [PRD 43](../../prd/43-conformance-scenario-model-and-execution-kits.md), and [PRD 44](../../prd/44-conformance-lab-sessions-and-evidence.md) own agent support evidence. |

### Requirement Map

Each row links a PRD 49 requirement to a human result, exact backlog tasks, a surface owner below, and its final proof. Surface names are navigation labels, not new product entities. All twelve rows remain product implementation work for later phases; P1 completes their mapping only.

| Requirement | Human result or preserved boundary | Phase and task ownership | Surface and evidence owner | Completion evidence |
| --- | --- | --- | --- | --- |
| [R-HX-01](../../prd/49-human-experience-standard-and-intent.md#r-hx-01-canonical-standard) | One short standard applies across products. | P2 t1–t5; P5 t4, t7, t45 | [Standard and design entry](#standard-and-design-entry); [Delivery and real use](#delivery-and-real-use) | Reviewed canonical contract, explanatory reference, and installed list/read access. |
| [R-HX-02](../../prd/49-human-experience-standard-and-intent.md#r-hx-02-impact-classification) | The author names the real human effect, including indirect effects. | P2 t2, t9, t12, t14–t19; P5 t20–t26 | [Standard and design entry](#standard-and-design-entry); [Agent application](#agent-application) | Valid forms plus agent interpretation review of direct, indirect, none, and misleading headless cases. |
| [R-HX-03](../../prd/49-human-experience-standard-and-intent.md#r-hx-03-human-experience-intent-section) | Human goals and promises appear before implementation detail. | P2 t6–t19 | [Standard and design entry](#standard-and-design-entry) | One correctly placed section, exact conditional fields, meaningful error recovery, and historical compatibility. |
| [R-HX-04](../../prd/49-human-experience-standard-and-intent.md#r-hx-04-universal-principles) | People can understand meaning, state, relationships, recovery, and next action. | P2 t4–t5; P3 t14–t15; P4 t5, t21–t28; P5 t28–t36 | [Review and findings](#review-and-findings); [Delivery and real use](#delivery-and-real-use) | Failure-revealing review and a real installed-product result; field presence alone is insufficient. |
| [R-HX-05](../../prd/49-human-experience-standard-and-intent.md#r-hx-05-human-and-machine-surfaces) | Useful meaning comes first; exact machine detail stays available and truthful. | P2 t4; P4 t22–t24; P5 t28–t36 | [Review and findings](#review-and-findings); [Delivery and real use](#delivery-and-real-use) | Compare the visible default with the detail path. Review equivalent meaning and visible limits. |
| [R-HX-06](../../prd/49-human-experience-standard-and-intent.md#r-hx-06-persona-boundary) | Name affected people without inventing a Persona or confusing audience with tester qualification. | P2 t10–t12; P3 t23; P4 t19 | [Standard and design entry](#standard-and-design-entry); [Review and findings](#review-and-findings) | Role/Persona examples, unchanged schema, and qualified-human proof only for an activated unassisted test. |
| [R-HX-07](../../prd/49-human-experience-standard-and-intent.md#r-hx-07-lifecycle-propagation) | The owner can follow intent from design through requirements, work, and evidence. | P3 t1–t24, t28–t38; P4 t1, t6, t11–t12; P5 t45–t49 | [Lifecycle and handoffs](#lifecycle-and-handoffs); [Review and findings](#review-and-findings) | Linked promise-to-evidence examples, a lost-intent negative example, and per-promise conclusions. |
| [R-HX-08](../../prd/49-human-experience-standard-and-intent.md#r-hx-08-proportionate-evidence) | Proof fits the effect without needless human work or false human claims. | P4 t1–t20, t25–t26, t30–t31; P5 t28–t36 | [Review and findings](#review-and-findings); [Delivery and real use](#delivery-and-real-use) | Technical, real-surface, and human evidence stay distinct; the installed exercise demonstrates an actual improvement. |
| [R-HX-09](../../prd/49-human-experience-standard-and-intent.md#r-hx-09-completion-and-obligations) | Completion claims show what is proved and what is still owed. | P3 t31, t37; P4 t6, t12, t27–t28, t32–t34; P5 t45–t53 | [Review and findings](#review-and-findings) | Passing automation cannot close a material human finding. Accepted deferrals retain owner, trigger, target, and exit criteria. |
| [R-HX-10](../../prd/49-human-experience-standard-and-intent.md#r-hx-10-resource-and-router-authority) | Agents find one governing source without a mandatory Skill or forced local copy. | P2 t20–t26; P3 t18–t24; P5 t1–t9, t44 | [Resource access and preservation](#resource-access-and-preservation); [Delivery and real use](#delivery-and-real-use) | Stable URI list/read, managed-block preservation, and installed-provider access without mandatory projection. |
| [R-HX-11](../../prd/49-human-experience-standard-and-intent.md#r-hx-11-validation-boundary) | Checks find malformed documents without claiming to measure human quality. | P2 t13–t19, t23, t27–t30; P4 t14, t21–t28; P5 t16, t19–t27 | [Standard and design entry](#standard-and-design-entry); [Agent application](#agent-application) | Structural negatives fail for structural reasons. Coherent interpretation and real use receive separate review. |
| [R-HX-12](../../prd/49-human-experience-standard-and-intent.md#r-hx-12-prospective-adoption) | New work adopts the rule while old and user-owned work stays safe. | P2 t15–t16; P3 t25–t30; P5 t8, t37–t44 | [Adoption and compatibility](#adoption-and-compatibility) | New, substantial, minor, historical, modified-router, direct, indirect, and none cases receive the correct treatment. |

### Original Promise Map

These are the eight promises in the [accepted design intent](../../designs/2026-08-28-human-experience-standard-and-intent.md#human-experience-intent), in source order. The requirement map and surface records supply their exact files, work owners, evidence, and deferral route.

| Design promise | Current requirements and owner | Work and proof |
| --- | --- | --- |
| Short, plain shared standard | R-HX-01 and R-HX-04; PRD 49 | P2 contract/reference review; P5 installed discovery. |
| Each generated design states its effect | R-HX-02 and R-HX-03; PRDs 49 and 23 | P2 structure and classification fixtures; P5 agent cases. |
| Human outcome comes before implementation detail | R-HX-03 and R-HX-04; PRD 49 | P2 design entry; P3 acceptance examples; P5 real surface. |
| None stays brief without an invented flow | R-HX-02, R-HX-03, and R-HX-08; PRD 49 | P2 short form; P4 boundary evidence; P5 none case. |
| Intent moves forward without repeated prose | R-HX-07 and R-HX-10; PRDs 14 and 15 | P3 linked propagation and thin router proof. |
| Owner can see intent, requirement, and acceptance evidence | R-HX-07 and R-HX-09; PRDs 14 and 49 | P3 trace; P4 conclusions; P5 final requirement audit. |
| Machine detail stays available without dominating the human path | R-HX-05; PRD 49 | P4 raw-ID negative case; P5 default/detail comparison. |
| The rule applies across technologies | R-HX-01 and R-HX-04; PRDs 01 and 49 | P2 diverse examples; P5 product-neutral installed fixture. |

### Exact Surface Owners

All source paths below are repository-relative. Existing files and symbols were checked at the baseline. A path labeled **planned** does not exist yet and is owned by the named later phase. Test ownership names the existing home to extend, not proof that an unbuilt behavior already passes.

#### Standard and Design Entry

- Upstream resources: **planned** `packages/docs/template/.make-docs/system/contracts/human-experience-contract.md` and **planned** `packages/docs/template/.make-docs/system/references/human-experience.md`, owned by P2 t1–t5.
- Existing consumers: `packages/docs/template/.make-docs/system/contracts/design-contract.md`, `packages/docs/template/.make-docs/system/templates/design.md`, `packages/docs/template/.make-docs/system/references/design-workflow.md`, and `packages/docs/template/.make-docs/system/prompts/request-to-design.prompt.md`.
- Code owner: `packages/cli/src/document-metadata.ts` → `validateGeneratedDocumentMetadata`. Its current behavior validates metadata and handoffs, not Human Experience body shape. `packages/cli/src/operations/closeout/index.ts` consumes it. P2 t13 owns the smallest body-validation extension and its caller integration.
- Test owners: `packages/cli/tests/document-metadata.test.ts` for deterministic document examples; `packages/cli/tests/consistency.test.ts` for upstream/default coverage; `packages/cli/tests/template-links.test.ts` for resource and template links. Generated agent cases use the agent-application owner below.
- Proof split: missing fields, invalid impact, duplicates, wrong order, empty fields, and unresolved placeholders are structural cases. A well-formed but misleading `none` claim is a semantic review case. P2 t17 must not become a keyword-based detector of human meaning. PRD 49 R-HX-11 limits automatic claims; P2 t29 and P5 t23/t26 own interpretation review.

#### Resource Access and Preservation

- Source catalog: `packages/docs/template/.make-docs/system-resources.catalog.json`. It uses `*.md` patterns within four typed directories, not a hand-maintained resource row for every Markdown file. P2 t20 means prove inclusion under those existing patterns. Change a catalog rule only if the new files are not covered; do not add a fifth family or invent a new workflow registration.
- Code owners: `packages/cli/src/rules.ts` → `REQUIRED_REFERENCE_PATHS`, `ALWAYS_REFERENCE_PATHS`, `getReferencePaths`; `packages/cli/src/catalog.ts` → `getDesiredAssetsForMaterializationMode`, `getSystemAssetMaterializationPlan`; `packages/cli/src/tool-directory.ts` → `getToolResourcePath`, `getToolResourcePaths`; `packages/cli/src/operations/resource/provider.ts` → `loadSystemResourceProvider`; `packages/cli/src/operations/resource/resolver.ts` → `resolveSystemResource`, `listSystemResources`, `readSystemResource`.
- Stable identities: `make-docs://system/contract/human-experience-contract.md` and `make-docs://system/reference/human-experience.md`. These are planned P2 identities, not currently available resources. The existing provider checks safe paths and its catalog; the resolver also checks local projection provenance.
- Router source: `packages/docs/template/AGENTS.md`, `packages/docs/template/CLAUDE.md`, and applicable paired routers under `packages/docs/template/docs/` and `packages/docs/template/.make-docs/`. P3 edits discovery in managed blocks only. `packages/cli/src/managed-block.ts` → `parseManagedBlock` and `upsertManagedBlock` supplies the block transform; lifecycle ownership and conflict checks remain the responsibility of `packages/cli/src/planner.ts` and existing lifecycle paths. Do not bypass those checks by calling a text helper directly on a user's file.
- Test owners: `packages/cli/tests/resource-identity-provider.test.ts`, `resource-provider-integration.test.ts`, `resource-resolver.test.ts`, `tool-directory.test.ts`, `system-assets.test.ts`, `p4-projection-lifecycle.test.ts`, `managed-block.test.ts`, `router-paths.test.ts`, and `lifecycle.test.ts`. Each abbreviated test filename is under `packages/cli/tests/`. `p3-operation-surfaces.test.ts` in that directory owns shared operation-surface regression proof.

#### Lifecycle and Handoffs

- Upstream reference owners under `packages/docs/template/.make-docs/system/references/`: `lifecycle.md`, `planning-workflow.md`, `execution-workflow.md`, and `prd-change-management.md`.
- Template owners under `packages/docs/template/.make-docs/system/templates/`: `plan-overview.md`, `plan-prd.md`, `plan-prd-change.md`, `prd-subsystem.md`, `work-index.md`, and `work-phase.md`. `packages/docs/template/.make-docs/system/contracts/output-contract.md` owns shared output shape.
- Prompt owners under `packages/docs/template/.make-docs/system/prompts/`: `designs-to-plan.prompt.md`, `designs-to-plan-change.prompt.md`, `plan-to-prd-green-field.prompt.md`, `plan-to-prd-change.prompt.md`, `prd-to-work-full-prd.prompt.md`, `prd-to-work-prd-feature.prompt.md`, and `prd-change-to-work.prompt.md`.
- Code/test owners: the existing metadata validator and `packages/cli/tests/document-metadata.test.ts` check handoff agreement. `packages/cli/tests/consistency.test.ts` and `template-links.test.ts` own shipped resource and link coverage. P3 t28–t32 add the promise propagation and lost-intent examples to these existing test homes. No runtime workflow engine is needed.
- W20 adds the Human Experience mapping and discovery duties. W21 retains shared testing policy, facilitator behavior, and the four-type selection system. Existing Unassisted Goal Testing resource support is partial supporting infrastructure, not delivery of W20 or the full W21 backlog.

#### Review and Findings

- P4 updates the planned Human Experience contract/reference. Existing consumer anchors are `packages/docs/template/.make-docs/system/contracts/coverage-pass-contract.md`, `deferred-obligation-contract.md`, and `naive-uat-contract.md`; the latter two filenames share that contracts directory. W20 references their rules without rewriting W21-owned shared testing behavior.
- Existing lifecycle/evidence code is `packages/cli/src/operations/closeout/index.ts`. Structural scenario validation and regression evidence live in `packages/cli/tests/p7-ugt.test.ts`, `registry-work-ops.test.ts`, `consistency.test.ts`, and `document-metadata.test.ts`, all under the test directory. These tests do not become human-quality judges. P4 t13–t14 and t21–t28 own decision and failure-revealing examples.
- Review executor: an agent or informed reviewer can compare evidence with promises and report limits. Use a reviewer other than the sole builder when practical in P4. The P5 real human exercise must not use the builder as its only judge. A qualified person alone executes an activated Unassisted Goal Test. None of these roles is established merely by a Persona slug.
- Finding route: first use PRD 03 for a material authority gap or confirmed drift. Keep the promise, evidence, severity, owner, disposition, and completion effect in the consuming phase/evidence record. Remediate, accept an owner-approved bounded caveat or narrower claim, or keep partial status. Only an accepted future outcome enters PRD 45's canonical obligation route. Include owner, trigger, target, dependencies, exit criteria, and backlinks; do not create an obligation for skipped advisory work.

#### Agent Application

- P5 t19–t27 own the installed conformance cases. Existing planning/execution owners are `packages/cli/scripts/conformance-kit.ts` and `packages/cli/scripts/conformance-ingest.ts`; PRDs 20, 43, and 44 retain supported-harness, tuple, scenario, and evidence authority.
- Test owners: `packages/cli/tests/conformance-scenarios.test.ts`, `conformance-kit.test.ts`, `conformance-governance.test.ts`, and `conformance-lab-session.test.ts`, all under the test directory. These prove conformance infrastructure. They do not alone prove that a supported agent correctly applies an unbuilt rule.
- Evidence must name the harness/model/provider/runtime, public starting context, generated result, interpretation conclusion, and bounded claim. Direct, indirect, none, misleading headless, and missing-product-choice cases remain required. P1 does not create a scenario, launch a harness matrix, or promote support claims.

#### Adoption and Compatibility

- Rule owners are the P2 contract/design entry and the P3 lifecycle consumers above. Existing update and preservation owners are `packages/cli/src/planner.ts`, `manifest.ts`, and `managed-block.ts` under the source directory. `packages/cli/tests/document-metadata.test.ts`, `lifecycle.test.ts`, `p4-projection-lifecycle.test.ts`, and `managed-block.test.ts` own focused compatibility checks.
- P2 t15 and P3 t25 apply the contract prospectively. P5 t37–t44 prove a new project, a historical design, a substantial update, a minor edit that needs no unrelated rewrite, modified router text, and direct/indirect/none paths. Do not infer activation from file age or require a new Human Experience frontmatter key. The accepted new-generation or substantial-update context controls adoption.
- P1 maps these duties. P2 owns the exact caller/fixture mechanism for activation within existing validation ownership. That is a routine engineering choice; it cannot weaken historical validity or introduce a new product schema.

#### Delivery and Real Use

- The fixed write order is upstream `packages/docs/template/`, generated `packages/cli/template/`, reviewed root projection, then a clean installed project. `scripts/copy-template-to-cli.mjs` supplies package copying through `npm run prepack -w packages/cli`. `scripts/smoke-pack.mjs` owns package smoke through `npm run smoke:pack`.
- Affected root resource destinations, if selected for local projection, are `.make-docs/system/contracts/`, `.make-docs/system/references/`, `.make-docs/system/templates/`, and `.make-docs/system/prompts/`. The catalog remains `.make-docs/system-resources.catalog.json`. Router destinations mirror the reviewed upstream router paths. Provider-backed access must work without forcing local resource bodies.
- Current install/update/projection operations own manifest evidence and conflict handling. Do not hand-edit the manifest, generated package copy, or root system resources. P1 runs no build, prepack, reseed, installation, update, or migration.
- Test owners: `packages/cli/tests/install.test.ts`, `lifecycle.test.ts`, `p4-projection-lifecycle.test.ts`, resource tests above, and `scripts/smoke-pack.mjs`. P5 t10–t18 owns one justified expanded integration pass, not release-grade certification.
- P5 t28–t36 owns a product-neutral runnable or inspectable fixture with relationships, state, detail, or recovery. Capture the prior risk, goal, visible result, optional detail path, and per-promise review. Installed documents alone do not prove improvement. Conditional unassisted testing follows P4's current decision. The originating example project is not an implementation target.

### P1 Findings and Scope Decisions

| Item | Disposition and effect |
| --- | --- |
| R-033 says separate review verdicts | Corrected in its existing register entry to the accepted per-promise review and evidence-reuse rule. Risk remains open. P4 and P5 own closure evidence. |
| Old resource paths in active W20 plan/work | Corrected to `.make-docs/system/<type>/`. P2/P3 task paths changed only as pointers; their task IDs, scope, and open state remain intact. |
| Existing plan/index handoff mismatches | The plan overview and work index had seven baseline metadata findings. Align their body handoffs with their existing metadata meanings and fix the obsolete work-index path. No new route or schema is introduced. |
| Defaults baseline failure | `consistency.test.ts` expects drift headings through D-030 but the register already contains D-031. The baseline has 45 passing tests and one failure. This limits the defaults claim; it is not a P1 product-authority conflict. The test inventory repair belongs with the D-031 documentation/test maintenance. P1 does not change that test or the migration/Store behavior. |
| Old history path in installed contract/template | PRD 22, PRD 09, current path hygiene, and the approved P1 plan use `.make-docs/archive/history/`. Use that current path for this session record. Keep old records and shipped templates unchanged; their resource maintenance stays with the existing W19 delivery/reconciliation work. |
| P2 t17 can be read as semantic automation | Apply PRD 49's structural-only boundary. Malformed forms are automated negatives; misleading meaning is an interpretation-review negative under P2 t29 and P5 t23/t26. No new semantic validator or product decision is authorized. |
| Catalog task can be read as per-file registration | Existing patterns already cover the new contract/reference filenames. P2 proves provider inventory and stable reads. It does not invent per-file catalog entries or a resource family. |

R-033 controls remain attached to the trace: structural success is necessary but insufficient; real surfaces and failure-revealing examples remain owned; every applicable promise gets a bounded conclusion; technical success cannot erase friction; agents cannot certify lived experience; P5 must prove an actual installed-product human improvement. No new `O-###` or `NUAT-###` is created. The later phase assignments are ordinary accepted backlog work, not deferrals created by P1.

### P1 Testing Decisions

All decisions use the current early `2.0.0-rc` maintainer context. The current outcome is a document map, not a release or runtime change. The retained evidence is the command identity, scope, result, and material limit below. Raw logs and private machine paths are not required in the repository.

| Testing type | Decision informed and reason now | Scope and executor | Gate effect | Effort budget and stop condition | Evidence and rerun trigger |
| --- | --- | --- | --- | --- | --- |
| Automated Implementation Testing | Can the changed documents support P2 without broken authority, paths, task ownership, or handoffs? | Agent-run PRD authority, defaults, changed-file metadata/link/path checks, trace checks, and diff review. | `blocking-current-work` for a P1-introduced error; baseline defaults failure blocks only a claim of a fully green defaults suite. | One baseline and one final changed-scope pass; at most two correction cycles. Repeat affected checks only after a material edit. Stop at sufficient scoped proof or an unresolved material P1 failure. | Validation results below. Rerun for changed relevant text/code, a new failure, or a new acceptance claim. |
| Performance Testing | `not-needed-now`: no runtime or human wait change is claimed. | No run; agent records the decision. | `not-applicable` | Zero test effort. Reconsider only if work introduces a current performance decision. | Scope inspection; runtime files unchanged. A material performance claim is the rerun trigger. |
| Guided Progress Review | Let the owner see how one requirement reaches its future files and proof. Optional after the map is ready. | Owner or maintainer, with agent guidance; the safe path below. | `advisory` | One offer, up to five minutes, three steps. Stop or decline at any time. No obligation and no delay to P1 completion. | Offer and any actual feedback. No human result is claimed before a response. Repeat only on request or a material map change. |
| Unassisted Goal Testing | `not-needed-now`: no new installed product path exists in P1 and document ownership can be checked directly. | No scenario or human run. | `not-applicable` | Zero test effort. P4 selects at most one scenario if material current uncertainty remains. | Decision only. New unresolved human uncertainty or explicit current authority can change selection. |

Optional guided path: (1) Open the requirement table and choose “Human and Machine Surfaces.” (2) Follow its delivery owner to see the visible-default and optional-detail proof. (3) Read the P1 status to see what exists now and what P5 still owes. Notice whether the owner, next action, and evidence are easy to find. This is a read-only document review. Close the document to stop; no setup or cleanup is needed. Feedback can improve the map without asking the owner to rerun automated checks or certify the whole capability.

### Validation Commands and Results

Run repository commands from the repository root. The Node loader form avoids the `tsx` launcher IPC socket restriction seen in this environment.

```sh
node --import tsx packages/cli/src/index.ts run prd authority validate --target-root .
npm run validate:defaults
python3 .make-docs/scripts/check_path_hygiene.py --repo-root .
git diff --check
```

The manifest path check covers selected managed files only. Also scan every changed P1 Markdown file with `scan_file(..., fix=False)` from that same script. Use the existing `validateTemplateLinks` and `validateGeneratedDocumentMetadata` functions for changed Markdown. Load resource URIs with `loadSystemResourceProvider` from the upstream template. A planned resource path in prose is a future target, not an available-resource claim or a link that should be resolved now.

The following read-only command checks changed tracked and untracked Markdown with the current metadata and link owners. It resolves stable resource links against the real upstream provider inventory.

```sh
node --import tsx --input-type=module <<'JS'
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateGeneratedDocumentMetadata } from './packages/cli/src/document-metadata.ts';
import { validateTemplateLinks } from './packages/cli/src/template-links.ts';
import { loadSystemResourceProvider } from './packages/cli/src/operations/resource/provider.ts';
const listed = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }) + '\n' + execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' });
const files = [...new Set(listed.split('\n').filter(p => p.endsWith('.md')))];
const documents = files.map(p => ({ templatePath: p, renderedPath: p, contents: readFileSync(p, 'utf8') }));
const provider = loadSystemResourceProvider({ root: 'packages/docs/template', packageName: '@brucewaynedecoy/make-docs', version: '2.0.0-rc', source: 'development' });
if (!provider.ok) throw new Error(JSON.stringify(provider));
const metadata = documents.flatMap(d => validateGeneratedDocumentMetadata(d.contents, { sourcePath: d.templatePath }));
const links = validateTemplateLinks({ documents, targetExists: existsSync, systemResourceUris: new Set(provider.value.resources.map(r => r.identity.uri)) });
console.log(JSON.stringify({ files: files.length, metadata, links }, null, 2));
process.exitCode = metadata.length || links.length ? 1 : 0;
JS
```

For changed-file path hygiene, use the same scanner without its manifest limit or any rewrite option:

```sh
python3 - <<'PYTHON'
from pathlib import Path
import runpy, subprocess
scan = runpy.run_path('.make-docs/scripts/check_path_hygiene.py')
scan_file = scan.get('scan_file')
listed = subprocess.check_output(['git', 'diff', '--name-only'], text=True) + '\n' + subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], text=True)
files = sorted({p for p in listed.splitlines() if p.endswith('.md')})
findings = []
for name in files:
    result, changed = scan_file(Path(name), name, str(Path.cwd()), scan.get('DEFAULT_ALLOW_TOKEN'), False)
    assert not changed
    findings.extend(result)
print(f'checked_files={len(files)} changed_files=0 errors={len(findings)}')
for finding in findings:
    print(finding)
raise SystemExit(bool(findings))
PYTHON
```

The exact later focused test commands are recorded here for P2–P5. P1 does not run these runtime suites merely to map their owners.

```sh
npm test -w packages/cli -- tests/document-metadata.test.ts tests/consistency.test.ts tests/template-links.test.ts
npm test -w packages/cli -- tests/resource-identity-provider.test.ts tests/resource-provider-integration.test.ts tests/resource-resolver.test.ts tests/tool-directory.test.ts tests/system-assets.test.ts tests/p4-projection-lifecycle.test.ts
npm test -w packages/cli -- tests/managed-block.test.ts tests/router-paths.test.ts tests/lifecycle.test.ts tests/p3-operation-surfaces.test.ts
npm test -w packages/cli -- tests/conformance-scenarios.test.ts tests/conformance-kit.test.ts tests/conformance-governance.test.ts tests/conformance-lab-session.test.ts
npm run smoke:pack
bash scripts/check-instruction-routers.sh
```

| Check | Evidence and claim |
| --- | --- |
| Baseline PRD authority | Passed: 39 PRDs, 1,065 Markdown files, 156 structured files, 822 authority links, no diagnostics. |
| Baseline defaults | 45/46 passed. The sole failure is the pre-existing D-031 heading missing from the hard-coded expected list in `consistency.test.ts`. |
| Baseline path hygiene | Passed: 83 managed files, no errors or rewrites. |
| Final changed-file structure, metadata, links, and trace | Scoped check passes: twelve unique requirement rows, t1–t21 in order, resolving requirement/owner fragments, and no metadata or Markdown-link errors. The two changed handoffs have no remaining metadata findings. |
| Final path and diff checks | Passed: 9 changed Markdown files and 83 manifest-selected files, no path errors or rewrites; `git diff --check` passed. Both embedded changed-file commands ran successfully. |
| Final authority and defaults | Authority passed with the same 39 PRDs, 1,065 Markdown files, 156 structured files, and 822 authority links. Defaults remained 45/46 passing with exactly the baseline D-031 inventory failure. No new failure appeared and no all-green defaults claim is made. |

Two focused correction cycles repaired the handoff value form and a Markdown-link scanner ambiguity in an embedded Python example. No product policy changed. Runtime and package tests listed above remain commands for later phases, not executed P1 proof.

### P1 Human Experience Review

Reviewer: the implementing Codex agent. This is an evidence and document review, not an independent human test. The available surface is the P1 Markdown map. Review covered the rendered structure implied by its headings, tables, and links and the source text; no lived-use, visual browser, installed-product, joy, or unassisted-success claim is made.

| P1 promise | Evidence and observation | Conclusion and limit |
| --- | --- | --- |
| Find the human reason before file detail | “Read This First,” impact meanings, and the requirement table put the human result before the surface-owner detail. | `satisfied` for document ordering and explicit meaning. Human ease of use has not been tested. |
| Follow a requirement to owned work and proof | Twelve unique rows link to current PRD requirements, exact phase tasks, local owner sections, and completion evidence. The original eight promises also have a requirement/work map. | `satisfied` for trace coverage and navigation. Later implementation and outcome evidence remain absent. |
| Tell completed P1 work from future capability work | P1 status, requirement-map introduction, planned-path labels, and P2 handoff distinguish this document map from shipped behavior. | `satisfied` for truthful scope. All eight original product promises still need later-phase proof before capability completion. |
| See limits and next action without reading raw logs | The findings table names the D-031 test-inventory failure and the current owners. Validation reports exact scope. The next step names P2 and its separate authority. | `satisfied` for visible limits and ownership. The defaults suite is not fully green. |

The optional guided review is offered with the three-step path above. No user response or human review result is assumed. If the owner reports confusion, use that feedback to improve this map. No advisory review, declined offer, or skipped unassisted test creates an obligation.

### Coverage and Closeout

| Surface | Decision | Reason and result |
| --- | --- | --- |
| Current PRD authority | `update-existing` for PRD 03; `none` for other owners | R-033 wording now follows accepted PRDs 49 and 50. No product requirement, PRD identity, or risk status changed. |
| Plan and work | `update-existing` | Correct active W20 resource paths and touched handoffs. Record the complete P1 trace, evidence, and phase status. P2/P3 checkbox states stay open. |
| System resources and runtime | `none` | P1 verifies owners only. No upstream or downstream system-resource, code, API, schema, manifest, or installed-project change. |
| Developer and user guides | `none` | The existing work file owns this implementation map. P1 ships no new user behavior that needs a guide. |
| History | `create` | One [P1 session record](../../../.make-docs/archive/history/2026-09-08-w20-r0-p1-authority-and-requirement-trace.md) preserves the result and limits. No old record is changed or moved. |
| Obligations and unassisted scenarios | `none` | No accepted future outcome was newly deferred. Existing P2–P5 duties have owners. No new `O-###` or `NUAT-###` is warranted. |

Orphan audit: all twelve requirements and all eight original design promises have named later work and evidence owners. R-033 remains open and linked to P4/P5. The unrelated D-031 baseline failure stays visible with its existing maintenance boundary. No accepted future outcome disappears from the backlog and no new unowned obligation remains.

P1 capability status: `implemented` for authority verification, the requirement map, exact source/test ownership, command records, finding routes, and closeout documentation. Human Experience shipped capability status: `not-implemented`; this phase has not delivered the new contract, design section, installed flow, or human outcome proof. The owner requested P1 closeout and commit on 2026-09-08 after the implementation result and defaults-test limit were reported. P1 is accepted for this bounded document closeout. This does not claim independent human testing or resolve R-033.

P2 readiness: ready for its separate implementation authorization on the documented authority and trace. There is no unresolved P1 product choice or unowned requirement. P2 must retain the baseline defaults limitation until its owner repairs it; it cannot claim a fully green defaults suite by citing P1. P2 does not start in this session. The owner has separately authorized staging and a local P1 commit. Publication, release, P2 execution, and broader W19/W21 closeout remain outside this authority.
