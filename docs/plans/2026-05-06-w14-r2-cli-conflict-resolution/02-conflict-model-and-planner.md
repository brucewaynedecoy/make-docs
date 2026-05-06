# Phase 2 - Conflict Model and Planner

## Objective

Replace instruction-only conflict-resolution plumbing with a general model for reviewable managed-file diffs across agent instructions, references, and templates.

## Depends On

- [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md)
- Existing planner behavior in `packages/cli/src/planner.ts`
- Existing install orchestration in `packages/cli/src/install.ts`
- Existing shared types in `packages/cli/src/types.ts`

## Files To Modify

- `packages/cli/src/types.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- downstream imports in `packages/cli/src/cli.ts` or tests only as needed for type changes

## Detailed Changes

1. Rename or replace `InstructionConflictResolution` and `InstructionConflictResolutions` with managed-file conflict types that support only `overwrite` and `skip`.
2. Rename or replace `InstructionConflict` with a reviewable diff type that can represent:
   - relative path;
   - group: agent instructions, references, or templates;
   - optional instruction kind for labels;
   - source id;
   - conflict reason.
3. Add deterministic classification for reviewable diffs:
   - root and router `AGENTS.md` / `CLAUDE.md` files are agent instructions;
   - files under `docs/assets/references/` are references;
   - files under `docs/assets/templates/` are templates.
4. Preserve current automatic behavior for creates, noops, manifest-owned updates, generated buildable files, and managed skill-file refreshes.
5. Expand batch or per-path resolutions into the install plan before apply.
6. Remove append-merge behavior from the active conflict path.
7. Keep any legacy helper only if needed temporarily during refactor; delete it before closeout if no longer used.

## Parallelism

This phase can run after Phase 1 and before Phase 3. It should own the model and planner write scope so UI work does not need to infer conflict classification.

## Acceptance Criteria

- The planner can mark divergent references and templates as reviewable conflicts.
- `overwrite` turns reviewable conflicts into normal update or generate actions with desired content.
- `skip` keeps reviewable conflicts as `skip-conflict` actions.
- The apply phase does not prompt and does not infer conflict decisions.
- No behavior changes are introduced for matching files, missing files, manifest-owned clean updates, or managed skill files.
