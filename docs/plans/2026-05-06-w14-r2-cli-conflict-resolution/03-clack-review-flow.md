# Phase 3 - Clack Review Flow

## Objective

Implement the interactive batch-first conflict review using existing Clack styling and cancellation patterns.

## Depends On

- [02-conflict-model-and-planner.md](./02-conflict-model-and-planner.md)
- Existing Clack wizard patterns in `packages/cli/src/wizard.ts`
- Existing CLI orchestration in `packages/cli/src/cli.ts`

## Files To Modify

- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/tests/cli.test.ts`, if CLI orchestration mocks need to follow renamed prompt exports

## Detailed Changes

1. Replace `promptForInstructionConflictResolutions` with a general conflict-resolution prompt.
2. Show a batch summary before the first decision:
   - total reviewable diff count;
   - counts by group;
   - review order;
   - concise explanation of all-at-once choices.
3. Prompt once with:
   - `Overwrite all`;
   - `Skip all`;
   - `Review each`.
4. For `Overwrite all`, return per-path `overwrite` resolutions for every reviewable diff.
5. For `Skip all`, return per-path `skip` resolutions for every reviewable diff.
6. For `Review each`, group files in this order:
   - agent instructions;
   - references;
   - templates.
7. Before each group, render a Clack-styled group boundary that names the group and group progress.
8. For each reviewed file, show path, reason, group, and `File N of M` progress.
9. Offer only `Overwrite` and `Skip` per file.
10. Preserve cancellation semantics: cancellation returns no partial resolution set and prevents apply.

## Parallelism

This phase depends on Phase 2's conflict model. It can run in parallel with focused test planning from Phase 4, but code edits should not overlap with Phase 2 in the same files until the model shape is stable.

## Acceptance Criteria

- The first conflict decision is batch-level, not per-file.
- The review flow clearly distinguishes agent instructions, references, and templates.
- Per-file review shows visible progress.
- The `Update` option is absent from this conflict-resolution flow.
- The flow uses Clack primitives and matches existing installer tone.
- Cancellation exits without applying partial decisions.
