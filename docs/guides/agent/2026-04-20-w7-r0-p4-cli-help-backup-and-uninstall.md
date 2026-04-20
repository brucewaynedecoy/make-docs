# CLI Help, Backup, and Uninstall - Phase 4 Uninstall Command

## Changes

Implemented the uninstall command described in [the design](../../designs/2026-04-18-cli-help-backup-and-uninstall.md), [the Phase 4 plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/04-uninstall-command.md), and [the Phase 4 backlog](../../work/2026-04-18-w7-r0-cli-help-backup-and-uninstall/04-uninstall-command.md). This phase turned `starter-docs uninstall` into a guarded lifecycle command: it routes through the CLI, shows destructive-operation warnings, audits once, optionally creates a backup from that same audit snapshot, removes only audited managed files, prunes only audited empty directories, and reports either a completion summary or a partial-failure summary.

| Area | Summary |
| --- | --- |
| Parallel stage execution | Phase 4 stages 1, 2, and 3 were implemented in parallel across the CLI route, uninstall review flow, and backup reuse seam; stages 4 and 5 were then integrated sequentially to complete deletion and validation behavior. |
| CLI routing | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now dispatches `starter-docs uninstall` through the real uninstall executor, forwards `--backup`, `--yes`, and `--target`, maps omitted `--yes` to default confirmation mode, and keeps `uninstall --help` on the command help surface. |
| Uninstall executor | [`packages/cli/src/uninstall.ts`](../../../packages/cli/src/uninstall.ts) now owns the end-to-end flow: warning checkpoint, single shared audit load, audit summary, final checkpoint, optional backup, audited file removal, audited empty-directory pruning, completion output, and partial-failure output. |
| Backup reuse | [`packages/cli/src/backup.ts`](../../../packages/cli/src/backup.ts) now exposes prepared backup execution and destination planning so uninstall can reuse one audit report and one resolved `.backup/YYYY-MM-DD[-NN]` destination before removing anything. Backup failure aborts uninstall removal. |
| Lifecycle presentation | [`packages/cli/src/lifecycle-ui.ts`](../../../packages/cli/src/lifecycle-ui.ts) now renders uninstall-specific warning, audit, cancellation, completion, and partial-failure summaries, including backup status when `uninstall --backup` is requested. |
| Safe deletion helpers | [`packages/cli/src/utils.ts`](../../../packages/cli/src/utils.ts) now includes deletion primitives that remove files only when they still exist and prune directories only when they are empty. The uninstall executor also blocks removal attempts inside `.backup/`. |
| Uninstall tests | [`packages/cli/tests/uninstall.test.ts`](../../../packages/cli/tests/uninstall.test.ts) covers prompt-skipping removal, modified root instruction preservation, unmanaged descendant preservation, confirm-mode cancellation without mutation, `uninstall --backup` audit reuse, and partial delete failure reporting. |
| CLI regression coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) now verifies uninstall help short-circuiting, uninstall dispatch payloads, and default uninstall confirmation mode. |
| Verification | Package-local verification passed for `npm test -- tests/cli.test.ts`, `npm test -- tests/backup.test.ts tests/cli.test.ts tests/uninstall.test.ts`, full `npm test`, and `npm run build` in `packages/cli/`. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/guides/agent/2026-04-20-w7-r0-p4-cli-help-backup-and-uninstall.md](./2026-04-20-w7-r0-p4-cli-help-backup-and-uninstall.md) | Session breadcrumb for the Phase 4 uninstall command implementation, including touched code areas, lifecycle behavior, test coverage, and verification outcomes. |

### Developer

None this session.

### User

None this session.
