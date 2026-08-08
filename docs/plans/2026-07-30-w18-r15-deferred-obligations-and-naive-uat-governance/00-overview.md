---
title: "W18 R15 Deferred Obligations and True Naive UAT Governance"
kind: "plan"
status: "draft"
coordinate: "W18 R15"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/prompts/plan-to-prd-change.prompt.md"
  why: "The two approved designs must become one reconciled active-PRD contract before Make Docs system resources, default Playbooks, dogfood projections, migration guidance, or implementation work are changed."
  coordinate_handoff: "Carry W18 R15 into the two new capability-authority PRDs, the reconciled existing PRD authorities, and the single downstream delta backlog; preserve W18 R14 as the deferred-obligation design lineage while treating W18 R15 as the owner-selected combined implementation revision."
source:
  type: "design"
  path: "docs/designs/2026-07-27-true-naive-end-user-acceptance-testing.md"
---

# W18 R15 Deferred Obligations and True Naive UAT Governance

## Purpose

Produce one reviewable change plan that reconciles [Deferred Obligations and Anti-Orphan Governance](../../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md) with [True Naive End-User Acceptance Testing](../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md). The combined change gives Make Docs a durable way to preserve required future outcomes and an honest way to determine when a real, isolated end user must test an installed product.

The two capabilities share the same authority chain:

1. Versioned PRD authority defines obligations, user outcomes, scenarios, findings, and dispositions.
2. Plans and work backlogs route those records without duplicating their meaning.
3. The phase-close coverage band enumerates candidates, records decisions, and blocks unsupported completion claims.
4. Project State in the machine-level Global Store records operational progress and evidence without becoming product authority.
5. Reusable Make Docs resources are authored under `packages/docs/template/` first, then projected into this maintainer repository and end-user projects.

## Objective

This plan is complete when it fixes the downstream PRD shape, system-resource catalog, source-versus-projection paths, lifecycle behavior, compatibility policy, and dependency-ordered backlog shape needed to implement both designs without re-deriving their decisions.

The downstream documentation round is complete when:

- two new capability-authority PRDs carry the genuinely novel anti-orphan and naive-UAT requirements, while existing PRDs are reconciled in place for behavior they already own;
- every genuinely impacted baseline PRD has a `### Change Notes` backlink;
- [the active register](../../prd/03-open-questions-and-risk-register.md) has the fixed `## Deferred Obligations` section and a scoped first-migration disposition;
- the active PRD index and glossary reflect the new authorities and terms;
- one W18 R15 delta backlog maps every normative design decision to an owned implementation phase;
- no runtime, CLI, MCP, database-schema, Global Store, Project State, or automatic migration work is included in the first implementation;
- validation proves upstream template authority, dogfood/install projection parity, traceability, anti-coaching separation, and conservative compatibility behavior.

## Coordinate Decision

- Coordinate: `W18 R15`
- Classification: `revision`
- Evidence: The anti-orphan design recommends W18 R14 because it revises W16 R0 coverage governance and consumes W18 R10 state boundaries. The naive-UAT design recommends W18 R15, requires explicit reconciliation with the sibling W18 R14 design, and leaves the final combined-versus-split decision to owner approval. The owner requested one plan bundle for both designs. No W18 R14 or W18 R15 plan or work directory exists, while W18 R13 is the latest completed revision. W18 R15 therefore becomes the combined downstream coordinate, and W18 R14 remains source lineage rather than a separate implementation bundle.

## Lifecycle Position

This request follows the default lifecycle arc: accepted designs -> plan -> reconciled PRD capability authorities -> delta work backlog -> implementation. There is no lifecycle-stage skip.

The only coordination adjustment is that two sibling design handoffs are merged into one plan revision. The reason is explicit owner direction plus the UAT design's dependency on the anti-orphan trigger, finding, and capability-completion rules. PRD generation and implementation remain separate approval gates.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no
- PRD strategy: two new numbered revision documents plus scoped baseline annotations
- Backlog strategy: one W18 R15 delta backlog

