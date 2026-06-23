# Phase 03: Migration Disposition Flows

## Purpose

Implement disposition behavior for classified source states while preserving review-first and one-audit safety.

## Overview

This phase wires classification into safe behavior. Ordinary install and reconfigure can sync clean states and recommend migration, but destructive migration must remain explicit.

## Source PRD Docs

- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-revise-compatibility-audit-and-migration-disposition.md)
- [13 Revise CLI Conflict Resolution](../../prd/13-revise-cli-conflict-resolution.md)
- [15 Revise Agent Instruction File Ownership](../../prd/15-revise-agent-instruction-file-ownership.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)

## Stage 1 - Implement sync and migrate paths

### Tasks

- [ ] t1: Allow `sync` only after the audit report shows no unreviewed ownership ambiguity.
- [ ] t2: Allow `migrate` only for clean and fully trusted prior states.
- [ ] t3: Ensure clean migration may rewrite manifest shape and add v2 provenance only for files that still match known ownership.

### Acceptance criteria

- Clean migration does not silently overwrite modified content.
- Clean migration does not broaden skill selection.
- Runtime state remains in `.make-docs/`, not `docs/assets/`.

### Dependencies

- Phase 02.

## Stage 2 - Implement migrate-with-review

### Tasks

- [ ] t4: Show classification and audit summary before reviewable migration.
- [ ] t5: Route changed managed files through overwrite/skip review.
- [ ] t6: Preserve managed-block semantics for instruction files and avoid append-merge ownership.

### Acceptance criteria

- Local deltas require explicit review.
- Non-interactive runs fail instead of choosing overwrite or skip.
- Instruction file migration uses managed blocks.

### Dependencies

- t1
- t2

## Stage 3 - Implement backup-and-reinstall and manual-review-required

### Tasks

- [ ] t7: Keep `backup-and-reinstall` behind a dedicated migration flow or equivalent explicit confirmation path.
- [ ] t8: Use one reviewed audit/classification result for approval, backup, removal, and reinstall.
- [ ] t9: Stop before mutation for `manual-review-required`.
- [ ] t10: Preserve rollback as restore-from-backup unless automation consumes backup metadata.

### Acceptance criteria

- Bare `make-docs` and `make-docs reconfigure` do not perform destructive backup-and-reinstall implicitly.
- No re-audit occurs between approval, backup, removal, and reinstall.
- Manual-review-required output names the failed evidence and leaves the tree unchanged.

### Dependencies

- t4
- t5
- t6
