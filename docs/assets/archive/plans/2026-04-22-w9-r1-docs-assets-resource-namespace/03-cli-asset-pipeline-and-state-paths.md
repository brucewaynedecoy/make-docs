# Phase 3 - CLI Asset Pipeline and State Paths

## Objective

Update the CLI so fresh installs, syncs, generated routers, and managed asset rules use `docs/assets/` for document resources, while manifest state, conflict staging, audits, backups, uninstalls, and tests use root `.make-docs/` for mutable CLI state.

## Depends On

- Phase 1 path contract.
- Phase 2 template target tree.
- `packages/cli/src/catalog.ts`
- `packages/cli/src/renderers.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/install.ts`
- CLI tests under `packages/cli/tests/`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/catalog.ts` | Emit managed instruction routers under `docs/assets/`, `docs/assets/archive/`, `docs/assets/history/`, `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/`. |
| `packages/cli/src/rules.ts` | Rewrite prompt, template, and reference rules from hidden directories to `docs/assets/*`. |
| `packages/cli/src/renderers.ts` | Replace `.assets`, `.assets/history`, `.assets/config`, `.prompts`, `.templates`, and design-reference renderer paths with the new `assets/` paths. |
| `packages/cli/src/manifest.ts` | Make `MANIFEST_RELATIVE_PATH` resolve to `.make-docs/manifest.json` and conflicts to `.make-docs/conflicts`. |
| `packages/cli/src/install.ts` | Stage skipped conflicts under `CONFLICTS_RELATIVE_DIR` at the new path. |
| `packages/cli/src/audit.ts`, `backup.ts`, `uninstall.ts`, `cli.ts` | Update state classification, backup copy paths, prune expectations, and runtime/help output. |
| `packages/cli/tests/*.test.ts` | Update install, consistency, renderer, CLI, audit, backup, uninstall, lifecycle, and wizard expectations. |
| `scripts/smoke-pack.mjs` | Validate packed CLI behavior against the new manifest/conflict/resource paths. |

## Detailed Changes

### 1. Centralize resource and state path constants where useful

Prefer small constants for common roots:

```ts
const DOCS_ASSETS_RELATIVE_DIR = "docs/assets";
const MAKE_DOCS_STATE_RELATIVE_DIR = ".make-docs";
export const MANIFEST_RELATIVE_PATH = `${MAKE_DOCS_STATE_RELATIVE_DIR}/manifest.json`;
export const CONFLICTS_RELATIVE_DIR = `${MAKE_DOCS_STATE_RELATIVE_DIR}/conflicts`;
```

Avoid a large path abstraction unless the implementation needs it. The goal is to prevent another broad string sweep for common roots.

### 2. Rewrite managed asset rules

Rewrite path rules so assets install to:

```text
docs/assets/archive/
docs/assets/history/
docs/assets/prompts/
docs/assets/references/
docs/assets/templates/
```

Prompt rules should move from `docs/.prompts/*.prompt.md` to `docs/assets/prompts/*.prompt.md`.

Template rules should move from `docs/.templates/*.md` to `docs/assets/templates/*.md`.

Reference rules should move from `docs/.references/*.md` to `docs/assets/references/*.md`.

Archive router assets should move from `docs/.archive/AGENTS.md` and `CLAUDE.md` to `docs/assets/archive/AGENTS.md` and `CLAUDE.md`.

### 3. Replace buildable router registrations

Update buildable path sets and switch cases for:

- `docs/assets/AGENTS.md`
- `docs/assets/CLAUDE.md`
- `docs/assets/archive/AGENTS.md`
- `docs/assets/archive/CLAUDE.md`
- `docs/assets/history/AGENTS.md`
- `docs/assets/history/CLAUDE.md`
- `docs/assets/prompts/AGENTS.md`
- `docs/assets/prompts/CLAUDE.md`
- `docs/assets/references/AGENTS.md`
- `docs/assets/references/CLAUDE.md`
- `docs/assets/templates/AGENTS.md`
- `docs/assets/templates/CLAUDE.md`

Remove the `docs/.assets/config/*` renderer paths. The `assets/` router should describe document resources only. CLI-owned state belongs in root `.make-docs/` and should not get a docs-template router.

### 4. Update manifest and conflict behavior

Set canonical runtime state to:

```text
.make-docs/manifest.json
.make-docs/conflicts/<run-id>/
```

Do not add legacy compatibility reads for `docs/.assets/config/manifest.json` unless execution discovers a current test or workflow that cannot be migrated without one. The dogfood repository should be cleaned up by the migration phase.

Do not put runtime state under `docs/assets/manifest.json`, `docs/assets/conflicts/`, `docs/assets/state/`, or `docs/assets/config/`.

### 5. Update test expectations

Tests should assert that fresh installs:

- create `docs/assets/`,
- install resource files under `docs/assets/*`,
- write `.make-docs/manifest.json`,
- stage conflicts under `.make-docs/conflicts/`,
- do not create hidden top-level resource directories.

Uninstall tests should verify that `docs/assets/` is not pruned if it contains user-owned history/archive resources, and that CLI-owned `.make-docs/` manifest/conflict files are removed safely.

## Parallelism

Rules/catalog/renderers are tightly coupled and should land in one implementation slice. Manifest/conflict updates can be a second slice, but both slices must merge before install and lifecycle tests are finalized.

## Acceptance Criteria

- [ ] `getDesiredAssets()` emits managed docs resources under `docs/assets/**`.
- [ ] `renderBuildableAsset()` supports the new router paths and no longer registers retired resource-router paths.
- [ ] Prompt/template/reference rule constants emit `docs/assets/prompts`, `docs/assets/templates`, and `docs/assets/references`.
- [ ] New installs write `.make-docs/manifest.json`.
- [ ] Skipped conflicts stage under `.make-docs/conflicts/<run-id>/`.
- [ ] Runtime output and CLI help no longer point users to `docs/.assets/config/` or any `docs/assets/` state path.
- [ ] Focused catalog, renderer, install, CLI, audit, backup, uninstall, lifecycle, and smoke tests pass after expectation updates.
