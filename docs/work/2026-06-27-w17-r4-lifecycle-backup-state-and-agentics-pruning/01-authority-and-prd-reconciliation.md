# P1 Authority and PRD Reconciliation

## Goal

Confirm the active documentation authority for W17 R4 before package code changes begin.

## Tasks

- [ ] t1 Read the agent instructions and numbered build-process documents required for the current workflow step.
- [ ] t2 Confirm [PRD 32](../../prd/32-revise-lifecycle-backup-state-agentics-pruning.md) is the active authority for `.make-docs/backup/**`, legacy `.backup/**` protection, and selected-agentics empty-directory pruning.
- [ ] t3 Review [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), and [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md) for W17 R4 annotations before implementation.
- [ ] t4 Confirm downstream W18 R2 plugin lifecycle planning consumes W17 R4 before implementing plugin backup, uninstall, or migration behavior.
- [ ] t5 Record any discovered authority drift in PRD 03 or the phase closeout notes before touching package code.

## Acceptance Criteria

- Workers can tell W17 R4 supersedes root `.backup/**` as the future backup destination.
- Workers can tell legacy root `.backup/**` remains protected state, not ordinary removable content.
- Workers can tell W17 R4 does not reopen W17 R3 native harness exposure.
