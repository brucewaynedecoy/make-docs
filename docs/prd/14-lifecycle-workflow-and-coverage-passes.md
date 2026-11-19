# 14 Lifecycle Workflow and Coverage Passes

## Purpose

This PRD carries Human Experience Intent and proportionate testing decisions through the lifecycle as cross-cutting quality controls. Neither Human Experience nor testing is a new linear stage.

This document defines the current product contract for lifecycle workflow, coverage passes, and phase-close routing. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

The scope includes Human Experience mapping, current-decision testing selection, explicit gate effects, evidence reuse, Human Experience Review as an agent-owned lens, optional experience handoffs, real-surface review, and bounded completion claims.

This authority owns lifecycle workflow, coverage passes, and phase-close routing. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

- [PRD 49](49-human-experience-standard-and-intent.md) owns the standard and impact model. This PRD owns lifecycle propagation, coverage candidacy, obligation routing, and phase-close use.
- This PRD owns plan and work coordinate selection, plan and backlog amendment, and Change History under `### Coordinate Selection and Amendment`. [PRD 51](51-backlog-review-and-reporting.md) owns the snapshot facts that support them.

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Human Experience Lifecycle and Review

- Design records one impact value and the Human Experience Intent.
- Planning maps each accepted experience promise to an owning PRD, affected surface or artifact, work phase, evidence mode, and obligation route.
- PRD reconciliation places each observable human outcome in the PRD that owns the capability.
- Work traces tasks and acceptance criteria to the owning promise or preserved boundary. Generic acceptance such as `UX is good` is invalid.
- Direct-impact implementation and review inspect the real human surface when it exists.
- Coverage records Human Experience Review as an agent-owned lens over suitable evidence and the built result. It does not create a fifth testing type, require duplicate evidence, or require an owner response by default.
- Completed direct human-facing work normally includes a short optional experience handoff. Silence, refusal, or no feedback does not block closure or create an obligation.
- Human acceptance blocks only when the user, an accepted design or PRD, release authority, or safety authority explicitly names the scope, human reviewer, surface, acceptance question, and gate effect.
- A bounded caveat must name the affected promise, evidence limit, risk, owner, and follow-on route.

- **Coverage-pass contract** — a single reference owning the decision-frame
  mechanics shared by closeout-style passes: a seven-step skeleton; base verdict
  semantics (`create`/`update-existing`/`link-only`/`none`) as a spine; named
  surfaces (guide/library, history, PRD, testing/UAT); a verdict axis separate
  from a persona-target axis; the history-record idempotency rule; the
  verdict-and-reason rule; and a validation checklist. The optional
  adversarial-review coverage-pass extension is part of this authority. It adds
  optional adversarial-review candidates and maps adversarial
  verdicts back to the base spine.
- **Performance evidence qualification boundary** — performance is a distinct non-persona coverage disposition governed by [PRD 48](./48-performance-evidence-governance.md), not an adversarial-review verdict or a Persona-targeted UAT decision. The coverage band inventories new or changed quantitative thresholds, absolute performance language, performance-sensitive claims, work criteria stricter than source authority, expired evidence, fingerprint changes, unresolved findings or waivers, and repeated checks. Each candidate keeps the base `create`/`update-existing`/`link-only`/`none` action and separately records `required-now`, `characterize-now`, `defer-required`, `not-needed`, or `reject-unsupported`, with a reason and canonical profile or obligation link when applicable.
- **Always-read lifecycle anchor** — an authoritative reference stating the
  lifecycle arc (optional artifacts inputs; Segment 1 plan; Segment 2 build loop
  with the coverage band; Segment 3 release/archival/retrospective), the default
  ordering (implementation derives from a work backlog), and a straddle rule
  that defaults to the arc while requiring departures to be surfaced rather than
  taken silently. No hard "never skip" gate.
