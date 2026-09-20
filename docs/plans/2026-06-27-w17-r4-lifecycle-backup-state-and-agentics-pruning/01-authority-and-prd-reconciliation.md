# P1 Authority and PRD Reconciliation

## Goal

Make the lifecycle backup-state correction authoritative before code changes begin.

## Scope

- Add PRD 32 as the active correction for future backup destinations, legacy root `.backup/**` compatibility, and selected-agentics empty-directory pruning.
- Annotate baseline lifecycle and packaging PRDs that still describe root `.backup/**` as the future backup destination.
- Preserve W7 and W17 R3 history as implementation evidence rather than rewriting completed work.
- Add a W17 R4 prerequisite to downstream plugin lifecycle planning so W18 R2 does not implement plugin backup or uninstall against the superseded root backup contract.

## PRD Updates

- Add [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md#requirement-history).
- Update [PRD 00](../../prd/00-index.md) reading order, document map, source anchors, audience paths, and intended follow-on list.
- Update [PRD 03](../../prd/03-open-questions-and-risk-register.md) for backup-root and selected-agentics pruning risk coverage.
- Annotate [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), and [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md).
- Correct future-facing shared-agentics wording in [PRD 02](../../prd/02-architecture-overview.md) where it still describes W17 R2 generated stubs as current architecture.

## Acceptance Criteria

- Active PRDs point future backup writes at `.make-docs/backup/**`.
- Active PRDs preserve root `.backup/**` only as legacy protected backup state or historical evidence.
- Active PRDs require safe pruning of empty managed `.make-docs/agentics/**` directories after selected-agentics removal.
- W18 R2 plugin lifecycle work records W17 R4 as a prerequisite for backup/uninstall behavior.
