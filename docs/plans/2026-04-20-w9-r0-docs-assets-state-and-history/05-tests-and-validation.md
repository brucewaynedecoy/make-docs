# Phase 5 - Tests and Validation

## Objective

Validate that `.assets` state and history are fully integrated, that the package still builds and ships a complete template, and that active docs no longer send users or agents to retired paths.

## Depends On

- Phases 1 through 4.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/consistency.test.ts` | Final expected buildable path updates for `.assets` routers. |
| `packages/cli/tests/install.test.ts` | Fresh install, reduced install, conflicts, and template completeness assertions. |
| `packages/cli/tests/cli.test.ts` | CLI output and help path expectations. |
| `packages/cli/tests/audit.test.ts` | Manifest-present and manifest-missing audit assertions for new state path. |
| `packages/cli/tests/backup.test.ts` | Backup copied-path expectations for new manifest location. |
| `packages/cli/tests/uninstall.test.ts` | Removed/pruned path assertions for new state location. |
| `packages/cli/tests/lifecycle.test.ts` | End-to-end audit, backup, uninstall path expectations. |
| `scripts/smoke-pack.mjs` | Packed CLI validation for new manifest, conflict, backup, and uninstall paths. |
| Optional validation helper | Add a small stale-reference/link check only if existing tests are not sufficient. |

## Detailed Validation

### 1. Focused test runs

Run focused tests during implementation:

```sh
npm test -w starter-docs -- tests/consistency.test.ts
npm test -w starter-docs -- tests/renderers.test.ts
npm test -w starter-docs -- tests/install.test.ts
npm test -w starter-docs -- tests/cli.test.ts
npm test -w starter-docs -- tests/audit.test.ts
npm test -w starter-docs -- tests/backup.test.ts
npm test -w starter-docs -- tests/uninstall.test.ts
npm test -w starter-docs -- tests/lifecycle.test.ts
```

### 2. Full package validation

Run:

```sh
npm run build -w starter-docs
npm test -w starter-docs
node scripts/smoke-pack.mjs
bash scripts/check-instruction-routers.sh
```

### 3. Router and template validation

Confirm:

- every file under `packages/docs/template/docs/` is managed by `getDesiredAssets()`,
- `renderBuildableAsset()` matches checked-in template files,
- reduced-profile installs still include required references/templates/prompts and `.assets` routers,
- `docs/guides/agent/` is not created by fresh installs.

### 4. Link validation

Run an internal Markdown link check over changed docs and moved history records. At minimum, validate:

- `docs/.assets/history/*.md`,
- `docs/.references/agent-guide-contract.md`,
- `docs/.templates/agent-guide.md`,
- `docs/.prompts/session-to-agent-guide.prompt.md`,
- `docs/guides/user/getting-started-installing-starter-docs.md`,
- `docs/guides/developer/cli-development-local-build-and-install.md`,
- new plan/work docs if generated after this plan.

### 5. Stale-reference validation

Run stale-reference searches after implementation:

```sh
rg -n "docs/\\.starter-docs|\\.starter-docs/conflicts|docs/guides/agent" docs packages scripts
rg -n "docs/\\.assets/starter-docs|docs/\\.assets/history" docs packages scripts
```

Allowed old-path references should be limited to historical designs, historical plans, historical work backlogs, and historical history records that are explicitly describing prior behavior. Active source-of-truth surfaces must not point users or generated output at retired paths.

### 6. Whitespace validation

Run:

```sh
git diff --check
```

## Acceptance Criteria

- [ ] Focused test suites pass.
- [ ] `npm run build -w starter-docs` passes.
- [ ] `npm test -w starter-docs` passes.
- [ ] `node scripts/smoke-pack.mjs` passes.
- [ ] `bash scripts/check-instruction-routers.sh` passes.
- [ ] Link validation passes for changed docs and moved history.
- [ ] Active stale references to `docs/.starter-docs/` are removed.
- [ ] Active stale references to `docs/guides/agent/` are removed.
- [ ] Historical stale references are documented as intentional or left only in clearly historical docs.
- [ ] `git diff --check` passes.
