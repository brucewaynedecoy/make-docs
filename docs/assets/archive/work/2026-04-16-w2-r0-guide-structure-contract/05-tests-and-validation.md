# Phase 5: Tests and Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-16-w2-r0-guide-structure-contract/05-tests-and-validation.md).

## Purpose

Update the test suite and validation scripts to cover all guide-related additions, then run the full validation sequence to confirm correctness.

## Overview

Three test/script files need updates, followed by a sequential validation run: unit tests, router checks, smoke pack, and manual spot-checks.

## Source Plan Phases

- [05-tests-and-validation.md](../../plans/2026-04-16-w2-r0-guide-structure-contract/05-tests-and-validation.md)

## Stage 1 — Update consistency tests

### Tasks

1. In `packages/cli/tests/consistency.test.ts`, add two entries to the `BUILDABLE_PATHS` constant:
   - `"docs/guides/AGENTS.md"`
   - `"docs/guides/CLAUDE.md"`
2. Run `npm run validate:defaults -w make-docs` to verify the consistency test passes.

### Acceptance criteria

- [x] `BUILDABLE_PATHS` includes both guide router paths
- [x] `npm run validate:defaults -w make-docs` passes

### Dependencies

- Phases 1-4 (all implementation complete)

## Stage 2 — Update install tests

### Tasks

1. In `packages/cli/tests/install.test.ts`, add assertions to the full-default install test:
   - `docs/.references/guide-contract.md` exists in installed output
   - `docs/.templates/guide-developer.md` exists in installed output
   - `docs/.templates/guide-user.md` exists in installed output
   - `docs/guides/AGENTS.md` exists and references `guide-contract.md`
   - `docs/guides/CLAUDE.md` exists and references `guide-contract.md`
   - `docs/AGENTS.md` rendered content contains guide-contract reference
   - `docs/.templates/AGENTS.md` rendered content mentions guide templates
2. Add a reduced-profile test case (e.g., `--no-work --no-prd`) that verifies guide files are still installed:
   - `docs/.references/guide-contract.md` exists
   - `docs/.templates/guide-developer.md` exists
   - `docs/.templates/guide-user.md` exists
   - `docs/guides/AGENTS.md` exists
   - `docs/guides/CLAUDE.md` exists
3. Run `npm test -w make-docs` to verify all tests pass.

### Acceptance criteria

- [x] Full-default install test asserts presence and content of all guide-related files
- [x] Reduced-profile test confirms guide files are not capability-gated
- [x] `npm test -w make-docs` passes

### Dependencies

- Stage 1 (consistency tests should pass before adding install tests)

## Stage 3 — Update check-instruction-routers.sh

### Tasks

1. In `scripts/check-instruction-routers.sh`, add `docs/guides/` and `docs/guides/agent/` to the list of directories checked for `AGENTS.md`/`CLAUDE.md` presence.
2. Verify the script checks both the template package (`packages/docs/template/`) and dogfood docs (`docs/`) if applicable.
3. Run `bash scripts/check-instruction-routers.sh` to verify it passes.

### Acceptance criteria

- [x] Script checks `docs/guides/` for AGENTS.md and CLAUDE.md (auto-discovered via `find`)
- [x] Script checks `docs/guides/agent/` for AGENTS.md and CLAUDE.md (auto-discovered via `find`)
- [x] `bash scripts/check-instruction-routers.sh` exits 0

### Dependencies

- Phase 4 (dogfood docs must be re-seeded)

## Stage 4 — Final validation run

### Tasks

1. Run `npm test -w make-docs` — all tests pass.
2. Run `bash scripts/check-instruction-routers.sh` — exits 0.
3. Run `node scripts/smoke-pack.mjs` — pack/install/verify succeeds.
4. Manual spot-check: run `npx make-docs init --yes --target /tmp/guide-contract-test` and verify:
   - `docs/.references/guide-contract.md` exists
   - `docs/.templates/guide-developer.md` exists
   - `docs/.templates/guide-user.md` exists
   - `docs/guides/AGENTS.md` references guide-contract
5. Manual spot-check: verify migrated dogfood guides have correct frontmatter and filenames.
6. Clean up: `rm -rf /tmp/guide-contract-test`.

### Acceptance criteria

- [x] `npm test -w make-docs` exits 0 (43 tests, 6 files, all pass)
- [x] `bash scripts/check-instruction-routers.sh` exits 0
- [x] `node scripts/smoke-pack.mjs` exits 0
- [x] Fresh install includes all guide-related files (confirmed in smoke-pack output)
- [x] Migrated guides have correct frontmatter and slug-mirrors-path filenames
- [x] No regressions in existing tests

### Dependencies

- Stages 1-3 (all test updates complete)
