---
date: "2026-04-20"
coordinate: "W9 R0"
---

# Docs Assets, State, and History - Config State Namespace Follow-Up

## Changes

Completed a Wave 9 corrective follow-up that moved the active make-docs CLI-managed state namespace from `docs/.assets/make-docs/` to `docs/.assets/config/`. This includes manifest reads and writes, skipped-conflict staging, managed config routers, package template assets, tests, smoke validation, and active documentation.

| Area | Summary |
| --- | --- |
| Runtime state | Updated the CLI manifest and conflict constants so new installs read/write `docs/.assets/config/manifest.json` and stage conflicts under `docs/.assets/config/conflicts/` without a fallback to the previous alpha path. |
| Managed routers | Replaced `.assets/make-docs` router assets with `.assets/config` routers in repo docs, package docs template, generated renderers, and managed asset selection. |
| Tests and smoke | Updated install, CLI, audit, backup, uninstall, lifecycle, renderer, consistency, and smoke-pack expectations for the new config path, including negative fresh-install assertions for the retired namespace. |
| Active docs | Updated current READMEs, user/developer guides, package docs, and Wave 9 plan/work docs to describe `docs/.assets/config/` as the CLI-managed config/state location. |
| Historical references | Left old-path references in historical records and older designs/plans where they describe prior behavior. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [README.md](../../../README.md) | Updated install/sync state path references to `docs/.assets/config/`. |
| [docs/.assets/AGENTS.md](../AGENTS.md) | Updated assets router guidance for CLI-managed config/state. |
| `docs/.assets/config/AGENTS.md` | New config router replacing the retired make-docs state router. |
| [docs/.references/commit-message-convention.md](../references/commit-message-convention.md) | Updated the Wave 9 commit-message example to name the config namespace. |
| [docs/assets/archive/plans/2026-04-20-w9-r0-docs-assets-state-and-history/](../archive/plans/2026-04-20-w9-r0-docs-assets-state-and-history/) | Updated active Wave 9 plan references from `.assets/make-docs` to `.assets/config`. |
| [docs/assets/archive/work/2026-04-20-w9-r0-docs-assets-state-and-history/](../archive/work/2026-04-20-w9-r0-docs-assets-state-and-history/) | Updated active Wave 9 work references from `.assets/make-docs` to `.assets/config`. |
| [packages/cli/src/manifest.ts](../../../packages/cli/src/manifest.ts) | Changed the canonical manifest and conflict paths to the config namespace. |
| [packages/cli/src/renderers.ts](../../../packages/cli/src/renderers.ts) | Updated generated router paths and wording for the config namespace. |
| `packages/docs/template/docs/.assets/config/AGENTS.md` | Added the shippable config router in the docs template. |
| [scripts/smoke-pack.mjs](../../../scripts/smoke-pack.mjs) | Updated packed CLI validation to assert the new config paths. |
| [docs/.assets/history/2026-04-20-w9-r0-config-state-namespace.md](./2026-04-20-w9-r0-config-state-namespace.md) | History record for this corrective follow-up. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Updated smoke-pack guidance to assert the config manifest path. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) | Updated manifest, conflict staging, directory tree, and troubleshooting references to `docs/.assets/config/`. |
