# Phase 04: Package Parity and Closeout

## Purpose

Prove that the reader-facing asset migration works in local dev, dogfood, and packed package contexts.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)

## Tasks

- [x] t1: Update `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, and related path lists for canonical guide/playbook paths. (`W9R3-P4-T1`)
- [x] t2: Update install, planner, audit, backup, and manifest behavior only where the new reader-facing paths affect managed-file ownership, conflict handling, or removal safety. (`W9R3-P4-T2`)
- [x] t3: Update `packages/cli/tests/install.test.ts` and `packages/cli/tests/consistency.test.ts` so parity checks include guide/playbook assets and do not misclassify archive or tool resources. (`W9R3-P4-T3`)
- [x] t4: Prove `packages/cli/template/**` reflects the template after copy/prepack. (`W9R3-P4-T4`)
- [x] t5: Update the risk register and history/closeout docs with implementation evidence. (`W9R3-P4-T5`)

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

## Implementation Notes

- Phase 2 already updated `packages/cli/src/catalog.ts` to manage the new `docs/assets/guides/**`, `docs/assets/playbooks/**`, and `docs/archive/**` router files. No `rules.ts` path-list change was needed because the new reader-facing assets are instruction routers, not prompt/template/reference rule entries.
- Added consistency coverage that verifies the default scaffold includes the canonical reader-facing router assets and reads them from the local template source.
- Added install coverage that verifies `docs/assets/guides/AGENTS.md`, `docs/assets/playbooks/AGENTS.md`, and `docs/archive/AGENTS.md` are manifest-tracked with `file:` source IDs.
- Extended `scripts/smoke-pack.mjs` so prepack/package smoke testing fails when the packed template omits the reader-facing routers, when installed assets do not include them, or when uninstall removes unmanaged custom guide/playbook/archive files.
- Ran `node scripts/copy-template-to-cli.mjs`; `packages/cli/template/**` is ignored/generated, and `npm run smoke:pack` re-ran prepack before packing the tarball.
- Updated `R-011` and `R-013` with W9 R3 Phase 4 evidence. `R-011` remains open for PRD 24 configuration-overlay integration. `R-013` remains open for broader restructure relocation, but the PRD 22 reader-facing router package flow is now proven.
- Developer guide decision: none; package parity evidence is captured in the smoke-pack script and this work/history record.
- User guide decision: none; installed command behavior did not change beyond managed router coverage.
- UAT decision: completed through the repo's packed CLI smoke scenario, `npm run smoke:pack`, because it exercises user-facing install, sync, skills, backup, and uninstall behavior from a packed tarball and now verifies reader-facing asset preservation.
- Changed path scope: `docs/prd/03-open-questions-and-risk-register.md`, `docs/work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/04-package-parity-and-closeout.md`, `docs/assets/history`, `packages/cli/tests/consistency.test.ts`, `packages/cli/tests/install.test.ts`, and `scripts/smoke-pack.mjs`.
