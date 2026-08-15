# 14 Lifecycle Workflow and Coverage Passes

## Purpose

This document defines the current product contract for lifecycle workflow, coverage passes, and phase-close routing. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns lifecycle workflow, coverage passes, and phase-close routing. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

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
- **Persona-aware testing/UAT boundary** — testing/UAT remains its own coverage
  candidate rather than a persona-targeted documentation candidate. When naive
  UAT activates, [46-naive-end-user-acceptance-testing.md](./46-naive-end-user-acceptance-testing.md)
  and [47-persona-model.md](./47-persona-model.md) require execution as exactly
  one eligible configured `user`- or `maintainer`-primitive Persona, defaulting
  to the canonical `user` Persona when none is supplied. Persona selection names
  the audience and evidence path; qualified-tester isolation remains a separate
  execution requirement and is never weakened by a `maintainer` selection.
- **Stage follow-on handoffs** — plans, PRDs, and work backlogs gain an
  advisable-default-but-overridable `## Intended Follow-On`, mirroring design
  docs, so the chain stops breaking between stages. PRD 23 adds the generated
  metadata layer for these handoffs.
- **Optional artifacts seed** — `docs/assets/artifacts/`, a zero-contract home for
  pre-design inputs, accommodating ideation and architecture as an input surface
  rather than contract-bound stages.

All stage vocabulary is domain-neutral so the capability serves non-software
documentation work.

Doc anchors:

- `docs/assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md`
- `docs/assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md`
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

Most adversarial candidates use `persona_target: none` because they challenge authority, implementation boundaries, or support claims. A configured persona slug is required only for persona-scoped content or audience-specific usability. The pass must use the configured persona set and must not invent an adversarial-review-specific persona schema.

When closeout or the caller requires a session record, the pass updates the current-session history record or creates one if absent; it never creates duplicate current-session entries. Exploratory runs may return verdicts without history mutation only when they explicitly report that no history artifact changed.

### Adversarial Review Surface Boundary

- A shipped prompt or system workflow reuses the coverage-pass contract and enters resource rules only after template/package parity is decided. A plugin or Skill adapter remains explicit-selection only and delegates any deterministic behavior to current typed operations. Long-running, nested, parallel, or unattended behavior uses the general lifecycle-run contract rather than adversarial-specific semantics.
- A generated plugin, skills bundle, or harness entry uses the reviewed package-plan, adapter, lifecycle, provenance, and conformance model. Generated output is a distribution artifact, never the authoritative adversarial-review source.
- Bare setup, default sync, lifecycle-run capture, and plugin or Skill selection do not imply adversarial review.
- Public claims for a harness, model, plugin bundle, unattended mode, CLI, MCP, or package delivery mode require implementation validation or conformance records for the exact support tuple. Without that evidence, language remains provisional.
- Shipped adversarial assets are authored first in `packages/docs/template/`, dogfooded only for reviewed template-owned files, bundled through copy/prepack, and validated in local and packed paths. Required validation expands according to the selected surface: resource, typed-operation, optional-adapter, package-parity, link, and conformance evidence.

## Contracts and Data

- The coverage-pass contract at
  `.make-docs/contracts/system/coverage-pass-contract.md` owns decision-frame
  mechanics only; it defers content to `guide-contract.md`,
  `prd-change-management.md`, `history-record-contract.md`, and
  `output-contract.md`.
- A persona-target axis reads the configured persona set; when configuration is
  absent, it uses the default Agent/Developer/User set and stable primitive
  mapping owned by [47-persona-model.md](47-persona-model.md). Naive-UAT
  activation remains a distinct testing/UAT coverage decision, while every
  activated execution resolves one eligible Persona under
  [46-naive-end-user-acceptance-testing.md](46-naive-end-user-acceptance-testing.md).
- Performance qualification records a non-persona disposition separately from the base coverage action, optional adversarial-review verdict, and Persona-scoped naive-UAT decision. The candidate data links any applicable canonical `PERF-###` profile, evidence validity, outcome, finding or waiver, finite-budget and stop state, unchanged-check fingerprint, supported scope, and phase-gate handoff; [PRD 48](./48-performance-evidence-governance.md) owns the field semantics and no lifecycle record may invent or tighten a target.
- An optional `docs/assets/artifacts/` directory with a light, zero-contract router.

