# Phase 03: Migration Disposition Flows

## Purpose

Implement disposition behavior for classified source states while preserving review-first and one-audit safety.

## Overview

This phase wires classification into safe behavior. Ordinary install and reconfigure can sync clean states and recommend migration, but destructive migration must remain explicit.

## Source PRD Docs

- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-compatibility-classification-and-migration-safety.md)
- [13 Revise CLI Conflict Resolution](../../prd/07-cli-command-surface-and-lifecycle.md#plan-review-confirmation-and-apply-orchestration)
- [15 Revise Agent Instruction File Ownership](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)

## Stage 1 - Implement sync and migrate paths

### Tasks

- [x] t1: Allow `sync` only after the audit report shows no unreviewed ownership ambiguity.
- [x] t2: Allow `migrate` only for clean and fully trusted prior states.
- [x] t3: Ensure clean migration may rewrite manifest shape and add v2 provenance only for files that still match known ownership.

### Acceptance criteria

- Clean migration does not silently overwrite modified content.
- Clean migration does not broaden skill selection.
- Runtime state remains in `.make-docs/`, not `docs/assets/`.

### Dependencies

- Phase 02.

## Stage 2 - Implement migrate-with-review

### Tasks

- [x] t4: Show classification and audit summary before reviewable migration.
- [x] t5: Route changed managed files through overwrite/skip review.
- [x] t6: Preserve managed-block semantics for instruction files and avoid append-merge ownership.

### Acceptance criteria

- Local deltas require explicit review.
- Non-interactive runs fail instead of choosing overwrite or skip.
- Instruction file migration uses managed blocks.

### Dependencies

- t1
- t2

## Stage 3 - Implement backup-and-reinstall and manual-review-required

### Tasks

- [x] t7: Keep `backup-and-reinstall` behind a dedicated migration flow or equivalent explicit confirmation path.
- [x] t8: Use one reviewed audit/classification result for approval, backup, removal, and reinstall.
- [x] t9: Stop before mutation for `manual-review-required`.
- [x] t10: Preserve rollback as restore-from-backup unless automation consumes backup metadata.

### Acceptance criteria

- Bare `make-docs` and `make-docs reconfigure` do not perform destructive backup-and-reinstall implicitly.
- No re-audit occurs between approval, backup, removal, and reinstall.
- Manual-review-required output names the failed evidence and leaves the tree unchanged.

### Dependencies

- t4
- t5
- t6

## Implementation Notes

- `packages/cli/src/cli.ts` now classifies compatibility state once before ordinary install/reconfigure planning and before any write path.
- Fresh installs are exempt only when the target has no manifest and either the target directory is absent/empty or a non-empty project has no make-docs ownership evidence, ambiguous fallback paths, or managed-path collisions.
- `sync` proceeds only when the classifier reports no unreviewed ownership ambiguity, and `migrate` proceeds only for `clean-v1` prior states.
- `migrate-with-review` prints classification/audit evidence in interactive runs and routes local deltas through the existing managed-file overwrite/skip review path. Non-interactive reviewable conflicts fail with state, disposition, and evidence.
- `backup-and-reinstall` is blocked from bare `make-docs` and `make-docs reconfigure`; destructive replacement remains reserved for a dedicated migration flow or equivalent explicit confirmation path.
- `manual-review-required` stops before mutation and names the failed evidence. Rollback remains the existing restore-from-backup behavior because this phase does not automate backup metadata consumption.
- Instruction file migration still uses managed-block replacement semantics through the existing planner/install flow; the implementation does not introduce append-merge ownership.
- Validation coverage includes focused CLI compatibility disposition tests plus the existing compatibility classifier and fixture matrix tests.
- Phase 3 touched `packages/cli/src/cli.ts`, `packages/cli/tests/cli.test.ts`, `docs/prd/18-compatibility-classification-and-migration-safety.md`, and `docs/assets/archive/history/2026-06-25-w10-r3-p3-migration-disposition-flows.md`.
- No developer or user guide changed because this phase ships safety behavior and internal audit output rather than a complete documented user migration workflow.
- PRD coverage stays in PRD 18 with updated source anchors; no new PRD change doc or risk-register entry was needed.
- UAT/manual testing remains deferred until full W10 R3 wave closeout.

## Link-Rewrite Hardening Addendum

Documentation tree moves during V1-to-V2 migration must be packaged CLI/shared-core behavior. Direct dogfood cleanup, one-off agent edits, or touched-file link repair do not satisfy this migration contract.

### Future Backlog Requirements

- Build a reviewed documentation move plan before moving or rewriting Markdown. The plan must record old path, new path, ownership class, planned link/image/reference-definition rewrites, skipped links, unresolved targets, and validation scope.
- Implement a Markdown rewriter that updates only parseable Markdown links, image links, and reference definitions. It must skip code spans, fenced code blocks, external URLs, `mailto:` links, and anchor-only links.
- Rewrite links only for files the CLI owns or files the user explicitly approves in `migrate-with-review`.
- Route unresolved targets, deleted/unmapped destinations, ambiguous ownership, and unsafe rewrites to `migrate-with-review` or `manual-review-required`; non-interactive runs must fail before writing.

### Acceptance Criteria

- Clean managed V1 documentation trees migrate with deterministic relative-link rewrites.
- Modified or user-authored Markdown is preserved unless the user approves the planned rewrite.
- Bare `make-docs` and `make-docs reconfigure` cannot silently perform documentation tree moves or link rewrites.
- The move plan is generated by CLI/shared-core code that ships in the package, not by root-dogfood scripts or backlog instructions.
