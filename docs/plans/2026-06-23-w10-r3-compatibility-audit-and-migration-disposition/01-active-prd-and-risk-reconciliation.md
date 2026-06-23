# Phase 01: Active PRD and Risk Reconciliation

## Purpose

Create the active-set PRD revision for compatibility classification and update affected baseline docs and risk-register entries.

## Scope

- Add `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`.
- Update `docs/prd/00-index.md`.
- Add targeted `Change Notes` to impacted baseline docs.
- Update existing D/Q/R items in `docs/prd/03-open-questions-and-risk-register.md`.
- Do not archive or regenerate the active PRD namespace.

## PRD Requirements

- Every install, reconfigure, migration, backup, uninstall, and future Rust path must classify source state before mutation.
- The classifier must produce exactly one source state from the accepted taxonomy.
- Dispositions must be `sync`, `migrate`, `migrate-with-review`, `backup-and-reinstall`, or `manual-review-required`.
- Ordinary install and reconfigure may recommend migration but must not perform destructive backup-and-reinstall implicitly.
- Backup-and-reinstall must use one reviewed audit/classification result for approval, backup, removal, and reinstall.
- Rollback is restore-from-backup unless later automation consumes the same backup manifest and path metadata.

## Risk Register Strategy

- Update one-audit safety risk R-006 with the migration disposition contract.
- Update template/package/dogfood risks to cite the classifier as the guardrail for existing installs.
- Update skills and remote-source entries to keep selected-skill preservation conservative during migration.
- Do not close entries unless the PRD revision fully resolves them; most remain open until implementation lands.

## Validation

- New PRD doc uses the active change-doc structure.
- Baseline annotations link back to `18-revise-compatibility-audit-and-migration-disposition.md`.
- PRD index includes the new revision in reading order, document map, source anchors, audience paths, and intended follow-on.
