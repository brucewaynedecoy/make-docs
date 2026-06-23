# 14 Add Lifecycle Workflow Foundation

## Purpose

Introduce make-docs's lifecycle workflow foundation as a net-new capability
area: a coverage-pass contract, an always-read lifecycle anchor, a
persona-scoped playbook output type, stage follow-on handoffs, and an optional
artifacts seed directory. Together they let make-docs nudge agents through its
full documentation lifecycle without becoming prescriptive, and make future
lifecycle stages cheap to add.

## Change Type

`addition`. A net-new capability area layered on the existing
design -> plan -> PRD -> work pipeline. It does not alter existing install,
template, skills, or packaging requirements; it adds a workflow-guidance
surface.

## Change Notes

- The W15 source-authority reconciliation clarifies the work-backlog handoff: accepted designs, plans, PRDs, and current work contracts drive backlog structure and content before archived examples, installed skill projections, generated harness stubs, or dogfood/package copies are consulted as fallback evidence.
- Revised by [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md): the W16 `docs/library/playbooks/<persona>/` placement is transitional. The v2 canonical playbook surface is `docs/assets/playbooks/<persona-slug>/`, and `persona` frontmatter is the authoritative audience target.
- Revised by [23-revise-generated-metadata-lifecycle-handoffs.md](./23-revise-generated-metadata-lifecycle-handoffs.md): generated lifecycle handoffs should carry `follow_on` frontmatter as tooling authority while preserving body `## Intended Follow-On` sections for readers.
- Revised by [24-revise-configuration-convention-overlay.md](./24-revise-configuration-convention-overlay.md): lifecycle labels may be rendered with project-specific presentation text, but lifecycle routes, handoff fields, departure slugs, and W/R/P lineage remain canonical.
- Revised by [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md): the deferred closeout/work skill refactor must move deterministic lifecycle helpers into CLI/shared-core operations and rewrite affected first-party skills in the same migration window before standalone scripts are removed or downgraded.
- Revised by [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md): persona-scoped playbooks now have a v2 content contract under `docs/assets/playbooks/**`, a required build/run stack discriminator, and a generic Run Playbook model that does not require every lifecycle playbook to become a plugin.
- Revised by [31-revise-coverage-pass-extensions-adversarial-review.md](./31-revise-coverage-pass-extensions-adversarial-review.md): adversarial review is an optional coverage-pass extension with candidate records and verdict mapping; it is not a mandatory lifecycle gate, release gate, plugin, playbook, CLI command, MCP operation, or conformance scenario by default.

## Capability Addition or Enhancement

- **Coverage-pass contract** — a single reference owning the decision-frame
  mechanics shared by closeout-style passes: a seven-step skeleton; base verdict
  semantics (`create`/`update-existing`/`link-only`/`none`) as a spine; named
  surfaces (guide/playbook, history, PRD, testing/UAT); a verdict axis separate
  from a persona-target axis; the history-record idempotency rule; the
  verdict-and-reason rule; and a validation checklist. PRD 31 extends this
  contract with optional adversarial-review candidates and maps adversarial
  verdicts back to the base spine.
- **Always-read lifecycle anchor** — an authoritative reference stating the
  lifecycle arc (optional artifacts inputs; Segment 1 plan; Segment 2 build loop
  with the coverage band; Segment 3 release/archival/retrospective), the default
  ordering (implementation derives from a work backlog), and a straddle rule
  that defaults to the arc while requiring departures to be surfaced rather than
  taken silently. No hard "never skip" gate.
- **Persona-scoped playbook output type** — playbooks become a procedural output
  type; W16 places the initial dogfood playbook under
  `docs/library/playbooks/<persona>/`, but PRD 22 makes
  `docs/assets/playbooks/<persona-slug>/` the v2 canonical target.
- **Stage follow-on handoffs** — plans, PRDs, and work backlogs gain an
  advisable-default-but-overridable `## Intended Follow-On`, mirroring design
  docs, so the chain stops breaking between stages. PRD 23 adds the generated
  metadata layer for these handoffs.
- **Optional artifacts seed** — `docs/artifacts/`, a zero-contract home for
  pre-design inputs, accommodating ideation and architecture as an input surface
  rather than contract-bound stages.

All stage vocabulary is domain-neutral so the capability serves non-software
documentation work.

Doc anchors:

- `docs/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md`
- `docs/designs/2026-06-17-make-docs-lifecycle-foundation.md`

## Affected Baseline Docs

This is a net-new capability area. It complements rather than alters:

- [01-product-overview.md](01-product-overview.md) — adds a workflow-guidance
  capability to the product surface.
- [02-architecture-overview.md](02-architecture-overview.md) — adds the
  references, library, and artifacts documentation zones.
- [06-template-contracts-and-generated-assets.md](06-template-contracts-and-generated-assets.md)
  — the coverage-pass contract and artifacts router join the managed reference
  and template surface.

No existing requirement is superseded; baseline annotations are optional for an
addition and are limited to cross-link awareness.

## Contracts and Data

- The coverage-pass contract (to be authored at
  `docs/assets/references/coverage-pass-contract.md`) owns decision-frame
  mechanics only; it defers content to `guide-contract.md`,
  `prd-change-management.md`, `history-record-contract.md`, and
  `output-contract.md`.
- A persona-target axis that reads the configured persona set; before
  configuration exists, a legacy Developer/User mapping applies.
- An optional `docs/artifacts/` directory with a light, zero-contract router.

## Integration Impact

- The lifecycle anchor and stage follow-on handoffs touch the routers and the
  plan, PRD, and work templates and contracts.
- The closeout and work-execution skills will cite the contract; that refactor
  is deferred to the no-scripts / CLI-migration wave (risk register R-008 and
  R-014).
- Forward-compatible with personas and configuration, the documentation
  restructure, the rename, and plugins; none of those are implemented by this
  change.

## Required Baseline Annotations

Optional for this addition. Add reciprocal `Related Docs` cross-links from
[01-product-overview.md](01-product-overview.md),
[02-architecture-overview.md](02-architecture-overview.md), and
[06-template-contracts-and-generated-assets.md](06-template-contracts-and-generated-assets.md)
to this doc where it aids discoverability; no `Superseded by` or `Deprecated by`
verbs apply.

## Source Anchors

- `docs/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md`
- `docs/designs/2026-06-17-make-docs-lifecycle-foundation.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`
- `docs/prd/23-revise-generated-metadata-lifecycle-handoffs.md`
- `docs/prd/24-revise-configuration-convention-overlay.md`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/prd/29-revise-playbook-contract-run-playbook.md`
- `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