- **Four-type testing boundary** — [PRD 50](50-proportionate-testing-and-human-centered-validation.md)
  owns Automated Implementation Testing, Performance Testing, Guided Progress
  Review, and Unassisted Goal Testing as the exact core taxonomy. Coverage selects
  only the types that can change a current decision. Guided Progress Review uses
  the owner, maintainer, or developer and is never a hard gate. When Unassisted
  Goal Testing activates, [PRD 46](46-naive-end-user-acceptance-testing.md) and
  [PRD 47](47-persona-model.md) preserve intended-audience resolution, evidence
  routing, qualified-human isolation, and anti-coaching as separate concerns.
- **Stage follow-on handoffs** — plans, PRDs, and work backlogs gain an
  advisable-default-but-overridable `## Intended Follow-On`, mirroring design
  docs, so the chain stops breaking between stages. PRD 23 adds the generated
  metadata layer for these handoffs.
- **Optional artifacts seed** — on-demand `docs/assets/project/`, a zero-contract home for
  pre-design inputs, accommodating ideation and architecture as an input surface
  rather than contract-bound stages.

All stage vocabulary is domain-neutral so the capability serves non-software
documentation work.

Doc anchors:

- `docs/assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md`
- `docs/assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md`

### Coordinate Selection and Amendment

Plans and work backlogs carry a `W{W} R{R}` coordinate, and their phases carry `W{W} R{R} P{P}`. This section owns how an agent selects that coordinate and how a committed plan or backlog changes. The shipped [Wave Model reference](../../.make-docs/system/references/wave-model.md) explains the procedure. [PRD 51](51-backlog-review-and-reporting.md) owns the deterministic facts that support it.

- R-COORD-1 (MUST): a Wave (`W`) is a self-contained unit of work, and it defines the scope of that work. A Wave can be a full build, one domain slice, or one change request. A plan is the statement of work for one W/R. The active PRD set is the product authority. A plan or work backlog never overrides it, and a backlog can be rebuilt from it.
- R-COORD-2 (MUST): a Phase is complete only when its work is done, closed out, and committed or deployed. Phase work that is done but not committed is not complete. It can be edited or undone in place.
- R-COORD-3 (MUST): a revision Phase is the next unused `P` in the same W/R. It changes the result of a completed Phase and carries no other coordinate marker. A revision Wave is the next unused `R` of a Wave. It is a change order for completed work and has its own plan and work backlog. `R0` is the base revision of every Wave.
- R-COORD-4 (MUST): the agent selects a coordinate in this order:
  1. A coordinate that the user states.
  2. The outcome test in R-COORD-5.
  3. Lineage Wave handling under R-COORD-6 through R-COORD-8.
  4. Archived lineage handling under R-COORD-9.
  5. The highest-wave rule in R-COORD-10.
- R-COORD-5 (MUST): a request that adds an outcome that no Wave's plan promised is new work. New work can be a new capability or an enhancement, and the test is decided by outcome, not by code area. New work gets a new Wave at the highest existing `W` plus one, with `R0`. A Wave can be small. A PRD `create` decision is strong evidence of new work, but it does not decide the result alone. When an unfinished Wave could also absorb the outcome, the owner chooses between extending that Wave and starting a new one.
- R-COORD-6 (MUST): a request that changes an outcome that an existing Wave promised belongs to that lineage Wave. For each affected Phase that is not complete, the agent edits the existing backlog in place when the change does not significantly deviate from the plan. When it does significantly deviate, the owner chooses one of two paths: amend the same plan and backlog in place, or finish the Wave and then open a revision Wave.
- R-COORD-7 (MUST): a change significantly deviates from a plan when it changes the plan's goal, scope, or non-goals; replaces the plan's chosen approach or architecture; or adds a product capability that the plan does not name. These changes are not significant deviations: adding, splitting, or reordering Phases or tasks inside the stated scope; fixing defects; and adjusting tests or evidence.
- R-COORD-8 (MUST): a change to a completed Phase is a revision Phase unless at least one of these is true, in which case it is a revision Wave:
  1. It reverses an approach or architecture choice in the plan, so the plan must be rewritten rather than extended.
  2. It must redo the results of two or more completed Phases.
  3. It needs its own design, or a plan with several Phases.

  Deployment alone does not make a change a revision Wave.
