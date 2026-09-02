---
title: "45 Deferred Obligation Governance"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md"
---

# 45 Deferred Obligation Governance

## Purpose

Define the Make Docs capability that prevents accepted future work, cross-phase outcomes, and remediation findings from disappearing when a bounded phase closes. The capability adds stable deferred-obligation identity, one canonical register, phase-close orphan auditing, honest phase-versus-capability completion language, and lifecycle routing from source authority through later fulfillment.

This document is the feature authority for deferred-obligation governance. It is not a revision ledger. The lifecycle, coverage, compatibility, template-delivery, and Project State PRDs own their respective integration behavior and consume the obligation contract defined here.

## Scope

The capability applies to required outcomes established by designs, PRD requirements, accepted decisions, risk mitigations, open-question resolutions, testing findings, and execution discoveries when those outcomes will not be fulfilled in the current bounded scope.

It governs:

- stable `O-###` identities and the canonical `## Deferred Obligations` register in [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md);
- ownership, target work coordinates, activation triggers, dependencies, exit criteria, acceptance traceability, status, and terminal rationale;
- a mandatory non-persona orphan-audit surface in the phase-close coverage band;
- planning, PRD, backlog, history, and phase-gate consumption;
- repository-authoritative project knowledge versus machine-local operational evidence;
- conservative adoption by existing projects.

It does not make every optional idea, open question, rejected alternative, or unimplemented requirement an obligation. An `O-###` record exists only when accepted product authority establishes a required future outcome that must survive the current scope.

## Component and Capability Map

| Component | Capability | Primary authority |
| --- | --- | --- |
| Deferred-obligation register | Preserve one append-only record for every accepted deferred outcome | [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md) |
| Orphan audit | Enumerate deferral candidates and assign a complete disposition before phase close | [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) and the upstream coverage contract |
| Lifecycle routing | Carry, activate, reassign, fulfill, cancel, or supersede obligations through plan, PRD, work, history, and gates | [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) |
| Completion semantics | Distinguish bounded phase completion from full capability completion | This PRD and PRD 14 |
| Operational evidence | Record audit execution, review, and closeout evidence without moving product meaning into SQLite | [38 Global Store and Project State](38-global-store-and-project-state.md) |
| Compatibility | Introduce the section and links without silently overwriting modified project content or rewriting archives | [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) |

## Requirements

### R-OBL-TEST Testing Deferral Boundary

- R-OBL-TEST-1 (MUST): a testing activity creates a durable obligation only when accepted current authority establishes a future outcome that remains owed and the record has an owner, activation trigger, target, exit criteria, and reason.
- R-OBL-TEST-2 (MUST NOT): `not-needed-now`, `not-applicable`, a declined Guided Progress Review, skipped advisory testing, or “test later” without accepted future authority cannot create an `O-###` record.
- R-OBL-TEST-3 (MUST): an advisory finding creates later work only when the owner accepts remediation as a required future outcome.
- R-OBL-TEST-4 (MUST): an obligation preserves owed work. It cannot turn a non-blocking activity into a gate, rewrite a test result, or imply product acceptance.

### R-OBL-ID Canonical Register and Identity

- R-OBL-ID-1 (MUST): the active `docs/prd/03-open-questions-and-risk-register.md` contains one fixed `## Deferred Obligations` section. It extends the existing living register and does not create a new fixed-core file, parallel backlog, or database-owned product contract.
- R-OBL-ID-2 (MUST): each accepted deferred outcome uses a stable project-wide `O-###` identifier. IDs are append-only, never reused, and never renumbered when ownership, target, status, or source authority changes.
- R-OBL-ID-3 (MUST): before a project has an active PRD register, the earliest owning design or plan may carry a provisional record using the same shape and ID namespace. The first PRD generation migrates the record without changing its identity and makes PRD 03 authoritative.
- R-OBL-ID-4 (MUST): a superseding obligation receives a new ID and links to the superseded record. `Cancelled` and `Superseded` require accepted product-authority rationale and are not synonyms for unfinished work.
- R-OBL-ID-5 (MUST): every record contains the fields defined in `## Contracts and Data`. A target of `Unresolved`, a session as owner, or vague activation language such as “later” is invalid at phase close.

