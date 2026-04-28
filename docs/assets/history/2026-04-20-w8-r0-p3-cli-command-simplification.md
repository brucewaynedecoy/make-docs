---
date: "2026-04-20"
coordinate: "W8 R0 P3"
---

# CLI Command Simplification - Phase 3 Help Router and Documentation Text

## Changes

Implemented Phase 3 of the Wave 8 CLI command simplification, framed by [the design](../archive/designs/2026-04-20-cli-command-simplification.md), [the Phase 3 plan](../archive/plans/2026-04-20-w8-r0-cli-command-simplification/03-help-router-and-doc-text.md), and [the Phase 3 backlog](../archive/work/2026-04-20-w8-r0-cli-command-simplification/03-help-router-and-doc-text.md). This phase aligned help output, generated router guidance, and active project documentation around bare `make-docs` apply/sync runs plus explicit `make-docs reconfigure` selection changes.

| Area | Summary |
| --- | --- |
| Top-level help | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now presents bare `make-docs [options]` as the apply/sync workflow and lists `reconfigure`, `backup`, and `uninstall` as explicit commands. |
| Reconfigure help | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now documents that `reconfigure` requires an existing manifest, opens the saved-selection wizard interactively, and requires selection flags with `--yes`. |
| Generated guidance | [`packages/cli/src/renderers.ts`](../../../packages/cli/src/renderers.ts) now points generated prompt and plan fallback text at `npx make-docs reconfigure` instead of the removed update-with-reconfigure form. |
| Public docs | [`README.md`](../../../README.md), [`packages/cli/README.md`](../../../packages/cli/README.md), [`packages/cli/src/README.md`](../../../packages/cli/src/README.md), the developer guide, and the user guide now use the new bare apply/sync and explicit reconfigure vocabulary. |
| Smoke script | [`scripts/smoke-pack.mjs`](../../../scripts/smoke-pack.mjs) now validates the packed CLI through the bare apply command instead of the removed `init` command. |
| Test coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) asserts the new help vocabulary and absence of removed command examples. [`packages/cli/tests/renderers.test.ts`](../../../packages/cli/tests/renderers.test.ts) asserts generated fallback guidance uses `npx make-docs reconfigure`. |
| Verification | `npm test -w make-docs -- tests/cli.test.ts tests/renderers.test.ts`, `npm test -w make-docs`, `npm run build -w make-docs`, and `node scripts/smoke-pack.mjs` passed. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [README.md](../../../README.md) | Updated public quick-start, sync, preview, and reconfigure examples to the new command vocabulary. |
| [packages/cli/README.md](../../../packages/cli/README.md) | Updated package-level CLI usage examples and behavior notes for bare apply/sync and explicit reconfigure. |
| [packages/cli/src/README.md](../../../packages/cli/src/README.md) | Updated CLI maintainer commands and smoke instructions to avoid removed command and flag forms. |
| [docs/guides/agent/2026-04-20-w8-r0-p3-cli-command-simplification.md](2026-04-20-w8-r0-p3-cli-command-simplification.md) | Agent session guide for Wave 8 Phase 3 help router and documentation text work. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/cli-development-local-build-and-install.md](../../guides/developer/cli-development-local-build-and-install.md) | Updated local build, dry-run, smoke, and common workflow commands to use bare apply/sync vocabulary. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) | Reworked install, sync, reconfigure, command reference, flag matrix, and troubleshooting sections around the new command model. |
