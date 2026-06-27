# P2 Backup State and Legacy Compatibility

## Goal

Move the packaged backup destination from root `.backup/**` to `.make-docs/backup/**` while preserving and protecting existing root `.backup/**`.

## Implementation Targets

- `packages/cli/src/backup.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/lifecycle-ui.ts`
- `packages/cli/src/types.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `scripts/smoke-pack.mjs`

## Requirements

- New backup destination planning writes to `.make-docs/backup/<date>`.
- Existing same-day ordinal behavior is preserved under `.make-docs/backup/**`.
- Home-scoped managed paths continue to back up under `_home/**` inside the dated snapshot.
- Legacy root `.backup/**` is excluded from audit traversal and uninstall pruning.
- Legacy root `.backup/**` is not used for new ordinal calculation.
- `make-docs uninstall --backup` creates the backup under `.make-docs/backup/**` before removal.
- Lifecycle UI and smoke-pack output should no longer teach root `.backup/**` as the future destination.

## Acceptance Criteria

- A fresh `make-docs backup --yes` creates `.make-docs/backup/YYYY-MM-DD`.
- A second same-day backup creates the expected ordinal under `.make-docs/backup/**`.
- Existing root `.backup/**` remains untouched by backup, audit, and uninstall.
- No package smoke or focused lifecycle test expects new root `.backup/**` creation.
