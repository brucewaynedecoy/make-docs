# Phase 04: Package Parity and Closeout

## Purpose

Prove that the reader-facing asset migration works in local dev, dogfood, and packed package contexts.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)

## Tasks

- [ ] t1: Update `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, and related path lists for canonical guide/playbook paths. (`W9R3-P4-T1`)
- [ ] t2: Update install, planner, audit, backup, and manifest behavior only where the new reader-facing paths affect managed-file ownership, conflict handling, or removal safety. (`W9R3-P4-T2`)
- [ ] t3: Update `packages/cli/tests/install.test.ts` and `packages/cli/tests/consistency.test.ts` so parity checks include guide/playbook assets and do not misclassify archive or tool resources. (`W9R3-P4-T3`)
- [ ] t4: Prove `packages/cli/template/**` reflects the template after copy/prepack. (`W9R3-P4-T4`)
- [ ] t5: Update the risk register and history/closeout docs with implementation evidence. (`W9R3-P4-T5`)

## Acceptance Criteria

- Local dev install behavior and packed package behavior agree.
- Template/dogfood/package parity checks fail on stale reader-facing default assets.
- Existing-install safety does not delete or overwrite custom guide/playbook/archive content without classification and review.
- The risk register entries touched by PRD 22 are closed or narrowed with concrete implementation evidence.

## Validation

- Run `npm test -w packages/cli`.
- Run `npm run validate:defaults -w packages/cli`.
- Run `npm run build -w packages/cli`.
- Run `npm run smoke:pack`.
- Run `git diff --check`.
- Run touched-file Markdown link checks.
