---
title: "Deferred Obligations and Anti-Orphan Governance"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "This feature revises the active PRD, coverage-pass, lifecycle, work-evidence, history, phase-gate, template, and compatibility contracts."
  coordinate_handoff: "Revises W16 R0 coverage governance and W18 R10 global-store state boundaries; recommended downstream coordinate W18 R14."
# coordinate: "W18 R14"
# source:
#   type: "manual-request"
#   path: "manual request for a v2 anti-orphan design"
# lifecycle:
#   default_arc: "design -> plan -> PRD -> work -> implementation"
#   departure: "source-to-design-straddle"
#   reason: "The user supplied the system-level problem and required design scope directly, so no separate source artifact was needed before design."
---

# Deferred Obligations and Anti-Orphan Governance

> Filename: `2026-07-27-deferred-obligations-and-anti-orphan-governance.md`. See `.make-docs/contracts/system/design-contract.md` for naming and structural rules.

## Purpose

Define a v2 anti-orphan feature that keeps every still-required capability or obligation visible, owned, routed, and dispositioned when delivery is deferred beyond the current phase. The feature closes a system-level guarantee gap without replacing Make Docs' existing risk and open-question register, PRD-to-backlog traceability, lifecycle coordinates, acceptance criteria, coverage passes, history records, phase gates, or machine-level work-execution evidence.

This design follows the normal planning arc in [lifecycle.md](../../.make-docs/references/system/lifecycle.md) after the user-authorized source-to-design straddle recorded in frontmatter. It stops at design and does not implement contracts, templates, validators, SQLite schema changes, CLI behavior, a plan, PRD revisions, or work backlogs.

## Context

Make Docs v2 already provides most of the components needed to reason about deferred work:

- The active PRD set has a living [open-question and risk register](../../.make-docs/references/system/prd-change-management.md) with stable decision, question, and risk identities.
- Designs, plans, PRD requirements, work backlogs, tasks, acceptance criteria, and source-document links provide forward and backward traceability.
- Wave, revision, phase, task, and acceptance-criterion coordinates describe where work belongs.
- The [coverage-pass contract](../../.make-docs/contracts/system/coverage-pass-contract.md) requires complete candidate enumeration, exactly one verdict per candidate, update-over-create behavior, history reconciliation, focused validation, and an explicit close summary.
- The [execution workflow](../../.make-docs/references/system/execution-workflow.md) derives work from the active PRD set and preserves dependency-ordered plans and delta backlogs.
- The [history-record contract](../../.make-docs/contracts/system/history-record-contract.md) preserves immutable, versioned session breadcrumbs without turning history into a live log.
- [Global Store and Project State](2026-07-01-global-store-and-project-state.md) places machine-local run-state and work-execution evidence in `~/.make-docs/store.db`, keyed by stable project and work-item identity, while versioned project knowledge remains in the repository.

Those mechanisms can show that a bounded phase was executed correctly, but they do not guarantee that a required outcome deferred by one authority is still owned by another. A design can say "later," a risk can carry a follow-up, an open question can resolve into future work, a PRD can defer part of a requirement, or an acceptance path can span multiple phases without a normative record requiring an owner, target coordinate, activation trigger, dependencies, and exit criteria. The coverage-pass spine can detect omitted candidates within a declared surface, but deferred obligations are not a mandatory phase-close surface. A phase can therefore be accurately phase-complete while being described imprecisely as feature-complete.

The W18 R10 store does not close this gap by itself. Its `work_evidence` records are relocated-canonical operational evidence; they are not versioned product requirements or obligation authority. Conversely, a Markdown-only solution that ignores the store would duplicate audit-run progress and closeout evidence that v2 deliberately removed from repositories. The anti-orphan feature must preserve that boundary:

1. Versioned project knowledge defines what remains owed and how it is routed.
2. Machine-local operational state records how the audit ran and whether its validation, review, and closeout gates passed.
3. Neither layer may silently substitute for the other.

## Decision

