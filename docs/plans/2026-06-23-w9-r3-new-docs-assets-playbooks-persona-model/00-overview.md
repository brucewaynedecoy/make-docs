# New Docs Assets, Playbooks, and Persona Model - PRD Change Plan

## Objective

Convert [New Docs Assets, Playbooks, and Persona Model](../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md) into an implementation-ready planning bundle that reconciles the active PRD set and produces a work backlog for the v2 reader-facing documentation asset namespace.

This plan originally established `docs/assets/{guides,playbooks}/` as the reader-facing reusable documentation asset surface. W9 R5 supersedes the guide path with `docs/assets/library/**`, keeps make-docs tool resources out of that surface, moves history/breadcrumb records into `docs/assets/archive/history/**`, and preserves the canonical persona schema and `persona` frontmatter contract needed by coverage, generated metadata, and configuration work.

## W9 R5 Supersession Note

W9 R3 has already been implemented under the pre-pivot archive/history model. Before extending any W9 R3 output, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md) as the blocking pivot. W9 R4 remains historical evidence for moving top-level archive/artifact assumptions into `docs/assets/**`; W9 R5 changes future guide/persona docs to `docs/assets/library/**`, changes future history/breadcrumb records to `docs/assets/archive/history/**`, and keeps tool resources under `.make-docs/**`.

## Coordinate Decision

Coordinate: `W9 R3`

The design's coordinate handoff is unresolved. This plan uses `W9 R3` because the design is part of Batch 2 canonical information architecture and materially revises the earlier W9 docs-assets namespace after [W9 R2 Tool Directory System and Custom Resource Tiers](../2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md) reserved `.make-docs/**` for tool resources. It also records W16 `docs/library/playbooks/**` as transitional historical evidence, but the dominant lineage is the W9 docs-assets restructure now corrected by W9 R5.

## Change Classification

- Route: `change-plan`
- Update Mode: `new-doc-related`
- Source design: [../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- Depends on: [../2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md](../2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md)
- PRD strategy: create PRD 22 because the guide/playbook namespace, persona schema, archive placement, and frontmatter authority are new active requirements that do not fit cleanly inside PRD 21's tool-directory scope.

## Current Baseline

Current repo state still reflects several earlier decisions:

- Historical guide routing and installed assets referenced `docs/guides/**`; W9 R5 moves them to `docs/assets/library/**`.
- W16 introduced `docs/library/playbooks/agent/make-docs-lifecycle.md` as a temporary playbook home; W9 R5 moves the active copy to `docs/assets/playbooks/**`.
- `docs/assets/**` currently holds prompts, references, templates, archive, and history content from earlier docs-assets work.
- The current CLI uses hard-coded path lists and duplicated validation knowledge in `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/install.ts`, `packages/cli/tests/install.test.ts`, and `packages/cli/tests/consistency.test.ts`.
- The coverage-pass contract already separates verdict and persona target, but `Q-009` and `R-011` remain open because persona schema and custom persona handling are not yet fixed.

## Output Contract

This planning round creates:

- This plan bundle under `docs/plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/`.
- A new active PRD change doc: [../../prd/22-project-documentation-asset-model.md](../../prd/22-project-documentation-asset-model.md#requirements).
- PRD index, risk-register, and affected baseline/change-doc annotations for the new requirements.
- A matching implementation backlog under `docs/work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/`.

This round does not move source files, update templates, or change CLI behavior. The backlog performs that work in a later implementation pass.

## Validation

The implementation backlog must preserve the template-first flow from PRD 19 and the tool-directory separation from PRD 21. Future implementation validation should include:

- `npm test -w packages/cli`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Markdown link checks for migrated guide, playbook, and archive references.
- Template/dogfood/package parity checks for shipped reader-facing assets.
- Router and path-hygiene checks for `docs/assets/library/**`, `docs/assets/playbooks/**`, `docs/assets/archive/**`, `docs/assets/archive/history/**`, `docs/assets/artifacts/**`, and remaining `.make-docs/**` tool-resource paths.
- Persona fixture checks for default and custom personas, including frontmatter/path drift.

## Phase Map

1. [Active PRD and Risk Reconciliation](01-active-prd-and-risk-reconciliation.md)
2. [Reader-Facing Asset Namespace](02-reader-facing-asset-namespace.md)
3. [Persona Schema and Validation Contract](03-persona-schema-and-validation-contract.md)
4. [Delta Backlog and Closeout](04-delta-backlog-and-closeout.md)