### R-OBL-AUTH Authority Chain and Backlinks

- R-OBL-AUTH-1 (MUST): the register owns current obligation identity, routing, and status. Designs, PRD requirements, questions, risks, plans, work items, acceptance scenarios, and history link to that record without copying it into another live register.
- R-OBL-AUTH-2 (MUST): links remain bidirectional while artifacts are active. The obligation links to every source that establishes or materially changes it, and affected active authorities cite the `O-###` identity.
- R-OBL-AUTH-3 (MUST): a risk owns uncertainty and impact, an open question owns a decision still to be made, and an obligation owns an accepted future outcome. Resolving a question or accepting a risk does not fulfill a linked obligation.
- R-OBL-AUTH-4 (MUST): cancelling or superseding an obligation requires the owning PRD requirement to be removed, narrowed, or superseded through product authority. An agent, facilitator, implementation session, or evidence row cannot make that decision alone.
- R-OBL-AUTH-5 (MUST): history records summarize material obligation deltas and link to repository authority. They do not become the live register or duplicate candidate-level audit state.
- R-OBL-AUTH-6 (MUST): a naive-UAT finding retains its canonical finding identity, scenario/result binding, evidence references, severity, reproducibility, disposition, and gate status under PRD 46. When the finding establishes accepted later work, a linked `O-###` routes that owed outcome without duplicating the finding, replacing its evidence, or changing its gate result.
- R-OBL-AUTH-7 (MUST): a performance applicability disposition of `defer-required` and remediation that remains owed by a bounded performance waiver route through one stable `O-###` record. The obligation links the governing [48 Performance Evidence Governance](48-performance-evidence-governance.md) authority and applicable profile, result, waiver, or finding without duplicating those records, changing their meaning, or becoming a second performance authority.

### R-OBL-AUDIT Phase-Close Orphan Audit

- R-OBL-AUDIT-1 (MUST): every phase close runs a mandatory, non-persona orphan-audit surface within the normal coverage band. It does not replace persona coverage, documentation coverage, PRD reconciliation, testing/UAT, accessibility, visual/manual testing, automated testing, or validation.
- R-OBL-AUDIT-2 (MUST): enumeration covers changed deferral language, decisions and risks that create future work, partially represented PRD outcomes, obligations targeted at the current or a completed coordinate, fired triggers, missing owners, changed dependencies, broken source links, produced exit evidence, and cross-phase acceptance paths without owned routing.
- R-OBL-AUDIT-3 (MUST): every candidate receives exactly one verdict: `register-new`, `update-routing`, `activate`, `fulfill`, `cancel-or-supersede`, `link-existing`, `already-owned`, or `not-an-obligation`.
- R-OBL-AUDIT-4 (MUST): the audit cannot pass while a candidate lacks a verdict; a record lacks a required field; source and register disagree; a target is unresolved; a triggered obligation is absent from active plan/work authority; a current-or-past-target record lacks a disposition; or fulfillment lacks exit and end-to-end acceptance evidence.
- R-OBL-AUDIT-5 (MUST): unresolved orphan findings block the Make Docs `Phase complete` label and lifecycle handoff. They do not automatically create a merge, commit, push, publish, or release gate unless the project separately establishes one.
- R-OBL-AUDIT-6 (MUST): history idempotency applies once per work session. Durable decisions update repository authority before close; operational candidate progress and sign-offs remain Project State.

### R-OBL-COMPLETE Phase and Capability Status

