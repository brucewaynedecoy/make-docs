# W17 R4 Lifecycle Backup State and Agentics Pruning Work

## Purpose

Implement the W17 R4 lifecycle correction: future backups write under `.make-docs/backup/**`, legacy root `.backup/**` stays protected, and selected-agentics uninstall prunes empty managed `.make-docs/agentics/**` directories safely.

## Source Chain

- Design: [docs/designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md](../../designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md)
- Plan: [docs/plans/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-overview.md](../../plans/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-overview.md)
- PRD: [docs/prd/32-revise-lifecycle-backup-state-agentics-pruning.md](../../prd/32-revise-lifecycle-backup-state-agentics-pruning.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Authority and PRD Reconciliation](01-authority-and-prd-reconciliation.md) | Confirm PRD and downstream backlog authority before implementation. |
| P2 | [02 Backup State and Legacy Compatibility](02-backup-state-and-legacy-compatibility.md) | Move new backup writes to `.make-docs/backup/**` and protect legacy `.backup/**`. |
| P3 | [03 Selected Agentics Uninstall Pruning](03-selected-agentics-uninstall-pruning.md) | Prune empty managed `.make-docs/agentics/**` directories after selected-agentics removal. |
| P4 | [04 Validation and Closeout](04-validation-and-closeout.md) | Run package validation, smoke-pack, manual UAT, PRD closeout, and history. |

## Acceptance Gate

Do not close W17 R4 while fresh backup runs create root `.backup/**`, while uninstall can delete or traverse legacy root `.backup/**`, while selected-agentics uninstall leaves empty managed `.make-docs/agentics/**` directories behind, or while pruning can delete unmanaged content under `.make-docs/agentics/**`.