- R-COORD-9 (MUST): when the lineage Wave is archived, the owner approves first. The agent then restores that Wave's plan and work backlog to the working set under their existing names and applies R-COORD-6 through R-COORD-8.
- R-COORD-10 (MUST): a newer, unrelated Wave never moves work to a new Wave. The highest-wave scan is used only for new work. A project with no prior plan or work record starts at `W1 R0`.
- R-COORD-11 (MUST): the agent asks the owner before it takes any of these actions:
  - a significant plan deviation on an unfinished Wave;
  - a revision Wave;
  - a new Wave when an existing Wave could absorb the work;
  - a backlog rebuild from the PRD;
  - an archived-Wave restore;
  - a revision Phase whose R-COORD-8 result is borderline.

  The agent decides alone when it edits unfinished work that fits the plan, and when it adds a clear revision Phase.
- R-COORD-12 (MUST): an owner question for an R-COORD-11 action names the choice, the reason, and the effect, and follows the user action request rules of the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md). For a coordinate choice that the agent makes alone, the agent's reply names the choice and the reason. A coordinate choice is never silent.
- R-COORD-13 (MUST): after a plan or work backlog has been committed once, each later scope edit adds one entry to a `## Change History` section. The section sits at the end of the work `00-index.md`, or at the end of the plan `00-overview.md` when the plan changes. A scope edit adds, removes, or rewrites tasks, acceptance criteria, or Phases. Checked tasks, status changes, closeout notes, and evidence links are progress, not scope edits, and need no entry. A plan or backlog that has not been committed is a draft and needs no entries.
- R-COORD-14 (MUST): Change History follows the requirement-history shape. It has one dated `### {{DATE}} — {{COORDINATE}}` entry per coherent change, with the newest entry last. The coordinate is the most specific one affected. Each entry records these fields:
  - `Kind`, which is one of `edit`, `revision-phase`, `pivot`, `rebuild`, or `revision-wave`;
  - `Affected scope`;
  - `Previous scope`;
  - `Replacement scope`;
  - `Rationale`;
  - `PRD decision`, with a reason when it is `none`;
  - `Owner approval`, or `Not required`;
  - `Source`.
- R-COORD-15 (MUST): a revision Phase names the Phase it changes in a `Revises:` line. When a revision Phase opens new work in a completed Wave, the work index status is `active`. A revision Wave's plan names the completed Phases that it changes in `## Coordinate Decision`, and the prior backlog's Change History records a `revision-wave` entry that links to it. Plan classification is `new-wave` or `revision-wave`. The legacy value `revision` means `revision-wave`.
- R-COORD-16 (MUST): a work backlog rebuilt from the PRD set keeps its W/R and its location. Completed Phases, including their tasks, checkboxes, and closeout notes, stay unchanged. Only unfinished Phases are rebuilt. The rebuild records a `rebuild` Change History entry. History keeps the prior version.
- R-COORD-17 (MUST): the PRD decision (`update-existing`, `create`, `link-only`, or `none`) is separate from the coordinate decision. When a change alters product requirements, the owning PRD is updated before the plan or backlog. PRD maintenance work goes into the lineage Wave's backlog, as an in-place edit or a revision Phase. A new work backlog exists only for a new Wave or a revision Wave.
- R-COORD-18 (MUST): a plan is written before execution. After its first commit, it is amended in place, with Change History, when the owner approves a pivot or when a revision Phase changes plan-level scope. An amended plan keeps its W/R.
- R-COORD-19 (MUST): coordinate and amendment rules name outcomes, such as restoring a record to the working set or keeping the prior version in history, rather than a storage mechanism. They remain valid when a record's history or archive is kept outside the project folder.
- R-COORD-20 (MUST): these rules govern coordinates selected and records changed from their effective date. Existing plan and work records keep their coordinates and are not renumbered or rewritten to conform.
- R-COORD-21 (MUST): coordinate selection is agent judgment. Deterministic tooling may report facts such as committed state, closeout presence, archived state, next free `P` and `R`, and the highest `W`. It does not select a coordinate or classify a change. The agent treats an unknown fact as unknown, never as false.
## Adversarial Review Coverage-Pass Extension

