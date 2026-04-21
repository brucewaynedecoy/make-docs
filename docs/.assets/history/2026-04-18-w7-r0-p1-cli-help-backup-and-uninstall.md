---
date: "2026-04-18"
coordinate: "W7 R0 P1"
---

# CLI Help, Backup, and Uninstall - Phase 1 Help and Command Surface

## Changes

Implemented the command-surface foundation described in [the design](../../designs/2026-04-18-cli-help-backup-and-uninstall.md), [the Phase 1 plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/01-help-and-command-surface.md), and [the Phase 1 backlog](../../work/2026-04-18-w7-r0-cli-help-backup-and-uninstall/01-help-and-command-surface.md). This phase intentionally stopped at parsing, validation, help rendering, and placeholder lifecycle dispatch so later phases can add backup and uninstall execution without reopening the CLI grammar.

| Area | Summary |
| --- | --- |
| CLI surface | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now recognizes `backup` and `uninstall`, parses lifecycle `--yes` prompt skipping and uninstall `--backup`, rejects invalid cross-command flag mixes, and keeps implicit command inference limited to install and update flows. |
| Help rendering | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now renders structured top-level help plus command-specific help for `init`, `update`, `backup`, and `uninstall`, with user-facing descriptions for lifecycle flags instead of implementation detail. |
| Dispatch guards | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) routes `--help` before manifest validation, selection validation, TTY checks, or install planning, and non-help `backup` and `uninstall` calls now fail with deliberate placeholder errors instead of falling through into install or update behavior. |
| Test coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) now covers top-level help, all four command-specific help screens, explicit `backup` and `uninstall` parsing, and the invalid cross-command flag combinations called out in the backlog. |
| Verification | Worker verification reported `npm test -w make-docs -- tests/cli.test.ts` and `npm run build -w make-docs` passing after the Phase 1 source and test changes landed. |

## Documentation

### Project

None this session.

### Developer

None this session.

### User

None this session.
