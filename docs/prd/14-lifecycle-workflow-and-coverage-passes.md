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
  surfaces (guide/playbook, history, PRD, testing/UAT); a verdict axis separate
  from a persona-target axis; the history-record idempotency rule; the
  verdict-and-reason rule; and a validation checklist. The optional
  adversarial-review coverage-pass extension is part of this authority. It adds
  optional adversarial-review candidates and maps adversarial
  verdicts back to the base spine.
- **Always-read lifecycle anchor** — an authoritative reference stating the
  lifecycle arc (optional artifacts inputs; Segment 1 plan; Segment 2 build loop
  with the coverage band; Segment 3 release/archival/retrospective), the default
  ordering (implementation derives from a work backlog), and a straddle rule
  that defaults to the arc while requiring departures to be surfaced rather than
  taken silently. No hard "never skip" gate.
- **Persona-scoped playbook output type** — playbooks are a procedural output
  type. [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md)
  owns the canonical `docs/assets/playbooks/<persona-slug>/` placement, while
  [47-persona-model.md](./47-persona-model.md) owns the persona slug and metadata
  contract. This persona axis does not apply to testing/UAT coverage, whose
  non-persona-scoped exception is owned by
  [46-naive-end-user-acceptance-testing.md](./46-naive-end-user-acceptance-testing.md).
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

Adversarial review is optional. It is not a release, merge, publish, push, implementation, or batch-approval gate and is not a plugin, prompt, playbook, CLI command, MCP operation, or conformance scenario by default. A downstream plan may select one of those exposure surfaces only through its current owner and evidence path.

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

- A shipped prompt reuses the coverage-pass contract and enters prompt rules only after template/package parity is decided. A playbook uses the current playbook authoring and run-state contracts. A plugin or workflow bundle uses PRD 30 and remains explicit-selection only. Long-running, nested, parallel, or unattended behavior uses the generic playbook execution contract rather than adversarial-specific semantics.
- A generated plugin, skills bundle, or harness entry uses the reviewed package-plan, adapter, lifecycle, provenance, and conformance model. Generated output is a distribution artifact, never the authoritative adversarial-review source.
- Bare setup, default sync, generic Run Playbook, and plugin selection do not imply adversarial review.
- Public claims for a harness, model, plugin bundle, unattended mode, CLI, MCP, or package delivery mode require implementation validation or conformance records for the exact support tuple. Without that evidence, language remains provisional.
- Shipped adversarial assets are authored first in `packages/docs/template/`, dogfooded only for reviewed template-owned files, bundled through copy/prepack, and validated in local and packed paths. Required validation expands according to the selected surface: prompt-rule, playbook, plugin, package-parity, link, and conformance evidence.

## Contracts and Data

- The coverage-pass contract at
  `.make-docs/contracts/system/coverage-pass-contract.md` owns decision-frame
  mechanics only; it defers content to `guide-contract.md`,
  `prd-change-management.md`, `history-record-contract.md`, and
  `output-contract.md`.
- A persona-target axis reads the configured persona set; when configuration is
  absent, it uses the default Agent/Developer/User set and stable primitive
  mapping owned by [47-persona-model.md](47-persona-model.md). Testing/UAT
  coverage remains outside persona scoping as required by
  [46-naive-end-user-acceptance-testing.md](46-naive-end-user-acceptance-testing.md).
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
## Phase-Close Obligation and UAT Gates

Every phase-close gate must run the non-persona-scoped [R-OBL-AUDIT](45-deferred-obligation-governance.md#r-obl-audit-phase-close-orphan-audit). [R-OBL-COMPLETE](45-deferred-obligation-governance.md#r-obl-complete-phase-and-capability-status) allows a phase to be `complete` only when accepted outcomes are completed or validly routed; capability reporting must separately use `partial`, `complete`, or `unverified` so a completed phase cannot imply that an entire feature is done.

Testing/UAT coverage also remains non-persona-scoped. Under [R-NUAT-ACTIVATE](46-naive-end-user-acceptance-testing.md#r-nuat-activate-user-observable-slices-and-valid-none) and [R-NUAT-GATE](46-naive-end-user-acceptance-testing.md#r-nuat-gate-phase-gates-and-finding-consumption), a genuinely user-observable slice activates naive UAT. Internal or headless work may record `none` only with the required rationale, evidence, owner, future trigger, target coordinate, and obligation route when later user signal is expected.
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
## Source Anchors

- `docs/assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md`
- `docs/assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/34-playbook-authoring-contract-and-model.md`
- `docs/prd/14-lifecycle-workflow-and-coverage-passes.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
