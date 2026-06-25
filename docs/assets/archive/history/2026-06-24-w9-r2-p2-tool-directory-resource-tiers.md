---
date: 2026-06-24
coordinate: W9 R2 P2
repo: make-docs
branch: make-docs-v2
status: completed
summary: "Added the code-level tool directory model and completed the Phase 2 resource-tier backlog."
---

# Tool Directory Resource Tiers

## Changes

Implemented the W9 R2 Phase 2 logical directory model by adding a typed `packages/cli/src/tool-directory.ts` contract for `.make-docs/**` runtime state, tool resource families, `system` and `custom` tiers, project-owned config, and reserved agentics paths, then wiring the existing manifest path constants through that model without moving current `docs/assets/**` resources.

| Area | Summary |
| --- | --- |
| Code contract | Added `packages/cli/src/tool-directory.ts` with runtime-state paths, resource-family tiers, custom/system classifiers, and reserved agentics helpers. |
| Manifest compatibility | Kept the existing manifest exports stable while sourcing `.make-docs`, manifest, and conflicts paths from the shared tool-directory model. |
| Tests | Added `packages/cli/tests/tool-directory.test.ts` to lock runtime-state separation, custom/system tier classification, and agentics reservation behavior. |
| Work backlog | Marked Phase 2 tasks complete and added implementation notes to [../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/02-tool-directory-and-resource-tiers.md](../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/02-tool-directory-and-resource-tiers.md). |
| Coverage decisions | Developer-guide and user-guide verdicts are `none` for this phase because the change is an internal primitive; guide coverage should wait until the migration behavior exists. PRD verdict is `none` because PRD 21 already defines the requirement and no risk status changed. UAT remains deferred until the full W9 R2 wave is complete. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/02-tool-directory-and-resource-tiers.md](../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/02-tool-directory-and-resource-tiers.md) | Captures Phase 2 implementation notes and completed task state. |

### Developer

None this session.

### User

None this session.
