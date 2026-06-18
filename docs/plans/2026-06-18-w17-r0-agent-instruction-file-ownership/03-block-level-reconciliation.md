# Phase 03: Block-Level Reconciliation

## Purpose

Move the manifest tracking and conflict review from file scope to block scope so
that a user editing their own content never conflicts, and make-docs can update
its block in place.

## What to build

- Manifest changes: record the managed block's hash (and the dedicated file's
  hash) instead of the whole shared-file hash for instruction files, in
  `packages/cli/src/manifest.ts`.
- Audit/planner changes: compare the block (not the whole file) to decide
  noop/update/conflict for instruction files (`packages/cli/src/audit.ts`,
  `planner.ts`).
- Conflict review: surface block-scoped decisions (re-assert the block, or keep
  the local block) instead of whole-file overwrite/skip; the default for an
  edited make-docs block is re-assert.
- Leave non-instruction managed files on the existing whole-file conflict model.

## Key decisions

- Block hash in the manifest is the unit of reconciliation for instruction
  files.
- Re-assertion is safe because the block is small and make-docs-owned; user
  content outside the block is structurally protected.

## Acceptance criteria

- Editing user content outside the block produces no conflict and no change to
  the block.
- Editing the block surfaces a block-scoped review, not a whole-file conflict.
- Reconfigure/update rewrites the block in place and leaves the rest intact.
- Existing whole-file conflict behavior for non-instruction files is unchanged.

## Dependencies

- Phases 01 and 02. Authored under `packages/cli/` (template-first).
