# CLI Command Simplification - Phase 1 Command Model and Parser

## Changes

Implemented Phase 1 of the Wave 8 CLI command simplification, framed by [the design](../../designs/2026-04-20-cli-command-simplification.md), [the Phase 1 plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/01-command-model-and-parser.md), and [the Phase 1 backlog](../../work/2026-04-20-w8-r0-cli-command-simplification/01-command-model-and-parser.md). This phase focused on parser shape, command validation, removed-command guidance, and parser tests. It did not intentionally rewrite the deeper apply/reconfigure behavior planned for later phases.

| Area | Summary |
| --- | --- |
| Public command model | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now exposes `reconfigure`, `backup`, and `uninstall` as explicit public commands, while bare `starter-docs` maps to the apply/sync install path. |
| Removed surfaces | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) rejects `starter-docs init`, `starter-docs update`, `starter-docs --reconfigure`, and `starter-docs update --reconfigure` with specific migration guidance before install planning runs. |
| Flag boundaries | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) keeps selection flags valid for bare apply and `reconfigure`, keeps selection flags rejected for `backup` and `uninstall`, and preserves `--backup` as uninstall-only. |
| Help surface | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now teaches bare apply/sync plus `reconfigure`, `backup`, and `uninstall`, removing public `init`, `update`, and `--reconfigure` examples from command help. |
| Test coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) now covers the updated command recognition model, bare existing-install selection flags, removed-command migration errors, removed `--reconfigure` guidance, and lifecycle invalid-flag boundaries. |
| Verification | `npm test -w starter-docs -- tests/cli.test.ts`, `npm test -w starter-docs`, and `npm run build -w starter-docs` passed after the Phase 1 changes. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/guides/agent/2026-04-20-w8-r0-p1-cli-command-simplification.md](2026-04-20-w8-r0-p1-cli-command-simplification.md) | Agent session guide for Wave 8 Phase 1 command model and parser work. |

### Developer

None this session.

### User

None this session.
