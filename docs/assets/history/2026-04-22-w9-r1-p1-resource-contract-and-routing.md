---
date: "2026-04-22"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W9 R1 P1"
summary: "Updated active docs routing contracts for the docs/assets resource namespace and root .make-docs state."
---

# Resource Contract and Routing

## Changes

Implemented W9 R1 Phase 1 for the docs assets resource namespace overhaul, framed by [the Phase 1 backlog](../../work/2026-04-22-w9-r1-docs-assets-resource-namespace/01-resource-contract-and-routing.md). This phase updated active dogfood and template routing language so document resources route through `docs/assets/`, while mutable make-docs state is described as root `.make-docs/` state.

| Area | Summary |
| --- | --- |
| Root docs routers | Updated the active docs routers to read reusable references, templates, prompts, archive records, and history records through `docs/assets/` while preserving project-document output roots. |
| References and templates | Updated workflow contracts, output contracts, prompt starters, and structural templates to point future work at `docs/assets/references/`, `docs/assets/templates/`, and `docs/assets/prompts/`. |
| Archive and history | Updated archive and history guidance to route future archive records to `docs/assets/archive/` and future history records to `docs/assets/history/`. |
| Runtime state | Reframed CLI state as root `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`, and marked the docs-tree config router as retired migration context. |
| Template dogfood | Applied matching path-language changes under the shippable docs template so Phase 2 file moves inherit the same contract. |
| Work backlog | Marked Phase 1 tasks and acceptance criteria complete after the active stale-path scan passed. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/AGENTS.md](../../AGENTS.md) and [docs/CLAUDE.md](../../CLAUDE.md) | Active root docs routers updated for the `docs/assets/` resource namespace and `.make-docs/` state split. |
| [docs/.references/](../references/) | Active workflow, output, wave, guide, design, planning, PRD-change, history, and commit-message references updated to the target path contract. |
| [docs/.templates/](../templates/) and [docs/.prompts/](../prompts/) | Template comments and prompt bodies updated to route future generated docs through `docs/assets/` resources. |
| [docs/.archive/](../archive/) and [docs/.assets/](../) | Existing router files updated with target archive, history, resource, and retired-state wording ahead of physical migration. |
| [packages/docs/template/docs/](../../../packages/docs/template/docs/) | Shippable template copy updated with matching Phase 1 routing language. |
| [docs/work/2026-04-22-w9-r1-docs-assets-resource-namespace/01-resource-contract-and-routing.md](../../work/2026-04-22-w9-r1-docs-assets-resource-namespace/01-resource-contract-and-routing.md) | Phase 1 backlog marked complete. |
| [docs/assets/history/2026-04-22-w9-r1-p1-resource-contract-and-routing.md](./2026-04-22-w9-r1-p1-resource-contract-and-routing.md) | History record for this Phase 1 implementation. |

### Developer

None this session.

### User

None this session.
