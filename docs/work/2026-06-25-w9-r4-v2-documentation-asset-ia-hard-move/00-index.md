# v2 Documentation Asset IA Hard Move - Work Backlog

## Purpose

Implement the W9 R4 pivot planned in [../../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md](../../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md) and reconciled into the active PRD set.

This backlog executes the hard move from top-level `docs/artifacts/**` and rejected top-level `docs/archive/**` assumptions into the accepted `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` model, while keeping Make Docs machinery under `.make-docs/**`.

## W9 R5 Supersession

W9 R4 remains historical implementation evidence for the top-level artifact/archive hard move and `.make-docs/**` tool-resource split. W9 R5 supersedes W9 R4 for guide/library and history/breadcrumb targets: future work must use `docs/assets/library/**` and `docs/assets/archive/history/**`, not this backlog's `docs/assets/guides/**` or `docs/assets/breadcrumbs/**` targets.

## Phase Map

| Phase | File | Purpose |
| --- | --- | --- |
| 1 | [01-authority-and-migration-inventory.md](01-authority-and-migration-inventory.md) | Verify W9 R4 authority, inventory affected future-facing references, and classify migration targets before moving behavior. |
| 2 | [02-asset-ia-router-contracts.md](02-asset-ia-router-contracts.md) | Update router, lifecycle, output, compatibility, catalog, and path-hygiene contracts to the accepted IA. |
| 3 | [03-template-package-dogfood-migration-lab.md](03-template-package-dogfood-migration-lab.md) | Update template/package surfaces and use this repo's dogfood tree as migration-lab evidence without making it shipped contract. |
| 4 | [04-validation-breadcrumbs-closeout.md](04-validation-breadcrumbs-closeout.md) | Validate parity, links, path references, breadcrumb/history handling, and final manual/UAT decision. |

## Usage Notes

- Treat W9 R4 as a blocking pivot-integration wave for remaining unimplemented v2 work that depends on docs asset locations, templates, compatibility classification, migration behavior, package materialization, or dogfood structure.
- Do not reorder already-completed W9 R2, W9 R3, W10 R1, W10 R2, or W10 R3 commits. They remain historical evidence produced under the prior IA.
- Execute W9 R4 before continuing later unimplemented v2 package/template/workflow phases that could otherwise repeat the old path assumptions.
- Treat [../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md](../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md), [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md), and [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) as the primary authority.
- Do not preserve top-level `docs/artifacts/**` as a shipped alias.
- Do not introduce top-level `docs/archive/**` as a shipped v2 target.
- Do not treat repo-root dogfood cleanup as template source of truth.
- W9 R5 moved preserved history and W9 R4 breadcrumb records under `docs/assets/archive/history/**`; use that location for current closeout records.
- Skip manual/UAT decisions until the full W9 R4 implementation is complete.

## Intended Follow-On

Route: `work-loop`

Next step: implement phases 1 through 4 in order, validating each phase before moving to the next.

Why: the PRD set now fixes the IA decisions; implementation must update contracts, routers, templates, package behavior, and dogfood migration evidence without reopening those choices.

Coordinate Handoff: use `W9 R4` for implementation history, phase closeout, and final coverage decisions.
