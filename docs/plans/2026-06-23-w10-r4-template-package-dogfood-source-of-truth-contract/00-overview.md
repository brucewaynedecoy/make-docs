# Template Package Dogfood Source of Truth Contract - PRD Change Plan

## Objective

Turn the accepted design in `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md` into the active PRD and work backlog contract for template-first authoring, reviewed dogfood reseeding, generated package template copies, and validation across local and packed package paths.

## W9 R5 Prerequisite

This W10 R4 plan remains valid for template/source-of-truth ordering, but any implementation must first apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md). W9 R5 fixes the concrete documentation asset locations that W10 R4 must reseed and package: `docs/assets/{archive,artifacts,library,playbooks}/**` plus on-demand `docs/assets/archive/history/**` for managed project documentation assets and `.make-docs/{contracts,references,scripts,templates,agentics}/**` for make-docs system machinery.

## Coordinate Decision

- Coordinate: `W10 R4`
- Route: `change-plan`
- Reason: this plan extends the W10 v2 package/deployment sequence after W10 R1 package boundaries, W10 R2 system asset materialization, and W10 R3 compatibility migration.
- Plan directory: `docs/plans/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/`
- PRD change doc: `docs/prd/06-template-contracts-and-generated-assets.md`
- Work backlog: `docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/`

## Change Classification

Append one active PRD change doc and annotate the existing active PRD set in place. No baseline PRD is removed or renumbered.

## Change Inputs

- Design: `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`
- Prior W10 PRDs: `docs/prd/16-package-runtime-and-deployment-boundaries.md`, `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`, `docs/prd/18-compatibility-classification-and-migration-safety.md`
- Current source anchors: `packages/cli/src/utils.ts`, `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, `packages/cli/src/managed-block.ts`, `packages/cli/package.json`, `scripts/copy-template-to-cli.mjs`, `scripts/smoke-pack.mjs`, and `packages/cli/tests/consistency.test.ts`

## Output Contract

This round produces:

- A plan bundle in this directory.
- One appended active PRD change doc, `docs/prd/06-template-contracts-and-generated-assets.md`.
- Baseline annotations in the PRD index, template contracts, dogfood operations, package validation, and risk register.
- A paired work backlog under `docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/`.

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| 1 | `01-active-prd-and-risk-reconciliation.md` | Active PRD registration, affected baseline notes, and living risk-register reconciliation. |
| 2 | `02-template-source-and-dogfood-ownership.md` | Template-first mutation order, dogfood/project ownership boundaries, and reviewed reseeding behavior. |
| 3 | `03-package-copy-and-validation-contract.md` | Generated `packages/cli/template/` copy contract, packed-package validation, and parity proof points. |
| 4 | `04-delta-backlog-and-closeout.md` | Work backlog generation, validation, and commit closeout for this planning round. |

## Intended Follow-On

Generate and execute the paired work backlog before implementation changes alter template files, dogfood reseeding helpers, package copy scripts, package README wording, or validation coverage for this source-of-truth contract.