### Add a Canonical Deferred-Obligations Section to the Existing PRD Register

The active `docs/prd/03-open-questions-and-risk-register.md` document will gain a fixed `## Deferred Obligations` section. This section is the canonical active register for accepted deferred capabilities and obligations. It extends the existing living register rather than introducing a new numbered PRD core document, a parallel backlog, or a database-owned product contract.

Each obligation uses a stable project-wide `O-###` identity and a heading of the form `### O-001 <title>`. IDs are append-only, are never renumbered or reused, and remain valid when ownership, target coordinates, status, or source authorities change. A superseding obligation receives a new ID and links back to the superseded record.

Before a project has an active PRD register, the earliest owning design or plan may carry a temporary `## Deferred Obligations` section using the same record shape and ID namespace. The first PRD generation migrates those records without renumbering them and makes the PRD register authoritative. This pre-PRD allowance is a lifecycle handoff, not a permanent second register.

Every obligation record contains these required fields:

| Field | Contract |
| --- | --- |
| `ID` | Stable `O-###` identity. The heading and field must agree. |
| `Capability or obligation` | A testable statement of the outcome that remains owed, not merely the task that might produce it. |
| `Source authority` | Relative links and, where useful, anchors to every authority that establishes or materially changes the obligation. At least one source is required. |
| `Owner` | A durable accountable role, team, or project responsibility. A named person may be included, but an agent, chat, run, or execution session is not a durable owner. |
| `Target work coordinate` | The intended wave, revision, and phase when those coordinates exist, or another explicit work coordinate supported by the project. `Unresolved` is not a valid phase-close value. |
| `Activation trigger` | The observable event or decision that changes the record from `Deferred` to `Active`, or a date or coordinate when activation is unconditional. |
| `Dependencies` | Other obligation IDs and linked authority or work dependencies, or explicit `None`. |
| `Exit criteria` | Observable evidence required to mark the obligation fulfilled, including any end-to-end outcome spanning phases. |
| `Related acceptance scenarios` | Scenario IDs or linked acceptance criteria that demonstrate the full outcome, or explicit `None` with a rationale while the scenario is not yet defined. |
| `Status` | Exactly one of `Deferred`, `Active`, `Fulfilled`, `Cancelled`, or `Superseded`. |
| `Cancellation or supersession rationale` | Required for `Cancelled` and `Superseded`; otherwise explicit `None`. A superseded record links to its replacement. |
| `Last reviewed` | Date plus the change-plan or phase-close coordinate that last reconciled the record. |

`Deferred` means the obligation is accepted and routed but its activation trigger has not fired. `Active` means the obligation is due in the current work scope. `Fulfilled` means its exit criteria and related end-to-end acceptance scenarios have evidence. `Cancelled` means the source requirement or obligation was intentionally withdrawn through PRD change management. `Superseded` means another linked obligation or accepted authority replaces it. `Cancelled` and `Superseded` are terminal dispositions, not synonyms for "not done."

An optional, rejected, or explicitly non-required idea is not automatically an obligation. The authoring workflow must still classify explicit language such as "deferred," "later," "future," "follow-up," and "out of scope" when it appears next to a required outcome. It may receive a reasoned `none` verdict when the source authority establishes that nothing remains owed.

### Preserve the v2 Project-Knowledge and Operational-State Boundary

The versioned repository and global store have different anti-orphan responsibilities:

| Information | Canonical home | Rule |
| --- | --- | --- |
| Obligation identity, capability statement, source authority, owner, target, trigger, dependencies, exit criteria, status, and terminal rationale | Active PRD register in the repository | This is versioned project knowledge. It must survive database loss, machine changes, clones, and store pruning. |
| Requirement, design, plan, backlog, acceptance, and history backlinks | Their existing repository artifacts | The authority chain remains reviewable in Git and portable with the project. |
| Audit-run progress, candidate-enumeration progress, validation and review sign-offs, waivers, and closeout approval | Machine-level global store at `~/.make-docs/store.db` | This is work-execution evidence keyed by stable project ID and canonical work-item identity. It must not be copied into repository runtime-state files. |
| Durable decisions produced by an audit | PRD register and affected repository authorities | Operational evidence may prove that a decision was reviewed, but the decision itself must update versioned project knowledge. |
| Session breadcrumb | `docs/assets/archive/history/` | History summarizes material obligation deltas and links to authority; it does not duplicate the audit log or become the live register. |