Adversarial review is optional. It is not a release, merge, publish, push, implementation, or batch-approval gate and is not a plugin, prompt, CLI command, MCP operation, or conformance scenario by default. A downstream plan may select an exposure surface only through its current owner and evidence path.

### Pass Skeleton

1. Load authority for the target surface.
2. Enumerate every adversarial candidate.
3. Assign exactly one verdict and reason to each candidate.
4. Prefer updating an existing owner over creating a new artifact.
5. Apply history idempotency once for the current session when history is required.
6. Validate changed or intentionally unchanged coverage.
7. Close with verdicts, reasons, changed artifacts, validation, and handoffs.

### Candidate Record and Verdicts

Every candidate records `id`, `target`, `challenge`, `evidence`, `persona_target`, `severity`, `verdict`, `reason`, `handoff`, and `validation`. The `id` is stable within the pass output; `severity` orders review but is not a gate; `persona_target` is a configured persona slug or `none`.

| Adversarial verdict | Base decision | Required meaning |
| --- | --- | --- |
| `new-gap` | `create` | Missing coverage has no current owner. |
| `revise-owner` | `update-existing` | A current owner exists but needs correction, narrowing, or stronger evidence. |
| `handoff-only` | `link-only` | The valid challenge needs a pointer, reconciliation note, future-plan handoff, or register reference. |
| `covered` | `none` | Existing authority already handles the challenge; the reason explains why no change is warranted. |
| `rejected` | `none` | The challenge is not actionable after authority review; the reason explains why. |

Display labels may vary, but this mapping may not. `covered` and `rejected` are recorded outcomes, never silent skips.

### Persona and History Boundaries

Most adversarial candidates use `persona_target: none` because they challenge authority, implementation boundaries, or support claims. A configured persona slug is required only for persona-scoped content or audience-specific usability. The pass must use the effective Persona set (defaults plus configuration) and must not invent an adversarial-review-specific persona schema.

When closeout or the caller requires a session record, the pass updates the current-session history record or creates one if absent; it never creates duplicate current-session entries. Exploratory runs may return verdicts without history mutation only when they explicitly report that no history artifact changed.

### Adversarial Review Surface Boundary

- A shipped prompt or system workflow reuses the coverage-pass contract and enters resource rules only after template/package parity is decided. A plugin or Skill adapter remains explicit-selection only and delegates any deterministic behavior to current typed operations. Long-running, nested, parallel, or unattended behavior uses the general lifecycle-run contract rather than adversarial-specific semantics.
- A generated plugin, skills bundle, or harness entry uses the reviewed package-plan, source-owned static adapter, lifecycle, and provenance model. Generated output is a distribution artifact, never the authoritative adversarial-review source.
- Bare setup, default sync, lifecycle-run capture, and plugin or Skill selection do not imply adversarial review.
- Public claims for a harness, model, plugin bundle, unattended mode, CLI, MCP, or package delivery mode require a source-owned static adapter declaration and direct installed-product and release proof for the claimed behavior. Without that evidence, language remains provisional.
- Shipped adversarial assets are authored first in `packages/docs/template/`, dogfooded only for reviewed template-owned files, bundled through copy/prepack, and validated in local and packed paths. Required validation expands according to the selected surface: resource, typed-operation, optional-adapter, package-parity, link, and direct installed-product and release evidence.

