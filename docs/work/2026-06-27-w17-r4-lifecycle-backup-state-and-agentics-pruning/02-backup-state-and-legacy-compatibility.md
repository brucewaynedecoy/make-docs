# P2 Backup State and Legacy Compatibility

## Goal

Change packaged lifecycle behavior so new backups write under `.make-docs/backup/**` while existing root `.backup/**` is preserved.

## Tasks

- [ ] t1 Update backup destination constants and planning in `packages/cli/src/backup.ts` so new dated backups live under `.make-docs/backup/**`.
- [ ] t2 Preserve current date and same-day ordinal behavior under the new backup root.
- [ ] t3 Update audit exclusions in `packages/cli/src/audit.ts` to protect both `.make-docs/backup/**` and legacy root `.backup/**`.
- [ ] t4 Update uninstall guardrails in `packages/cli/src/uninstall.ts` so neither backup root can be removed, traversed, or pruned.
- [ ] t5 Update lifecycle UI text and diagnostics so user-facing output names `.make-docs/backup/**` for new backups and distinguishes legacy `.backup/**`.
- [ ] t6 Update backup, audit, uninstall, lifecycle, and smoke-pack tests that currently assert root `.backup/**` as the new destination.
- [ ] t7 Add regression tests proving existing root `.backup/**` is preserved and not used for `.make-docs/backup/**` ordinal calculation.

## Acceptance Criteria

- `make-docs backup --yes` creates `.make-docs/backup/<date>`.
- `make-docs uninstall --backup --yes` backs up to `.make-docs/backup/<date>` before removal.
- Existing root `.backup/**` remains untouched.
- Fresh installs and smoke-pack runs do not create root `.backup/**`.
