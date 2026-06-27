---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R4 P2"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Moved current lifecycle backups under Make Docs tool state while preserving legacy root backup evidence."
---

# W17 R4 P2 Backup State and Legacy Compatibility

## Changes

Phase 2 moved future lifecycle backup writes to `.make-docs/backup/**` while preserving legacy root `.backup/**` as protected backup evidence: backup planning now uses the Make Docs tool-state backup root, audit and uninstall guardrails protect both backup roots, CLI help and the lifecycle user guide teach the new destination, and package tests plus smoke-pack expectations prove new backups no longer depend on root `.backup/**` or its ordinals.

- Added a shared backup path helper for the current and legacy project backup roots.
- Updated backup planning so new backups and same-day ordinals are created under `.make-docs/backup/**`.
- Updated audit and uninstall guardrails so `.make-docs/backup/**` and root `.backup/**` are excluded from removal and pruning.
- Updated lifecycle CLI help and user guidance to distinguish current backup state from legacy recovery evidence.
- Updated backup, audit, uninstall, lifecycle, CLI help, and smoke-pack coverage for the new destination and legacy preservation behavior.

Validation run:

- `npm test -w packages/cli -- --run tests/backup.test.ts tests/audit.test.ts tests/uninstall.test.ts tests/lifecycle.test.ts tests/cli.test.ts --reporter=dot --silent`
- `git diff --check`
- Focused Markdown link check for the Phase 2 work file, this history record, and the updated lifecycle user guide.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/02-backup-state-and-legacy-compatibility.md](../../../work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/02-backup-state-and-legacy-compatibility.md) | Marked Phase 2 complete and recorded backup-state validation evidence. |
| [docs/assets/archive/history/2026-06-27-w17-r4-p2-backup-state-and-legacy-compatibility.md](2026-06-27-w17-r4-p2-backup-state-and-legacy-compatibility.md) | Added this phase closeout breadcrumb. |

### Developer

None this session.

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/cli-lifecycle-managing-installations.md](../../library/user/cli-lifecycle-managing-installations.md) | Updated lifecycle backup guidance for `.make-docs/backup/**` and legacy `.backup/**` recovery evidence. |