## Change Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Deferred Obligations and Anti-Orphan Governance | design document | [../../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md](../../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md) | High - owner directed combined planning from this design |
| True Naive End-User Acceptance Testing | design document | [../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md](../../designs/2026-07-27-true-naive-end-user-acceptance-testing.md) | High - owner directed combined planning and resolved its coordinate question |
| Active open-question, drift, and risk register | living PRD authority | [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) | High - canonical current register; it does not yet contain `## Deferred Obligations` |
| Lifecycle foundation | existing capability authority | [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md) | High - owns lifecycle ordering and phase-close behavior |
| Coverage-pass extensions | existing capability authority | [../../prd/31-revise-coverage-pass-extensions-adversarial-review.md](../../prd/31-revise-coverage-pass-extensions-adversarial-review.md) | High - owns the reusable coverage-pass extension model |
| Global Store and Project State | existing capability authority | [../../prd/38-revise-global-store-and-project-state.md](../../prd/38-revise-global-store-and-project-state.md) | High - owns operational evidence and repository-state boundaries |
| Template and dogfood source-of-truth contract | existing capability authority | [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md) | High - fixes upstream-first authoring and downstream projection |
| Compatibility and migration disposition | existing capability authority | [../../prd/18-revise-compatibility-audit-and-migration-disposition.md](../../prd/18-revise-compatibility-audit-and-migration-disposition.md) | High - requires classification before updates and protects modified project content |
| Playbook and persona authorities | existing capability authorities | [PRD 22](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md), [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md), and [PRD 34](../../prd/34-revise-playbook-contract-and-model.md) | High - own persona separation, reusable Playbook delivery, and current Playbook structure |
| Agent-instruction ownership | existing capability authority | [../../prd/15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md) | High - constrains managed instruction and router updates |

## Resolved Planning Decisions

The UAT design left seven questions for downstream planning. This bundle resolves them as follows:

1. **Canonical `NUAT-###` ownership:** the active capability PRD that owns the primary external user outcome carries a fixed `## Naive UAT Scenarios` section. A cross-subsystem scenario has one canonical owner and backlinks from contributing PRDs; work files never become a second scenario authority.
2. **Initial Project State evidence:** the documentation-first implementation reuses the current validation, review, closeout, and notes evidence seams. It does not add a dedicated evidence kind or schema field.
3. **Raw evidence storage:** the first implementation records consent-aware references to machine-local evidence or an explicitly exported, redacted portable bundle. It does not prescribe a new Global Store directory, retention daemon, encryption mechanism, size limit, or binary format.
4. **Deferral and cancellation authority:** only the durable product authority allowed to revise the owning PRD requirement may approve a `fail` or `revise` deferral, supported-scope narrowing, cancellation, or supersession. A facilitator, tester, implementer, or agent cannot make that product decision alone.
5. **Independent tester count:** the shared contract requires at least one valid independent naive run per claimed support-scope cell. A project may require more through its PRD severity or risk rules. There is no universal two-tester rule; additional successful runs never override a critical or major unresolved finding.
6. **Accessibility declaration:** each scenario records an `accessibility_basis` and the applicable assistive-technology or interaction scope. Projects select standards appropriate to their product surface; no web-only standard is imposed on CLI, API, device, SDK, or non-visual projects. Accessibility remains a separate coverage mode.
7. **Coordinate:** both designs proceed through this single W18 R15 plan, PRD, and backlog lineage.

## Baseline Context

- Active `docs/prd/` status: active flat namespace, docs `00` through `44`; next available numbers are `45` and `46`.
- Active plan/work status: W18 R13 is the latest existing W18 revision; neither W18 R14 nor W18 R15 has a plan or work directory.
- Current register status: `docs/prd/03-open-questions-and-risk-register.md` contains drift, question, and risk namespaces but no `O-###` namespace or fixed deferred-obligations section.
- Current reusable-resource status: coverage, lifecycle, PRD, work, history, template, and Playbook resources exist, but no shared deferred-obligation contract, naive-UAT contract, naive-UAT scenario template, tester Playbook, or facilitator Playbook exists.
- Current execution-state status: W18 R10 already provides stable project identity and work-evidence seams. This round consumes those seams and does not change their runtime implementation.
- Discovery pass required: yes, but scoped. PRD generation and backlog generation must inventory active deferral language and current UAT/manual-test artifacts relevant to the changed governance behavior. Archive material is read only when an active authority links to it or the new behavior exposes an old deferral.

## Output Contract

- Plan directory:
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/01-prd-capability-authority-and-baseline-reconciliation.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/02-system-contracts-and-scenario-governance.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/03-playbooks-dogfood-and-compatibility.md`
  - `docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/04-delta-backlog-and-validation.md`
- New capability-authority PRDs:
  - `docs/prd/45-deferred-obligation-governance.md`
  - `docs/prd/46-naive-end-user-acceptance-testing.md`
- Direct living-authority updates:
  - `docs/prd/00-index.md`
  - `docs/prd/03-open-questions-and-risk-register.md`
  - `docs/prd/04-glossary.md`
- Baseline annotations: the PRDs listed under `## Baseline Annotation Plan`.
- Delta backlog:
  - `docs/work/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/`
  - `00-index.md` plus five dependency-ordered phase files defined in [Phase 4](./04-delta-backlog-and-validation.md).

## Change Doc Strategy

