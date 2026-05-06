# Phase 2: Conflict Model and Planner

## Purpose

Generalize the planner and install model so reviewable managed-file diffs are not limited to agent instructions.

## Overview

This phase replaces instruction-specific conflict-resolution types with a managed-file diff model covering agent instructions, references, and templates. It keeps automatic create, noop, manifest-owned update, generated buildable file, and managed skill-file refresh behavior unchanged.

## Source PRD Docs

- `docs/prd/13-revise-cli-conflict-resolution.md`
- [docs/prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [docs/prd/11-revise-cli-asset-selection-simplification.md](../../prd/11-revise-cli-asset-selection-simplification.md)

## Stage 1 - Replace Instruction-Only Types

### Tasks

- [ ] t1: Replace or rename `InstructionConflictResolution` and `InstructionConflictResolutions` in `packages/cli/src/types.ts`.
- [ ] t2: Define overwrite/skip-only resolution types for reviewable managed-file diffs.
- [ ] t3: Replace or rename `InstructionConflict` with a type that includes relative path, group, source id, reason, and optional instruction kind.

### Acceptance criteria

- The active conflict-resolution type no longer includes `update`.
- The reviewable diff type can represent agent instructions, references, and templates.
- Existing instruction-kind metadata remains available for labels where useful.

### Dependencies

- Phase 1 PRD contract is complete.

## Stage 2 - Classify Reviewable Diffs

### Tasks

- [ ] t4: Add classification for root and router `AGENTS.md` / `CLAUDE.md` files as agent instructions.
- [ ] t5: Add classification for managed `docs/assets/references/` files as references.
- [ ] t6: Add classification for managed `docs/assets/templates/` files as templates.
- [ ] t7: Expose reviewable diffs from install planning without changing unrelated `skip-conflict` behavior.

### Acceptance criteria

- Divergent references and templates are reviewable conflicts instead of silently skipped.
- Agent instruction conflicts still carry enough context for user-facing labels.
- Non-reviewable conflicts retain clear reasons.

### Dependencies

- Stage 1 type work is complete.

## Stage 3 - Apply Resolutions Deterministically

### Tasks

- [ ] t8: Update `packages/cli/src/planner.ts` so `overwrite` maps to normal `update` or `generate` actions with desired content.
- [ ] t9: Update `packages/cli/src/planner.ts` so `skip` remains a `skip-conflict` action with a clear reason.
- [ ] t10: Remove append-merge behavior from the active conflict-resolution path.
- [ ] t11: Update `packages/cli/src/install.ts` and downstream imports for the generalized conflict discovery API.

### Acceptance criteria

- Applying an install plan never prompts.
- Applying an install plan does not infer missing user decisions.
- The old append-merge path is no longer reachable from the conflict review flow.
- Matching, missing, manifest-owned, generated, and managed skill-file cases keep existing behavior.

### Dependencies

- Stage 2 classification is complete.

## Stage 4 - Model-Level Review

### Tasks

- [ ] t12: Search for stale instruction-only conflict names after the refactor.
- [ ] t13: Run focused TypeScript type checks or tests that exercise `packages/cli/src/types.ts`, `packages/cli/src/planner.ts`, and `packages/cli/src/install.ts`.
- [ ] t14: Reindex code with `jcodemunch` if needed for follow-on implementation review.

### Acceptance criteria

- Stale exported names are either removed or intentionally retained with accurate behavior.
- Model and planner changes compile.
- Any unavoidable shared behavior change is documented before Phase 3 begins.

### Dependencies

- Stages 1 through 3 are complete.
