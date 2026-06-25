---
date: "2026-04-22"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W9 R1 P2"
summary: "Moved the shippable docs template resource tree under docs/assets."
---

# Template Resource Tree

## Changes

Implemented W9 R1 Phase 2 for the docs assets resource namespace overhaul, framed by [the Phase 2 backlog](../archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/02-template-resource-tree.md). This phase moved the shippable docs template resources into `packages/docs/template/docs/assets/`, removed the template config router instead of carrying CLI state into docs assets, and repaired active template routers to use `docs/assets/` paths.

| Area | Summary |
| --- | --- |
| Template resource tree | Moved archive, history, prompts, references, and templates into `packages/docs/template/docs/assets/`. |
| Template state boundary | Removed `packages/docs/template/docs/.assets/config/` because `.make-docs/` runtime state is created outside the shippable docs template. |
| Template routers | Updated active template capability routers to reference `docs/assets/` support resources. |
| Work backlog | Marked Phase 2 tasks and acceptance criteria complete. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/docs/template/docs/assets/](../../../packages/docs/template/docs/assets/) | Consolidated shippable template resource root for archive, history, prompts, references, and templates. |
| [packages/docs/template/docs/designs/](../../../packages/docs/template/docs/designs/) | Updated design router references to the new template support-resource paths. |
| [packages/docs/template/docs/guides/](../../../packages/docs/template/docs/guides/) | Updated guide router references to the new template support-resource paths. |
| [packages/docs/template/docs/plans/](../../../packages/docs/template/docs/plans/) | Updated plan router references to the new template support-resource paths. |
| [packages/docs/template/docs/prd/](../../../packages/docs/template/docs/prd/) | Updated PRD router references to the new template support-resource paths. |
| [packages/docs/template/docs/work/](../../../packages/docs/template/docs/work/) | Updated work router references to the new template support-resource paths. |
| [docs/assets/archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/02-template-resource-tree.md](../archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/02-template-resource-tree.md) | Marked Phase 2 work tasks and acceptance criteria complete. |
| [docs/assets/history/2026-04-22-w9-r1-p2-template-resource-tree.md](2026-04-22-w9-r1-p2-template-resource-tree.md) | History record for this phase. |

### Developer

None this session.

### User

None this session.
