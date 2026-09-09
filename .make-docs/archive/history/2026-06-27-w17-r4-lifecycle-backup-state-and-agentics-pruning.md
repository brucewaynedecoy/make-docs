# W17 R4 Lifecycle Backup State and Agentics Pruning Planning

## Summary

Captured the W17 R4 corrective strategy for lifecycle backup state and selected-agentics pruning. The new authority moves future backups from root `.backup/**` to `.make-docs/backup/**`, preserves existing root `.backup/**` as protected legacy backup evidence, and requires uninstall to prune empty managed `.make-docs/agentics/**` directories only when audit proves no unmanaged descendants remain.

## Completed

- Added the W17 R4 corrective design under `docs/designs/`.
- Generated the paired W17 R4 plan bundle under `docs/plans/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/`.
- Added PRD 32 and reconciled active PRD/backlog authority for backup state, legacy backup protection, selected-agentics pruning, and W18 R2 plugin lifecycle inheritance.
- Generated the paired W17 R4 work backlog under `docs/work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/`.

## Validation

- `git diff --check` passed.
- `bash scripts/check-wave-numbering.sh` passed.
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .` passed with `errors=0`.
- A changed-file local Markdown link probe passed across the edited and newly generated Markdown files.
- Required design-heading, `Route: change-plan`, and W17 R4 coordinate handoff checks passed.
- jdocmunch reindex was attempted, but the exposed indexer rejected the local filesystem path as an invalid GitHub owner; direct changed-file validation was used instead.
- Package implementation validation is deferred to W17 R4 execution.

## Follow-On

Implement W17 R4 from `docs/work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/` before downstream lifecycle, selected-agentics cleanup, package-smoke, or plugin lifecycle work changes backup/uninstall behavior.
