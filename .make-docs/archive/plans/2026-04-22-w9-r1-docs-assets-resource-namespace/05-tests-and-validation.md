# Phase 5 - Tests and Validation

## Objective

Validate that the new `docs/assets/` namespace is complete in the template, enforced by the CLI, dogfooded by this repository, reflected in active docs without stale future-facing hidden-resource paths, and kept separate from root `.make-docs/` runtime state.

## Depends On

- Phases 1 through 4.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/consistency.test.ts` | Final buildable and managed-path expectations for `docs/assets/**`. |
| `packages/cli/tests/renderers.test.ts` | Router renderer assertions for assets, archive, history, prompts, references, templates, docs root, and guides. |
| `packages/cli/tests/install.test.ts` | Fresh/reduced install assertions, manifest path, conflicts path, and absence of hidden resource directories. |
| `packages/cli/tests/cli.test.ts` | CLI output and help path expectations. |
| `packages/cli/tests/audit.test.ts` | Manifest-present and manifest-missing audit assertions for `.make-docs/manifest.json`. |
| `packages/cli/tests/backup.test.ts` | Backup copied-path expectations for the direct manifest location. |
| `packages/cli/tests/uninstall.test.ts` | Removed/pruned path assertions for new state location and assets root preservation. |
| `packages/cli/tests/lifecycle.test.ts` | End-to-end audit, backup, uninstall, and renderer output expectations. |
| `scripts/smoke-pack.mjs` | Packed CLI validation for resource tree, manifest, conflict, backup, and uninstall paths. |
| Validation helper or docs allowlist if needed | Stale-reference allowlist for historical docs only. |

## Detailed Validation

### 1. Focused test runs

Run focused tests during implementation:

```sh
npm test -w make-docs -- tests/consistency.test.ts
npm test -w make-docs -- tests/renderers.test.ts
npm test -w make-docs -- tests/install.test.ts
npm test -w make-docs -- tests/cli.test.ts
npm test -w make-docs -- tests/audit.test.ts
npm test -w make-docs -- tests/backup.test.ts
npm test -w make-docs -- tests/uninstall.test.ts
npm test -w make-docs -- tests/lifecycle.test.ts
```

### 2. Full package validation

Run:

```sh
npm run build -w make-docs
npm test -w make-docs
node scripts/smoke-pack.mjs
bash scripts/check-instruction-routers.sh
```

### 3. Template completeness validation

Confirm:

- every file under `packages/docs/template/docs/assets/` is managed by `getDesiredAssets()`,
- no active file remains under retired template roots,
- `renderBuildableAsset()` matches checked-in template router files,
- reduced-profile installs still include required references, templates, prompts, and assets routers,
- fresh installs do not create hidden top-level resource directories under `docs/`.

### 4. Dogfood validation

Confirm this repository's active docs tree has:

```text
docs/assets/
docs/designs/
docs/guides/
docs/plans/
docs/prd/
docs/work/
```

and does not have active hidden resource roots:

```text
docs/.archive/
docs/.assets/
docs/.prompts/
docs/.references/
docs/.templates/
docs/.resources/
```

If a hidden resource root remains because of unmanaged user content, document it explicitly and do not delete unknown files without user approval.

Confirm CLI state is outside `docs/`:

```text
.make-docs/manifest.json
.make-docs/conflicts/
```

Confirm these docs-tree state paths do not exist:

```text
docs/assets/manifest.json
docs/assets/conflicts/
docs/assets/state/
docs/assets/config/
```

### 5. Link validation

Run internal Markdown link checks over moved and active docs. At minimum validate:

- `docs/assets/references/*.md`
- `docs/assets/templates/*.md`
- `docs/assets/prompts/*.prompt.md`
- `docs/assets/archive/AGENTS.md`
- `docs/assets/history/*.md`
- `docs/AGENTS.md` and `docs/CLAUDE.md`
- `docs/guides/**/*.md`
- `README.md`
- `packages/cli/README.md`
- `packages/docs/README.md`
- new plan/work docs for this wave revision

### 6. Stale-reference validation

Run stale-reference searches after implementation:

```sh
rg -n "docs/\\.(archive|assets|prompts|references|templates|resources)" docs packages scripts README.md
rg -n "docs/assets/(manifest|conflicts|state|config)|docs/\\.assets/config|docs/\\.assets/history|docs/\\.archive" docs packages scripts README.md
rg -n "docs/assets/(manifest|conflicts|state|config)|docs/\\.assets|docs/\\.prompts|docs/\\.references|docs/\\.templates|docs/\\.archive" packages/cli/src packages/cli/tests scripts/smoke-pack.mjs
rg -n "\\.make-docs/(manifest\\.json|conflicts)" docs packages scripts README.md
```

Allowed old-path references should be limited to historical designs, historical plans, historical work backlogs, and historical history records that explicitly describe previous behavior. Active source-of-truth surfaces must not point users or generated output at retired paths.

### 7. Whitespace validation

Run:

```sh
git diff --check
```

## Acceptance Criteria

- [ ] Focused test suites pass.
- [ ] `npm run build -w make-docs` passes.
- [ ] `npm test -w make-docs` passes.
- [ ] `node scripts/smoke-pack.mjs` passes.
- [ ] `bash scripts/check-instruction-routers.sh` passes.
- [ ] Template completeness confirms all `packages/docs/template/docs/assets/**` files are managed.
- [ ] Dogfood tree validation confirms `docs/assets/` is the only active support-resource namespace and root `.make-docs/` owns CLI state.
- [ ] Link validation passes for moved and active docs.
- [ ] Active stale references to hidden resource directories and retired docs-tree state paths are removed.
- [ ] Historical stale references are documented as intentional or left only in clearly historical docs.
- [ ] `git diff --check` passes.
