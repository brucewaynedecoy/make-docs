# Phase 02: Reader-Facing Asset Namespace

## Purpose

Implement the canonical guide, playbook, and archive path model without breaking template, dogfood, package, or router behavior.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)

## Tasks

- [x] t1: Inventory current `docs/guides/**`, `docs/library/playbooks/**`, `docs/assets/archive/**`, and `docs/assets/history/**` references across docs, template, CLI source, tests, and scripts. (`W9R3-P2-T1`)
- [x] t2: Add or update `packages/docs/template/docs/assets/guides/**` and `packages/docs/template/docs/assets/playbooks/**` as the shipped source-of-truth paths for reader-facing defaults. (`W9R3-P2-T2`)
- [x] t3: Reseed root dogfood `docs/assets/guides/**` and `docs/assets/playbooks/**` from the template where files are shipped defaults; preserve make-docs-only artifacts as dogfood-only. (`W9R3-P2-T3`)
- [x] t4: Migrate or map `docs/library/playbooks/**` references to `docs/assets/playbooks/**` while preserving lineage. (`W9R3-P2-T4`)
- [x] t5: Define the archive migration path from `docs/assets/archive/**` toward `docs/archive/**`; keep history placement as an explicit follow-on if not implemented. (`W9R3-P2-T5`)
- [x] t6: Update routers and path-hygiene guidance so `docs/assets/**` no longer reads as a tool-resource catch-all. (`W9R3-P2-T6`)

## Acceptance Criteria

- New canonical paths exist in the template before dogfood copies.
- Links from active docs resolve after guide/playbook/archive migration.
- Tool resources remain under `.make-docs/**` or their current transition path governed by PRD 21.
- Historical archive and lineage links remain readable.

## Validation

- Run Markdown link checks for moved or touched docs.
- Run router checks for `AGENTS.md` and `CLAUDE.md` files.
- Run path-hygiene checks against new canonical paths.

## Implementation Notes

- Inventory covered repo docs, template docs, CLI catalog selection, install and consistency tests, and closeout/workflow scripts. Current script defaults still point to `docs/assets/history/**` and existing guide directories as a follow-on compatibility surface.
- Added canonical shipped routers in `packages/docs/template/docs/assets/guides/**` and `packages/docs/template/docs/assets/playbooks/**`, then reseeded matching dogfood routers in `docs/assets/guides/**` and `docs/assets/playbooks/**`.
- Added `docs/assets/playbooks/agent/make-docs-lifecycle.md` as the canonical playbook copy and linked the legacy `docs/library/playbooks/agent/make-docs-lifecycle.md` to it so lineage remains readable.
- Added `docs/archive/**` routers as the planned archive migration surface and left existing `docs/assets/archive/**` records in place.
- Updated `docs/assets/**` routers and `path-and-link-hygiene.md` so reader-facing assets are distinct from current tool-resource bootstrap files.
- Changed path scope: `docs/assets`, `docs/archive`, `docs/library/playbooks`, `packages/docs/template/docs/assets`, `packages/docs/template/docs/archive`, `packages/docs/template/docs/guides`, `packages/cli/src/catalog.ts`, `packages/cli/tests/consistency.test.ts`, and `packages/cli/tests/install.test.ts`.
- Developer guide decision: updated existing `docs/guides/developer/template-assets-and-generated-routers.md`.
- User guide decision: none; installed user behavior remains unchanged until package parity work.
- UAT decision: deferred until full W9 R3 wave completion.
