# Phase 3: Backup Command

> Derives from [Phase 3 of the plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/03-backup-command.md).

## Purpose

Implement `make-docs backup` as the non-destructive lifecycle command that consumes one audit result, presents it clearly, resolves a deterministic backup destination, and copies the audited payload without modifying the originals.

## Overview

This phase turns the audit contract into a usable command. It owns backup command routing, `--yes` prompt-skipping behavior, destination planning under `.backup/`, `_home` layout for global paths, and the shared presentation helpers that uninstall will later reuse.

## Source Plan Phases

- [03-backup-command.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/03-backup-command.md)

## Stage 1 — Wire `backup` through the CLI surface

### Tasks

1. Update `packages/cli/src/cli.ts` so `make-docs backup` dispatches into backup execution instead of the Phase-1 placeholder error.
2. Keep `backup --help` routed to its command-specific help surface without running audit.
3. Default to interactive confirmation when `--yes` is omitted.
4. Treat legacy `--permissions` values as unknown arguments.
5. Extend `packages/cli/tests/cli.test.ts` for the final backup command behavior.

### Acceptance criteria

- [ ] `make-docs backup` dispatches to backup execution
- [ ] `make-docs backup --help` still exits before audit/copy work
- [ ] Omitting `--yes` defaults backup to interactive confirmation
- [ ] Legacy `--permissions` values fail clearly as unknown arguments
- [ ] CLI tests cover final backup command routing and help

### Dependencies

- Phase 1

## Stage 2 — Implement backup orchestration and destination resolution

### Tasks

1. Create `packages/cli/src/backup.ts` as the backup execution module.
2. Load the manifest when present and invoke the shared audit exactly once.
3. Resolve the final backup destination before rendering confirmation so the exact path is shown to the user.
4. Implement deterministic same-day directory selection under `<targetDir>/.backup/`:
   - plain date on first backup
   - rename to `-01` and create `-02` on second same-day backup
   - continue ordinal numbering afterward
5. Exit successfully without creating a backup directory when the audit yields nothing copyable.

### Acceptance criteria

- [ ] `packages/cli/src/backup.ts` exists and owns backup execution
- [ ] Backup invokes the shared audit exactly once per run
- [ ] The final backup destination is resolved before confirmation/output
- [ ] Same-day backup promotion and ordinal sequencing follow the design and plan
- [ ] Empty audits exit successfully without creating a new `.backup/` directory

### Dependencies

- Phase 2

## Stage 3 — Copy audited content into project-relative and `_home` layouts

### Tasks

1. Copy audited removable project-local files into the backup tree preserving target-relative paths.
2. Copy audited home/global files under `.backup/<date-or-ordinal>/_home/`, preserving paths relative to the user home directory.
3. Materialize audited directory-prune candidates in the backup tree even when they would otherwise be absent after file copy.
4. Surface but do not copy retained/skipped paths.
5. Reject audited absolute paths outside both the target directory and user home by surfacing them as skipped rather than inventing a backup layout.

### Acceptance criteria

- [ ] Project-local files keep their normal relative paths inside the backup root
- [ ] Home/global files land under `_home/...`
- [ ] Audited directory-prune candidates are materialized in the backup tree
- [ ] Retained/skipped paths are not copied
- [ ] Unsupported absolute paths are surfaced as skipped instead of copied

### Dependencies

- Stage 2 audit result and destination resolver

## Stage 4 — Add shared lifecycle presentation helpers and confirmation behavior

### Tasks

1. Create `packages/cli/src/lifecycle-ui.ts` for shared backup/uninstall presentation helpers.
2. Render a boxed or clearly separated backup audit summary that includes:
   - operation label
   - target directory
   - resolved backup destination
   - grouped counts for files, directories, and retained/skipped paths
3. By default, prompt once after the audit summary and before copy.
4. With `--yes`, print the same summary and proceed without prompting.
5. Render a completion summary with destination and copied counts after success.

### Acceptance criteria

- [ ] `packages/cli/src/lifecycle-ui.ts` exists and is used by backup
- [ ] Backup audit output is grouped and readable
- [ ] Default mode prompts once before copy
- [ ] `--yes` skips the prompt but still shows the audit summary
- [ ] Completion output shows the resolved destination and copied totals

### Dependencies

- Stages 1-3

## Stage 5 — Add backup tests and run validation

### Tasks

1. Create `packages/cli/tests/backup.test.ts`.
2. Cover:
   - backup execution
   - destination naming
   - same-day ordinal promotion
   - `_home` path mapping
   - default confirmation vs `--yes`
   - non-destructive behavior
3. Extend `packages/cli/tests/cli.test.ts` as needed for backup help and parser coverage.
4. Run targeted backup tests, then the full suite, then a build.

### Acceptance criteria

- [ ] `packages/cli/tests/backup.test.ts` exists
- [ ] Backup naming and ordinal promotion are covered
- [ ] `_home` path mapping is covered
- [ ] Non-destructive backup behavior is covered
- [ ] default confirmation vs `--yes` behavior is covered
- [ ] `npm run build -w make-docs` succeeds
- [ ] `npm test -w make-docs` passes

### Dependencies

- Stages 1-4
