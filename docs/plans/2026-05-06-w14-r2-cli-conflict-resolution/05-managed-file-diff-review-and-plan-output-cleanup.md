# Phase 5 - Managed-File Diff Review and Plan Output Cleanup

## Objective

Capture the retroactive cleanup that made selected existing managed-file diffs reviewable, made non-interactive unresolved diffs fail before apply, and removed internal planner labels from user-facing planned operations output.

## Depends On

- [02-conflict-model-and-planner.md](./02-conflict-model-and-planner.md)
- [03-clack-review-flow.md](./03-clack-review-flow.md)
- [04-tests-delta-backlog-and-validation.md](./04-tests-delta-backlog-and-validation.md)
- `docs/prd/13-revise-cli-conflict-resolution.md`
- Existing planner and output behavior in `packages/cli/src/planner.ts`, `packages/cli/src/cli.ts`, `packages/cli/src/install.ts`, and `packages/cli/src/skills-ui.ts`

## Files Covered By Implementation

- `packages/cli/src/cli.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/wizard.ts`
- focused CLI, install, and wizard test files under `packages/cli/tests/`

## Detailed Changes

1. Treat selected existing managed-file diffs as reviewable when they can be safely resolved through the generalized managed-file conflict flow.
2. Distinguish source manifest drift from genuine local edits before surfacing review decisions.
3. Fail non-interactive runs with unresolved reviewable managed-file diffs before apply writes output.
4. Preserve deterministic apply behavior: unresolved conflicts are blocked, overwrite resolutions become normal write operations, and skip resolutions preserve the file.
5. Clean planned operations output so users see grouped `generate`, `update`, `skip`, and `remove` operations.
6. Remove parenthetical reason text and internal `skip-conflict` labels from the plan output surface.
7. Keep unrelated audit wording and unrelated skill-file behavior outside this cleanup.

## Parallelism

This phase landed as a narrow cleanup after the model, review flow, and validation phases were already in place. It should be treated as dependent on Phases 2 through 4 rather than a new independent implementation stream.

## Acceptance Criteria

- Selected existing managed-file diffs are reviewable instead of being skipped outside the conflict-review path.
- Non-interactive unresolved managed-file diffs fail before apply writes any outputs.
- Planned operations render grouped `generate`, `update`, `skip`, and `remove` output.
- Plan output omits parenthetical conflict reasons and internal `skip-conflict` labels.
- Focused tests cover reviewability, non-interactive failure, and plan output cleanup.
- Validation evidence is captured in the matching P5 work backlog and history breadcrumb.
