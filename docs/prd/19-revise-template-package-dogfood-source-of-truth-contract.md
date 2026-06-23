# 19 Revise Template Package Dogfood Source of Truth Contract

## Purpose

Define the v2 source-of-truth contract between the shipped documentation template, this repository's dogfood `docs/` tree, and the npm package's bundled template copy.

This change captures where template-owned assets are authored, when root `docs/` is reseeded, when `packages/cli/template/` is refreshed, and what validation proves each layer still represents the same product-owned asset set.

## Change Type

Revision to the active template, dogfood, package, validation, and compatibility requirements.

## Baseline Being Revised or Removed

- Revises `docs/prd/06-template-contracts-and-generated-assets.md` by making `packages/docs/template/` the first mutation target for shipped template-owned docs assets.
- Revises `docs/prd/09-dogfood-and-maintainer-operations.md` by making repo-root `docs/` a dogfood validation surface with explicit project-owned exclusions.
- Revises `docs/prd/10-packaging-validation-and-release-reference.md` by making generated `packages/cli/template/` and smoke-pack validation part of the source-of-truth proof.
- Refines `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` by applying reviewed migration and conflict rules to reseeding operations.
- Updates `docs/prd/03-open-questions-and-risk-register.md` without adding new register IDs.

## Rationale

The repository already has three distinct layers: `packages/docs/template/` as the shipped template source, root `docs/` as a dogfood copy plus local project workspace, and `packages/cli/template/` as the generated package-bundled copy. Current code supports that model through `resolveTemplateRoot()`, `readPackageFile()`, asset cataloging, manifest ownership, package `prepack`, copy scripts, smoke-pack validation, and targeted parity tests. The requirement needs to become an active PRD contract so implementation work does not reintroduce dogfood-first authoring or hand-edited package template drift.

## Effective Requirement

Source-of-truth order:

- `packages/docs/template/` is the first mutation target for every shipped template-owned docs asset.
- Root `docs/` is dogfood validation, not the product source of truth.
- `packages/cli/template/` is a generated package-bundled copy, not an authoring surface.
- If package validation finds drift, fixes start in `packages/docs/template/` or the copy/package script, then regenerate the bundled copy.
- Conformance-lab assets from [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) do not enter `packages/docs/template/`, root dogfood reseeding, or `packages/cli/template/` unless a later accepted design deliberately promotes a subset.
- Tool-directory defaults from [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) follow the same source-of-truth order: author in `packages/docs/template/`, dogfood selected template-owned files under review, and bundle through package copy/prepack.
- Reader-facing guide/playbook defaults from [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) follow the same source-of-truth order when they are shipped starter assets: author in `packages/docs/template/`, dogfood selected template-owned files under review, and bundle through package copy/prepack.
- First-party system helper script or wrapper changes from [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) follow the same shipped-resource order when they are template-owned: start in `packages/docs/template/`, dogfood selected files under review, refresh `packages/cli/template/`, and keep registry or skill payload changes scoped to selected-skill assets.
- Playbook defaults from [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md) follow the same source-of-truth order and must preserve minimum playbook frontmatter, path/persona consistency, stack metadata, body contract sections, and package-template parity when shipped.
- Future adversarial-review prompts, references, playbooks, starter assets, plugins, CLI/MCP affordances, or conformance assets from [31-revise-coverage-pass-extensions-adversarial-review.md](./31-revise-coverage-pass-extensions-adversarial-review.md) follow the same source-of-truth order only when a downstream plan explicitly selects and ships that surface; adversarial review is not dogfooded first and is not shipped by default.

Template-owned assets:

- Template-owned files include root and docs instruction routers, docs asset routers, shipped workflow references, shipped templates, shipped prompt starters, starter docs structure, and static helper files recorded by the installer as managed assets.
- Dogfood/project-owned files include generated designs, plans, PRDs, work backlogs, local guide content, local history/archive records, artifact review content, local overlays, and local config.
- Mixed directories such as `docs/assets/history/` and `docs/assets/archive/` are directory-contract surfaces. Routers and starter structure may be template-owned, but local records inside them remain project-owned unless deliberately shipped as starter content.
- `.make-docs/` remains mutable runtime state and is not reseeded through `docs/`.

Mutation order:

1. Edit `packages/docs/template/` for shipped assets.
2. Update `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, validation tests, or manifest expectations when the managed asset set changes.
3. Reseed root `docs/` only for affected template-owned files.
4. Refresh `packages/cli/template/` through the package copy/prepack path.
5. Run package and dogfood validation before claiming the asset is shipped.

Dogfood reseeding:

- Reseeding is reviewed and scoped, not a blind recursive copy.
- Helper scripts may be added later only if they preserve the same ownership boundary.
- Project-owned files must be skipped or surfaced for explicit review.
- Local changes to managed files use PRD 18 compatibility and managed-file conflict rules.

Package validation:

- Local CLI development may read sibling `packages/docs/template/` first.
- Npm tarball and publish validation must exercise `packages/cli/template/` after copy/prepack.
- `npm run smoke:pack` and package dry-run checks are the package proof surfaces.
- Package validation remains dry-run only unless separately authorized.

Freshness proof:

- Dogfood freshness must be proven by targeted parity checks for files expected to match exactly.
- Router and managed-block checks remain required for generated instruction surfaces.
- A later implementation plan should expand parity lists or introduce a clearer ownership manifest so Q-005 and R-007 do not rely on manual inspection alone.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhances template ownership with the explicit template-first mutation order and project-owned exclusions. |
| `docs/prd/09-dogfood-and-maintainer-operations.md` | Enhances dogfood operations with reviewed reseeding and freshness proof requirements. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhances packaging validation with generated package-template and packed-path proof requirements. |
| `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` | Applies compatibility and managed-file conflict rules to reseeding when local managed files have changed. |
| `docs/prd/03-open-questions-and-risk-register.md` | Updates D-006, D-007, D-014, Q-005, R-003, R-004, and R-007 without duplicating entries. |
| `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md` | Applies template/package/dogfood source-of-truth order to future reader-facing guide and playbook defaults. |
| `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md` | Applies template/package/dogfood source-of-truth order to future shipped adversarial-review surfaces without making them default assets. |

The paired delta backlog for implementation work should be generated under `docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/` and trace back to this revision, the W10 R4 plan, the accepted design, and current TypeScript CLI/package surfaces.

## Required Baseline Annotations

- `docs/prd/00-index.md` must include PRD 19 in reading order, document map, source anchors, audience paths, and intended follow-on.
- `docs/prd/06-template-contracts-and-generated-assets.md` must point to PRD 19 from change notes.
- `docs/prd/09-dogfood-and-maintainer-operations.md` must point to PRD 19 from change notes.
- `docs/prd/10-packaging-validation-and-release-reference.md` must point to PRD 19 from change notes.
- `docs/prd/03-open-questions-and-risk-register.md` must update the existing relevant entries without creating new register IDs.

## Source Anchors

- `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`
- `docs/plans/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-overview.md`
- `docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-index.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `packages/cli/src/utils.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/package.json`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`
- `packages/cli/tests/consistency.test.ts`
- `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/prd/29-revise-playbook-contract-run-playbook.md`
- `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