| New doc | Kind | Why it exists | Primary affected authorities |
| --- | --- | --- | --- |
| `45-deferred-obligation-governance.md` | capability | Defines the `O-###` register, phase-close orphan audit, authority chain, completion language, migration behavior, and repository/Global Store split | PRDs 03, 14, 18, 19, 31, and 38 |
| `46-naive-end-user-acceptance-testing.md` | capability | Defines qualified naive testing, activation and valid `none`, `NUAT-###` scenarios, anti-coaching, evidence/outcomes, mode separation, finding routing, accessibility, and migration | PRDs 14, 15, 18, 19, 22, 29, 31, 34, and 38; PRD 45 as a sibling dependency |

PRD 45 is written first because PRD 46 uses its obligation links, capability-status language, and anti-orphan finding route. Both documents are new capability authorities in one reviewed PRD reconciliation set and cross-link each other.

## Baseline Annotation Plan

| Existing authority | Impacted sections | Reconciliation action | Target capability authority |
| --- | --- | --- | --- |
| `03-open-questions-and-risk-register.md` | fixed section spine, status semantics, source anchors | revise and extend | PRD 45; link PRD 46 for `none` and findings |
| `04-glossary.md` | lifecycle, coverage, testing, evidence, and completion terms | add | PRDs 45 and 46 |
| `06-template-contracts-and-generated-assets.md` | system templates and generated default behavior | revise | PRDs 45 and 46 |
| `09-dogfood-and-maintainer-operations.md` | upstream-first dogfood delivery and parity verification | revise | PRDs 45 and 46 |
| `14-add-lifecycle-workflow-foundation.md` | coverage band, phase gate, phase/capability completion | revise | PRDs 45 and 46 |
| `15-revise-agent-instruction-file-ownership.md` | managed router guidance and anti-coaching instruction ownership | update in place | PRD 46 |
| `18-revise-compatibility-audit-and-migration-disposition.md` | legacy classification, modified-content protection, first qualifying migration | update in place | PRDs 45 and 46 |
| `19-revise-template-package-dogfood-source-of-truth-contract.md` | upstream source and installed projection | update in place | PRDs 45 and 46 |
| `22-revise-new-docs-assets-playbooks-persona-model.md` | non-persona coverage versus persona-targeted reader artifacts | update in place | PRD 46 |
| `29-revise-playbook-contract-run-playbook.md` | tester/facilitator workflow assets and execution boundary | update in place | PRD 46 |
| `31-revise-coverage-pass-extensions-adversarial-review.md` | candidate enumeration, verdicts, testing modes, orphan audit | update in place | PRDs 45 and 46 |
| `34-revise-playbook-contract-and-model.md` | current Playbook v2 resource conformance | update in place | PRD 46 |
| `38-revise-global-store-and-project-state.md` | operational evidence versus repository authority | update in place without schema change | PRDs 45 and 46 |

PRDs 20 and 37 are verification-only boundaries: conformance evidence must not be relabeled as naive UAT, but no annotation is required unless PRD execution finds text that currently permits that substitution.

## Obligation Disposition

The active PRD register has no `O-###` records yet, so there are no existing obligation IDs to carry, activate, reassign, fulfill, cancel, or supersede during this planning step.

The downstream PRD and backlog round must:

- inventory active deferral candidates before adding the first `O-###` record;
- preserve all existing `D-###`, `Q-###`, and `R-###` identities;
- create an obligation only when accepted authority establishes a required future outcome;
- classify the designs' optional future validator, CLI, database projection, dedicated evidence kind, and richer evidence-file management as `not-an-obligation` for this documentation-first round unless product authority explicitly accepts one as owed;
- link every activated naive-UAT `none` decision to an `O-###` record when a future user-observable acceptance outcome remains required;
- keep capability status unverified until the maintainer dogfood's first scoped migration and orphan audit have valid local evidence.

## Plan Phase Map

| Plan phase | File | Result |
| --- | --- | --- |
| 1 | [01-prd-capability-authority-and-baseline-reconciliation.md](./01-prd-capability-authority-and-baseline-reconciliation.md) | Fixes PRD 45/46 content, register migration, glossary/index work, in-place authority reconciliation, and cross-links |
| 2 | [02-system-contracts-and-scenario-governance.md](./02-system-contracts-and-scenario-governance.md) | Fixes exact upstream contract, template, reference, prompt, and router changes |
| 3 | [03-playbooks-dogfood-and-compatibility.md](./03-playbooks-dogfood-and-compatibility.md) | Fixes tester/facilitator Playbooks, dogfood/install projection, conservative migration, evidence boundaries, and acceptance examples |
| 4 | [04-delta-backlog-and-validation.md](./04-delta-backlog-and-validation.md) | Fixes the five-phase work backlog, validation bar, and owner handoff |

Dependency order is strict: Phase 1 defines product authority; Phase 2 encodes that authority in reusable system resources; Phase 3 adds reader workflows and delivery/migration behavior; Phase 4 generates and validates the executable backlog.

## Worker Ownership

