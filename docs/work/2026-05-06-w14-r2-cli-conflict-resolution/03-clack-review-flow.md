# Phase 3: Clack Review Flow

## Purpose

Implement the interactive conflict-review experience using the generalized managed-file diff model.

## Overview

This phase replaces per-instruction conflict prompts with a batch-first Clack flow. Users first choose how to handle all diffs, then optionally review individual files grouped as agent instructions, references, and templates.

## Source PRD Docs

- `docs/prd/13-revise-cli-conflict-resolution.md`
- [docs/prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Add Batch-Level Prompt

### Tasks

- [ ] t1: Replace `promptForInstructionConflictResolutions` in `packages/cli/src/wizard.ts` with a generalized conflict-resolution prompt.
- [ ] t2: Render a Clack note summarizing total diff count, counts by group, and review order.
- [ ] t3: Add the initial `Overwrite all`, `Skip all`, and `Review each` selection.
- [ ] t4: Map `Overwrite all` and `Skip all` to per-path resolution records.

### Acceptance criteria

- The first user decision is batch-level.
- The prompt summarizes all reviewable groups before asking for a decision.
- Batch overwrite and skip return deterministic per-path resolutions.

### Dependencies

- Phase 2 generalized conflict model is available.

## Stage 2 - Add Grouped Per-File Review

### Tasks

- [ ] t5: Sort reviewable diffs by group: agent instructions, references, templates.
- [ ] t6: Render a group boundary before each non-empty group.
- [ ] t7: Render per-file context with group name, path, conflict reason, and `File N of M` progress.
- [ ] t8: Offer only `Overwrite` and `Skip` per file.

### Acceptance criteria

- Agent instructions are reviewed before references.
- References are reviewed before templates.
- Per-file review includes visible file and group progress.
- The per-file prompt does not include `Update`.

### Dependencies

- Stage 1 batch prompt is complete.

## Stage 3 - Wire CLI Orchestration

### Tasks

- [ ] t9: Update `packages/cli/src/cli.ts` to call the generalized conflict prompt after the initial plan discovers reviewable diffs.
- [ ] t10: Feed returned resolutions into the second deterministic install plan.
- [ ] t11: Preserve cancellation semantics so cancellation exits without partial apply.
- [ ] t12: Update CLI mock names and imports in tests.

### Acceptance criteria

- Interactive install and reconfigure flows use the generalized prompt.
- Non-interactive or `--yes` behavior is explicit and consistent with the PRD change doc.
- Cancellation prevents apply and does not persist partial decisions.

### Dependencies

- Stages 1 and 2 are complete.
- Phase 2 planner API is stable.

## Stage 4 - UX Copy Review

### Tasks

- [ ] t13: Review user-facing labels, hints, and notes for Clack style consistency.
- [ ] t14: Remove stale instruction-only wording from conflict-review output.
- [ ] t15: Confirm the flow does not introduce raw, unstyled terminal output.

### Acceptance criteria

- Conflict review copy names agent instructions, references, and templates accurately.
- Labels are concise and match existing installer tone.
- No user-facing `Update` option remains in the conflict review.

### Dependencies

- Stages 1 through 3 are complete.
