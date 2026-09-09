# Phase 3 - CLI State Paths

## Objective

Move make-docs CLI state from `docs/.make-docs/` to `docs/.assets/config/` across install, sync, reconfigure, audit, backup, uninstall, CLI output, and smoke validation.

## Depends On

- [2026-04-20-docs-assets-state-and-history.md](../../designs/2026-04-20-docs-assets-state-and-history.md)
- `packages/cli/src/manifest.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/cli.ts`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/manifest.ts` | Change the canonical manifest path to `docs/.assets/config/manifest.json`. |
| `packages/cli/src/install.ts` | Change skipped-conflict staging to `docs/.assets/config/conflicts/<run-id>/...`; prefer a shared constant over a hardcoded string. |
| `packages/cli/src/audit.ts` | Confirm manifest-present and manifest-missing paths classify the new manifest path as managed state. |
| `packages/cli/src/backup.ts` | Ensure backups copy the new manifest path and preserve relative destination behavior. |
| `packages/cli/src/uninstall.ts` | Ensure uninstall removes the new manifest and prunes only the emptied `docs/.assets/config/` state branch. |
| `packages/cli/src/cli.ts` | Replace hardcoded manifest/help text with the new path or shared helper. |
| `packages/cli/src/README.md` and `packages/cli/README.md` | Update examples and state-path descriptions. |
| `packages/cli/tests/*.test.ts` | Update manifest, conflicts, audit, backup, uninstall, lifecycle, and CLI output expectations. |
| `scripts/smoke-pack.mjs` | Update packed CLI smoke expectations for manifest, conflict staging, backup, and uninstall. |

## Detailed Changes

### 1. Update the manifest constant

Set:

```ts
export const MANIFEST_RELATIVE_PATH = "docs/.assets/config/manifest.json";
```

Do not add fallback reads from `docs/.make-docs/manifest.json`. This is an alpha-phase path move, and existing installs are out of scope.

### 2. Centralize the conflict staging path

Replace the hardcoded conflict root in `applyAction()` with a shared constant such as:

```ts
export const CONFLICTS_RELATIVE_DIR = "docs/.assets/config/conflicts";
```

The exact location can live in `manifest.ts`, `install.ts`, or a small state-path helper, but avoid introducing a broad abstraction unless the implementation genuinely needs it.

### 3. Remove hardcoded old path text

Replace hardcoded `docs/.make-docs/manifest.json` mentions in runtime output with the new path. Known areas include:

- `printPlan()` manifest note in `packages/cli/src/cli.ts`
- command-specific help text for `reconfigure`
- package README examples
- source README conflict examples

Prefer using `MANIFEST_RELATIVE_PATH` in code so future path moves do not require another string sweep.

### 4. Preserve lifecycle safety

Audit should continue treating the manifest as managed state. Backup should copy it under `.backup/<date>/docs/.assets/config/manifest.json`. Uninstall should remove it and prune only directories that are empty after managed files are removed.

The presence of `docs/.assets/history/` routers or history files must prevent uninstall from pruning the parent `docs/.assets/` directory.

### 5. Update tests and smoke expectations

Update all tests that assert:

- manifest location,
- conflict staging location,
- audit removable paths,
- backup copied paths,
- uninstall removed/pruned paths,
- CLI output containing manifest paths,
- packed smoke install/sync/backup/uninstall behavior.

Do not add tests for legacy `.make-docs` compatibility.

## Parallelism

Manifest path updates and conflict path updates are tightly coupled and should be done in the same implementation pass. README and test updates can proceed after the constants are final.

## Acceptance Criteria

- [ ] New installs write `docs/.assets/config/manifest.json`.
- [ ] Existing-target sync reads `docs/.assets/config/manifest.json`.
- [ ] Skipped conflicts stage under `docs/.assets/config/conflicts/<run-id>/...`.
- [ ] Runtime output and help no longer point users to `docs/.make-docs/`.
- [ ] Backup includes the new manifest path.
- [ ] Uninstall removes the new manifest and does not remove `docs/.assets/history/`.
- [ ] Focused CLI, install, audit, backup, uninstall, lifecycle, and smoke expectations pass.
