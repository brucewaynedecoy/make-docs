# Make Docs PRD Decomposition Backlog

> In v2, work backlogs are directories. This file is the entry point for the dependency-ordered implementation phases that follow.

## Purpose

This backlog converts the active `make-docs` PRD set into dependency-ordered implementation work. The phase order follows the live architecture captured in [../../prd/01-product-overview.md](../../prd/01-product-overview.md) and [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md): typed install state and manifest safety in `packages/cli/src/types.ts:38-271`, `packages/cli/src/profile.ts:10-99`, and `packages/cli/src/manifest.ts:18-245` come first; asset selection and rendering in `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/rules.ts:130-194`, and `packages/cli/src/renderers.ts:40-570` come next; public CLI and skills behavior in `packages/cli/src/cli.ts:77-244` and `packages/cli/src/skill-catalog.ts:33-138` follow; dogfood, packaging, and release validation land last through `packages/cli/src/utils.ts:33-55`, `packages/cli/package.json:9-25`, and `scripts/smoke-pack.mjs:60-246`.

## Phase Map

| Phase | Focus | Primary anchors | Depends on |
| --- | --- | --- | --- |
| [01-core-install-flow.md](01-core-install-flow.md) | Rebuild `InstallSelections`, capability resolution, manifest state, plan/apply behavior, and audit-safe lifecycle boundaries. | `packages/cli/src/types.ts:38-271`, `packages/cli/src/profile.ts:10-99`, `packages/cli/src/planner.ts:19-390`, `packages/cli/src/install.ts:26-240`, `packages/cli/src/audit.ts:41-940` | None |
| [02-template-and-contract-system.md](02-template-and-contract-system.md) | Rebuild the template source tree, asset-selection rules, router renderers, and document contract surfaces. | `packages/docs/template/**`, `packages/cli/src/rules.ts:8-194`, `packages/cli/src/catalog.ts:7-85`, `packages/cli/src/renderers.ts:40-570` | Phase 01 |
| [03-skills-and-cli-lifecycle.md](03-skills-and-cli-lifecycle.md) | Rebuild the public command surface, wizard/review flow, skills-only maintenance path, and command/help alignment. | `packages/cli/src/cli.ts:77-1019`, `packages/cli/src/wizard.ts:124-1011`, `packages/cli/src/skills-command.ts:32-193`, `packages/cli/src/skill-catalog.ts:33-138`, `packages/cli/src/skill-resolver.ts:40-226` | Phases 01-02 |
| [04-dogfood-packaging-and-validation.md](04-dogfood-packaging-and-validation.md) | Rebuild dogfood re-seeding, packaging surface truth, release metadata, and validation/release gates. | `packages/docs/README.md:50-121`, `packages/cli/src/utils.ts:33-55`, `packages/cli/package.json:9-25`, `scripts/copy-template-to-cli.mjs:24-32`, `scripts/smoke-pack.mjs:60-246` | Phases 01-03 |

## Usage Notes

- This backlog now incorporates the full `docs/prd/01` through `docs/prd/10` set. The fixed-core overview docs [../../prd/01-product-overview.md](../../prd/01-product-overview.md) and [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md) reinforce the same dependency ordering already visible in the subsystem docs rather than changing it.
- Internal maintainer and dogfood workflows are first-class acceptance boundaries in every phase. `packages/docs/README.md:86-121`, `packages/cli/src/utils.ts:33-55`, and `scripts/smoke-pack.mjs:60-246` describe product behavior, not repo-only housekeeping.
- Treat `packages/content`, skills delivery mode, and template/reference mode semantics as explicit decision points from [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md). Do not leave them as implied future work.
- Preserve the order `profile/manifest -> asset catalog/renderers -> CLI and skills surfaces -> dogfood/packaging/release validation`. Later phases may reuse earlier contracts, but they should not silently redefine them.