- R-OBL-COMPLETE-1 (MUST): `Phase complete` means bounded phase tasks and acceptance criteria are satisfied, the coverage band and orphan audit are complete, and required closeout evidence exists.
- R-OBL-COMPLETE-2 (MUST): `Capability partial` means intended behavior is delivered while one or more linked obligations remain `Deferred` or `Active`, or their end-to-end exit evidence is incomplete.
- R-OBL-COMPLETE-3 (MUST): `Capability complete` means every linked obligation is `Fulfilled`, or is `Cancelled` or `Superseded` through accepted PRD authority, and the end-to-end acceptance scenarios have evidence.
- R-OBL-COMPLETE-4 (MUST): `Capability status unverified` applies when a legacy project has not completed its first migration/audit or required machine-local evidence is unavailable.
- R-OBL-COMPLETE-5 (MUST): `Feature complete` may be used only as a reader-facing synonym for `Capability complete`; it cannot be inferred from one completed phase.

### R-OBL-FLOW Lifecycle Consumption

- R-OBL-FLOW-1 (MUST): change planning loads the register and classifies each affected obligation as `carry`, `activate`, `reassign`, `fulfill`, `cancel`, or `supersede`.
- R-OBL-FLOW-2 (MUST): PRD reconciliation updates the obligation and every affected requirement, risk, question, acceptance route, or glossary term in the same change set.
- R-OBL-FLOW-3 (MUST): backlog generation preserves `O-###` links in source authority, tasks, dependencies, and acceptance criteria. Later-phase obligations remain visible even when no current-phase task is generated.
- R-OBL-FLOW-4 (MUST): phase gates consume audit status, candidate/verdict totals, evidence references, activated and fulfilled IDs, surviving deferred IDs with next coordinates, unresolved blockers, and the supported capability-status statement.
- R-OBL-FLOW-5 (MUST): task completion alone does not fulfill an obligation. Fulfillment requires the record’s exit criteria and related end-to-end acceptance evidence.
- R-OBL-FLOW-6 (MUST): registering, updating, activating, or fulfilling an obligation does not alter an Unassisted Goal Test result, finding, rerun trigger, or gate effect. PRD 46 owns the authoritative result and disposition. `not-needed-now` creates no obligation unless separate accepted future authority establishes an outcome that remains owed.
- R-OBL-FLOW-7 (MUST): registering, updating, activating, or fulfilling an obligation does not rewrite a performance outcome, waive a target, close a performance finding, or satisfy a performance gate. Task and obligation status cannot alter a recorded `PERF-###` result; only an authority-approved disposition and any required separately authorized later result may change current performance acceptance under PRD 48.

### R-OBL-STATE Repository and Project State Boundary

- R-OBL-STATE-1 (MUST): obligation meaning, sources, ownership, routing, trigger, dependencies, exit criteria, status, and terminal rationale are versioned repository knowledge.
- R-OBL-STATE-2 (MUST): audit-run progress, candidate counts, validation/review/closeout decisions, waivers, blockers, and raw evidence references are operational Project State keyed by stable project and canonical work-item identity.
- R-OBL-STATE-3 (MUST): the documentation-first implementation may use current `validation`, `review`, `closeout`, and `notes` evidence seams. It does not require a new evidence kind, table, payload schema, lock behavior, or write path.
- R-OBL-STATE-4 (MUST): a future SQLite projection is rebuildable and non-authoritative. Database loss cannot erase or change obligation meaning.
- R-OBL-STATE-5 (MUST): missing, corrupt, pruned, or unavailable evidence never implies that the audit passed. Repository meaning remains available, but the affected closeout boundary returns to `Capability status unverified` until evidence is restored or the audit reruns.

### R-OBL-COMPAT Existing-Project Adoption

- R-OBL-COMPAT-1 (MUST): new installations receive the register section and authoring guidance through upstream template delivery.
- R-OBL-COMPAT-2 (MUST): absence of `## Deferred Obligations` in an existing project is a legacy state, not immediate corruption.
- R-OBL-COMPAT-3 (MUST): the first qualifying change plan, PRD reconciliation, or phase close inventories active deferral candidates, creates records only for accepted required outcomes, adds backlinks as active files are touched, assigns explicit dispositions, and runs the first audit before claiming verified capability status.
- R-OBL-COMPAT-4 (MUST): existing `D-###`, `Q-###`, `R-###`, work coordinates, filenames, history identities, and archived artifacts remain stable. A `Deferred` risk or question is a candidate, not an automatic obligation.
- R-OBL-COMPAT-5 (MUST): unchanged managed defaults may receive a planned update; modified or ambiguous project content stops for human reconciliation. No archive-wide rewrite or silent overwrite is allowed.
- R-OBL-COMPAT-6 (MUST): the documentation-first capability requires no immediate Global Store schema migration and fabricates no historical evidence.

