---
date: "2026-04-22"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W9 R1 P3"
summary: "Updated the CLI asset pipeline to use docs/assets resources and root .make-docs state."
---

# CLI Asset Pipeline and State Paths

## Changes

Implemented W9 R1 Phase 3 for the docs assets resource namespace overhaul, framed by [the Phase 3 backlog](../../work/2026-04-22-w9-r1-docs-assets-resource-namespace/03-cli-asset-pipeline-and-state-paths.md). This phase moved the CLI asset pipeline to emit document resources under `docs/assets/`, moved runtime state to root `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`, and updated lifecycle tests plus packed smoke coverage for the new split.

| Area | Summary |
| --- | --- |
| Managed resources | Updated the CLI catalog and rules so archive, history, prompts, references, and templates resolve under `docs/assets/**`. |
| Buildable renderers | Reworked generated routers and design workflow renderers to use `docs/assets/` resource paths while explicitly rejecting state/config paths under `docs/assets/`. |
| Runtime state | Changed manifest and conflict staging constants to root `.make-docs/manifest.json` and `.make-docs/conflicts/`. |
| Lifecycle behavior | Updated install, audit, backup, uninstall, skills, wizard, and CLI readouts to describe root `.make-docs/` state instead of docs-tree config state. |
| Validation | Updated CLI tests and `scripts/smoke-pack.mjs`; validated with the full CLI suite, packed smoke, stale-path scans, and `git diff --check`. |
| Work backlog | Marked Phase 3 tasks and acceptance criteria complete with implementation notes. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/cli/src/README.md](../../../packages/cli/src/README.md) | Updated manual CLI verification notes to inspect `.make-docs/manifest.json` and `.make-docs/conflicts/`. |
| [docs/work/2026-04-22-w9-r1-docs-assets-resource-namespace/03-cli-asset-pipeline-and-state-paths.md](../../work/2026-04-22-w9-r1-docs-assets-resource-namespace/03-cli-asset-pipeline-and-state-paths.md) | Marked Phase 3 work complete and recorded validation commands. |
| [docs/assets/history/2026-04-22-w9-r1-p3-cli-asset-pipeline-and-state-paths.md](2026-04-22-w9-r1-p3-cli-asset-pipeline-and-state-paths.md) | History record for this phase. |

### Developer

None this session.

### User

None this session.
