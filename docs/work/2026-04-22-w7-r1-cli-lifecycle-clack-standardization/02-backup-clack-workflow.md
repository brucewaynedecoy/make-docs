# Phase 2: Backup Clack Workflow

> Derives from [Phase 2 of the W7 R1 plan](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/02-backup-clack-workflow.md).

## Purpose

Route `make-docs backup` through the lifecycle renderer so backup audit review, confirmation, noop, cancellation, and completion states use the same Clack-backed interaction model as the rest of the CLI.

## Overview

This phase converts the existing backup workflow in `packages/cli/src/backup.ts` to consume the renderer boundary from Phase 1. It must keep backup semantics stable: one audit, deterministic destination naming, no destination creation for empty audits, project-relative and `_home/` layouts, and `.backup/` exclusion.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Design and Plan Docs

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- [02-backup-clack-workflow.md](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/02-backup-clack-workflow.md)
- [03-backup-command.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/03-backup-command.md)

## Stage 1 - Inject the Lifecycle Renderer Into Backup

### Tasks

1. Update `runBackupCommand` in `packages/cli/src/backup.ts` to obtain or accept the lifecycle renderer.
2. Keep the public backup command options compatible with existing callers and tests.
3. Route prepared audit and destination data into renderer methods instead of direct lifecycle output helpers.
4. Preserve the existing return shape for `BackupExecutionResult`.

### Acceptance criteria

- [ ] Backup execution can use the production lifecycle renderer.
- [ ] Tests can provide a fake or recording renderer where needed.
- [ ] `BackupExecutionResult` remains compatible with existing callers.
- [ ] Backup command dispatch from `packages/cli/src/cli.ts` remains unchanged unless renderer injection requires a narrow adjustment.

### Dependencies

- Phase 1 renderer contract.

## Stage 2 - Render Backup Review and Confirmation Through Clack

### Tasks

1. Render the backup review through the lifecycle renderer after audit and destination preparation.
2. Include target directory, destination directory or no-op state, files to copy, directories to materialize, retained paths, skipped paths, and totals.
3. Route the backup confirmation prompt through the lifecycle renderer.
4. Preserve cancellation behavior: cancellation exits without creating a backup destination or copying files.
5. Preserve non-TTY guidance for interactive runs without a TTY.

### Acceptance criteria

- [ ] Backup audit review uses the lifecycle renderer.
- [ ] Review appears before confirmation and before copy.
- [ ] Backup confirmation uses the lifecycle renderer.
- [ ] Cancellation uses the lifecycle renderer and does not modify files.
- [ ] Non-TTY confirmation failures still guide users to `make-docs backup --yes`.

### Dependencies

- Stage 1 renderer injection.
- Phase 1 production renderer.

## Stage 3 - Render Backup Noop and Completion Through Clack

### Tasks

1. Route empty-audit noop output through the lifecycle renderer.
2. Ensure noop output states that no make-docs-managed files required backup and no destination was created.
3. Route success completion output through the lifecycle renderer.
4. Include destination, copied file count, materialized directory count, retained path count, and skipped path count in the completion payload.
5. Remove remaining production direct stdout calls from backup-specific completion paths.

### Acceptance criteria

- [ ] Backup noop uses the lifecycle renderer.
- [ ] Backup noop does not create a `.backup/` destination.
- [ ] Backup completion uses the lifecycle renderer.
- [ ] Completion includes copied, materialized, retained, and skipped counts.
- [ ] Backup-specific raw stdout completion output is no longer the production path.

### Dependencies

- Stage 2 review and confirmation conversion.

## Stage 4 - Preserve Backup Semantics With Regression Tests

### Tasks

1. Update `packages/cli/tests/backup.test.ts` to assert semantic renderer routing.
2. Preserve tests for audit-once behavior.
3. Preserve tests for destination naming and same-day ordinal promotion.
4. Preserve tests for project-relative and `_home/` layouts.
5. Preserve tests for `.backup/` exclusion, empty-audit no-op behavior, and `--yes` prompt skipping.

### Acceptance criteria

- [ ] Backup tests prove review, prompt skipping, cancellation, noop, and success route through the lifecycle renderer.
- [ ] Existing backup destination and layout tests continue to pass.
- [ ] Existing audit-once tests continue to pass.
- [ ] Existing empty-audit no-op tests continue to pass.
- [ ] Tests do not rely on raw box-drawing output where semantic assertions are sufficient.

### Dependencies

- Stages 1-3.
- Phase 1 test adapter support.
