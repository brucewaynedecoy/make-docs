# New Docs Assets Playbooks Persona Model - Work Backlog

## Purpose

Implement the requirements planned in [../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md) and captured in [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md).

## W9 R4 Supersession Note

W9 R3 is completed historical implementation evidence. Before using this backlog for follow-on work, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md) as the blocking pivot. W9 R4 supersedes the W9 R3 top-level `docs/archive/**` direction with `docs/assets/archive/**`, changes future history writes to `docs/assets/breadcrumbs/**`, hard-moves top-level `docs/artifacts/**` to `docs/assets/artifacts/**`, and keeps tool resources under `.make-docs/**`.

## Source Inputs

- Design: [../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md](../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- Plan: [../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../../plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- Primary PRD: [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- Dependency PRDs: [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md), [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)

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
- Treat `docs/library/playbooks/**` as transitional.
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
