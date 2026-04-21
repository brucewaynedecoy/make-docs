# Phase 3: CLI State Paths

> Derives from [Phase 3 of the plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/03-cli-state-paths.md).

## Purpose

Move starter-docs CLI-managed state from `docs/.starter-docs/` to `docs/.assets/config/`.

## Overview

This phase owns runtime state behavior. It should update manifest reads/writes, conflict staging, lifecycle audit behavior, runtime output, test expectations, and smoke validation. It must not add backward-compatible reads from the old alpha manifest path.

## Source PRD Docs

None. This backlog is derived from the `w9-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [03-cli-state-paths.md](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/03-cli-state-paths.md)

## Stage 1 - Move manifest and conflict path constants

### Tasks

1. Change `MANIFEST_RELATIVE_PATH` in `packages/cli/src/manifest.ts` to `docs/.assets/config/manifest.json`.
2. Add or expose a shared conflict root constant for `docs/.assets/config/conflicts`.
3. Replace the hardcoded conflict root in `packages/cli/src/install.ts`.
4. Avoid adding fallback reads from `docs/.starter-docs/manifest.json`.
5. Prefer imported constants over repeated path literals when updating code.

### Acceptance criteria

- [x] New installs write the manifest at `docs/.assets/config/manifest.json`.
- [x] Existing-target sync reads the new manifest path.
- [x] Skipped conflicts stage under `docs/.assets/config/conflicts/<run-id>/...`.
- [x] No code path silently reads the old alpha manifest path.
- [x] Manifest and conflict path strings are not duplicated unnecessarily in source.

### Dependencies

- Phase 1 for final path naming.

## Stage 2 - Preserve audit, backup, and uninstall safety

### Tasks

1. Confirm `packages/cli/src/audit.ts` classifies the new manifest path as managed state through `MANIFEST_RELATIVE_PATH`.
2. Update any audit test setup that removes or asserts the old manifest path.
3. Confirm backup copies the new manifest relative path into `.backup/<date>/docs/.assets/config/manifest.json`.
4. Confirm uninstall removes the new manifest path.
5. Update pruning expectations so `docs/.assets/config/` can be pruned only when empty.
6. Ensure uninstall never removes `docs/.assets/history/` or parent `docs/.assets/` when history or router files remain.

### Acceptance criteria

- [x] Manifest-present audit includes the new manifest as managed state.
- [x] Manifest-missing audit setup removes the new manifest path.
- [x] Backup copies the new manifest path.
- [x] Uninstall removes the new manifest path.
- [x] Uninstall does not remove history records or `.assets` routers.

### Dependencies

- Stage 1.

## Stage 3 - Update CLI output and CLI-facing docs

### Tasks

1. Update `packages/cli/src/cli.ts` plan output to display the new manifest path.
2. Update `packages/cli/src/cli.ts` command help that mentions the manifest requirement.
3. Update `packages/cli/src/README.md` conflict and manifest examples.
4. Update `packages/cli/README.md` state-path and conflict-staging descriptions.
5. Keep user-facing prose clear that `docs/.assets/config/` is CLI-managed state.

### Acceptance criteria

- [x] Apply/sync plan output displays the new manifest path.
- [x] `starter-docs reconfigure --help` references the new manifest path.
- [x] CLI source README examples use the new state paths.
- [x] CLI package README uses the new state paths.
- [x] Runtime and CLI-facing docs no longer point users to `docs/.starter-docs/`.

### Dependencies

- Stage 1.

## Stage 4 - Update state-path tests and smoke validation

### Tasks

1. Update `packages/cli/tests/install.test.ts` manifest and conflict staging assertions.
2. Update `packages/cli/tests/cli.test.ts` output and help assertions.
3. Update `packages/cli/tests/audit.test.ts` manifest-missing setup.
4. Update `packages/cli/tests/backup.test.ts` copied-file expectations.
5. Update `packages/cli/tests/uninstall.test.ts` removed/pruned path expectations.
6. Update `packages/cli/tests/lifecycle.test.ts` audit, backup, and uninstall lifecycle expectations.
7. Update `scripts/smoke-pack.mjs` manifest, conflict, backup, and uninstall assertions.
8. Do not add tests for old-path compatibility.

### Acceptance criteria

- [x] `npm test -w starter-docs -- tests/install.test.ts` passes.
- [x] `npm test -w starter-docs -- tests/cli.test.ts` passes.
- [x] `npm test -w starter-docs -- tests/audit.test.ts` passes.
- [x] `npm test -w starter-docs -- tests/backup.test.ts` passes.
- [x] `npm test -w starter-docs -- tests/uninstall.test.ts` passes.
- [x] `npm test -w starter-docs -- tests/lifecycle.test.ts` passes.
- [x] `node scripts/smoke-pack.mjs` passes after this phase and dependent template changes are present.

### Dependencies

- Stages 1-3.
