# W16 R0 — Lifecycle Workflow Foundation (Work Backlog)

> Work backlogs are directories: this `00-index.md` is the entry point; phase
> detail lives in the sibling `0N-<phase>.md` files. See
> `docs/assets/references/wave-model.md` for W/R semantics.

## Purpose

This delta backlog implements the lifecycle workflow foundation added in
[historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`):
the coverage-pass contract, the always-read lifecycle anchor, the persona-scoped
lifecycle playbook, the stage follow-on handoffs, the optional `docs/artifacts/`
seed, and the coverage-pass starter prompts. It derives from the W16 R0 plan and
the lifecycle-foundation design, and is documentation work only — no source-code
changes.

The four-skill refactor and the three-location skill mirror are intentionally
**out of scope** here; they are deferred to the no-scripts / CLI-migration wave
(risk register R-008 and R-014).

## Authoring Location and Re-Seed

Product assets implemented by these phases — the references and templates under
`docs/assets/**`, the routers, the starter prompts, and the `docs/artifacts/`
router — are shipped product and must be authored in the source-of-truth
template `packages/docs/template/docs/...` first, then re-seeded to the
repo-root dogfood `docs/...`. make-docs's own content (this backlog and the
other planning docs, the guides, the lifecycle playbook content, and the
`docs/artifacts/` content) stays dogfood-only. The phase files name dogfood
`docs/...` paths for brevity; every product-asset task follows this
template-first rule. See risk register D-014.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-coverage-pass-contract.md](./01-coverage-pass-contract.md) | Author the coverage-pass contract and wire it into the routers. |
| [02-lifecycle-anchor.md](./02-lifecycle-anchor.md) | Author the always-read lifecycle anchor. |
| [03-lifecycle-playbook.md](./03-lifecycle-playbook.md) | Author the dogfooded, persona-scoped lifecycle playbook. |
| [04-stage-follow-on-handoffs.md](./04-stage-follow-on-handoffs.md) | Add Intended-Follow-On handoffs to plans, PRDs, and work backlogs. |
| [05-artifacts-seed.md](./05-artifacts-seed.md) | Sanction the optional `docs/artifacts/` seed directory. |
| [06-starter-prompts.md](./06-starter-prompts.md) | Ship the coverage-pass starter prompts. |

## Source PRD Docs

- [historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`) — the new change doc this backlog implements.
- [01-product-overview.md](../../../../prd/01-product-overview.md), [02-architecture-overview.md](../../../../prd/02-architecture-overview.md), [06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md) — impacted baseline docs.

## Usage Notes

- Read phases in order; they are dependency-ordered. Phase 01 (the contract) is
  the foundation the others cite.
- Every phase file includes `## Source PRD Docs` linking back to PRD 14 and the
  impacted baseline docs.
- Coordinate: `W16 R0`. This is a delta backlog (active-set evolution), not a
  full-set regeneration.
