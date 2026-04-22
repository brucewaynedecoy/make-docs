---
date: "2026-04-20"
coordinate: "W8 R0 P2"
---

# CLI Command Simplification - Phase 2 Apply and Reconfigure Behavior

## Changes

Implemented Phase 2 of the Wave 8 CLI command simplification, framed by [the design](../../designs/2026-04-20-cli-command-simplification.md), [the Phase 2 plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/02-apply-and-reconfigure-behavior.md), and [the Phase 2 backlog](../../work/2026-04-20-w8-r0-cli-command-simplification/02-apply-and-reconfigure-behavior.md). This phase made bare `make-docs` the apply/sync path for both fresh and existing installs, while reserving `make-docs reconfigure` for explicit footprint changes.

| Area | Summary |
| --- | --- |
| Bare apply/sync | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now lets bare existing-install runs apply the saved manifest selections directly instead of opening the removed update-vs-reconfigure chooser. |
| Desired-state flags | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) continues to resolve selection flags over the default selections for first installs and over manifest selections for existing installs, so bare `--yes --no-skills` persists and applies the new desired state in one run. |
| Reconfigure guard | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) keeps `make-docs reconfigure` manifest-only, opens the wizard from saved selections interactively, and now rejects `make-docs reconfigure --yes` unless at least one selection flag is provided. |
| Wizard cleanup | [`packages/cli/src/wizard.ts`](../../../packages/cli/src/wizard.ts) no longer exports the update-vs-reconfigure action prompt because bare existing installs no longer branch through that prompt. |
| Test coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) now covers bare non-interactive installs, bare non-interactive syncs, bare interactive syncs without the wizard, selection-flag application on existing installs, reconfigure wizard initial selections, `reconfigure --yes` without flags, and reconfigure without a manifest. |
| Verification | `npm test -w make-docs -- tests/cli.test.ts`, `npm test -w make-docs`, and `npm run build -w make-docs` passed after the Phase 2 changes. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/guides/agent/2026-04-20-w8-r0-p2-cli-command-simplification.md](2026-04-20-w8-r0-p2-cli-command-simplification.md) | Agent session guide for Wave 8 Phase 2 apply and reconfigure behavior work. |

### Developer

None this session.

### User

None this session.
