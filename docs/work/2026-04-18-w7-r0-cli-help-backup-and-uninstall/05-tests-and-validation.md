# Phase 5: Tests and Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/05-tests-and-validation.md).

## Purpose

Lock the shipped lifecycle behavior down with targeted automated coverage, packed-install validation, and manual dogfood verification after all feature phases are complete.

## Overview

This phase is the dedicated validation/fixup pass for the wave. It should not re-own feature implementation from prior phases. Instead, it should add the missing coverage, run the full validation ladder, and close any defects found while preserving the same disjoint ownership model from the plan.

## Source Plan Phases

- [05-tests-and-validation.md](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/05-tests-and-validation.md)

## Stage 1 — Finalize automated help and renderer coverage

### Tasks

1. Extend `packages/cli/tests/cli.test.ts` so help assertions cover:
   - top-level help with `init`, `update`, `backup`, and `uninstall`
   - command descriptions and examples
   - `backup --help`
   - `uninstall --help`
   - `--yes` prompt-skipping help text
2. Add `packages/cli/tests/renderers.test.ts` if lifecycle presentation helpers need isolated output coverage.
3. Add or extend reusable helpers in `packages/cli/tests/helpers.ts` for output capture and temp fixtures.

### Acceptance criteria

- [ ] Top-level and command-specific help coverage is complete
- [ ] Renderer-specific lifecycle output is covered when applicable
- [ ] Test helpers support lifecycle scenarios without duplicating setup code

### Dependencies

- Phases 1, 3, and 4

## Stage 2 — Add lifecycle execution tests

### Tasks

1. Create `packages/cli/tests/lifecycle.test.ts`.
2. Cover audit ownership and safety rules:
   - manifest-backed audit
   - manifest-missing fallback
   - unmanaged files inside managed-looking directories
   - `.backup/` exclusion
   - exact-match generated root instruction files removable
   - modified root instruction files preserved
3. Cover backup execution rules:
   - first backup date directory
   - second backup same-day promotion to `-01` and `-02`
   - later ordinal numbering
   - `_home` mapping
   - non-destructive copy behavior
4. Cover uninstall execution rules:
   - plain uninstall remove/prune behavior
   - unmanaged-file preservation
   - modified/unmodified root instruction files
   - `--yes`
   - `uninstall --backup`
   - backup-failure abort behavior

### Acceptance criteria

- [ ] `packages/cli/tests/lifecycle.test.ts` exists
- [ ] Audit safety rules are covered
- [ ] Backup naming and `_home` mapping are covered
- [ ] Uninstall remove/preserve behavior is covered
- [ ] `uninstall --backup` single-audit behavior is covered
- [ ] Backup-failure abort behavior is covered

### Dependencies

- Phases 2-4

## Stage 3 — Extend smoke-pack to validate lifecycle behavior

### Tasks

1. Update `scripts/smoke-pack.mjs` to exercise backup and uninstall against a packed CLI install.
2. Have the smoke test:
   - install/init a real temp target
   - run `backup --yes`
   - verify `.backup/<date-or-sequence>/` exists and contains managed files
   - run `uninstall --yes`
   - verify managed files are removed, preserved custom files remain, and `.backup/` still exists
3. Keep smoke-pack isolated from any user home directories by using temp/fake-home fixtures when needed.

### Acceptance criteria

- [ ] `scripts/smoke-pack.mjs` covers backup and uninstall in addition to install
- [ ] Smoke-pack verifies `.backup/` persists after uninstall
- [ ] Smoke-pack verifies preserved custom files remain
- [ ] Smoke-pack remains deterministic in temp/fake-home environments

### Dependencies

- Stage 2 plus the final feature implementations from Phases 1-4

## Stage 4 — Run the full validation ladder

### Tasks

1. Run `npm test -w make-docs`.
2. Run `bash scripts/check-instruction-routers.sh`.
3. Run `bash scripts/check-wave-numbering.sh`.
4. Run `node scripts/smoke-pack.mjs`.
5. Fix any defects uncovered by the above before continuing.

### Acceptance criteria

- [ ] `npm test -w make-docs` passes
- [ ] `bash scripts/check-instruction-routers.sh` passes
- [ ] `bash scripts/check-wave-numbering.sh` passes
- [ ] `node scripts/smoke-pack.mjs` passes
- [ ] Any validation failures discovered in this stage are resolved before closeout

### Dependencies

- Stages 1-3

## Stage 5 — Manual dogfood verification

### Tasks

1. Dogfood the lifecycle flow in a temp target:
   - `npm run dev -w make-docs -- init --yes --target /tmp/make-docs-lifecycle`
   - create one unmanaged file inside a managed-looking directory
   - optionally modify `AGENTS.md` or `CLAUDE.md`
   - `npm run dev -w make-docs -- backup --yes --target /tmp/make-docs-lifecycle`
   - `npm run dev -w make-docs -- uninstall --backup --yes --target /tmp/make-docs-lifecycle`
2. Verify that:
   - managed files are removed
   - preserved custom files remain
   - modified root instruction files remain if changed
   - the backup tree survives uninstall and remains inspectable
3. Clean up the temp target after verification.

### Acceptance criteria

- [ ] Manual dogfood run succeeds end to end
- [ ] Managed files are removed from the temp target
- [ ] Preserved custom files remain
- [ ] Modified root instruction files remain when expected
- [ ] `.backup/` remains available after uninstall

### Dependencies

- Stage 4