The orphan audit may use the existing `validation`, `review`, `closeout`, and `notes` work-evidence seams to record its passed, waived, blocked, or informational evidence. The exact payload shape and whether a dedicated future `orphan-audit` evidence kind is warranted remain downstream implementation decisions. This design does not require a schema change to establish the documentation behavior.

A future SQLite obligation projection is permitted only as a rebuildable mirror or search index. The repository record remains canonical, the projection must identify its source document and content version, and rebuilding the projection must not change repository files. Adding such a projection requires a versioned store migration and explicit compatibility behavior; it is not part of the normative documentation feature.

If the database is missing, corrupt, pruned, or unavailable, Make Docs must not infer that an audit passed. The repository still retains all obligation meaning and routing, but capability status returns to `Capability status unverified` for the affected closeout boundary until the audit is rerun or valid work-execution evidence is restored. Cross-machine handoff carries the register through Git; audit evidence uses the existing explicit state export/import path when available or is rerun on the receiving machine.

### Preserve One Authority Chain and Add Backlinks

The deferred-obligations register owns current routing and status. Other artifacts participate through links and the responsibilities they already have:

| Authority or artifact | Anti-orphan responsibility |
| --- | --- |
| Decision or design | Identify any required outcome moved beyond the current scope, link or establish its `O-###` record, and state whether the design creates, changes, cancels, or supersedes the obligation. |
| Open question | Link the obligation when a possible answer would create or reroute required future work. On resolution, update the question and obligation together rather than copying the question text into a second unresolved record. |
| Risk | Link the obligation when mitigation, contingency, or follow-up must survive the current phase. The risk owns uncertainty and impact; the obligation owns the required future outcome. |
| PRD requirement | Link every obligation that defers part of the requirement or its end-to-end acceptance path. Cancelling the obligation requires the requirement to be removed, narrowed, or superseded through PRD change management. |
| Plan | Include an obligation disposition in the overview and phase mapping: carry, activate, reassign, fulfill, cancel, or supersede. Every active or targeted obligation maps to an explicit work coordinate. |
| Work backlog | Cite relevant `O-###` records in source PRD docs, tasks, and acceptance criteria. Backlog generation must not silently convert an obligation into an unlinked task or omit it because its target phase is later. |
| History record | Record material obligation deltas and the audit outcome as an immutable breadcrumb. Candidate-level operational detail stays in work-execution evidence. |
| Phase gate | Read the global-store validation, review, and closeout evidence; carry unresolved blockers, capability status, and next coordinates for obligations that remain deferred. |

Links work in both directions while artifacts remain active: the register links to source authorities and planned work, while the source requirement, change record, plan, or work item cites the obligation ID. An obligation may have several source links, but it has one canonical active record.

### Separate Phase Completion From Capability Completion

Make Docs will use the following completion language wherever a phase, feature, or capability is summarized:

- `Phase complete` means the bounded phase tasks and acceptance criteria are satisfied, the coverage-pass band is complete, the phase-close orphan audit passed, and the required closeout evidence is present in the global store.
- `Capability partial` means some intended behavior is delivered while one or more requirement-linked obligations remain `Deferred` or `Active`, or their end-to-end exit evidence is incomplete.
- `Capability complete` means every obligation linked to the capability is `Fulfilled`, or is `Cancelled` or `Superseded` through an accepted PRD change that also reconciles the source requirement, and the end-to-end acceptance scenarios have evidence.
- `Capability status unverified` means a legacy project has not completed its first anti-orphan migration and audit, or required local audit evidence is unavailable.

