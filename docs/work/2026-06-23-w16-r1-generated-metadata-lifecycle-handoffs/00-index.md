# Generated Metadata Lifecycle Handoffs - Work Backlog

## W9 R4 Prerequisite

Before executing this backlog, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). W16 R1 metadata and handoff fields must describe `.make-docs/**` system resources and `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` project assets, not pre-pivot `docs/artifacts/**`, top-level `docs/archive/**`, `docs/assets/history/**`, or `docs/assets/{prompts,references,templates}/**` assumptions.

## Purpose

Implement the requirements planned in [../../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md](../../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md) and captured in [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md).

## Source Inputs

- Design: [../../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md](../../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- Plan: [../../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md](../../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md)
- Primary PRD: [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- Dependency PRDs: [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md), [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 01 | [01-requirements-and-register-reconciliation.md](01-requirements-and-register-reconciliation.md) | Active PRDs and risk register reflect PRD 23. |
| 02 | [02-metadata-schema-and-templates.md](02-metadata-schema-and-templates.md) | Generated templates carry common and conditional metadata. |
| 03 | [03-handoff-drift-validation.md](03-handoff-drift-validation.md) | YAML/body handoff and lifecycle departure validation exists. |
| 04 | [04-package-parity-and-closeout.md](04-package-parity-and-closeout.md) | Package, parity, and closeout proof cover metadata changes. |

## Global Constraints

- Do not backfill every historical document.
- Do not make follow-ons hard gates.
- Do not rename `persona` from PRD 22.
- Do not put provider/cache provenance for tool resources into reader-facing document metadata.
- Preserve template-first authoring from PRD 19.

## Validation Summary

At closeout, run:

- `npm test -w packages/cli`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Markdown link checks for touched docs.
- Metadata fixture checks for generated docs and YAML/body drift.
