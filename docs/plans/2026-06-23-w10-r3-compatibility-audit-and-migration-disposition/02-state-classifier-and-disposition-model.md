# Phase 02: State Classifier and Disposition Model

## Purpose

Plan the implementation surface that classifies existing installs before mutation and maps each state to a safe disposition.

## Current Implementation Evidence

- `packages/cli/src/manifest.ts` owns schema version 1 validation, selection migration, file hashes, selected skills, and manifest audit context.
- `packages/cli/src/audit.ts` already distinguishes manifest-present and manifest-missing audit modes.
- `packages/cli/src/backup.ts` and `packages/cli/src/uninstall.ts` already execute from reviewed audit results.
- `packages/cli/src/planner.ts` and `packages/cli/src/managed-block.ts` already support managed-file and managed-block review.

## Required Implementation Decisions

- Add a state classifier before any file mutation path.
- Validate manifest parseability, schema, package identity, selections, managed file records, skill records, and materialization provenance before trusting state.
- Treat ambiguous fallback recognition as a stop-before-mutation condition.
- Keep `sync` and `migrate` narrow; local deltas require `migrate-with-review`.
- Keep unsupported recognizable shapes on a dedicated `backup-and-reinstall` path.

## Validation

- Future source work must add fixtures for every state/disposition pair.
- The classifier must be testable without invoking destructive backup or uninstall behavior.