`Feature complete` is permitted only as a reader-facing synonym for `Capability complete`; it must not be inferred from a bounded phase's completion. A phase close with surviving obligations must say, for example, `Phase complete; capability status: partial; O-004 remains deferred to W3 R1 P2.` This permits honest implementation-slice closure without hiding an unfinished cross-phase outcome.

### Add a Required Phase-Close Orphan Audit to the Coverage Band

The orphan audit is a mandatory, non-persona coverage surface in the phase-close coverage band. It uses the existing coverage-pass skeleton and does not replace persona coverage, documentation and Playbook coverage, history, PRD reconciliation, validation, UAT, or manual-test passes.

The audit surface is the active authority chain plus the phase diff: accepted designs and change plans, the active PRD set, the active plan and work backlog, the deferred-obligations register, the current phase's acceptance criteria, repository changes, and material history created by the phase. Archived artifacts are consulted only when an active authority links to them or the current change exposes an older deferral.

Candidate enumeration includes:

- New or changed statements using deferral language such as "deferred," "later," "future," "follow-up," or "out of scope" when a required outcome may remain.
- Decisions, open questions, and risks whose resolution or mitigation creates future required work.
- PRD requirements or acceptance paths only partially represented in the current phase.
- Obligations targeted at the current or any completed coordinate.
- Obligations whose activation trigger fired, owner disappeared, target changed, dependency changed, source link broke, or exit evidence was produced.
- Cross-phase acceptance scenarios not represented by an owned obligation and target coordinate.

Every candidate receives exactly one audit verdict:

| Orphan-audit verdict | Base coverage verdict | Required result |
| --- | --- | --- |
| `register-new` | `update-existing` | Add a fully populated record to the canonical active register. |
| `update-routing` | `update-existing` | Repair owner, target, trigger, dependency, source, or acceptance traceability while preserving the ID. |
| `activate` | `update-existing` | Change `Deferred` to `Active` and reconcile the current plan and backlog. |
| `fulfill` | `update-existing` | Record exit and end-to-end acceptance evidence, then change status to `Fulfilled`. |
| `cancel-or-supersede` | `update-existing` | Reconcile the source requirement through PRD change management and record the rationale or replacement. |
| `link-existing` | `link-only` | Add a backlink to an existing obligation without duplicating its active record. |
| `already-owned` | `none` | Record why the candidate already has complete, valid ownership and routing. |
| `not-an-obligation` | `none` | Record why the source does not establish a required future outcome. |

`Orphan` is an audit finding, not a terminal disposition. The audit cannot close while any candidate lacks a verdict, an accepted obligation lacks a required field, a source and register disagree, a link is broken, a target is unresolved, a current-or-past-target obligation lacks an explicit disposition, or a triggered obligation is absent from the active plan and work backlog.

The pass applies the existing history idempotency rule once per work session. The repository receives only durable register, authority, backlog, acceptance, and breadcrumb changes. The global store receives the operational audit record: stable project and work-item identity, audit status, candidate and verdict counts, validation and review decisions, evidence references, blockers, and closeout approval. Candidate-level details may remain operational unless they establish a durable decision; every durable decision updates the repository authority before the pass closes.

An unresolved orphan blocks the Make Docs `Phase complete` label and lifecycle handoff because the coverage band is incomplete. It does not by itself create a release, merge, publish, push, or commit gate; a project may establish those stronger gates separately.

### Carry Obligations Through Change Planning, PRD Evolution, Backlog Generation, and Phase Gates

Change planning loads the canonical register before proposing scope. The change plan classifies every obligation affected by the change as `carry`, `activate`, `reassign`, `fulfill`, `cancel`, or `supersede`, maps every nonterminal affected record to an explicit wave, revision, and phase, and identifies newly exposed candidates from the design delta.

PRD revision updates the obligation record and its linked requirement, risk, question, glossary, or acceptance material in the same change set. A question or risk may close while its obligation remains deferred; closing uncertainty does not fulfill the required outcome. Cancellation or supersession is valid only when active PRD authority reflects the corresponding product decision.

