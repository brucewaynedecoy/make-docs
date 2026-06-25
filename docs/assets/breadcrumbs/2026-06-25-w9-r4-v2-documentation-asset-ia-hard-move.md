---
client: "Codex Desktop"
date: "2026-06-25"
coordinate: "W9 R4"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Implemented the v2 documentation asset IA hard move."
---

# W9 R4 v2 Documentation Asset IA Hard Move

## Changes

Implemented the W9 R4 pivot captured in [the accepted design](../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md), [the W9 R4 plan](../../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md), and [the W9 R4 work backlog](../../work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). The implementation hard-moved top-level `docs/artifacts/**` into `docs/assets/artifacts/**`, rejected top-level `docs/archive/**` as a shipped v2 target, moved make-docs-owned system resources into `.make-docs/{contracts,references,templates,scripts}/system/**`, and established `docs/assets/breadcrumbs/**` as the new closeout breadcrumb target while preserving existing `docs/assets/history/**` as pre-migration evidence.

| Area | Summary |
| --- | --- |
| Authority | [PRD 21](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md), [PRD 22](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md), and [R-013](../../prd/03-open-questions-and-risk-register.md#r-013-the-restructure-and-rename-will-relocate-newly-authored-assets) now reflect the hard-move IA and close the broad relocation risk. |
| Runtime and template contract | Root and template `.make-docs/**` now carry system contracts, references, prompt starters, templates, and helper scripts; `packages/docs/template/docs/assets/**` now carries the shipped project-asset routers. |
| CLI and package proof | CLI catalog, compatibility, planner, rules, tool-directory logic, test fixtures, and smoke-pack validation now assert the W9 R4 layout. |
| Dogfood boundary | This repo's dogfood tree was migrated and validated as a migration laboratory without making existing local historical clutter define the shipped template contract. |
| Workflow departure | `./.make-docs/build-process/` was not present in this checkout, so the phase work used `docs/AGENTS.md`, `.make-docs/references/system/lifecycle.md`, W9 R4 phase docs, and live PRD/design/plan authority instead. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-06-25-v2-documentation-asset-ia-hard-move.md](../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md) | Accepted pivot authority for the v2 documentation asset IA hard move. |
| [docs/plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md](../../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md) | W9 R4 implementation plan generated from the accepted design. |
| [docs/work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md](../../work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md) | W9 R4 work backlog and phase sequencing authority. |
| [docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md) | Active PRD authority for `.make-docs/**` system tool resources. |
| [docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) | Active PRD authority for `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**`. |
| [.make-docs/contracts/system/history-record-contract.md](../../../.make-docs/contracts/system/history-record-contract.md) | Current breadcrumb/history record contract used for this closeout. |
| [packages/docs/template/.make-docs/AGENTS.md](../../../packages/docs/template/.make-docs/AGENTS.md) | Shipped template system-resource router. |
| [packages/docs/template/docs/assets/AGENTS.md](../../../packages/docs/template/docs/assets/AGENTS.md) | Shipped template project-asset router. |
| [scripts/smoke-pack.mjs](../../../scripts/smoke-pack.mjs) | Packed-template smoke validation updated to assert the W9 R4 IA. |

### Developer

None this session.

### User

None this session.