## Contracts and Data

Lifecycle artifacts link to the accepted Human Experience Intent and record their own mapping, evidence, finding, verdict, or obligation. They do not copy the full intent block.

- The coverage-pass contract at
  `.make-docs/system/contracts/coverage-pass-contract.md` owns decision-frame
  mechanics only; it defers content to `guide-contract.md`,
  `prd-change-management.md`, `history-record-contract.md`, and
  `output-contract.md`.
- A Persona-target axis reads the effective Persona set (defaults plus configuration) when an owning activity
  needs audience resolution. [PRD 47](47-persona-model.md) owns stable primitives
  and defaults. Guided Progress Review uses a human role without requiring a
  Persona. Unassisted Goal Testing can resolve one eligible Persona for audience
  framing and evidence routing under [PRD 46](46-naive-end-user-acceptance-testing.md),
  while executor qualification remains separate.
- Performance qualification records a non-Persona disposition separately from the base coverage action and optional adversarial-review verdict. The candidate data links any applicable canonical `PERF-###` profile, evidence validity, outcome, finding or waiver, finite-budget and stop state, unchanged-check fingerprint, supported scope, gate effect, and phase-close handoff; [PRD 48](48-performance-evidence-governance.md) owns the field semantics and no lifecycle record may invent or tighten a target.
- Shared inputs use content-driven `docs/assets/project/**` under the short `docs/assets/` root router. No extra artifact-family router or empty child scaffold is required.

## Integrations

- [PRD 50](50-proportionate-testing-and-human-centered-validation.md) defines shared testing selection, records, budgets, stops, evidence reuse, human testing experience, and gate effects. [PRD 49](49-human-experience-standard-and-intent.md) defines Human Experience authority for the built result and review lens. [PRD 46](46-naive-end-user-acceptance-testing.md) owns conditional Unassisted Goal Testing. [PRD 47](47-persona-model.md) keeps Persona separate. Specialist accessibility, visual, performance, automation, architecture, and regression owners keep their own evidence and verdicts.

- The lifecycle anchor and stage follow-on handoffs touch the routers and the
  plan, PRD, and work templates and contracts.
- Closeout and work-execution skills consume this contract; any remaining
  refactor is routed through the no-scripts / CLI-migration obligations in
  risk-register items R-008 and R-014.
- This authority remains compatible with personas, configuration, the
  documentation restructure, the rename, and plugins without implementing
  those adjacent capabilities.
- Performance coverage integrates through [PRD 48](./48-performance-evidence-governance.md), the [accepted guardrails design](../designs/2026-08-12-performance-testing-guardrails.md), and the [W19 R2 plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md); this lifecycle PRD consumes qualification and gate results without duplicating the substantive performance contract.

## Phase-Close Obligation and UAT Gates

A phase can close with partial capability status when an accepted future outcome remains owed and a valid obligation preserves it. A capability cannot make an unqualified claim when evidence required by current authority is absent or an accepted material finding remains unresolved. A declined Guided Progress Review, `not-needed-now`, skipped advisory test, or declined or unanswered optional experience handoff does not block closure or create an obligation.

