# Phase 4: Re-seed and Validation

> Derives from [Phase 4 of the plan](../../plans/2026-04-16-w3-r0-design-naming-simplification/04-reseed-and-validation.md).

## Purpose

Re-seed the repo-root dogfood docs from the updated template package and run the full validation suite.

## Overview

Six template-owned files need re-seeding, followed by the standard validation sequence. Existing design files in `docs/designs/` are NOT modified.

## Source Plan Phases

- [04-reseed-and-validation.md](../../plans/2026-04-16-w3-r0-design-naming-simplification/04-reseed-and-validation.md)

## Stage 1 — Re-seed dogfood docs

### Tasks

1. Copy 6 files from `packages/docs/template/` to `docs/`:
   - `docs/.references/wave-model.md` ← updated (Design row removed, Design Exemption added)
   - `docs/.references/design-contract.md` ← updated (simplified Required Path)
   - `docs/.references/design-workflow.md` ← updated (simplified path patterns)
   - `docs/.templates/design.md` ← updated (simplified filename blockquote)
   - `docs/designs/AGENTS.md` ← updated (simplified naming convention)
   - `docs/designs/CLAUDE.md` ← updated (mirror of AGENTS.md)
2. Verify each target is byte-identical to its source via `diff`.
3. Confirm existing design files in `docs/designs/` (the `w2-r0` designs and `2026-04-16-design-naming-simplification.md`) are untouched.

### Acceptance criteria

- [x] 6 files re-seeded and verified byte-identical to source
- [x] Existing design files in `docs/designs/` are NOT modified
- [x] `bash scripts/check-instruction-routers.sh` passes for dogfood `docs/`

### Dependencies

- Phase 3 (all template and CLI changes complete)

## Stage 2 — Final validation run

### Tasks

1. Run `npm test -w starter-docs` — all tests pass.
2. Run `bash scripts/check-instruction-routers.sh` — exits 0.
3. Run `node scripts/smoke-pack.mjs` — pack/install/verify succeeds.
4. Manual spot-check: fresh `init --yes` into a temp dir:
   - `docs/.references/design-contract.md` shows `YYYY-MM-DD-<slug>.md` (no W/R)
   - `docs/.references/wave-model.md` has `## Design Exemption` section
   - `docs/designs/AGENTS.md` shows simplified naming convention and example
5. Manual spot-check: existing `w2-r0` designs in `docs/designs/` are untouched.

### Acceptance criteria

- [x] `npm test -w starter-docs` exits 0 (43 tests, 6 files)
- [x] `bash scripts/check-instruction-routers.sh` exits 0
- [x] `node scripts/smoke-pack.mjs` exits 0
- [x] Fresh install contains simplified design naming pattern (confirmed via smoke-pack)
- [x] Wave model contains Design Exemption section
- [x] No regressions in existing tests
- [x] Existing designs untouched (all 8 files intact)

### Dependencies

- Stage 1
