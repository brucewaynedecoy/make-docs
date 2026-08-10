# New Docs Assets Playbooks Persona Model - Work Backlog

## Purpose

Implement the requirements planned in [../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md) and captured in [../../prd/22-project-documentation-asset-model.md](../../prd/22-project-documentation-asset-model.md#requirements).

## W9 R5 Supersession Note

W9 R3 is completed historical implementation evidence. Before using this backlog for follow-on work, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md) as the blocking pivot. W9 R4 superseded the W9 R3 top-level archive/artifact direction; W9 R5 further changes future guide/persona docs to `docs/assets/library/**` and future history/breadcrumb records to `docs/assets/archive/history/**`.

## Source Inputs

- Design: [../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- Plan: [../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- Primary PRD: [../../prd/22-project-documentation-asset-model.md](../../prd/22-project-documentation-asset-model.md#requirements)
- Dependency PRDs: [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority), [../../prd/21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md)

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 01 | [01-requirements-and-register-reconciliation.md](01-requirements-and-register-reconciliation.md) | Active PRDs and risk register reflect PRD 22. |
| 02 | [02-reader-facing-asset-namespace.md](02-reader-facing-asset-namespace.md) | Guide/playbook/archive path mappings are implemented template-first. |
| 03 | [03-persona-schema-and-validation.md](03-persona-schema-and-validation.md) | Persona schema, frontmatter authority, and validation fixtures exist. |
| 04 | [04-package-parity-and-closeout.md](04-package-parity-and-closeout.md) | Package, dogfood, and closeout proof covers reader-facing assets. |

## Global Constraints

- Preserve `.make-docs/**` as the tool-resource and runtime namespace from PRD 21.
- Preserve PRD 19 template-first authoring and reviewed dogfood reseeding.
- Treat `docs/library/playbooks/**` as migrated historical evidence.
- Treat `docs/assets/archive/**` as the managed archive surface; older W9 R3 references to top-level `docs/archive/**` are superseded by W9 R4.
- Do not implement Run Playbook execution in this backlog.
- Do not make directory placement authoritative over `persona` frontmatter.

## Validation Summary

At closeout, run:

- `npm test -w packages/cli`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Markdown link checks for touched docs.
- Template/dogfood/package parity checks for migrated reader-facing assets.
- Path-hygiene and router checks for new canonical paths.