Every phase-close gate must run the non-persona-scoped [R-OBL-AUDIT](45-deferred-obligation-governance.md#r-obl-audit-phase-close-orphan-audit). [R-OBL-COMPLETE](45-deferred-obligation-governance.md#r-obl-complete-phase-and-capability-status) allows a phase to be `complete` only when accepted outcomes are completed or validly routed; capability reporting must separately use `partial`, `complete`, or `unverified` so a completed phase cannot imply that an entire feature is done.

Each phase-close testing candidate consumes the compact decision record from [PRD 50](50-proportionate-testing-and-human-centered-validation.md): testing type, decision, reason, maturity, scope, executor, gate effect, effort budget, stop condition, retained evidence, and rerun trigger. The phase does not activate all four core types merely because they are candidates.

Automated Implementation Testing can block the scoped correctness claim. Performance Testing blocks only an accepted hard outcome or bounded support claim. Guided Progress Review is always advisory or informational. Unassisted Goal Testing is advisory by default and blocks only when explicit current product or release authority names the affected outcome or claim. An optional experience handoff is completion communication and never becomes a gate by silence or refusal. A separate human acceptance gate blocks only when accepted authority names its scope, human reviewer, surface, acceptance question, and gate effect. A user-observable slice alone does not activate Unassisted Goal Testing.

When Unassisted Goal Testing activates, the phase record links the exact scenario identity and version when one exists, intended audience, qualified executor, public scope, result, evidence, findings, disposition, gate effect, and rerun trigger. `clear`, `friction`, `blocked`, `invalid-run`, and `not-needed-now` keep the meanings in [PRD 46](46-naive-end-user-acceptance-testing.md). Non-blocking results inform work without silently becoming phase failure.

When performance qualification is applicable, the same phase-close record separately consumes the exact profile and supported scope, normalized outcome and evidence validity, material findings and reproducibility, waiver scope and expiry, deferred `O-###` outcomes, finite-budget and diminishing-return status, unchanged-check compliance, and gate effect. A performance result affects only the current accepted requirement or bounded claim. `waived` is not success and never replenishes the evidence budget or creates an unlimited rerun.

## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.

### Shared Asset and Audience Routing

R-ASSET-LIFECYCLE-1 (MUST): optional pre-design inputs and shared project material use `docs/assets/project/**`; audience assets use `docs/assets/<persona-slug>/**`. The first needed content creates its path. Neither directory placement nor asset creation promotes content to product authority or adds a lifecycle stage. Resolve shipped defaults plus configured Personas under PRD 47. Ordinary lifecycle work can continue when optional CLI capture is unavailable; no local operational fallback is permitted.

## Requirement History

### 2026-09-14 — W19 R6 P3

- Affected requirement or section: coverage evidence, support claims, and shipped optional-adapter assets.
- Previous contract: Public harness claims could depend on dynamic conformance records and generated lab evidence.
- Replacement contract: Public claims require a source-owned static adapter and direct installed-product and release proof. Generated output remains a distribution artifact, not authority.
- Rationale: Current product authority and real installed behavior must control support wording.
- Source: [P3 design](../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md) and [P3 plan](../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/03-static-harness-adapters-and-conformance-retirement.md)

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 31.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — W16 R0

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current lifecycle workflow, coverage passes, and phase-close routing requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Lifecycle foundation design](../../.make-docs/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Coverage-pass contract`, `Persona-aware testing/UAT boundary`, `Adversarial Review Surface Boundary`, `Contracts and Data`, and `Phase-Close Obligation and UAT Gates`
- Previous contract: Coverage treated testing/UAT as non-persona and carried a Persona-scoped Playbook delivery assumption; phase-close routing did not require a selected eligible Persona or state one-valid-run sufficiency.
- Replacement contract: Naive UAT remains a distinct coverage candidate but every activated run resolves one configured `user` or `maintainer` Persona, defaults to canonical `user`, keeps tester qualification separate, and closes only from scenario-version-, support-scope-, evidence-, finding-, and gate-authoritative results; one valid independent run per claimed cell is the shared minimum unless accepted risk rules require more.
- Rationale: W19 R1 rehomes Naive UAT as a system workflow and typed operation surface while preserving qualification, anti-coaching, evidence, finding, and gate semantics and retiring Playbook delivery.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
### 2026-08-28 — W20 R0

- Affected requirement or section: `Requirements`, `Contracts and Data`, `Integrations`, phase-close gates, and `Human Experience Lifecycle and Review`.
- Previous contract: Lifecycle governance owned coverage, UAT, performance, obligations, and phase-close status, but it did not carry one accepted human outcome through each artifact.
- Replacement contract: Lifecycle governance now propagates Human Experience Intent and gives Human Experience Review a separate candidate, verdict, evidence boundary, and completion rule.
- Rationale: Human quality must survive design, planning, implementation, review, and release without becoming a copied checklist or an unowned late-stage concern.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: purpose, scope, `Human Experience Lifecycle and Review`, contracts, integrations, and phase-close testing gates.
- Previous contract: Lifecycle treated Human Experience Review as a separate candidate, activated naive UAT at each genuinely user-observable slice, and made activated UAT a default phase gate with durable routing for valid `none`.
- Replacement contract: Lifecycle selects only the four testing types that can change a current decision, treats Human Experience Review as a lens, keeps Guided Progress Review non-blocking, makes Unassisted Goal Testing conditional and advisory by default, and consumes explicit gate effects and rerun triggers.
- Rationale: Phase-close rigor must protect current decisions without creating duplicate human work, false gates, or obligations for tests that are not useful now.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

### 2026-09-15 — W20 R2

- Affected requirement or section: `Human Experience Lifecycle and Review` and `Phase-Close Obligation and UAT Gates`.
- Previous contract: Lifecycle treated the normal owner response to an agent-prepared Human Experience Review as required acceptance work.
- Replacement contract: Lifecycle requires the agent review, makes the normal experience handoff optional and non-blocking, and consumes a human response as a gate only when accepted authority explicitly names its scope and gate effect.
- Rationale: Human Experience must remain a real quality duty without creating a recurring human closeout task or false obligation.
- Source: [W20 R2 Human Experience Review and Feedback Boundary plan](../plans/2026-09-15-w20-r2-human-experience-review-and-feedback-boundary/00-overview.md)

### 2026-09-09 — W19 R4 Asset and Persona Recovery

- Affected requirement or section: `Shared Asset and Audience Routing` and current asset, bootstrap, migration, or storage statements in this owner.
- Previous contract: Optional pre-design inputs used docs/artifacts/ and a separate artifact router. Prior dated records retain their historical claims.
- Replacement contract: Shared material uses `docs/assets/project/`; audience assets use on-demand Persona children; archives remain `.make-docs/archive/`. Short routing exposes defaults and configured harness files without a CLI. Reviewed layout moves use the R3 Store service and verify content and links. Existing local-state prose is aligned with the completed R3 boundary.
- Rationale: Finish the missed consolidation requirement and remove active instructions that can restore legacy paths. This is the W19 R4 draft implementation target, not a runtime completion claim.
- Source: [asset and Persona design](../designs/2026-09-09-project-assets-and-persona-discovery.md); [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md).

### 2026-11-18 — W28 R0

- Affected requirement or section: `Coordinate Selection and Amendment` (`R-COORD-1` through `R-COORD-21`) and the Component and Capability Map.
- Previous contract: No PRD owned coordinate selection. Shipped resources gave the next unused revision to any work that revised, reworked, corrected, standardized, or finished delivered wave work. PRD maintenance work used a separate dated delta backlog, and plans were not amended after execution started.
- Replacement contract: An outcome test selects new Waves. Unfinished lineage work is edited in place. A change to a completed Phase is a revision Phase unless one of three revision-Wave tests applies. Owner gates cover serious actions. Committed plans and backlogs record scope edits in Change History. PRD maintenance work joins the lineage backlog.
- Rationale: Revisions had become routine fixes and add-ons, so a revision number no longer showed which changes were serious. The plan is the statement of work for a Wave, and the PRD remains the product authority.
- Source: [Wave, Revision, and Backlog Amendment Rules design](../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md) and [W28 R0 plan](../plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md).

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)
- [Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md)

- `docs/assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md`
- `docs/assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/14-lifecycle-workflow-and-coverage-passes.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
- [Accepted Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 Performance Evidence Governance plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [PRD 48 — Performance Evidence Governance](./48-performance-evidence-governance.md)
