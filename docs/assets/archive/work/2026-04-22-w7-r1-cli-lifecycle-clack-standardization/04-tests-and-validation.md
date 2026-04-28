# Phase 4: Tests and Validation

> Derives from [Phase 4 of the W7 R1 plan](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/04-tests-and-validation.md).

## Purpose

Add semantic coverage for lifecycle Clack standardization and complete the final validation pass across build, automated tests, and package smoke checks.

## Overview

This phase is the closing validation pass for W7 R1. It should confirm the new lifecycle renderer is the production path for backup and uninstall workflows while preserving W7 R0 behavior. It should also refresh documentation examples only if the implementation changes documented output examples.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Design and Plan Docs

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- [04-tests-and-validation.md](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/04-tests-and-validation.md)
- [05-tests-and-validation.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/05-tests-and-validation.md)

## Stage 1 - Add Shared Renderer Contract Tests

### Tasks

1. Add or update lifecycle renderer tests in `packages/cli/tests/lifecycle.test.ts`.
2. Assert workflow start labels, warning events, audit review events, confirmation events, cancellation events, success events, and failure events.
3. Assert renderer event ordering for review, confirmation, execution, and completion.
4. Assert prompt approval, prompt cancellation, prompt skipping, and non-TTY error behavior.

### Acceptance criteria

- [x] Lifecycle renderer tests prove production flows use Clack-backed lifecycle rendering.
- [x] Shared tests assert semantic event labels, counts, and safety messages.
- [x] Tests cover approval, cancellation, prompt skipping, and non-TTY errors.
- [x] Tests avoid brittle snapshots of full decorative output.

### Dependencies

- Phase 1 renderer boundary.

## Stage 2 - Complete Backup Regression Coverage

### Tasks

1. Finalize backup tests in `packages/cli/tests/backup.test.ts`.
2. Cover review rendering, prompt skipping, cancellation, noop, and success.
3. Preserve coverage for audit-once behavior, empty-audit no-op behavior, backup destination naming, same-day ordinal promotion, project-relative layout, `_home/` layout, and `.backup/` exclusion.
4. Add CLI-level coverage only if backup dispatch or error shape changed.

### Acceptance criteria

- [x] Backup tests cover review, prompt skipping, cancellation, noop, and success.
- [x] Backup tests prove unchanged audit and copy semantics.
- [x] Backup tests prove unchanged destination naming and layout semantics.
- [x] Backup tests prove `.backup/` exclusion remains intact.

### Dependencies

- Phase 2 backup conversion.
- Stage 1 shared renderer test support.

## Stage 3 - Complete Uninstall Regression Coverage

### Tasks

1. Finalize uninstall tests in `packages/cli/tests/uninstall.test.ts`.
2. Cover warning rendering, audit review rendering, prompt skipping, cancellation, success, and partial failure.
3. Preserve coverage for warning and final confirmation checkpoints.
4. Preserve coverage for `uninstall --backup` single-audit behavior and backup failure aborting removal.
5. Preserve coverage for audited leaf removal, safe directory pruning, preserved/skipped paths, and `.backup/` exclusion.
6. Add CLI-level coverage only if uninstall dispatch or error shape changed.

### Acceptance criteria

- [x] Uninstall tests cover warning, audit review, prompt skipping, cancellation, success, and partial failure.
- [x] Uninstall tests prove unchanged `uninstall --backup` single-audit semantics.
- [x] Uninstall tests prove backup failure still aborts removal.
- [x] Uninstall tests prove unchanged safe removal and pruning semantics.
- [x] Uninstall tests prove `.backup/` exclusion remains intact.

### Dependencies

- Phase 3 uninstall conversion.
- Stage 1 shared renderer test support.

## Stage 4 - Refresh Documentation Examples if Needed

### Tasks

1. Search README and guides for backup or uninstall output examples.
2. Update examples only if the Clack standardization changes documented output shape.
3. Avoid rewriting unrelated lifecycle documentation.
4. Keep wording aligned with the current command names and W7 R0 safety model.

### Acceptance criteria

- [x] Documentation examples are checked for drift.
- [x] Any updated examples match the Clack-backed lifecycle workflow.
- [x] Unrelated docs remain untouched.
- [x] Command names and safety guidance stay aligned with current CLI behavior.

### Dependencies

- Phase 2 and Phase 3 output shape.

## Stage 5 - Run Final Validation

### Tasks

1. Run `npm run build -w make-docs`.
2. Run `npm test -w make-docs`.
3. Run `node scripts/smoke-pack.mjs`.
4. If a command fails for environmental reasons, record the blocker and narrower checks that did pass.
5. Confirm no tests rely on raw box-drawing or fixed decorative Clack output where semantic assertions are sufficient.

### Acceptance criteria

- [x] `npm run build -w make-docs` passes.
- [x] `npm test -w make-docs` passes.
- [x] `node scripts/smoke-pack.mjs` passes.
- [x] Any environmental blocker is documented with narrower passing checks.
- [x] Lifecycle renderer coverage avoids brittle decorative snapshots.

### Dependencies

- Stages 1-4.
- Phases 1-3 complete.
