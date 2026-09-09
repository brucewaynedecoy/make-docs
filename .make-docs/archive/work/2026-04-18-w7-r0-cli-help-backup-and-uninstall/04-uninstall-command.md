# Phase 4: Uninstall Command

> Derives from [Phase 4 of the plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/04-uninstall-command.md).

## Purpose

Implement `make-docs uninstall` as the destructive lifecycle command that consumes one audit snapshot, warns clearly, optionally backs up from the same audit, and removes only audited leaf files and prunable directories.

## Overview

This phase owns uninstall routing, the warning/audit/final-confirm UX, `--backup` orchestration, leaf-first delete behavior, and outcome reporting. It must consume the audit and backup contracts from earlier phases instead of re-deriving ownership or destination logic.

## Source Plan Phases

- [04-uninstall-command.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/04-uninstall-command.md)

## Stage 1 — Wire `uninstall` through the CLI surface

### Tasks

1. Update `packages/cli/src/cli.ts` so `make-docs uninstall` dispatches into uninstall execution instead of the Phase-1 placeholder error.
2. Keep `uninstall --help` routed to help without running audit or delete work.
3. Ensure `--backup`, `--yes`, and `--target` are passed through to uninstall execution cleanly.
4. Extend `packages/cli/tests/cli.test.ts` for final uninstall routing/help assertions.

### Acceptance criteria

- [ ] `make-docs uninstall` dispatches to uninstall execution
- [ ] `make-docs uninstall --help` exits before audit/removal work
- [ ] `--backup`, `--yes`, and `--target` reach uninstall execution correctly
- [ ] CLI tests cover final uninstall command routing and help

### Dependencies

- Phase 1

## Stage 2 — Implement the warning, audit, and confirmation flow

### Tasks

1. Create `packages/cli/src/uninstall.ts` as the uninstall orchestration module.
2. Render an initial warning panel before execution proceeds.
3. Run or load the shared audit once.
4. Render an audit summary that shows:
   - files scheduled for removal
   - directories eligible for pruning
   - preserved/skipped paths
5. Render a final irreversible-action confirmation before removal.
6. By default, require user approval at both checkpoints.
7. With `--yes`, skip prompts but still print warning and audit summaries.

### Acceptance criteria

- [ ] `packages/cli/src/uninstall.ts` exists and owns uninstall orchestration
- [ ] Uninstall shows both the initial warning and audit summary before removal
- [ ] Default mode requires explicit approval at both confirmation points
- [ ] `--yes` skips prompts but still prints warning and audit summaries
- [ ] Canceling at either confirmation point exits cleanly with no mutations

### Dependencies

- Phase 2

## Stage 3 — Implement `uninstall --backup` from a single audit snapshot

### Tasks

1. Extend `packages/cli/src/backup.ts` to accept a precomputed audit result and resolved backup destination.
2. For `make-docs uninstall --backup`, resolve the backup destination once and display it in the uninstall warning/audit output.
3. Pass the single audit result directly into backup execution.
4. Abort uninstall entirely if backup fails.
5. Keep audit ownership rules unchanged; this stage should consume Phase-2 results only.

### Acceptance criteria

- [ ] `uninstall --backup` uses one audit result for both backup and removal
- [ ] The exact backup destination is shown before execution
- [ ] Backup runs before any removal work
- [ ] Backup failure aborts uninstall without deleting files
- [ ] No second audit pass is introduced

### Dependencies

- Phases 2 and 3

## Stage 4 — Remove audited leaves and prune only audited empty directories

### Tasks

1. Reuse or minimally extend helper logic in `packages/cli/src/utils.ts` for deterministic leaf-first deletion and prune ordering.
2. Remove only files explicitly marked removable by the audit.
3. Prune only directories explicitly marked prunable by the audit and only when they are still empty at deletion time.
4. Leave preserved/skipped paths untouched.
5. Remove project-root `AGENTS.md` and `CLAUDE.md` only when the audit marked them as exact generated-content matches.
6. Remove the manifest and prune `docs/.make-docs/` only when that directory becomes empty.
7. Never remove or traverse `.backup/` as an uninstall target.

### Acceptance criteria

- [ ] Uninstall removes only audited removable files
- [ ] Uninstall prunes only audited directories that are actually empty
- [ ] Preserved/skipped paths remain untouched
- [ ] Modified root instruction files remain untouched
- [ ] Exact-match generated root instruction files are removed when audited removable
- [ ] `.backup/` is never traversed or removed

### Dependencies

- Stages 2 and 3

## Stage 5 — Add uninstall outcome reporting and validation coverage

### Tasks

1. Render a final uninstall summary that distinguishes:
   - files removed
   - directories pruned
   - preserved paths
   - whether backup was created first
2. Report partial failure cleanly if deletion fails partway through.
3. Extend lifecycle-oriented tests for:
   - uninstall preserve/remove behavior
   - unmanaged-file preservation
   - modified/unmodified root instruction files
   - `--yes`
   - `uninstall --backup`
4. Run targeted lifecycle tests and then the full suite.

### Acceptance criteria

- [ ] Uninstall completion output distinguishes removals, prunes, preserved paths, and backup status
- [ ] Partial-delete failures are reported without cleaning up preserved paths or `.backup/`
- [ ] Lifecycle tests cover plain uninstall and `uninstall --backup`
- [ ] `npm test -w make-docs` passes after uninstall coverage is added

### Dependencies

- Stages 1-4
