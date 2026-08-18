---
title: "W18 R15 Deferred Obligations and True Naive UAT Governance"
kind: "plan"
status: "draft"
coordinate: "W18 R15"
follow_on:
  route: "work-generation"
  next_prompt: ".make-docs/system/prompts/prd-change-to-work.prompt.md"
  why: "PRDs 45 and 46 and the in-place PRD maintenance are complete; the next separately authorized lifecycle step is the W18 R15 delta backlog from current PRD authority."
  coordinate_handoff: "Carry W18 R15 from current PRDs 45 and 46, the maintained existing PRD authorities, and O-001/O-002 into one downstream delta backlog; preserve W18 R14 as design lineage rather than a separate implementation bundle."
source:
  type: "design"
  path: "docs/designs/2026-07-27-true-naive-end-user-acceptance-testing.md"
---

# W18 R15 Deferred Obligations and True Naive UAT Governance

## Purpose

Record the combined W18 R15 plan that reconciles [Deferred Obligations and Anti-Orphan Governance](../../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md) with [True Naive End-User Acceptance Testing](../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md), consumes the resulting current authority in [PRD 45](../../prd/45-deferred-obligation-governance.md) and [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md), and hands that authority to the still-pending W18 R15 delta backlog. The combined capability gives Make Docs a durable way to preserve required future outcomes and an honest way to determine when a real, isolated end user must test an installed product.

The two capabilities share the same authority chain:

1. Versioned PRD authority defines obligations, user outcomes, scenarios, findings, and dispositions.
2. Plans and work backlogs route those records without duplicating their meaning.
3. The phase-close coverage band enumerates candidates, records decisions, and blocks unsupported completion claims.
4. Project State in the machine-level Global Store records operational progress and evidence without becoming product authority.
5. Reusable Make Docs resources are authored under `packages/docs/template/` first, then projected into this maintainer repository and end-user projects.

## Objective

This plan fixes the current PRD authority, system-resource catalog, source-versus-projection paths, lifecycle behavior, compatibility policy, and dependency-ordered backlog shape needed to implement both designs without re-deriving their decisions.

PRD authority maintenance is complete:

- [PRD 45](../../prd/45-deferred-obligation-governance.md) and [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md) carry the genuinely novel anti-orphan and naive-UAT requirements, while existing PRDs retain behavior they already own;
- the maintained existing PRDs carry requirement-history and source-anchor traceability without standalone revise-only PRDs;
- [the active register](../../prd/03-open-questions-and-risk-register.md) has the fixed `## Deferred Obligations` section, O-001, O-002, and conservative initial migration dispositions;
- the active PRD index, product overview, and glossary reflect the capability authorities and terms.

The next separately authorized documentation step is complete when:

- one W18 R15 delta backlog maps every normative requirement in current PRDs 45 and 46 to an owned implementation phase;
- no runtime, CLI, MCP, database-schema, Global Store, Project State, or automatic migration work is included in the first implementation;
- validation proves upstream template authority, dogfood/install projection parity, traceability, anti-coaching separation, and conservative compatibility behavior.

## Coordinate Decision

- Coordinate: `W18 R15`
- Classification: `revision`
- Evidence: The anti-orphan design recommends W18 R14 because it revises W16 R0 coverage governance and consumes W18 R10 state boundaries. The naive-UAT design recommends W18 R15, requires explicit reconciliation with the sibling W18 R14 design, and leaves the final combined-versus-split decision to owner approval. The owner requested one plan bundle for both designs. This W18 R15 plan and PRDs 45 and 46 now exist, while no W18 R15 work directory exists. W18 R15 is the combined downstream coordinate, and W18 R14 remains source lineage rather than a separate implementation bundle.

## Lifecycle Position

This request follows the default lifecycle arc: accepted designs -> plan -> current PRD capability authorities -> delta work backlog -> implementation. There is no lifecycle-stage skip.