### R-OBL-ACCEPT End-to-End Acceptance

The implementation must preserve the end-to-end scenarios in `## Acceptance Scenarios`. Each obligation’s exit criteria describe the full outcome, not merely a phase-local assertion.

## Contracts and Data

Every obligation record uses this contract:

| Field | Requirement |
| --- | --- |
| `ID` | Stable `O-###` identity matching the heading |
| `Capability or obligation` | Testable outcome still owed |
| `Source authority` | At least one relative source link; include every source that materially changes the obligation |
| `Owner` | Durable role, team, or project responsibility; never only an agent, chat, run, or session |
| `Target work coordinate` | Explicit wave/revision/phase or another supported concrete coordinate |
| `Activation trigger` | Observable event or unconditional date/coordinate that changes `Deferred` to `Active` |
| `Dependencies` | Obligation IDs and linked authority/work dependencies, or explicit `None` |
| `Exit criteria` | Observable evidence required for fulfillment, including cross-phase outcomes |
| `Related acceptance scenarios` | Scenario IDs/links, or explicit `None` with rationale while not yet defined |
| `Status` | `Deferred`, `Active`, `Fulfilled`, `Cancelled`, or `Superseded` |
| `Cancellation or supersession rationale` | Required for terminal cancellation/supersession; otherwise `None` |
| `Last reviewed` | Date plus change-plan or phase-close coordinate |

Status meanings are:

| Status | Meaning |
| --- | --- |
| `Deferred` | Accepted and routed; activation trigger has not fired |
| `Active` | Due in current work scope |
| `Fulfilled` | Exit criteria and related end-to-end acceptance evidence are satisfied |
| `Cancelled` | Owning product authority intentionally withdrew the requirement |
| `Superseded` | A linked obligation or accepted authority replaces the record |

Storage boundaries are:

| Information | Canonical home |
| --- | --- |
| Obligation meaning and routing | Active PRD register |
| Requirement, design, plan, work, acceptance, and history links | Their existing repository artifacts |
| Audit execution progress and sign-offs | Unified Project State in the machine-level Global Store |
| Durable audit decisions | PRD register and affected repository authorities |
| Session summary | `docs/assets/archive/history/` |
| Optional query projection | Rebuildable, non-authoritative database projection |

## Integrations

- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) consumes the orphan audit in the coverage band and owns phase/capability completion, common enumeration, verdict, history-idempotency, and validation mechanics.
- [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) owns classification and modified-content safety for existing projects.
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), and [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) jointly own upstream-first delivery from `packages/docs/template/` through reviewed dogfood projection and installed-package proof.
- [38 Global Store and Project State](38-global-store-and-project-state.md) owns operational evidence storage and the non-authoritative database boundary.
- [46 Unassisted Goal Testing](46-naive-end-user-acceptance-testing.md) owns canonical scenario results, findings, evidence references, dispositions, and any explicit gate effect. This PRD routes only accepted later work and never converts `not-needed-now`, a non-blocking result, or a declined activity into an obligation.
- [50 Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md) owns the common gate, evidence, stop, rerun, and testing-deferral rules.

## Rebuild Notes

Implement this capability documentation-first. The first implementation changes Make Docs contracts, templates, prompts, references, and lifecycle guidance upstream under `packages/docs/template/`, then projects reviewed copies into the maintainer dogfood and instantiated projects. It does not require dedicated obligation runtime commands, validators, a new store schema, or a migration engine.

