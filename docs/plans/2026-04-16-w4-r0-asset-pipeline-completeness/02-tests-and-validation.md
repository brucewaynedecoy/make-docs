# Phase 2 — Tests and Validation

## Objective

Add a template-completeness test to prevent future asset pipeline gaps, update existing tests to verify the newly added files, and run the full validation suite.

## Depends On

Phase 1 (all CLI source changes must be complete).

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/consistency.test.ts` | Add a template-completeness test that compares template files against `getDesiredAssets`. |
| `packages/cli/tests/install.test.ts` | Add assertions for newly managed files in reduced-profile installs. |

## Detailed Changes

### 1. Template-completeness test (`consistency.test.ts`)

Add a new test that:

1. Walks the `packages/docs/template/` directory recursively to collect all file paths (relative to the template root).
2. Resolves the full-default profile via `resolveInstallProfile(defaultSelections())`.
3. Calls `getDesiredAssets(profile)` to get the list of managed asset paths.
4. Compares the two sets: every file in the template directory must appear in the desired assets list.
5. Fails with a descriptive message listing any unmanaged files.

This test ensures that if a new file is added to the template without being registered in `rules.ts` or `catalog.ts`, the test suite catches it immediately.

Implementation notes:
- Use `readdirSync` with `recursive: true` to walk the template directory.
- Filter out directories (only compare files).
- The template root can be resolved via the existing `TEMPLATE_ROOT` constant from `utils.ts`.
- File paths should be relative to the template root and normalized to match the format used by `getDesiredAssets`.

### 2. Reduced-profile assertions (`install.test.ts`)

Extend the existing reduced-profile test (the one that disables all capabilities) to verify the newly always-installed files:

- `docs/.references/wave-model.md` exists
- `docs/.references/agent-guide-contract.md` exists
- `docs/.templates/agent-guide.md` exists
- `docs/.archive/AGENTS.md` exists
- `docs/.archive/CLAUDE.md` exists

Also verify the prompts-enabled-but-no-capabilities case includes:
- `docs/.prompts/session-to-agent-guide.prompt.md` exists

And verify a plans-enabled profile includes:
- `docs/.templates/plan-overview.md` exists

### 3. Final validation run

Execute in order:

1. `npm test -w starter-docs` — all tests pass, including the new template-completeness test.
2. `bash scripts/check-instruction-routers.sh` — exits 0.
3. `node scripts/smoke-pack.mjs` — pack/install/verify succeeds.
4. Manual spot-check: run a reduced-profile install (`--no-work --no-prd --no-designs --no-plans --yes`) into a temp dir and verify `wave-model.md`, `agent-guide-contract.md`, `agent-guide.md`, and archive routers are present.

## Acceptance Criteria

- [ ] Template-completeness test exists and passes for the full-default profile.
- [ ] The template-completeness test would fail if a new file were added to the template without being registered in the asset pipeline.
- [ ] Reduced-profile test asserts presence of `wave-model.md`, `agent-guide-contract.md`, `agent-guide.md`, and archive routers.
- [ ] Plans-enabled test asserts presence of `plan-overview.md`.
- [ ] `npm test -w starter-docs` exits 0.
- [ ] `bash scripts/check-instruction-routers.sh` exits 0.
- [ ] `node scripts/smoke-pack.mjs` exits 0.
- [ ] No regressions in existing tests.
