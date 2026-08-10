# Template, Package, and Dogfood Source-of-Truth Contract

> Filename: `2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`. See `.make-docs/contracts/system/design-contract.md` for naming and structural rules.

## Purpose

Define the v2 source-of-truth contract between the shipped documentation template, this repository's dogfood `docs/` tree, and the npm package's bundled template copy.

This design decides where template-owned assets are authored, when root `docs/` is reseeded, when `packages/cli/template/` is refreshed, and what validation proves each layer still represents the same product-owned asset set.

## Context

This is the fourth design in Batch 1 of the [v2 proposed design and roadmap](../assets/artifacts/v2-proposed-design-and-roadmap.md). It intentionally straddles the normal lifecycle because roadmap artifacts are being promoted into design docs before the repo returns to the default design -> plan -> PRD -> work -> implementation arc.

The three accepted Batch 1 designs are stronger authority than the roadmap where they overlap. [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md) keeps the TypeScript npm package as the current npm and `npx` installer owner. [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md) keeps full local materialization as the safe default and states that root `docs/` is not the source of truth for shipped template-owned assets. [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md) classifies root dogfood as validation with a narrower managed-product boundary than the shipped template.

Current maintainer docs already describe a three-layer relationship. `packages/docs/template/` is the source of truth for shipped template-owned files, repo-root `docs/` is a dogfood copy used by this repo to exercise the shipped docs system, and `packages/cli/template/` is the bundled copy produced during `prepack` for tarball and publish flows. [packages/docs/README.md](../../packages/docs/README.md), [maintainer-dogfood-and-maintainer-operations.md](../assets/library/developer/maintainer-dogfood-and-maintainer-operations.md), and [maintainer-docs-assets-and-runtime-state-boundaries.md](../assets/library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) all point in this direction.

Prior design and history show why this needs to become a v2 contract instead of remaining maintainer convention. The archived [Docs Assets Resource Namespace Overhaul](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md) established "template first, dogfood second." D-014 in the [risk register](../prd/03-open-questions-and-risk-register.md) records that W16 product assets were authored in dogfood first and then reverse-seeded into the template. [2026-06-18-w16-r0-template-dogfood-reconciliation.md](../assets/archive/history/2026-06-18-w16-r0-template-dogfood-reconciliation.md) and [2026-06-18-w17-r0-static-template-router-skill-correction.md](../assets/archive/history/2026-06-18-w17-r0-static-template-router-skill-correction.md) record the corrective direction: installed docs, routers, and instruction content come from static template bytes, while root dogfood remains a consumer with local project artifacts.

The implementation surfaces that enforce this boundary today are `resolveTemplateRoot` and `readPackageFile` in [utils.ts](../../packages/cli/src/utils.ts), asset path selection in [rules.ts](../../packages/cli/src/rules.ts), desired asset assembly in [catalog.ts](../../packages/cli/src/catalog.ts), manifest ownership in [manifest.ts](../../packages/cli/src/manifest.ts), managed-file conflict planning in [planner.ts](../../packages/cli/src/planner.ts), apply behavior in [install.ts](../../packages/cli/src/install.ts), managed-block markers in [managed-block.ts](../../packages/cli/src/managed-block.ts), package scripts in [packages/cli/package.json](../../packages/cli/package.json), and package validation through `scripts/copy-template-to-cli.mjs`, `scripts/smoke-pack.mjs`, `npm run validate:defaults -w packages/cli`, and `npm run smoke:pack`.

This design references D-014, R-003, R-004, R-007, Q-005, and D-006 in the risk register without mutating them. It also leaves the skill delivery questions from D-005, Q-001, Q-007, and Q-012 to the later Batch 3 and Batch 4 designs.

## Decision

`packages/docs/template/` is the first mutation target for every shipped template-owned docs asset. A change to a product-owned instruction router, workflow reference, reusable prompt starter, structural template, starter asset directory, or managed docs asset belongs in `packages/docs/template/` before it appears in root `docs/` or `packages/cli/template/`.

Root `docs/` is dogfood validation, not the product source of truth. It must be reseeded only for the template-owned files that this repo should exercise as a make-docs consumer. Reseeding must not overwrite make-docs project artifacts, including designs, plans, PRDs, work backlogs, authored guides, local history records, local archive entries, artifact review outputs, local overlays, or repository-specific documentation unless those files are deliberately promoted into the shipped starter template by a later accepted plan.

`packages/cli/template/` is a generated package-bundled copy, not an authoring surface. It is refreshed from `packages/docs/template/` by the package preparation path, currently `node ../../scripts/copy-template-to-cli.mjs` through the `prepack` script in `packages/cli/package.json`. Maintainers must not treat hand edits in `packages/cli/template/` as source changes. If package validation finds drift, the fix starts in `packages/docs/template/` or in the copy/package script, then regenerates the bundled copy.

Template ownership is file-level unless a later design defines a richer ownership manifest. The current contract is:

- Template-owned files include root and docs instruction routers, docs asset routers, shipped workflow references, shipped templates, shipped prompt starters, starter docs structure, and any static helper files the installer records as managed assets.
- Dogfood/project-owned files include this repo's generated designs, plans, PRDs, work backlogs, local guide content, local history/archive records, artifact review content, and any local custom overlay or config.
- Mixed directories, such as `docs/assets/archive/` and its on-demand `docs/assets/archive/history/` records, are directory-contract surfaces. Their routers and starter structure may be template-owned, but this repo's individual records inside them remain dogfood/project-owned unless deliberately shipped as starter content.
- `.make-docs/` remains mutable installer runtime state and is not reseeded through `docs/`.

The required mutation order is:

1. Edit `packages/docs/template/` for the shipped asset.
2. Update `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, validation tests, or manifest expectations if the managed asset set changes.
3. Reseed root `docs/` only for the affected template-owned files so this repo dogfoods the shipped result.
4. Refresh `packages/cli/template/` through the package copy/prepack path.
5. Run package and dogfood validation before claiming the asset is shipped.

Dogfood reseeding remains a reviewed operation, not a blind recursive copy. It may be supported by deterministic helper scripts later, but any helper must preserve the same ownership boundary: template-owned files may be copied into dogfood; project-owned files must be skipped or surfaced for explicit review. If a reseed touches a managed file that has local changes, the compatibility and managed-file conflict rules from [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md) apply.

Package validation must prove the bundled copy, not just the sibling development template. Local CLI development may read the sibling `packages/docs/template/` tree first, but npm tarball and publish validation must exercise `packages/cli/template/` after the copy/prepack step. `npm run smoke:pack` and package dry-run checks are the package proof surfaces for this contract.

Dogfood freshness must be proven by targeted parity checks for the files expected to match exactly, plus router and managed-block checks for generated instruction surfaces. The implementation may keep manually curated parity lists in tests while v2 is being planned, but a later change plan should either expand those lists or introduce a clearer ownership manifest so Q-005 and R-007 are not left to manual inspection alone.

The package docs and release docs must be treated as secondary descriptions of this contract. If package README wording, tarball allowlists, smoke-pack expectations, or maintainer guides disagree with `packages/cli/package.json`, `packages/docs/template/`, and the accepted design set, the later implementation plan should reconcile the docs rather than changing this source-of-truth order.

## Alternatives Considered

### Treat root `docs/` as the source of truth

This would make dogfood convenient but would repeat D-014. Product assets could exist only in this repo's working docs tree while consuming projects continued to receive stale template bytes. It would also blur project-owned artifacts with shipped system assets.

### Treat `packages/cli/template/` as the source of truth

This would align directly with npm tarball contents but would make the generated package copy the authoring surface. It would also fight the current development flow, where the CLI can read the sibling `packages/docs/template/` tree before package copy.

### Automate dogfood reseeding as a recursive copy

A blind copy would reduce maintainer effort but would overwrite or hide project-owned dogfood content. The safer direction is reviewed reseeding plus stronger proof that the selected template-owned paths match.

### Defer source-of-truth ownership to the conformance lab

The conformance lab needs this contract as input. It can enforce scenarios only after the batch has decided which layer is authoritative and which validation proves each layer.

## Consequences

Future Batch 1 conformance work has a concrete scenario set: template-first mutation, reviewed dogfood reseed, package copy/prepack refresh, and package validation through the bundled template. The conformance lab should treat a green sibling-template install as insufficient unless the bundled package path is also proven.

Batch 2 information-architecture designs inherit a clearer boundary. They can restructure docs assets and personas without accidentally moving make-docs project records into the shipped starter template or treating root dogfood as the product source of truth.

Implementation planning must close the current freshness gaps. At minimum, it should preserve `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run smoke:pack`, package dry-run checks when package contents change, instruction-router checks, targeted template/dogfood parity checks, and a check that `packages/cli/template/` matches the copied template after prepack. If copy or publish dry-runs race around `prepack`, validation should run those package checks sequentially.

R-003 remains active until packed-template validation proves parity in normal release flows. R-004 remains active while path ownership is duplicated across `rules.ts`, `catalog.ts`, tests, scripts, and docs. R-007 and Q-005 remain active until dogfood freshness proof is stronger than manual review. D-006 remains open until package README and tarball allowlist wording are reconciled with the actual package boundary.

This design does not change package contents, template files, dogfood files, source code, PRDs, risk-register entries, plans, work backlogs, or prior design backlinks. Those mutations belong to later plan, PRD, work, and implementation phases after the Batch 1 design set is accepted.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md), [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md), [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md), [Docs Assets Resource Namespace Overhaul](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md), [Agent Instruction File Ownership](../assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md)

Reason: This design is a new v2 Batch 1 contract that formalizes the template-first, dogfood-second direction already present in prior design, maintainer guidance, and W16/W17 corrective history. It does not edit or supersede those docs; it narrows their shared intent into the v2 ownership rule later plans should implement.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: The design revises and standardizes existing package/template/dogfood behavior rather than starting a fresh baseline. It should feed a change plan that updates validation, maintainer docs, and implementation surfaces against the active make-docs PRD/risk namespace after Batch 1 is accepted.

Coordinate Handoff: prior related work includes W9 R1 resource namespace, W16 R0 lifecycle/template reconciliation, and W17 R0 static template/router correction; reconciled into the active PRD namespace as [PRD 06](../prd/06-template-contracts-and-generated-assets.md#template-source-authority) and treated as an accepted v2 source-of-truth contract.