Backlog generation derives tasks and acceptance criteria from active and target-phase obligations while preserving `O-###` links. The work index and phase file include relevant obligation records in source authority and dependency context. A later-phase obligation remains visible in the plan even when no current-phase implementation task is generated for it.

History records summarize added, rerouted, activated, fulfilled, cancelled, and superseded obligations plus the audit result. They remain immutable breadcrumbs. Operational status transitions and sign-offs are recorded through the global-store evidence seam rather than copied into history.

The phase gate reads global-store work-execution evidence keyed to the current project, wave slug, and phase path. It requires:

- A completed orphan-audit status and evidence references.
- Candidate and verdict totals proving complete enumeration.
- The IDs and next coordinates of obligations still `Deferred`.
- The IDs of obligations activated or fulfilled in the phase.
- No unresolved orphan blockers.
- A capability-status statement supported by the register and acceptance evidence.

### Require End-to-End Acceptance Scenarios

The documentation contract is accepted only if it can preserve these end-to-end scenarios:

1. **Multi-phase capability:** A design defers a required outcome beyond the first delivery slice. An `O-###` record links the design and PRD requirement, names an owner, maps the target phase, and defines a trigger and end-to-end exit criteria. The first phase closes as `Phase complete; capability status: partial`; global-store evidence proves the audit passed. A later phase activates and fulfills the same record, supplies cross-phase acceptance evidence, and then permits `Capability complete`.
2. **Question or risk becomes work:** An open question resolves or a risk mitigation becomes mandatory after the current backlog was generated. The question or risk closes or changes status, its linked obligation activates, change planning maps it to work, and the audit rejects any state where the uncertainty closes but the required outcome disappears.
3. **Scope moves without identity loss:** A change plan moves an obligation to another wave, revision, phase, or owner. The same `O-###` remains canonical, old and new authorities remain traceable, the active register shows the new route, and history records the durable delta.
4. **Intentional cancellation or supersession:** Product authority withdraws or replaces a requirement. PRD change management updates the source requirement, the obligation records its rationale or replacement ID, generated backlog deltas remove or replace affected work, and the audit confirms the outcome was dispositioned rather than silently dropped.
5. **Orphan introduced during execution:** A phase implementation or acceptance finding exposes required later work absent from the plan. The phase-close audit remains blocked in work-execution evidence until a complete obligation is registered and routed. A vague history note or operational evidence row cannot substitute for the repository change.
6. **Database loss or corruption:** The repository retains every obligation and backlink, but prior local audit sign-off is unavailable. Make Docs reports `Capability status unverified`, reruns the audit or restores valid evidence, and never reconstructs obligation meaning from stale operational payloads.
7. **Cross-machine continuation:** A clone receives the same versioned obligations. The receiving machine imports explicitly portable run evidence or reruns the orphan audit; it never assumes another machine's unshared SQLite state.
8. **Legacy active project:** A project has deferred language but no obligation section. Migration inventories the active authority chain, creates stable records without renumbering existing `D-###`, `Q-###`, or `R-###` entries, marks capability status unverified until the first audit passes, and does not rewrite archived artifacts or modified user content automatically.

Each obligation's exit criteria points to the end-to-end evidence that closes the outcome, not only to a task-local assertion. When one scenario spans several phase files, the canonical record names the full scenario and each work item names the portion it proves.

### Make Documentation Behavior Normative and Automation Layered

The anti-orphan guarantee is documentation-governed. After the downstream change plan updates active contracts, templates, prompts, Playbooks, and dogfood documents, authors and executors must maintain the register and run the audit even when no dedicated validator exists. Markdown authority defines what remains owed.

V2 already supplies operational infrastructure that the workflow may use without changing the meaning of the feature: a stable project identifier, canonical work-item identity, `work.evidence.record` and `work.evidence.read`, and global-store evidence kinds for validation, review, closeout, notes, commit policy, commit, and push. This design does not add a runtime command or prescribe a new database table.

The downstream change plan must update at least:

