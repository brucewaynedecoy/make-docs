# Phase 2: Tests and Validation

> Derives from [Phase 2 of the plan](../../plans/2026-04-16-w4-r0-asset-pipeline-completeness/02-tests-and-validation.md).

## Purpose

Add a template-completeness test to prevent future asset pipeline gaps, update existing tests to verify newly managed files, and run the full validation suite.

## Overview

A new template-completeness test walks the template directory and compares it against `getDesiredAssets` output — catching any future file added to the template without being registered in the pipeline. Existing reduced-profile tests are extended with assertions for the 7 newly managed files.

## Source Plan Phases

- [02-tests-and-validation.md](../../plans/2026-04-16-w4-r0-asset-pipeline-completeness/02-tests-and-validation.md)

## Stage 1 — Add template-completeness test

### Tasks

1. In `packages/cli/tests/consistency.test.ts`, add a new test that:
   - Walks `packages/docs/template/` recursively to collect all file paths (relative to the template root).
   - Resolves the full-default profile via `resolveInstallProfile(defaultSelections())`.
   - Calls `getDesiredAssets(profile)` to get the list of managed asset paths.
   - Compares the two sets: every file in the template must appear in the desired assets.
   - Fails with a descriptive message listing any unmanaged files.
2. Use `readdirSync` with `{ recursive: true }` to walk the template directory.
3. Filter out directories (compare files only).
4. Resolve the template root via the existing `TEMPLATE_ROOT` constant from `utils.ts`.
5. Normalize paths to match the relative format used by `getDesiredAssets` (e.g., `docs/AGENTS.md`, not `packages/docs/template/docs/AGENTS.md`).

### Acceptance criteria

- [ ] Template-completeness test exists in `consistency.test.ts`
- [ ] Test passes for the current full-default profile (all template files are covered)
- [ ] Test would fail if a new file were added to the template without being registered in the asset pipeline (verify by temporarily adding a dummy file)

### Dependencies

- Phase 1 (all 7 files must be in the pipeline for the test to pass)

## Stage 2 — Update reduced-profile test assertions

### Tasks

1. In `packages/cli/tests/install.test.ts`, extend the existing reduced-profile test (the one that disables all capabilities) with assertions for:
   - `docs/.references/wave-model.md` exists
   - `docs/.references/agent-guide-contract.md` exists
   - `docs/.templates/agent-guide.md` exists
   - `docs/.archive/AGENTS.md` exists
   - `docs/.archive/CLAUDE.md` exists
2. Verify a prompts-enabled-but-no-capabilities case includes `docs/.prompts/session-to-agent-guide.prompt.md`. This may require adding a new test or extending an existing one.
3. Verify a plans-enabled profile includes `docs/.templates/plan-overview.md` (add assertion to the existing designs-only or plans-enabled test).

### Acceptance criteria

- [ ] Reduced-profile test asserts presence of `wave-model.md`, `agent-guide-contract.md`, `agent-guide.md`, and archive routers
- [ ] Plans-enabled test asserts presence of `plan-overview.md`
- [ ] Session-to-agent-guide prompt is tested for prompts-enabled profiles

### Dependencies

- Stage 1 (completeness test should pass before adding install assertions)

## Stage 3 — Final validation run

### Tasks

1. Run `npm test -w starter-docs` — all tests pass.
2. Run `bash scripts/check-instruction-routers.sh` — exits 0.
3. Run `node scripts/smoke-pack.mjs` — pack/install/verify succeeds.
4. Manual spot-check: run a reduced-profile install into a temp dir and verify all previously unmanaged files are now present.

### Acceptance criteria

- [ ] `npm test -w starter-docs` exits 0
- [ ] `bash scripts/check-instruction-routers.sh` exits 0
- [ ] `node scripts/smoke-pack.mjs` exits 0
- [ ] Reduced-profile install includes all 7 previously unmanaged files
- [ ] No regressions in existing tests

### Dependencies

- Stages 1 and 2
