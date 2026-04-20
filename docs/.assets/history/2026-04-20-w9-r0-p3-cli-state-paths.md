---
date: "2026-04-20"
coordinate: "W9 R0 P3"
---

# Docs Assets, State, and History - Phase 3: CLI State Paths

## Changes

Completed Wave 9 Phase 3, framed by [the Phase 3 plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/03-cli-state-paths.md) and [the Phase 3 backlog](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/03-cli-state-paths.md). This phase moved starter-docs CLI-managed state from `docs/.starter-docs/` to `docs/.assets/starter-docs/` without adding legacy fallback reads.

| Area | Summary |
| --- | --- |
| State constants | [`packages/cli/src/manifest.ts`](../../../packages/cli/src/manifest.ts) now exposes `STARTER_DOCS_STATE_RELATIVE_DIR`, `MANIFEST_RELATIVE_PATH`, and `CONFLICTS_RELATIVE_DIR` for the new `.assets/starter-docs` state namespace. |
| Conflict staging | [`packages/cli/src/install.ts`](../../../packages/cli/src/install.ts) stages skipped instruction conflicts under the shared `CONFLICTS_RELATIVE_DIR` path. |
| CLI output | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) uses `MANIFEST_RELATIVE_PATH` in apply/sync output and `reconfigure --help` text. |
| Lifecycle safety | Audit, backup, uninstall, lifecycle, install, and CLI tests were updated for the new manifest path, including coverage that uninstall preserves `.assets/history` and parent `.assets` routers when history records remain. |
| Docs and smoke | Public, package, source, developer, and user docs now describe `docs/.assets/starter-docs/manifest.json`; [`scripts/smoke-pack.mjs`](../../../scripts/smoke-pack.mjs) validates the new manifest, conflict, backup, and uninstall paths. |
| Validation | The phase backlog records focused install, CLI, audit, backup, uninstall, lifecycle, and packed smoke validation as passing. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-20-w9-r0-docs-assets-state-and-history/03-cli-state-paths.md](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/03-cli-state-paths.md) | Phase 3 work item with acceptance criteria marked complete. |
| [README.md](../../../README.md) | Updated public install/sync state path references to `docs/.assets/starter-docs/`. |
| [docs/.references/commit-message-convention.md](../../.references/commit-message-convention.md) | Updated the Wave 9 example wording to describe the new state namespace. |
| [packages/cli/README.md](../../../packages/cli/README.md) | Updated package README manifest and conflict staging examples. |
| [packages/cli/src/README.md](../../../packages/cli/src/README.md) | Updated CLI maintainer examples for manifest inspection and conflict staging. |
| [packages/cli/src/manifest.ts](../../../packages/cli/src/manifest.ts) | Moved manifest and conflict path constants into `docs/.assets/starter-docs/`. |
| [packages/cli/src/install.ts](../../../packages/cli/src/install.ts) | Switched conflict staging to the shared `.assets/starter-docs` constant. |
| [packages/cli/src/cli.ts](../../../packages/cli/src/cli.ts) | Updated runtime plan output and reconfigure help to use the shared manifest path. |
| [packages/cli/tests/](../../../packages/cli/tests/) | Updated install, CLI, audit, backup, uninstall, and lifecycle test expectations for the new state path. |
| [scripts/smoke-pack.mjs](../../../scripts/smoke-pack.mjs) | Updated packed CLI smoke validation for manifest, conflict, backup, and uninstall paths. |
| [docs/.assets/history/2026-04-20-w9-r0-p3-cli-state-paths.md](./2026-04-20-w9-r0-p3-cli-state-paths.md) | History record for the Phase 3 CLI state path migration. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Updated smoke-pack expectations for the new manifest path. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-starter-docs.md](../../guides/user/getting-started-installing-starter-docs.md) | Updated manifest, directory tree, conflict staging, and troubleshooting references for the new `.assets/starter-docs` state path. |