Future deterministic support may detect missing sections, duplicate IDs, invalid fields/statuses, broken links, unresolved targets, dependency cycles, fired triggers absent from active work, unsupported completion language, and missing evidence. Automation must not invent owners, choose targets, interpret ambiguous triggers, decide optionality, mark exit criteria satisfied, cancel requirements, or overwrite modified user content.

## Acceptance Scenarios

1. A multi-phase capability closes its first phase as `Phase complete; capability status: partial`, keeps one routed obligation, then activates and fulfills that same record in later work before claiming `Capability complete`.
2. An open question resolves or a risk mitigation becomes mandatory; uncertainty closes while the required outcome activates and becomes owned work rather than disappearing.
3. A plan moves an obligation to another owner or coordinate without changing its `O-###` identity, and history records the durable routing delta.
4. Product authority intentionally cancels or supersedes an outcome; PRD requirements, obligation rationale, and later work reconcile together.
5. Execution exposes required future work absent from the plan; phase close remains blocked until a complete record and route exist.
6. Database loss preserves obligation meaning in Git but makes local audit status unverified until evidence is restored or the audit reruns.
7. A clone receives the same versioned obligations and either imports explicitly portable evidence or reruns the audit.
8. A legacy project gains the section through scoped migration without renumbering existing risk/question IDs, rewriting archives, or overwriting modified content.
9. An Unassisted Goal Test `friction` finding creates a linked obligation only when the owner accepts later remediation as required. The obligation does not rewrite the finding, change its gate effect, or require a rerun without a current rerun trigger.
10. A Guided Progress Review is declined; the phase remains valid and no obligation is created.
11. A testing decision records `not-needed-now`; the orphan audit accepts the disposition because no future outcome is owed.

## Non-Requirements

- No SQLite-owned canonical obligation register.
- No new fixed PRD core file.
- No automatic conversion of every deferred risk, question, option, or requirement into `O-###`.
- No substitution of backlog tasks for durable obligation identity.
- No repository copy of operational audit state.
- The current capability does not require a dedicated CLI, MCP tool, validator, evidence kind, table, or migration.
- No automatic merge, commit, push, publish, or release gate.

## Requirement History

### 2026-08-14 — W19 R1

- Affected requirement or section: `R-OBL-AUTH Authority Chain and Backlinks`, `R-OBL-FLOW Lifecycle Consumption`, `Integrations`, and `Rebuild Notes`
- Previous contract: Naive-UAT outcomes could be described as routed through obligations without an explicit boundary preserving canonical findings, evidence references, dispositions, and gate results; delivery also assumed Playbook resources.
- Replacement contract: PRD 46 remains authoritative for UAT scenarios, outcomes, findings, evidence, dispositions, and gates, while `O-###` records route only accepted later work and cannot convert an unsatisfied UAT state into acceptance; obligation resources no longer assume Playbook delivery.
- Rationale: W19 R1 separates authoritative UAT evidence and gate consumption from durable future-work routing while rehoming reusable workflow policy into first-class system resources.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, integrations, and acceptance scenarios.
- Previous contract: UAT `none`, blocked, failed, revised, and unresolved states commonly routed future work and could imply an unsatisfied gate.
- Replacement contract: Testing creates an obligation only for an accepted future outcome with complete routing. `not-needed-now`, declined guided review, and skipped advisory testing do not create obligations or gates.
- Rationale: Anti-orphan governance must preserve real owed work without manufacturing procedural debt.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 performance evidence plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [48 Performance Evidence Governance](48-performance-evidence-governance.md)
- [50 Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md)
- [Deferred Obligations and Anti-Orphan Governance design](../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md)
- [W18 R15 combined plan](../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md)
- [W18 R15 P1 reconciliation history](../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md)
- [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md)
- [38 Global Store and Project State](38-global-store-and-project-state.md)
- [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md)
- [Coverage pass contract](../../.make-docs/system/contracts/coverage-pass-contract.md)
- [Output contract](../../.make-docs/system/contracts/output-contract.md)
- [PRD authority-maintenance rules](../../.make-docs/system/references/prd-change-management.md)