- The PRD change-management and output contracts.
- The active PRD register template and routers that name its fixed sections.
- Lifecycle, execution, coverage-pass, history, phase-gate, change-planning, PRD-generation, and backlog-generation guidance.
- The upstream template source under `packages/docs/template/`, followed by dogfood regeneration into `.make-docs/` and `docs/` under the maintainer source-of-truth rule.
- Tester and acceptance material for the scenarios in this design.
- Work-evidence guidance that binds the orphan-audit result to stable project and work-item identity without copying operational state into repository artifacts.

A future validator or CLI operation may inventory candidates, check the register, and report missing sections, duplicate or malformed `O-###` IDs, invalid statuses, absent required fields, broken links, unresolved or past target coordinates, dependency cycles, triggered records missing from active work, unsupported completion language, and absent work-execution evidence. It may write audit progress and sign-offs through the existing global-store seam.

Automation must not infer or assign an owner, invent a target coordinate, decide that a requirement is optional, activate an ambiguous trigger, mark exit criteria satisfied, cancel an obligation, or rewrite modified user content. Those are authority decisions. A future SQLite mirror may accelerate cross-project queries, but it remains rebuildable from repository authority and cannot become the only copy.

### Migrate Existing Projects and Stores Conservatively

New installations receive the updated register section and authoring guidance from the canonical package template. The maintainer workflow updates `packages/docs/template/` first and then dogfoods the installed copies; it does not author shipped defaults directly in the maintainer repository's installed instance.

Existing projects remain readable. Absence of `## Deferred Obligations` is a legacy state, not immediate corruption. Their first qualifying change plan, PRD revision, or phase-close coverage band performs a scoped migration before claiming verified capability status:

1. Inventory deferral candidates in the active authority chain and current work, using archived material only when linked or newly exposed.
2. Add the fixed register section without overwriting modified user content.
3. Create `O-###` records for accepted obligations and record `not-an-obligation` reasons for reviewed candidates that do not establish required outcomes.
4. Add backlinks as active files are touched; do not mass-rewrite archive history.
5. Reconcile target coordinates and run the first orphan audit.
6. Record the audit's validation, review, and closeout evidence in the global store.
7. Replace `Capability status unverified` only after the active chain and local evidence both pass.

Existing `D-###`, `Q-###`, and `R-###` records retain their IDs and meanings. A `Deferred` question or risk is an audit candidate but is not automatically converted into an obligation; it links to a new `O-###` only when a required future outcome exists. Existing work coordinates, file numbering, plan lineage, history identities, and archived artifacts remain stable.

Existing v2 stores require no immediate schema migration because the documentation feature can use the current work-evidence model. If downstream planning chooses a dedicated evidence kind or obligation mirror table, it must version and migrate `store.db`, handle newer-schema databases explicitly, preserve write-ahead logging and locking behavior, and keep repository knowledge recoverable without the database. No legacy evidence is fabricated or silently backfilled.

Compatibility follows [Compatibility Audit and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md): known legacy states receive explicit migrations, unchanged generated defaults may receive planned template updates, and modified or ambiguous states stop for human reconciliation. There is no silent overwrite and no opportunistic repository-wide backfill.

## Alternatives Considered

### Make SQLite the Canonical Obligation Register

Rejected. Obligation meaning, source authority, ownership, routing, and status are versioned project knowledge. A machine-local database is not shared through Git, may be pruned on uninstall, and must be recoverable without loss of project knowledge. SQLite owns operational evidence, not the product contract.

### Add a New Fixed PRD Core File

Rejected. The [output contract](../../.make-docs/contracts/system/output-contract.md) defines the fixed PRD core and assigns living change-management state to `03-open-questions-and-risk-register.md`. A new numbered core file would alter the sequence and create a parallel reconciliation location.

### Represent Obligations Only as Risks or Open Questions

Rejected. A risk owns uncertainty, likelihood, impact, and mitigation; an open question owns a decision still to be made. A deferred obligation can remain after the risk is accepted or the question is answered and needs different ownership, routing, activation, and exit semantics.

