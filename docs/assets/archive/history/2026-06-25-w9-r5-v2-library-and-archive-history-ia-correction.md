---
date: "2026-06-25"
client: "Codex Desktop"
coordinate: "W9 R5"
repo: "make-docs"
status: "completed"
summary: "Implemented the W9 R5 library and archive-history IA correction."
---

# W9 R5 v2 Library and Archive History IA Correction

## Changes

Implemented the W9 R5 corrective wave that supersedes W9 R4 for guide/library and history/breadcrumb paths. The shipped and dogfooded Make Docs v2 asset contract now uses `docs/assets/library/**` for guide/persona documentation and `docs/assets/archive/history/**` for history and breadcrumb records.

| Area | Summary |
| --- | --- |
| Authority | Added W9 R5 design, plan, and work authority and reconciled active PRDs in place. |
| Package | Updated template routers, CLI catalog/fallback path knowledge, tests, smoke-pack assertions, skill helpers, and the generated CLI template copy. |
| Dogfood | Moved current guides, history, W9 R4 breadcrumb, and transitional playbook material into the corrected asset tree and refreshed the dogfood manifest. |
| Validation | Ran targeted old-path scans and changed-file Markdown link checks before package validation. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-06-25-v2-library-and-archive-history-ia-correction.md](../../../designs/2026-06-25-v2-library-and-archive-history-ia-correction.md) | W9 R5 corrective design authority. |
| [docs/plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md](../../../plans/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-overview.md) | W9 R5 plan bundle. |
| [docs/work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md](../../../work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md) | W9 R5 work backlog and phase evidence. |
| [historical closeout](2026-06-24-w9-r3-p4-package-parity-closeout.md) (retired action-PRD: `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`) | Active PRD reconciliation for library, archive, artifacts, playbooks, and archive-history paths. |
| [README.md](../../../../README.md) | Updated public guide discovery and asset tree references. |
| [packages/docs/README.md](../../../../packages/docs/README.md) | Updated template package layout and re-seed instructions. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/template-assets-and-generated-routers.md](../../library/developer/template-assets-and-generated-routers.md) | Updated maintainer guide for W9 R5 template and system-resource layout. |
| [docs/assets/library/developer/template-contracts-guide-authoring.md](../../library/developer/template-contracts-guide-authoring.md) | Updated guide authoring guidance for the library path and `.make-docs/**` contracts. |
| [docs/assets/library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Updated runtime-state and docs-assets boundary guidance. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/concepts-wave-revision-phase-coordinates.md](../../library/user/concepts-wave-revision-phase-coordinates.md) | Updated W/R/P history-record examples to archive-history. |
