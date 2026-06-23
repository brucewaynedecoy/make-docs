# Phase 03: Migration Backup Rollback Safety

## Purpose

Plan the safety requirements for migration, backup-and-reinstall, rollback, and TypeScript/Rust compatibility.

## Migration Boundary

- Clean prior state can migrate without review only when ownership is fully trusted.
- Supported but modified or partial state must use managed-file review.
- Malformed or unsupported but recognizable state must not be converted implicitly by ordinary install.
- Unknown shapes must stop before mutation.

## Backup and Rollback Boundary

- Backup-and-reinstall must run one audit/classification pass.
- It must show files to back up, remove, preserve, and skip before destructive action.
- It must create a dated backup before any removal.
- It must remove only files the same reviewed audit result marks removable.
- It must install fresh from the selected v2 mode after removal.
- It must never re-audit between approval, backup, removal, and reinstall.
- Rollback is restore-from-backup unless later automation consumes the same backup manifest and path metadata.

## Rust Coexistence Boundary

- The TypeScript npm implementation remains the current executable source of truth.
- A future Rust CLI must preserve the same taxonomy, manifest compatibility, and single-audit safety model before it classifies, syncs, migrates, backs up, uninstalls, or provider-resolves.
- PATH order may choose a runtime, but the selected runtime must not fork installed-project compatibility semantics.

## Validation

- Future implementation must extend lifecycle tests rather than bypass them.
- Package, dogfood, and template validation stay separate surfaces.
