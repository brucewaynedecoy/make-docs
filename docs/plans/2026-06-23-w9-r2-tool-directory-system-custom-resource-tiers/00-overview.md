# Tool Directory System and Custom Resource Tiers - PRD Change Plan

## Objective

Turn the accepted tool-directory design into the active PRD and work backlog contract for `.make-docs/` tool resources, system/custom resource tiers, runtime state boundaries, and the migration path away from product-owned tool assets in `docs/assets/**`.

## W9 R5 Supersession Note

W9 R2 has already been implemented and remains historical evidence for the first `.make-docs/**` split. Before extending or reimplementing any W9 R2 work, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md) as the blocking pivot. W9 R4 remains historical evidence for top-level artifact/archive moves; W9 R5 supersedes older future-facing guide, breadcrumb, and history assumptions. The current targets are `docs/assets/{archive,artifacts,library,playbooks}/**`, on-demand `docs/assets/archive/history/**`, and `.make-docs/{contracts,references,scripts,templates,agentics}/**`.

## Coordinate Decision

- Coordinate: `W9 R2`
- Route: `change-plan`
- Reason: this design materially revises the archived W9 R1 docs-assets resource namespace while depending on the accepted W10 Batch 1 package, materialization, compatibility, and source-of-truth contracts.
- Plan directory: `docs/plans/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/`
- PRD change doc: `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`
- Work backlog: `docs/work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/`

## Change Inputs

- Design: `docs/designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md`
- Prior lineage: W9 R1 docs-assets resource namespace, W14 asset selection work, W16/W17 template and instruction-router corrections, and W10 R1-R5 v2 contract revisions.
- Current source anchors: `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/install.ts`, `packages/cli/src/managed-block.ts`, package copy/prepack, smoke-pack validation, and consistency tests.

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| 1 | `01-active-prd-and-risk-reconciliation.md` | Register PRD 21 and update affected active PRDs and living risk entries. |
| 2 | `02-tool-directory-and-resource-tiers.md` | Define `.make-docs/` tool families, system/custom tiers, runtime state, bootstrap, and agentics reservation. |
| 3 | `03-migration-and-validation-contract.md` | Define migration boundaries from `docs/assets/**`, package/template propagation, and validation expectations. |
| 4 | `04-delta-backlog-and-closeout.md` | Generate work backlog, validate, and commit this planning round. |

## Intended Follow-On

Generate and execute the paired work backlog before moving current template-owned tool resources from `docs/assets/**` into `.make-docs/**`.
