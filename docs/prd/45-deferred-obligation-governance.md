---
title: "45 Deferred Obligation Governance"
kind: "prd"
status: "active"
coordinate: "W18 R15"
source:
  type: "plan"
  path: "docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md"
---

# 45 Deferred Obligation Governance

## Purpose

Define the Make Docs capability that prevents accepted future work, cross-phase outcomes, and remediation findings from disappearing when a bounded phase closes. The capability adds stable deferred-obligation identity, one canonical register, phase-close orphan auditing, honest phase-versus-capability completion language, and lifecycle routing from source authority through later fulfillment.

This document is the feature authority for deferred-obligation governance. It is not a revision ledger. Existing lifecycle, coverage, compatibility, template-delivery, and Project State PRDs remain authoritative for their own behavior and are reconciled in place to consume this capability.

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
| Orphan audit | Enumerate deferral candidates and assign a complete disposition before phase close | [31 Coverage Pass Extensions](31-revise-coverage-pass-extensions-adversarial-review.md) and the future upstream coverage contract |
| Lifecycle routing | Carry, activate, reassign, fulfill, cancel, or supersede obligations through plan, PRD, work, history, and gates | [14 Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md) |
| Completion semantics | Distinguish bounded phase completion from full capability completion | This PRD and PRD 14 |
| Operational evidence | Record audit execution, review, and closeout evidence without moving product meaning into SQLite | [38 Global Store and Project State](38-revise-global-store-and-project-state.md) |
| Compatibility | Introduce the section and links without silently overwriting modified project content or rewriting archives | [18 Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md) |

## Requirements

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

### R-OBL-AUDIT Phase-Close Orphan Audit

- R-OBL-AUDIT-1 (MUST): every phase close runs a mandatory, non-persona orphan-audit surface within the normal coverage band. It does not replace persona coverage, documentation and Playbook coverage, PRD reconciliation, testing/UAT, accessibility, visual/manual testing, automated testing, or validation.
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

- [14 Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md) consumes the orphan audit in the coverage band and owns phase/capability completion language.
- [18 Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md) owns classification and modified-content safety for existing projects.
- [19 Template Package Dogfood Source of Truth](19-revise-template-package-dogfood-source-of-truth-contract.md) owns upstream-first delivery from `packages/docs/template/` to dogfood and installed projects.
- [31 Coverage Pass Extensions](31-revise-coverage-pass-extensions-adversarial-review.md) owns the common enumeration, verdict, history-idempotency, and validation mechanics.
- [38 Global Store and Project State](38-revise-global-store-and-project-state.md) owns operational evidence storage and the non-authoritative database boundary.
- [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) routes valid testing/UAT `none`, `revise`, `fail`, and `blocked` outcomes through obligations when later product work remains owed.

## Rebuild Notes

Implement this capability documentation-first. The first implementation changes Make Docs contracts, templates, prompts, Playbooks, and lifecycle guidance upstream under `packages/docs/template/`, then projects reviewed copies into the maintainer dogfood and instantiated projects. It does not require runtime commands, validators, a new store schema, or a migration engine.

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

## Non-Requirements

- No SQLite-owned canonical obligation register.
- No new fixed PRD core file.
- No automatic conversion of every deferred risk, question, option, or requirement into `O-###`.
- No substitution of backlog tasks for durable obligation identity.
- No repository copy of operational audit state.
- No dedicated CLI, MCP tool, validator, evidence kind, table, or migration in the PRD-only reconciliation.
- No automatic merge, commit, push, publish, or release gate.

## Source Anchors

- [Deferred Obligations and Anti-Orphan Governance design](../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md)
- [W18 R15 combined plan](../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md)
- [W18 R15 P1 reconciliation history](../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [14 Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [18 Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [19 Template Package Dogfood Source of Truth](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [31 Coverage Pass Extensions](31-revise-coverage-pass-extensions-adversarial-review.md)
- [38 Global Store and Project State](38-revise-global-store-and-project-state.md)
- [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md)
- [Coverage pass contract](../../.make-docs/contracts/system/coverage-pass-contract.md)
- [Output contract](../../.make-docs/contracts/system/output-contract.md)
- [Legacy PRD change-management rules, overridden by the owner for capability-oriented reconciliation](../../.make-docs/references/system/prd-change-management.md)
