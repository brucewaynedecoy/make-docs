---
title: "W21 R0 Proportionate Testing and Human-Centered Validation"
kind: "plan"
status: "draft"
coordinate: "W21 R0"
source:
  type: "design"
  path: "docs/designs/2026-08-28-proportionate-testing-and-human-centered-validation.md"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "The four-type testing model, proportionality rules, human testing experience, and gate semantics must become current product authority before implementation or W20 R0 revision."
  coordinate_handoff: "Carry W21 R0 into maintained PRD requirement history, source links, and a later W21 R0 delta backlog. Review and revise W20 R0 only after the testing PRD set is accepted."
---

# W21 R0 Proportionate Testing and Human-Centered Validation

> In v2, plans are directories. This file is the `00-overview.md` entry point. Phase detail lives in the numbered files beside it.

**Date:** 2026-08-28

**Repository:** `make-docs`

**Purpose:** Produce a reviewable authority-maintenance and implementation plan that makes testing proportionate to the current decision, gives each form of testing one clear purpose, and makes human testing brief, meaningful, and respectful.

## Objective

Make Docs must help agents choose the smallest useful test for the current product state and decision. It must stop agents from treating test volume as quality, from applying production-grade proof to unstable work, and from turning every human-visible change into a mandatory acceptance ceremony.

The plan establishes exactly four core testing types:

1. Automated Implementation Testing;
2. Performance Testing;
3. Guided Progress Review; and
4. Unassisted Goal Testing.

It also applies the Human Experience Standard to the testing activity itself. A person should know why a test is useful, what they will do, how much effort it should take, what the result can affect, and how to stop or recover.

## Governing Invariant

Choose the least costly test that can change the current decision. Match testing to product maturity, risk, and reversibility. Make human testing brief, goal-led, non-redundant, and respectful of the person's time and knowledge. A test becomes a gate only when accepted authority says its failure blocks the current outcome.

Specialized testing owners can add detail. They cannot weaken the common proportionality, effort-budget, stop-rule, human-experience, evidence-reuse, or gate rules.

## Coordinate Decision

Use `W21 R0`.

The accepted design defines a new end-to-end testing-governance initiative. It is related to W20 R0 because W20 consumes testing authority. It is not a redo of the Human Experience Standard itself. The highest active plan wave is W20. The wave model therefore assigns the next wave and resets the revision to R0.

W21 R0 must settle the testing PRD set before any W20 R0 plan or backlog revision. Historical W19 testing records and the current W20 R0 artifacts remain evidence. They are not rewritten to imply that the new testing model existed earlier.

## Change Classification

This is authoritative PRD maintenance with one new coherent product capability.

- Create one new product-wide testing-governance PRD.
- Update existing PRD owners for lifecycle, human testing, performance, experience, conformance, obligations, resources, routing, metadata, and Persona boundaries.
- Update the PRD index, glossary, product overview, and risk register.
- Preserve useful naive-UAT identities and evidence without keeping the current over-broad activation rule.
- Plan one later W21 R0 delta backlog for system resources, templates, prompts, routing, conformance, and delivery.
- Hold W20 R0 implementation. Review its plan and backlog after the testing PRD set is accepted.

## Maintenance Inputs

Primary design authority:

- [Proportionate Testing and Human-Centered Validation](../../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)

Related current authority and lineage:

- [Human Experience Standard and Intent design](../../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience plan](../2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [W20 R0 work backlog](../../work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md)
- [PRD 14: Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 46: Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 48: Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49: Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [Naive End-User Acceptance Testing design](../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md)
- [Performance Testing Guardrails design](../../designs/2026-08-12-performance-testing-guardrails.md)

## Background and Justification

Make Docs gives agents strong structure for complex work. That structure has also encouraged a false form of certainty around testing. Agents can add suites, matrices, benchmarks, walkthroughs, evidence packets, and phase gates even when those activities do not change a current decision.

The failure is not only excess work. The four testing purposes have become mixed together:

- automated testing can grow from focused proof into repeated broad reassurance;
- performance testing can apply production expectations before a feature works as a coherent whole;
- guided manual testing can ask the owner to repeat technical assertions that automation already proved; and
- naive UAT can become a mandatory sign-off gate instead of a narrow way to reveal human-understanding gaps.

This creates cost, delay, and frustration. It also damages trust. A person who wants to enjoy and understand visible progress instead receives setup work, raw commands, internal identifiers, and duplicate checks. A useful testing model must protect correctness without treating time, attention, and human understanding as free resources.

W21 R0 therefore treats testing as a decision system. Each activity must name the decision it can change, the failure that matters now, the smallest representative scope, the executor, the gate effect, the effort budget, the stop condition, the retained evidence, and the rerun trigger.

## Four-Type Testing Model

| Testing type | Primary question | Default executor | Default gate effect |
| --- | --- | --- | --- |
| Automated Implementation Testing | Does changed behavior satisfy focused assertions, and did it introduce a relevant regression? | Agent or automated system | Can block the scoped correctness claim. |
| Performance Testing | Does current performance evidence answer an accepted decision for this maturity, risk, and support scope? | Agent-coordinated tools, with owner input when target authority is needed | Blocking only for an accepted current hard outcome. |
| Guided Progress Review | Can the owner experience and understand meaningful progress through a short prepared path? | Owner, maintainer, or developer with agent guidance | Always advisory or informational. |
| Unassisted Goal Test | Can an intended person understand and attempt a meaningful goal without private coaching? | Qualified human using allowed public or starting information | Advisory by default; blocking only through explicit current authority. |

Accessibility, security, privacy, architecture, visual regression, conformance, and other specialist reviews remain separate when their authorities apply. Human Experience Review is a lens over evidence and the built result. It is not a fifth testing type.

## Common Testing Decision Record

The first release uses a compact body record. It does not add frontmatter fields.

- `Testing type`
- `Decision informed`
- `Reason now`
- `Product maturity`
- `Scope`
- `Executor`
- `Gate effect`
- `Effort budget`
- `Stop condition`
- `Evidence retained`
- `Rerun trigger`

If evidence cannot change a current decision, the normal result is `not-needed-now`. The agent must not activate all four types merely to make a plan or phase appear complete.

## Candidate Decision Matrix

| Candidate | Decision | Reason |
| --- | --- | --- |
| Product-wide testing governance | `create` | No current PRD owns the four-type taxonomy, common decision record, proportionality, shared gate effects, testing experience, and evidence-reuse rules as one coherent capability. |
| PRD 00 index | `update-existing` | The index must add the new authority and route readers to the correct specialized owners. |
| PRD 01 product overview | `update-existing` | Product capability and current limitation language must state that Make Docs selects proportionate testing and protects the human testing experience. |
| PRD 03 risk register | `update-existing` | The active set needs one risk for under-testing, over-testing, gate drift, and human-testing burden. |
| PRD 04 glossary | `update-existing` | The four types, Human Experience Review lens, gate effect, and `not-needed-now` need stable meanings. |
| PRD 06 template contracts and generated assets | `update-existing` | Installed contracts, references, templates, prompts, and routers must carry the testing standard. |
| PRD 09 dogfood and verification | `none` | Its current upstream-first and verification rules are sufficient. The implementation backlog can consume them without new product authority. |
| PRD 10 package delivery | `none` | Its current package-delivery rules already cover new system assets. PRD 06 owns the new resource set. |
| PRD 14 lifecycle workflow and coverage passes | `update-existing` | Lifecycle routing must use the four types without making every type mandatory or turning advisory work into a phase gate. |
| PRD 15 agent instruction ownership | `update-existing` | Managed routers must expose the shared standard and route agents to specialized testing authority. |
| PRD 20 harness conformance and support claims | `update-existing` | Supported agents must select, explain, budget, stop, and gate testing consistently. |
| PRD 23 metadata and lifecycle handoffs | `update-existing` | The common decision record belongs in document bodies, and handoffs must preserve testing decisions without schema inflation. |
| PRD 43 conformance scenario model | `update-existing` | Scenarios must reveal under-testing, over-testing, false gates, duplicate human work, and poor test instructions. |
| PRD 44 lab sessions and evidence | `update-existing` | Lab execution must distinguish agent-run proof, guided owner review, and qualified unassisted human attempts. |
| PRD 45 deferred obligation governance | `update-existing` | `not-needed-now`, declined guided review, and skipped advisory tests must not create false durable obligations. |
| PRD 46 naive end-user acceptance testing | `update-existing` | Narrow the subject to Unassisted Goal Testing while preserving useful public-path, anti-coaching, qualification, finding, and compatibility controls. |
| PRD 47 Persona model | `update-existing` | Persona selection and tester qualification must remain distinct, and the owner role for Guided Progress Review must be explicit. |
| PRD 48 performance evidence governance | `update-existing` | Preserve its detailed evidence model and make maturity and common gate semantics explicit at each consumption point. |
| PRD 49 Human Experience Standard and Intent | `update-existing` | Remove broad naive-UAT activation and define Human Experience Review as a reusable lens, not a fifth test. |
| W20 R0 plan and backlog | `none` during PRD reconciliation | Review and revision occur only after the testing PRD set is accepted. Historical task IDs remain stable. |

## Existing PRDs to Update

### PRD 01: Product Overview

Add proportionate testing as a product capability. State that Make Docs does not require every testing type for every phase. Add the human testing experience to the product quality boundary.

### PRD 03: Open Questions and Risk Register

Add one current rebuild risk for testing proportionality and gate drift. The control must point to the new testing authority, PRDs 14, 45, 46, 48, and 49, and failure-revealing conformance.

### PRD 04: Glossary

Define the four core types and related shared terms. Keep the definitions short and authoritative. Do not define specialist reviews as aliases for a core type.

### PRD 06: Template Contracts and Generated Assets

Require a product-wide testing contract and reference, template entry points, prompt routing, and installed router discovery. Keep `packages/docs/template/` as upstream authority and dogfood only after upstream validation.

### PRD 14: Lifecycle Workflow and Coverage Passes

Replace broad testing-candidate behavior with a current-decision route. Add the common decision record and explicit gate effects. Keep Guided Progress Review non-blocking. Make Unassisted Goal Testing conditional. Reuse valid evidence when no rerun trigger exists.

### PRD 15: Agent Instruction Ownership and Managed Blocks

Require concise router guidance to locate the common testing authority. Routers should not embed the whole testing standard or activate every testing type by default.

### PRD 20: Agent Harness Conformance and Support Claims

Require supported agents to apply the same type selection, reason, budget, stop, evidence, and gate rules. A support claim must not rely only on successful happy-path execution.

### PRD 23: Generated Document Metadata and Lifecycle Handoffs

Keep testing decision fields in document bodies for the first release. Preserve current decisions and evidence links through lifecycle handoffs. Do not add top-level metadata merely because testing exists.

### PRD 43: Conformance Scenario Model and Execution Kits

Add realistic scenarios that expose excess testing, missing justified proof, copied performance targets, duplicate manual assertions, coached unassisted tests, and unsupported blocking verdicts.

### PRD 44: Conformance Lab Sessions and Evidence

Require correct executor boundaries and evidence handling. Guided reviews use the owner or maintainer. Unassisted Goal Tests use a qualified human and anti-coaching controls. Lab records must state the gate effect.

### PRD 45: Deferred Obligation Governance

State that a testing activity becomes a durable obligation only when an accepted future outcome, owner, trigger, and reason remain owed. `Not needed now` is not deferral.

### PRD 46: Unassisted Goal Testing

Keep the filename and PRD number for stable links. Change the human-facing title and current normative body. Existing `NUAT-###` identities remain valid. New identity naming remains a later implementation choice unless compatibility analysis proves a safe alias.

### PRD 47: Persona Model

State that Persona identifies an intended audience. It does not prove that a person is qualified for an unassisted test. Add the owner, maintainer, or developer role for Guided Progress Review.

### PRD 48: Performance Evidence Governance

Keep current `PERF-###` profiles and applicability states. Add the common test decision and gate-effect mapping. Make product maturity a required reason before sophisticated proof.

### PRD 49: Human Experience Standard and Intent

Keep authority over the quality of the built result. Make testing governance own evidence selection and administration. Treat Human Experience Review as a lens that can reuse suitable evidence.

## Genuinely New Product PRD

Create `docs/prd/50-proportionate-testing-and-human-centered-validation.md`.

It owns:

- the product-wide testing standard;
- the exact four-type taxonomy;
- the common decision record;
- affected-first automated-testing levels;
- maturity-qualified test selection;
- human testing experience requirements;
- shared gate-effect values and defaults;
- evidence retention and reuse;
- rerun triggers;
- integration boundaries with specialized testing and review owners; and
- acceptance scenarios for correct selection and administration.

It does not replace the detailed performance model in PRD 48 or the detailed unassisted-human model in PRD 46.

## Requirement History Entries

Add one dated `2026-08-28 — W21 R0` entry to each materially changed PRD except new PRD 50 and the shared index, glossary, and risk register.

Each entry must state:

- the affected requirement or section;
- the previous contract;
- the replacement contract;
- why the change is needed; and
- a resolving source link to this plan or the governing design.

The current body remains normative. Requirement History remains non-normative.

## Affected Links, Risks, Plans, and Work

### PRD index

Add PRD 50 to the reading order and document map. Link PRDs 14, 46, 48, and 49 as its closest owners. Add a testing-governance audience path.

### Risk register

Create one risk that covers both failure directions:

- too little evidence for a material current decision; and
- too much, too broad, too early, or too difficult testing for the current decision.

The risk must also cover false gate creation and human-testing burden.

### W20 R0 dependency

Do not edit the W20 R0 plan or backlog during PRD reconciliation. After the owner accepts the updated testing PRD set, review W20 R0 for:

- naive-UAT tasks that should become conditional Unassisted Goal Tests;
- Human Experience Review tasks that should become review lenses;
- Guided Progress Review opportunities that should remain optional and non-blocking;
- duplicate manual checks already covered by automation;
- performance work that lacks a current maturity-qualified decision; and
- phase gates or deferred obligations that no longer have authority.

Preserve existing W20 task IDs. Use surgical edits or explicit supersession notes. Do not regenerate the backlog as if no prior work existed.

### W21 R0 delta backlog

After PRD acceptance and the W20 review, create one W21 R0 delta backlog. It should implement the shared testing authority and its specialized integrations. It must not absorb unrelated W20 Human Experience implementation.

## Repo Summary and Execution Mode

This repository is both the Make Docs maintainer source and a dogfood installation.

- Product PRDs, designs, plans, work backlogs, and local history are project content under `docs/`.
- Shipped system resources are authored first under `packages/docs/template/`.
- The repo-local `.make-docs/` and managed docs are dogfood copies, not the upstream source.
- `packages/cli/` consumes the docs template at build time and does not own a second template source.

PRD reconciliation is surgical maintenance. Later implementation must use upstream-first authoring and then dogfood the accepted result.

## Output Contract

This plan bundle contains:

- `00-overview.md` — authority decisions, context, document catalog, dependencies, and handoff;
- `01-prd-authority-and-testing-model.md` — PRD creation and surgical owner updates;
- `02-system-resources-and-lifecycle-routing.md` — common resources, routers, templates, metadata, and lifecycle use;
- `03-proportionate-technical-testing.md` — affected-first automated work and maturity-qualified performance evidence;
- `04-human-centered-testing.md` — Guided Progress Review, Unassisted Goal Testing, and the Human Experience Review lens; and
- `05-conformance-delivery-and-w20-handoff.md` — failure-revealing proof, package delivery, dogfood, closeout, and W20 R0 review.

The first implementation release does not require a new Skill, runtime command, or frontmatter schema. A later typed operation can assist with selection and evidence only after the written model proves stable.

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 1 | [PRD Authority and Testing Model](01-prd-authority-and-testing-model.md) | Current product authority owns the four-type model and all specialized boundaries agree. |
| 2 | [System Resources and Lifecycle Routing](02-system-resources-and-lifecycle-routing.md) | Installed projects and agents can find and apply the common decision process. |
| 3 | [Proportionate Technical Testing](03-proportionate-technical-testing.md) | Automated and performance work stays bounded by current risk, maturity, and decision value. |
| 4 | [Human-Centered Testing](04-human-centered-testing.md) | Guided and unassisted human activities have clear, distinct, humane purposes. |
| 5 | [Conformance, Delivery, and W20 Handoff](05-conformance-delivery-and-w20-handoff.md) | Failure-revealing evidence proves the model, delivery is complete, and W20 R0 is ready for joint revision. |

## Worker Ownership

Later execution should use disjoint write scopes when the active harness supports them.

| Workstream | Primary scope | Dependency |
| --- | --- | --- |
| PRD authority | `docs/prd/` | Accepted design and plan |
| Shared testing resources | `packages/docs/template/.make-docs/` testing contracts, references, templates, and prompts | Accepted PRDs |
| Lifecycle and router integration | Upstream lifecycle, coverage, router, and handoff resources | Shared testing resources |
| Technical testing integration | Automated and performance resources and conformance scenarios | Shared testing resources |
| Human testing integration | Guided review, unassisted goal, Persona, and Human Experience resources | Shared testing resources |
| Conformance and delivery | Scenario fixtures, lab kits, package manifest, dogfood, and validation | All implementation workstreams |
| W20 review | Existing W20 R0 plan and backlog only | Accepted testing PRDs; owner review before edits |

The coordinator resolves dependencies and reviews evidence. When delegation is available, the coordinator does not own output files.

## MCP Strategy

- Use jdocmunch first for project documents, contracts, templates, plans, PRDs, and links.
- Refresh the docs index when it is stale.
- Use jcodemunch first for implementation symbols and call relationships during later code work.
- Use direct reads only when the relevant index cannot be repaired.
- Use deterministic Make Docs validation for the active PRD set and generated resources.

## Dependencies

1. The governing testing design is accepted for planning and PRD maintenance.
2. PRD 49 and the W20 R0 plan and backlog exist as current dependency evidence.
3. PRD reconciliation must finish before W20 R0 revision or W21 implementation planning.
4. The owner must accept the reconciled testing PRD set before either backlog is changed.
5. Later implementation must author system resources upstream before dogfood materialization.
6. Existing performance and naive-UAT evidence remains usable when its scope and meaning remain valid.

## Validation

### Plan validation

- The bundle contains `00-overview.md` and five numbered phase files.
- Every phase links to this overview and the governing design.
- W21 R0 appears consistently in plan frontmatter, titles, paths, and handoffs.
- The candidate matrix records `create`, `update-existing`, or `none` for every affected owner.
- The W20 R0 pause and later review are explicit.

### PRD validation

- Current normative requirements appear in their owning PRDs.
- PRD 50 owns one coherent product capability.
- PRD 46 is narrowed without breaking stable file and scenario identities.
- PRD 48 remains the detailed performance owner.
- PRD 49 remains the built-result Human Experience owner.
- The index, glossary, risk register, source links, and requirement history resolve.
- `make-docs run prd authority validate --target-root <project>` exits zero.

### Later implementation validation

- Small changes choose focused automated proof and stop.
- Expanded and release-grade automated proof require the correct authority.
- Unstable MVP work rejects performance activity that cannot change a current decision.
- A real feasibility cliff still activates bounded performance evidence.
- Guided Progress Review is short, recognizable, non-duplicative, and never a gate.
- Unassisted Goal Testing can reveal hidden mental-model failure without coaching.
- A human-visible change can validly use `not-needed-now` for unassisted testing.
- Human Experience Review reuses evidence instead of creating a duplicate test.
- Skipped advisory work creates neither a failed phase nor a false obligation.
- No blocking verdict appears without accepted current authority.
- At least one installed-product exercise proves that the testing experience is shorter and more meaningful than the prior technical walkthrough pattern.

## Unresolved Questions

The PRD pass should settle product behavior. Later implementation planning can decide:

- whether new Unassisted Goal Test scenarios retain `NUAT-###` or gain a new prefix with stable aliases;
- whether existing naive-UAT resource filenames remain compatibility surfaces while human-facing titles change; and
- whether a future typed helper is justified after the body-record workflow is proven.

These questions do not block PRD reconciliation.

## Approval State

The owner has authorized creation of this plan and reconciliation of the PRD set.

That authority does not include W20 R0 plan or backlog revision, W21 backlog generation, implementation, migration, staging, commit, publication, or release.

## Intended Follow-On

- `Route:` `prd-generation`
- `Next step:` reconcile the active PRD set through [Phase 1](01-prd-authority-and-testing-model.md).
- `Why:` Testing behavior must become current product authority before system resources, lifecycle routing, conformance, W21 work, or W20 R0 revision can rely on it.
- `Coordinate Handoff:` carry W21 R0 into PRD requirement history and source links. After owner acceptance of the PRD set, review W20 R0 together before changing either backlog.