The future PRD and backlog execution should remain delegation-ready. Worker labels describe responsibilities, not hard-coded agents.

| Worker | Scope | Write scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| PRD authority worker | PRDs 45/46 and requirement anchors | new capability-authority PRDs only | approved plan | PRD 45 and PRD 46 |
| Register and baseline worker | living register, glossary, baseline annotations | PRDs 00, 03, 04, 06, 09, 14, 15, 18, 19, 22, 29, 31, 34, 38 | PRD 45/46 draft anchors | fixed register, index, glossary, backlinks |
| System-resource worker | contracts, templates, references, prompts | `packages/docs/template/.make-docs/**` | PRD 45/46 | upstream documentation system resources |
| Playbook and router worker | tester/facilitator/lifecycle Playbooks and routers | `packages/docs/template/docs/**` | PRD 46 and system contracts | upstream Playbooks and instruction routing |
| Projection and compatibility worker | dogfood/install projection and migration fixtures | planned dogfood outputs and compatibility evidence only | upstream resource completion | byte-parity projection and legacy-state dispositions |
| Backlog worker | W18 R15 work bundle | `docs/work/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/**` | all PRD decisions fixed | dependency-ordered delta backlog |
| Validation and fix worker | changed-doc and projection verification | changed files only when a fix is required | all outputs | validation evidence and traceability fixes |

When delegation is available, the coordinator has write scope `none`, manages dependencies, and performs the owner-review handoff.

## MCP Strategy

- Preferred documentation server: `jdocmunch` for active designs, plans, PRDs, contracts, references, templates, Playbooks, and history.
- Preferred code server when later implementation inspects validators, projection code, or operation seams: `jcodemunch`.
- Reindex rule: refresh the local index when a source is missing or stale before falling back.
- Fallback: bounded direct file reads and `rg` only after the relevant index cannot supply current content.

## Validation

The PRD/backlog round must validate:

1. PRDs 45 and 46 use the feature-oriented subsystem contract and link both designs plus each other.
2. Every baseline listed above contains the required `### Change Notes` backlink, with no silent rewrite or renumbering.
3. PRD 03 contains exactly one fixed `## Deferred Obligations` section, unique append-only `O-###` IDs, and no automatic conversion of `D-###`, `Q-###`, or `R-###`.
4. `NUAT-###` ownership is singular, links resolve, and every scenario or valid `none` record traces to requirements, work, and findings.
5. Upstream system resources are authored only under `packages/docs/template/`; dogfood copies are projected and byte-equivalent where the materialization contract requires it.
6. Testing/UAT records say `coverage_scope: non-persona`, while tester and facilitator Playbooks carry their own valid persona targets.
7. Tester packets contain no operator-only setup, success outcomes, internal terminology, expected answers, or hidden steps.
8. Existing projects without the new sections remain readable; modified or ambiguous project-owned content stops for review.
9. No new CLI command, MCP operation, store schema, database projection, evidence kind, or automatic migration appears in the delta backlog.
10. Repository documentation checks, path/link hygiene, wave numbering, template/default validation, and whitespace checks pass.

## Dependencies

- W16 R0 lifecycle and coverage governance remains the foundation being revised.
- W18 R10 Global Store and Project State must remain available as operational evidence infrastructure, but its schema and runtime behavior remain unchanged.
- W10 R3 compatibility policy governs all legacy and modified-content handling.
- W10 R4 template/dogfood authority governs source and projection order.
- Current Playbook v2 contracts from W18 R12 constrain the new Playbooks.
- The two untracked design documents remain the accepted source inputs and must not be edited as part of plan creation or downstream implementation unless the owner explicitly requests design revision.

## Intended Follow-On

- Route: `prd-generation`
- Next step: generate PRDs 45 and 46, update the scoped baseline authorities, then create the single W18 R15 delta backlog.
- Why: the PRD set must become the versioned product contract before reusable Make Docs defaults or dogfood copies change.
- Coordinate Handoff: carry `W18 R15` into PRD source metadata, the work directory, phase files, history breadcrumbs, and Project State evidence.

Saving or approving this plan does not authorize PRD generation, backlog generation, system-resource edits, dogfood projection, migration, runtime work, commit, push, publication, release, or deployment.

## Owner Review Gate

Exact approval statement for the next lifecycle step:

> I approve the W18 R15 Deferred Obligations and True Naive UAT Governance plan bundle as the authoritative basis for active PRD evolution and one scoped delta backlog. Proceed with PRDs 45 and 46 and the W18 R15 backlog using the fixed source, projection, migration, non-persona coverage, anti-coaching, evidence, and anti-orphan boundaries in this plan. Do not implement system resources, project migrations, runtime behavior, CLI or MCP operations, Global Store or Project State changes, database changes, dogfood projection, publication, release, commit, or push without separate authorization.
