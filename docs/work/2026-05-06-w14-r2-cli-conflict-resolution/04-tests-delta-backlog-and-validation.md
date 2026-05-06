# Phase 4: Tests, Delta Backlog, and Validation

## Purpose

Prove the revised conflict-resolution behavior, validate the implementation, and capture closeout artifacts.

## Overview

This phase updates planner, CLI, and wizard tests for the generalized conflict flow. It also performs final validation and creates history records for completed implementation phases.

## Source PRD Docs

- `docs/prd/13-revise-cli-conflict-resolution.md`
- [docs/prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [docs/prd/11-revise-cli-asset-selection-simplification.md](../../prd/11-revise-cli-asset-selection-simplification.md)

## Stage 1 - Planner Regression Tests

### Tasks

- [ ] t1: Replace tests for instruction `update` conflict handling with overwrite/skip-only behavior.
- [ ] t2: Add tests for divergent agent instruction overwrite and skip decisions.
- [ ] t3: Add tests for divergent reference overwrite and skip decisions.
- [ ] t4: Add tests for divergent template overwrite and skip decisions.
- [ ] t5: Add tests proving existing noop, create, manifest-owned update, generated, and managed skill-file paths are unchanged.

### Acceptance criteria

- References and templates can be overwritten when the user chooses overwrite.
- `Skip all` or per-file skip preserves reviewable diffs as conflicts.
- The removed instruction `update` behavior is not asserted as active behavior.
- Existing automatic planner behavior has regression coverage.

### Dependencies

- Phase 2 implementation is complete.

## Stage 2 - CLI and Wizard Tests

### Tasks

- [ ] t6: Add tests proving the batch prompt appears before per-file review.
- [ ] t7: Add tests proving grouped review order is agent instructions, references, then templates.
- [ ] t8: Add tests for visible group and file progress text.
- [ ] t9: Add tests proving cancellation exits without partial apply.
- [ ] t10: Update CLI orchestration tests for renamed generalized prompt exports or mocks.

### Acceptance criteria

- Tests fail if per-file prompts happen before the batch decision.
- Tests fail if `Update` reappears in conflict-review options.
- Tests cover cancellation and all three batch choices.

### Dependencies

- Phase 3 implementation is complete.

## Stage 3 - Validation Run

### Tasks

- [ ] t11: Run focused tests for install planning and CLI conflict prompts.
- [ ] t12: Run `npm test -w make-docs`.
- [ ] t13: Run `npm run validate:defaults -w make-docs`.
- [ ] t14: Run `bash scripts/check-instruction-routers.sh`.
- [ ] t15: Run `git diff --check`.
- [ ] t16: Scan for stale `InstructionConflictResolution`, `InstructionConflictResolutions`, instruction-only conflict wording, and user-facing `Update` conflict labels.

### Acceptance criteria

- Validation commands pass, or failures are documented with concrete blockers.
- Stale naming is removed or intentionally retained with accurate behavior.
- No unrelated validation failures are introduced by the change.

### Dependencies

- Stages 1 and 2 are complete.

## Stage 4 - Closeout Artifacts

### Tasks

- [ ] t17: Reindex docs with `jdocmunch` after PRD and work-history edits.
- [ ] t18: Reindex code with `jcodemunch` after implementation if code-indexed review is needed.
- [ ] t19: Create `docs/assets/history/` records for completed implementation phases.
- [ ] t20: Summarize validation evidence and remaining risks for handoff.

### Acceptance criteria

- History records exist for completed implementation phases.
- The W14 R2 design, plan, PRD change doc, backlog, and history entries are traceable.
- Final handoff states whether implementation is complete and which validations were run.

### Dependencies

- Stages 1 through 3 are complete.
