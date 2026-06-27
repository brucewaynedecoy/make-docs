# P2 Backup State and Legacy Compatibility

## Goal

Change packaged lifecycle behavior so new backups write under `.make-docs/backup/**` while existing root `.backup/**` is preserved.

## Tasks

- [x] t1 Update backup destination constants and planning in `packages/cli/src/backup.ts` so new dated backups live under `.make-docs/backup/**`.
- [x] t2 Preserve current date and same-day ordinal behavior under the new backup root.
- [x] t3 Update audit exclusions in `packages/cli/src/audit.ts` to protect both `.make-docs/backup/**` and legacy root `.backup/**`.
- [x] t4 Update uninstall guardrails in `packages/cli/src/uninstall.ts` so neither backup root can be removed, traversed, or pruned.
- [x] t5 Update lifecycle UI text and diagnostics so user-facing output names `.make-docs/backup/**` for new backups and distinguishes legacy `.backup/**`.
- [x] t6 Update backup, audit, uninstall, lifecycle, and smoke-pack tests that currently assert root `.backup/**` as the new destination.
- [x] t7 Add regression tests proving existing root `.backup/**` is preserved and not used for `.make-docs/backup/**` ordinal calculation.

## Acceptance Criteria

- `make-docs backup --yes` creates `.make-docs/backup/<date>`.
- `make-docs uninstall --backup --yes` backs up to `.make-docs/backup/<date>` before removal.
- Existing root `.backup/**` remains untouched.
- Fresh installs and smoke-pack runs do not create root `.backup/**`.

## Validation Notes

Phase 2 validation confirmed:

- `packages/cli/src/backup-paths.ts` centralizes the packaged backup-state roots so backup creation uses `.make-docs/backup/**` while audit and uninstall guardrails still recognize legacy root `.backup/**`.
- `make-docs backup` and `make-docs uninstall --backup` plan new dated backups under `.make-docs/backup/<date>`, including same-day ordinal suffixes under the new root.
- Legacy root `.backup/**` is preserved as protected backup evidence and is ignored when calculating new `.make-docs/backup/**` ordinals.
- Audit and uninstall logic protect both `.make-docs/backup/**` and `.backup/**` from removal, traversal, and pruning.
- CLI help, lifecycle guide text, package tests, and smoke-pack expectations now name `.make-docs/backup/**` as the current backup destination and reserve `.backup/**` for legacy protected state.

Coverage decisions:

- Developer guide coverage: none. The implementation adds package helper code and tests but does not add a new developer-facing workflow.
- User guide coverage: update-existing. [CLI lifecycle managing installations](../../assets/library/user/cli-lifecycle-managing-installations.md) now describes `.make-docs/backup/**` as the backup destination and `.backup/**` as legacy recovery evidence.
- PRD coverage: none. Phase 1 confirmed active PRD reconciliation; Phase 2 implemented the already accepted PRD 32 backup-state behavior.
- UAT coverage: deferred until the W17 R4 wave is fully implemented, per user instruction.

Validation run:

- `npm test -w packages/cli -- --run tests/backup.test.ts tests/audit.test.ts tests/uninstall.test.ts tests/lifecycle.test.ts tests/cli.test.ts --reporter=dot --silent`
- `git diff --check`
- Focused Markdown link check for the Phase 2 work file, Phase 2 history record, and updated lifecycle user guide.
