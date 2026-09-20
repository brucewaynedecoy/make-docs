# P1 Authority and PRD Reconciliation

## Goal

Confirm the active documentation authority for W17 R4 before package code changes begin.

## Tasks

- [x] t1 Read the agent instructions and numbered build-process documents required for the current workflow step.
- [x] t2 Confirm [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md#requirement-history) is the active authority for `.make-docs/backup/**`, legacy `.backup/**` protection, and selected-agentics empty-directory pruning.
- [x] t3 Review [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), and [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) for W17 R4 annotations before implementation.
- [x] t4 Confirm downstream W18 R2 plugin lifecycle planning consumes W17 R4 before implementing plugin backup, uninstall, or migration behavior.
- [x] t5 Record any discovered authority drift in PRD 03 or the phase closeout notes before touching package code.

## Acceptance Criteria

- Workers can tell W17 R4 supersedes root `.backup/**` as the future backup destination.
- Workers can tell legacy root `.backup/**` remains protected state, not ordinary removable content.
- Workers can tell W17 R4 does not reopen W17 R3 native harness exposure.

## Validation Notes

Phase 1 validation confirmed:

- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md#requirement-history) is the active authority for the W17 R4 correction. It requires future backup writes under `.make-docs/backup/**`, preserves existing root `.backup/**` as protected legacy backup evidence, and requires selected-agentics empty-directory pruning only when audit proves no unmanaged descendants remain.
- [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), and [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) already contain W17 R4 annotations for manifest lifecycle, CLI lifecycle, packaging proof, shared-agentics native exposure, and selected-agentics pruning.
- [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) and [W18 R2](../2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md) explicitly consume W17 R4 before plugin backup, uninstall, migration, or cleanup behavior.
- No authority drift was found that required a PRD 03 risk-register update before package code changes.

Coverage decisions:

- Developer guide coverage: none. Phase 1 confirmed existing authority and did not create a new maintainer workflow beyond the W17 R4 backlog itself.
- User guide coverage: none. Phase 1 did not change shipped user behavior.
- PRD coverage: none. Active PRDs were already reconciled by the W17 R4 planning pass; Phase 1 verified that surface rather than changing requirements.
- UAT coverage: deferred until the W17 R4 wave is fully implemented, per user instruction.
