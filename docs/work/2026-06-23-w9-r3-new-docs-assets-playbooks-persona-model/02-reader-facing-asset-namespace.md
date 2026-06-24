# Phase 02: Reader-Facing Asset Namespace

## Purpose

Implement the canonical guide, playbook, and archive path model without breaking template, dogfood, package, or router behavior.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)

## Tasks

- [ ] t1: Inventory current `docs/guides/**`, `docs/library/playbooks/**`, `docs/assets/archive/**`, and `docs/assets/history/**` references across docs, template, CLI source, tests, and scripts. (`W9R3-P2-T1`)
- [ ] t2: Add or update `packages/docs/template/docs/assets/guides/**` and `packages/docs/template/docs/assets/playbooks/**` as the shipped source-of-truth paths for reader-facing defaults. (`W9R3-P2-T2`)
- [ ] t3: Reseed root dogfood `docs/assets/guides/**` and `docs/assets/playbooks/**` from the template where files are shipped defaults; preserve make-docs-only artifacts as dogfood-only. (`W9R3-P2-T3`)
- [ ] t4: Migrate or map `docs/library/playbooks/**` references to `docs/assets/playbooks/**` while preserving lineage. (`W9R3-P2-T4`)
- [ ] t5: Define the archive migration path from `docs/assets/archive/**` toward `docs/archive/**`; keep history placement as an explicit follow-on if not implemented. (`W9R3-P2-T5`)
- [ ] t6: Update routers and path-hygiene guidance so `docs/assets/**` no longer reads as a tool-resource catch-all. (`W9R3-P2-T6`)

## Acceptance Criteria

- New canonical paths exist in the template before dogfood copies.
- Links from active docs resolve after guide/playbook/archive migration.
- Tool resources remain under `.make-docs/**` or their current transition path governed by PRD 21.
- Historical archive and lineage links remain readable.

## Validation

- Run Markdown link checks for moved or touched docs.
- Run router checks for `AGENTS.md` and `CLAUDE.md` files.
- Run path-hygiene checks against new canonical paths.
