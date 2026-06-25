---
date: 2026-06-24
coordinate: W9 R3 P2
repo: make-docs
branch: make-docs-v2
status: completed
summary: "Defined reader-facing guide/playbook asset routers, mapped the lifecycle playbook, and recorded archive namespace migration guidance."
---

# New Docs Assets Reader-Facing Asset Namespace

## Changes

Completed W9 R3 Phase 2 by establishing the reader-facing guide and playbook namespace under `docs/assets/**`, preserving the old guide and playbook paths as transitional readable surfaces, and defining `docs/archive/**` as the planned archive migration target without moving historical archive content.

| Area | Summary |
| --- | --- |
| Template routers | Added shipped routers for `docs/assets/guides/**`, `docs/assets/playbooks/**`, and `docs/archive/**` under `packages/docs/template/docs/`. |
| Dogfood routers | Reseeded the same routers under repo-root `docs/`, and updated `docs/assets/**`, `docs/guides/**`, and `docs/assets/archive/**` routers with transition wording. |
| Playbook lineage | Added [../../playbooks/agent/make-docs-lifecycle.md](../../playbooks/agent/make-docs-lifecycle.md) as the canonical W9 R3 copy and linked the legacy [../../playbooks/agent/make-docs-lifecycle.md](../../playbooks/agent/make-docs-lifecycle.md) path back to it. |
| Path hygiene | Updated [../../../../.make-docs/references/system/path-and-link-hygiene.md](../../../../.make-docs/references/system/path-and-link-hygiene.md) so `docs/assets/**` no longer reads as a tool-resource catch-all. |
| Package surface | Updated catalog coverage and focused tests so the new template router files are part of the asset pipeline. Generated package-template parity remains in Phase 4. |
| Coverage decisions | Developer-guide verdict is `update-existing` for [../../library/developer/template-assets-and-generated-routers.md](../../library/developer/template-assets-and-generated-routers.md). User-guide verdict is `none` because installed user behavior remains unchanged until Phase 4. No new PRD was created because PRD 22 already owns the namespace requirements. UAT remains deferred until the full W9 R3 wave is complete. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../library/AGENTS.md](../../library/AGENTS.md) | Defines canonical reader-facing guide asset routing. |
| [../../playbooks/AGENTS.md](../../playbooks/AGENTS.md) | Defines canonical reader-facing playbook asset routing. |
| [../../AGENTS.md](../../AGENTS.md) | Defines planned lifecycle archive routing without moving current archive records. |
| [../../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/02-reader-facing-asset-namespace.md](../../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/02-reader-facing-asset-namespace.md) | Records Phase 2 completion evidence and coverage decisions. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/template-assets-and-generated-routers.md](../../library/developer/template-assets-and-generated-routers.md) | Updates maintainer guidance for reader-facing assets, transition routers, and tool-resource boundaries. |

### User

None this session.