### Represent Obligations Only as Backlog Tasks

Rejected. Tasks are phase-scoped implementation units that can be moved, split, regenerated, or omitted before a later phase is expanded. The obligation must survive backlog transformations and describe the capability outcome rather than one implementation step.

### Store the Whole Audit in Repository History

Rejected. V2 intentionally relocates run-state and work-execution evidence to the global store. History remains a concise, immutable breadcrumb for durable project changes; copying candidate progress and sign-offs into history would reintroduce duplicate runtime state.

### Add a Standalone Coverage Workflow

Rejected. The base coverage-pass contract already supplies complete-enumeration, verdict, history-idempotency, and validation mechanics. The orphan audit is a mandatory coverage surface, not a parallel closeout system.

### Wait for a Dedicated Validator or CLI Command

Rejected. Ownership, source authority, trigger meaning, cancellation, and exit evidence are documentation decisions that automation cannot safely infer. The guarantee must work through the authority chain first; future tooling can check it and persist operational evidence.

## Consequences

The design creates one durable identity for every accepted deferred outcome and makes that identity visible across decisions, uncertainty tracking, requirements, planning, execution, acceptance, history, and closeout. It permits honest phase closure while preventing phase-local success from being mislabeled as whole-capability completion.

The fixed PRD register gains a new normative record class and therefore requires coordinated changes across contracts, references, templates, prompts, Playbooks, dogfood content, tester material, and work-evidence guidance. The maintainer source-of-truth rule makes this broader than a local template edit.

Every phase-close coverage band gains an audit cost. That cost is bounded by the active authority chain and current diff. Projects with many legacy deferrals pay a one-time migration and reconciliation cost before they can claim verified capability status.

The repository/global-store split introduces an explicit recovery rule: obligation knowledge survives independently, but missing operational evidence invalidates the prior local completion claim until evidence is restored or the audit reruns. This is safer than either treating database loss as product-knowledge loss or treating absent evidence as an implicit pass.

The following mechanics remain unresolved for downstream change planning:

1. Which project authority may approve `Cancelled` status: product owner, PRD owner, or another explicitly configured role?
2. Must `Owner` always name a durable role with an optional person, or may a project define another durable ownership form?
3. Should orphan-audit evidence use existing `validation`, `review`, `closeout`, and `notes` payloads only, or should a future CLI change add a dedicated `orphan-audit` evidence kind?
4. Should v2 add a rebuildable SQLite obligation mirror for cross-project queries, or leave cross-project discovery to repository scanning until demonstrated demand exists?
5. When audit evidence is absent on another machine, which evidence export/import forms qualify as portable enough to avoid rerunning the audit?
6. Should a dependency cycle always block phase close, or may project authority classify its severity?

No runtime, CLI, schema, contract, template, PRD, plan, work, history, or phase-gate behavior changes as part of this design-only artifact.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs:
  - [Coverage-Pass Extensions and Adversarial Review](2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
  - [Global Store and Project State](2026-07-01-global-store-and-project-state.md)
  - [Generated Metadata and Lifecycle Handoffs](2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
  - [v2 Documentation Asset IA Hard Move](2026-06-25-v2-documentation-asset-ia-hard-move.md)
  - [Compatibility Audit and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
  - [Coverage-Pass Contract and Skill Evolution](../assets/archive/designs/2026-05-28-coverage-pass-contract-and-skill-evolution.md)
- Reason: This design adds a distinct mandatory governance surface across the existing coverage, PRD, lifecycle, and W18 R10 state boundaries. It extends those decisions without superseding their coverage mechanics, repository IA, compatibility rules, or project-knowledge versus operational-state split.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: This feature revises the active PRD, coverage-pass, lifecycle, work-evidence, history, phase-gate, template, and compatibility contracts.
- Coordinate Handoff: Revises W16 R0 coverage governance and W18 R10 global-store state boundaries; recommended downstream coordinate W18 R14.
