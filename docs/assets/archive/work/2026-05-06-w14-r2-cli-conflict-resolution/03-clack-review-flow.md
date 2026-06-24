# Phase 3: Clack Review Flow

## Purpose

Implement the interactive conflict-review experience using the generalized managed-file diff model.

## Overview

This phase replaces per-instruction conflict prompts with a batch-first Clack flow. Users first choose how to handle all diffs, then optionally review individual files grouped as agent instructions, references, and templates.

## Source PRD Docs

- `docs/prd/13-revise-cli-conflict-resolution.md`
- [docs/prd/07-cli-command-surface-and-lifecycle.md](../../../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Add Batch-Level Prompt

### Tasks

- [x] t1: Replace `promptForInstructionConflictResolutions` in `packages/cli/src/wizard.ts` with a generalized conflict-resolution prompt.
- [x] t2: Render a Clack note summarizing total diff count, counts by group, and review order.
- [x] t3: Add the initial `Overwrite all`, `Skip all`, and `Review each` selection.
- [x] t4: Map `Overwrite all` and `Skip all` to per-path resolution records.

### Acceptance criteria

- The first user decision is batch-level.
- The prompt summarizes all reviewable groups before asking for a decision.
- Batch overwrite and skip return deterministic per-path resolutions.

### Dependencies

- Phase 2 generalized conflict model is available.

## Stage 2 - Add Grouped Per-File Review

### Tasks

- [x] t5: Sort reviewable diffs by group: agent instructions, references, templates.
- [x] t6: Render a group boundary before each non-empty group.
- [x] t7: Render per-file context with group name, path, conflict reason, and `File N of M` progress.
- [x] t8: Offer only `Overwrite` and `Skip` per file.

### Acceptance criteria

- Agent instructions are reviewed before references.
- References are reviewed before templates.
- Per-file review includes visible file and group progress.
- The per-file prompt does not include `Update`.

### Dependencies

- Stage 1 batch prompt is complete.

## Stage 3 - Wire CLI Orchestration

### Tasks

- [x] t9: Update `packages/cli/src/cli.ts` to call the generalized conflict prompt after the initial plan discovers reviewable diffs.
- [x] t10: Feed returned resolutions into the second deterministic install plan.
- [x] t11: Preserve cancellation semantics so cancellation exits without partial apply.
- [x] t12: Update CLI mock names and imports in tests.

### Acceptance criteria

- Interactive install and reconfigure flows use the generalized prompt.
- Non-interactive or `--yes` behavior is explicit and consistent with the PRD change doc.
- Cancellation prevents apply and does not persist partial decisions.

### Dependencies

- Stages 1 and 2 are complete.
- Phase 2 planner API is stable.

## Stage 4 - UX Copy Review

### Tasks

- [x] t13: Review user-facing labels, hints, and notes for Clack style consistency.
- [x] t14: Remove stale instruction-only wording from conflict-review output.
- [x] t15: Confirm the flow does not introduce raw, unstyled terminal output.

### Acceptance criteria

- Conflict review copy names agent instructions, references, and templates accurately.
- Labels are concise and match existing installer tone.
- No user-facing `Update` option remains in the conflict review.

### Dependencies

- Stages 1 through 3 are complete.
