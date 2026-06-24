# Phase 03: Block-Level Reconciliation

## Purpose

Move the manifest tracking and conflict review from file scope to block scope so
a user editing their own content never conflicts, and make-docs can update its
block in place.

## Overview

Block-scoped reconciliation structurally protects user and project-specific
content: only the make-docs block participates in noop/update/conflict decisions
for instruction files.

## Source PRD Docs

- [15-revise-agent-instruction-file-ownership.md](../../../../prd/15-revise-agent-instruction-file-ownership.md)
- [05-installation-profile-and-manifest-lifecycle.md](../../../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07-cli-command-surface-and-lifecycle.md](../../../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Block-scoped manifest and conflict

### Tasks

- [x] t1: Record the managed block hash in the manifest for instruction files in `packages/cli/src/manifest.ts`, replacing the whole-file hash for those files.
- [x] t2: Update audit and planner (`packages/cli/src/audit.ts`, `packages/cli/src/planner.ts`) to compare the block, not the whole file, for instruction files when deciding noop, update, or conflict.
- [x] t3: Update conflict review to surface block-scoped decisions (re-assert the block, or keep the local block); default to re-assert for an edited make-docs block; never offer whole-file overwrite for instruction files.
- [x] t4: Keep non-instruction managed files on the existing whole-file overwrite/skip conflict model.
- [x] t5: Add tests: editing content outside the block produces no conflict; editing the block surfaces a block-scoped review; reconfigure rewrites the block in place; non-instruction file behavior is unchanged.

### Acceptance criteria

- Editing user content outside the block produces no conflict and no change to the block.
- Editing the block surfaces a block-scoped review, not a whole-file conflict.
- Reconfigure rewrites the block in place and leaves the rest intact.
- Existing whole-file conflict behavior for non-instruction files is unchanged.

### Dependencies

- Phases 01 and 02. Authored under `packages/cli/` (template-first).