## Integrations

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

Every phase-close gate must run the non-persona-scoped [R-OBL-AUDIT](45-deferred-obligation-governance.md#r-obl-audit-phase-close-orphan-audit). [R-OBL-COMPLETE](45-deferred-obligation-governance.md#r-obl-complete-phase-and-capability-status) allows a phase to be `complete` only when accepted outcomes are completed or validly routed; capability reporting must separately use `partial`, `complete`, or `unverified` so a completed phase cannot imply that an entire feature is done.

Testing/UAT remains a distinct coverage candidate, but activated naive UAT is always Persona-executed. Under [R-NUAT-ACTIVATE](46-naive-end-user-acceptance-testing.md#r-nuat-activate-user-observable-slices-and-valid-none) and [R-NUAT-GATE](46-naive-end-user-acceptance-testing.md#r-nuat-gate-phase-gates-and-finding-consumption), a genuinely user-observable slice activates naive UAT and resolves one eligible configured `user` or `maintainer` Persona, with the canonical `user` Persona as the no-input default. Internal or headless work may record `none` only with the required rationale, evidence, owner, future trigger, target coordinate, and obligation route when later user signal is expected.

A phase-close naive-UAT gate records the exact canonical `NUAT-###` scenario version, selected Persona slug, installed-product support-scope cell, run outcome, evidence references, findings, and disposition. Under [R-NUAT-EVIDENCE](46-naive-end-user-acceptance-testing.md#r-nuat-evidence-setup-outcomes-findings-and-reproducibility), one valid independent naive run is the shared minimum sufficient evidence for each claimed support-scope cell unless accepted project severity or risk rules require more. A `pass` satisfies only that scenario version and cell; `revise`, `fail`, `blocked`, an unrun activated scenario, or an unresolved activated finding leaves acceptance unsatisfied. Routing later owed work through [PRD 45](45-deferred-obligation-governance.md) preserves the finding and gate outcome rather than converting it to a pass.

When performance qualification is applicable, the same phase-close gate separately consumes the exact profile and supported scope, normalized outcome and evidence validity, critical or major findings and reproducibility, waiver scope and expiry, deferred `O-###` outcomes, finite-budget and diminishing-return status, and unchanged-check compliance. A performance `pass` satisfies only the executed profile version and scope; `fail`, `revise`, `blocked`, expired evidence, an unrun required profile, or an unresolved material finding leaves performance acceptance unsatisfied. `waived` is not success and permits only the explicitly owner-accepted bounded continuation within its accepted scope and effect; it never silently satisfies or overrides the performance requirement, authorizes continuation beyond that scope or effect, replenishes the evidence budget, or creates an unlimited continuation or rerun. This performance decision neither changes the Persona-scoped naive-UAT contract nor increases its one-valid-run minimum.

## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 31.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W16 R0

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current lifecycle workflow, coverage passes, and phase-close routing requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Lifecycle foundation design](../assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Coverage-pass contract`, `Persona-aware testing/UAT boundary`, `Adversarial Review Surface Boundary`, `Contracts and Data`, and `Phase-Close Obligation and UAT Gates`
- Previous contract: Coverage treated testing/UAT as non-persona and carried a Persona-scoped Playbook delivery assumption; phase-close routing did not require a selected eligible Persona or state one-valid-run sufficiency.
- Replacement contract: Naive UAT remains a distinct coverage candidate but every activated run resolves one configured `user` or `maintainer` Persona, defaults to canonical `user`, keeps tester qualification separate, and closes only from scenario-version-, support-scope-, evidence-, finding-, and gate-authoritative results; one valid independent run per claimed cell is the shared minimum unless accepted risk rules require more.
- Rationale: W19 R1 rehomes Naive UAT as a system workflow and typed operation surface while preserving qualification, anti-coaching, evidence, finding, and gate semantics and retiring Playbook delivery.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
## Source Anchors

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
