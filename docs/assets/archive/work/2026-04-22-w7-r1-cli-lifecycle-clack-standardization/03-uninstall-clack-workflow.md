# Phase 3: Uninstall Clack Workflow

> Derives from [Phase 3 of the W7 R1 plan](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/03-uninstall-clack-workflow.md).

## Purpose

Route `make-docs uninstall` through the lifecycle renderer so destructive warnings, audit review, final confirmation, backup-before-remove status, cancellation, completion, and partial-failure states use the same Clack-backed interaction model as the rest of the CLI.

## Overview

This phase converts the existing uninstall workflow in `packages/cli/src/uninstall.ts` to consume the renderer boundary from Phase 1. It must preserve W7 R0 uninstall safety semantics: one audit result, optional backup from the same audit result, backup failure aborts removal, only audited leaves are removed, safe directory pruning, preserved/skipped paths remain untouched, and `.backup/` is never traversed as an uninstall target.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Design and Plan Docs

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- [03-uninstall-clack-workflow.md](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/03-uninstall-clack-workflow.md)
- [04-uninstall-command.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/04-uninstall-command.md)

## Stage 1 - Inject the Lifecycle Renderer Into Uninstall

### Tasks

1. Update `runUninstallCommand` in `packages/cli/src/uninstall.ts` to obtain or accept the lifecycle renderer.
2. Keep uninstall command options compatible with existing CLI dispatch and tests.
3. Route warning, audit review, confirmation, cancellation, completion, and failure states into renderer methods.
4. Preserve the existing `UninstallExecutionResult` shape.

### Acceptance criteria

- [x] Uninstall execution can use the production lifecycle renderer.
- [x] Tests can provide a fake or recording renderer where needed.
- [x] `UninstallExecutionResult` remains compatible with existing callers.
- [x] CLI dispatch remains stable unless renderer injection requires a narrow adjustment.

### Dependencies

- Phase 1 renderer contract.

## Stage 2 - Render Warning and Audit Review Through Clack

### Tasks

1. Route the initial uninstall warning through the lifecycle renderer.
2. Preserve warning copy that suggests `make-docs backup` and `make-docs uninstall --backup` when `--backup` is not present.
3. Preserve warning copy that identifies the backup destination when `--backup` is present.
4. Route audit review through the lifecycle renderer after the single audit result is available.
5. Include target directory, backup-before-removal state, files to remove, directories to prune, preserved paths, skipped paths, and totals.

### Acceptance criteria

- [x] Initial uninstall warning uses the lifecycle renderer.
- [x] Warning still suggests backup alternatives when `--backup` is omitted.
- [x] Warning still surfaces the exact backup destination when `--backup` is present.
- [x] Uninstall audit review uses the lifecycle renderer.
- [x] Audit review does not change removable, prunable, preserved, or skipped classification.

### Dependencies

- Stage 1 renderer injection.
- Phase 1 production renderer.

## Stage 3 - Render Final Confirmation and Cancellation Through Clack

### Tasks

1. Route the final destructive confirmation through the lifecycle renderer.
2. Preserve remove-only wording that states removal cannot be undone.
3. Preserve backup-then-remove wording that states backup happens before audited removal.
4. Route cancellation at the warning checkpoint through the renderer.
5. Route cancellation at the final checkpoint through the renderer.
6. Preserve non-TTY guidance for interactive runs without a TTY.

### Acceptance criteria

- [x] Final destructive confirmation uses the lifecycle renderer.
- [x] Remove-only confirmation remains clearly destructive.
- [x] Backup-then-remove confirmation remains clearly ordered.
- [x] Cancellation at either checkpoint renders through the lifecycle renderer.
- [x] Cancellation at either checkpoint does not modify files.
- [x] Non-TTY confirmation failures still guide users to `make-docs uninstall --yes`.

### Dependencies

- Stage 2 warning and review conversion.

## Stage 4 - Render Success and Partial Failure Through Clack

### Tasks

1. Route successful completion output through the lifecycle renderer.
2. Include removed file count, pruned directory count, preserved path count, skipped path count, and backup status.
3. Route partial-failure output through the lifecycle renderer.
4. Include files removed before failure, directories pruned before failure, preserved/skipped counts, backup status, and error message.
5. Keep the renderer side-effect free; it should report state and never perform cleanup.

### Acceptance criteria

- [x] Success summary uses the lifecycle renderer.
- [x] Partial-failure summary uses the lifecycle renderer.
- [x] Success and failure summaries include backup status.
- [x] Partial-failure summary includes partial mutation counts and error message.
- [x] Renderer methods do not mutate filesystem state.

### Dependencies

- Stage 3 final confirmation conversion.

## Stage 5 - Preserve Uninstall Semantics With Regression Tests

### Tasks

1. Update `packages/cli/tests/uninstall.test.ts` to assert semantic renderer routing.
2. Preserve tests for warning and final confirmation checkpoints.
3. Preserve tests for cancellation before mutation.
4. Preserve tests for `uninstall --backup` single-audit behavior.
5. Preserve tests for backup failure aborting removal.
6. Preserve tests for audited leaf removal, safe directory pruning, preserved/skipped paths, and `.backup/` exclusion.

### Acceptance criteria

- [x] Uninstall tests prove warning, audit review, prompt skipping, cancellation, success, and partial failure route through the lifecycle renderer.
- [x] Existing `uninstall --backup` single-audit tests continue to pass.
- [x] Existing backup-failure-aborts-removal tests continue to pass.
- [x] Existing safe removal and pruning tests continue to pass.
- [x] Tests do not rely on raw box-drawing output where semantic assertions are sufficient.

### Dependencies

- Stages 1-4.
- Phase 1 test adapter support.