The only coordination adjustment is that two sibling design handoffs are merged into one plan revision. The reason is explicit owner direction plus the UAT design's dependency on the anti-orphan trigger, finding, and capability-completion rules. PRD maintenance is complete; backlog generation and implementation remain separate approval gates.

## Authority Maintenance Classification

- Requested change type: `revision`
- Effective execution mode: `authoritative PRD maintenance`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no
- PRD result: PRDs 45 and 46 are current capability authorities, and existing PRD owners were maintained in place without revise-only PRDs
- PRD phase status: complete
- Backlog strategy: one W18 R15 delta backlog, not yet generated

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Deferred Obligations and Anti-Orphan Governance | design document | [../../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md](../../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md) | High - owner directed combined planning from this design |
| True Naive End-User Acceptance Testing | design document | [../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md](../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md) | High - owner directed combined planning and resolved its coordinate question |
| Active open-question, drift, risk, and obligation register | living PRD authority | [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) | High - canonical current register with `## Deferred Obligations`, O-001, and O-002 |
| Lifecycle foundation | existing capability authority | [../../prd/14-lifecycle-workflow-and-coverage-passes.md](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | High - owns lifecycle ordering and phase-close behavior |
| Coverage-pass extensions | existing capability authority | [../../prd/14-lifecycle-workflow-and-coverage-passes.md](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | High - owns the reusable coverage-pass extension model |
| Global Store and Project State | existing capability authority | [../../prd/38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) | High - owns operational evidence and repository-state boundaries |
| Template and dogfood source-of-truth contract | existing capability authority | [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority) | High - fixes upstream-first authoring and downstream projection |
| Compatibility and migration disposition | existing capability authority | [../../prd/18-compatibility-classification-and-migration-safety.md](../../prd/18-compatibility-classification-and-migration-safety.md) | High - requires classification before updates and protects modified project content |
| Playbook and persona authorities | existing capability authorities | [PRD 22](../../prd/22-project-documentation-asset-model.md#requirements), [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md#requirements), and [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md) | High - own persona separation, reusable Playbook delivery, and current Playbook structure |
| Agent-instruction ownership | existing capability authority | [../../prd/15-agent-instruction-ownership-and-managed-blocks.md](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | High - constrains managed instruction and router updates |

## Resolved Planning Decisions

The UAT design left seven questions for downstream planning. This bundle resolves them as follows:

1. **Canonical `NUAT-###` ownership:** the active capability PRD that owns the primary external user outcome carries a fixed `## Naive UAT Scenarios` section. A cross-subsystem scenario has one canonical owner and backlinks from contributing PRDs; work files never become a second scenario authority.
2. **Initial Project State evidence:** the documentation-first implementation reuses the current validation, review, closeout, and notes evidence seams. It does not add a dedicated evidence kind or schema field.
3. **Raw evidence storage:** the first implementation records consent-aware references to machine-local evidence or an explicitly exported, redacted portable bundle. It does not prescribe a new Global Store directory, retention daemon, encryption mechanism, size limit, or binary format.
4. **Deferral and cancellation authority:** only the durable product authority allowed to revise the owning PRD requirement may approve a `fail` or `revise` deferral, supported-scope narrowing, cancellation, or supersession. A facilitator, tester, implementer, or agent cannot make that product decision alone.
5. **Independent tester count:** the shared contract requires at least one valid independent naive run per claimed support-scope cell. A project may require more through its PRD severity or risk rules. There is no universal two-tester rule; additional successful runs never override a critical or major unresolved finding.
6. **Accessibility declaration:** each scenario records an `accessibility_basis` and the applicable assistive-technology or interaction scope. Projects select standards appropriate to their product surface; no web-only standard is imposed on CLI, API, device, SDK, or non-visual projects. Accessibility remains a separate coverage mode.
7. **Coordinate:** both designs proceed through this single W18 R15 plan, PRD, and backlog lineage.

## Current Authority Status

- Active PRD status: [PRD 45](../../prd/45-deferred-obligation-governance.md) owns deferred-obligation governance, and [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md) owns naive end-user acceptance testing.
- PRD maintenance status: complete. The PRD index, product overview, glossary, register, and existing capability owners were maintained in place; no revise-only PRDs were created.
- Register status: `docs/prd/03-open-questions-and-risk-register.md` contains the fixed `## Deferred Obligations` section, Active O-001, Deferred O-002, and conservative initial migration dispositions.
- Plan/work status: this W18 R15 plan exists; no W18 R15 work directory exists, so backlog generation is pending a separate approval.
- System-resource status: the completed step stopped at PRD maintenance. It did not create templates, contracts, Playbooks, skills, installed projections, migrations, or runtime changes.
- Current execution-state status: W18 R10 already provides stable project identity and work-evidence seams. W18 R15 consumes those seams and does not change their runtime implementation.
- Discovery still required for the backlog: inventory active deferral language and current UAT/manual-test artifacts relevant to the changed governance behavior. Archive material is read only when a current authority links to it or the new behavior exposes an old deferral.

The [W18 R15 P1 history record](../../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md) preserves the completed PRD-maintenance evidence and the explicit stop boundary.

## Current Authority And Pending Output

- Plan directory:
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/01-prd-capability-authority-and-baseline-reconciliation.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/02-system-contracts-and-scenario-governance.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/03-playbooks-dogfood-and-compatibility.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/04-delta-backlog-and-validation.md`
- Current capability-authority PRDs:
  - [PRD 45](../../prd/45-deferred-obligation-governance.md)
  - [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md)
- Maintained living authorities:
  - `docs/prd/00-index.md`
  - `docs/prd/01-product-overview.md`
  - `docs/prd/03-open-questions-and-risk-register.md`
  - `docs/prd/04-glossary.md`
- Current capability owners listed under `## Authority Maintenance Record`.
- Pending delta backlog:
  - `docs/work/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/`
  - `00-index.md` plus five dependency-ordered phase files defined in [Phase 4](./04-delta-backlog-and-validation.md).

## Current Capability Ownership

| Current authority | Kind | Ownership | Primary related authorities |
| --- | --- | --- | --- |
| [PRD 45](../../prd/45-deferred-obligation-governance.md) | capability | Defines the `O-###` register, phase-close orphan audit, authority chain, completion language, migration behavior, and repository/Global Store split | PRDs 03, 06, 09, 10, 14, 18, and 38 |
| [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md) | capability | Defines qualified naive testing, activation and valid `none`, `NUAT-###` scenarios, anti-coaching, evidence/outcomes, mode separation, finding routing, accessibility, and migration | PRDs 06, 09, 10, 14, 15, 18, 22, 34, 35, 38, 43, 44, and 47; PRD 45 as a sibling dependency |

PRD 45 was established first because PRD 46 uses its obligation links, capability-status language, and anti-orphan finding route. Both are current capability authorities in one reviewed PRD-maintenance set and cross-link each other.

## Authority Maintenance Record

| Maintained authority | Current relationship | Owning W18 R15 authority |
| --- | --- | --- | --- |
| `00-index.md`, `01-product-overview.md`, and `04-glossary.md` | Catalog and define the current capability authorities and terms | PRDs 45 and 46 |
| `03-open-questions-and-risk-register.md` | Owns the fixed obligation register, status semantics, O-001/O-002, and migration dispositions | PRD 45; PRD 46 for `none` and findings |
| PRDs 06, 09, 10, 14, and 18 | Own template/dogfood delivery, packaging validation, lifecycle coverage, and conservative compatibility boundaries | PRDs 45 and 46 |
| PRDs 15, 22, and 47 | Own managed instruction, documentation-asset, and persona boundaries | PRD 46 |
| PRDs 34 and 35 | Own Playbook structure, execution, and portability boundaries | PRD 46 |
| PRD 38 | Owns operational evidence versus repository authority without a W18 R15 schema change | PRDs 45 and 46 |
| PRDs 43 and 44 | Keep conformance and lab evidence distinct from naive UAT | PRD 46 |

PRD 20 remains the current conformance/support-claim boundary; former PRD 37 is historical provenance. Conformance evidence and internal testing are not naive UAT.

## Obligation Disposition

[The active PRD register](../../prd/03-open-questions-and-risk-register.md#deferred-obligations) now contains two initial obligations with conservative migration dispositions:

| Obligation | Current status | Current route | Disposition |
| --- | --- | --- | --- |
| O-001, Adversarial-Review Coverage Contract | Active | W18 R3 P2; [plan](../2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/02-adversarial-pass-contract.md) and [work source](../../work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/02-adversarial-pass-contract.md) | Retain as an active architecture-independent contract slice. The current W18 R3 work index remains deferred-and-split, so execution still requires owner authorization; this obligation is not terminally disposed. |
| O-002, Adversarial-Review Playbook Exposure | Deferred | Future owner-approved rewrite of W18 R3 P3-P4; current [plan P3](../2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/03-optional-surface-exposure.md), [plan P4](../2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/04-template-history-validation-closeout.md), [work P3](../../work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/03-optional-surface-exposure.md), and [work P4](../../work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/04-template-history-validation-closeout.md) are source candidates only | Retain as deferred. The existing P3-P4 backlog is explicitly non-executable as written and must be rewritten against the implemented v2 architecture before authorization; the accepted future outcome is not yet satisfied or terminally disposed. |

Downstream backlog generation must preserve all existing `D-###`, `Q-###`, `R-###`, and `O-###` identities; create another obligation only when accepted authority establishes a required future outcome; and link an activated naive-UAT `none` decision to an obligation when a future user-observable acceptance outcome remains required. The designs' optional future validator, CLI, database projection, dedicated evidence kind, and richer evidence-file management remain `not-an-obligation` for this documentation-first round unless product authority explicitly accepts one as owed. Capability status remains unverified until maintainer-dogfood migration and orphan-audit evidence exists.

## Plan Phase Map

| Plan phase | File | Current result | Status |
| --- | --- | --- | --- |
| 1 | [01-prd-capability-authority-and-baseline-reconciliation.md](./01-prd-capability-authority-and-baseline-reconciliation.md) | Established PRDs 45/46, O-001/O-002, maintained living authorities, and cross-links | Complete; recorded in [P1 history](../../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md) |
| 2 | [02-system-contracts-and-scenario-governance.md](./02-system-contracts-and-scenario-governance.md) | Defines the pending upstream contract, template, reference, prompt, and router implementation boundary | Not implemented; input to the pending backlog |
| 3 | [03-playbooks-dogfood-and-compatibility.md](./03-playbooks-dogfood-and-compatibility.md) | Defines the pending Playbook, dogfood/install projection, compatibility, evidence, and acceptance boundary | Not implemented; input to the pending backlog |
| 4 | [04-delta-backlog-and-validation.md](./04-delta-backlog-and-validation.md) | Defines the required work-bundle shape, validation bar, and owner handoff | Backlog generation pending separate authorization |

Dependency order remains strict: completed Phase 1 is current product authority; a separately approved Phase 4 work-generation step must map the still-pending Phase 2 and Phase 3 behavior into executable work before implementation begins.

## Worker Ownership

Pending backlog generation and implementation should remain delegation-ready. Worker labels describe responsibilities, not hard-coded agents.

| Worker | Scope | Write scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| System-resource worker | contracts, templates, references, prompts | `packages/docs/template/.make-docs/**` | PRD 45/46 | upstream documentation system resources |
| Playbook and router worker | tester/facilitator/lifecycle Playbooks and routers | `packages/docs/template/docs/**` | PRD 46 and system contracts | upstream Playbooks and instruction routing |
| Projection and compatibility worker | dogfood/install projection and migration fixtures | planned dogfood outputs and compatibility evidence only | upstream resource completion | byte-parity projection and legacy-state dispositions |
| Backlog worker | W18 R15 work bundle | `docs/work/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/**` | current PRDs 45/46 and maintained authorities | dependency-ordered delta backlog |
| Validation and fix worker | changed-doc and projection verification | changed files only when a fix is required | all outputs | validation evidence and traceability fixes |

The PRD-maintenance work is already complete and is not a pending worker assignment. When downstream work is authorized and delegation is available, the coordinator has write scope `none`, manages dependencies, and performs the owner-review handoff.

## MCP Strategy

- Preferred documentation server: `jdocmunch` for active designs, plans, PRDs, contracts, references, templates, Playbooks, and history.
- Preferred code server when later implementation inspects validators, projection code, or operation seams: `jcodemunch`.
- Reindex rule: refresh the local index when a source is missing or stale before falling back.
- Fallback: bounded direct file reads and `rg` only after the relevant index cannot supply current content.

## Validation

The completed PRD-maintenance step recorded that PRDs 45 and 46 use the feature-oriented subsystem contract, link both source designs and each other, maintain the living authorities in place, and add one fixed `## Deferred Obligations` section with unique O-001/O-002 records without converting existing `D-###`, `Q-###`, or `R-###` identities. Its [history record](../../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md) reports 1,075 tests passing plus targeted path, link, whitespace, and wave checks; the aggregate validator remained red only for pre-existing root instruction-router parity and line-budget debt. That step stopped before templates, contracts, Playbooks, skills, projections, migrations, runtime work, staging, commit, push, publication, or release.

The pending backlog and implementation must validate:

1. `NUAT-###` ownership is singular, links resolve, and every scenario or valid `none` record traces to requirements, work, and findings.
2. Upstream system resources are authored only under `packages/docs/template/`; dogfood copies are projected and byte-equivalent where the materialization contract requires it.
3. Testing/UAT records say `coverage_scope: non-persona`, while tester and facilitator Playbooks carry their own valid persona targets.
4. Tester packets contain no operator-only setup, success outcomes, internal terminology, expected answers, or hidden steps.
5. Existing projects without the new sections remain readable; modified or ambiguous project-owned content stops for review.
6. No new CLI command, MCP operation, store schema, database projection, evidence kind, or automatic migration appears in the delta backlog.
7. Repository documentation checks, path/link hygiene, wave numbering, template/default validation, and whitespace checks pass for the authorized delta.

## Dependencies

- W16 R0 lifecycle and coverage governance remains the foundation being revised.
- W18 R10 Global Store and Project State must remain available as operational evidence infrastructure, but its schema and runtime behavior remain unchanged.
- W10 R3 compatibility policy governs all legacy and modified-content handling.
- W10 R4 template/dogfood authority governs source and projection order.
- Current Playbook v2 contracts from W18 R12 constrain the new Playbooks.
- The two accepted design documents remain source inputs and must not be edited during downstream implementation unless the owner explicitly requests design revision.

## Intended Follow-On

- Route: `work-generation`
- Next prompt: `.make-docs/system/prompts/prd-change-to-work.prompt.md`
- Next step: generate the single W18 R15 delta backlog from current PRDs 45 and 46 plus the maintained existing authorities.
- Why: versioned product authority is complete; executable work must now be mapped before reusable Make Docs defaults or dogfood copies change.
- Coordinate Handoff: carry `W18 R15` from current PRD source metadata into the work directory, phase files, history breadcrumbs, and Project State evidence.

Saving this reconciled plan does not authorize backlog generation, system-resource edits, dogfood projection, migration, runtime work, commit, push, publication, release, or deployment.

## Owner Review Gate

Exact approval statement for the next lifecycle step:

> I approve generation of the W18 R15 delta backlog from current PRDs 45 and 46 and the maintained existing authorities, using the fixed source, projection, migration, non-persona coverage, anti-coaching, evidence, and anti-orphan boundaries in this plan. Do not implement system resources, project migrations, runtime behavior, CLI or MCP operations, Global Store or Project State changes, database changes, dogfood projection, publication, release, commit, or push without separate authorization.
