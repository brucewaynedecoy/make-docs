# Phase 4: Tests, Packaging, and Validation

> Derives from [Phase 4 of the plan](../../plans/2026-04-21-w10-r0-make-docs-rename/04-tests-packaging-and-validation.md).

## Purpose

Update test and smoke expectations for `make-docs`, then prove the rename is complete with package, router, smoke, and stale-reference validation.

## Overview

This phase has two modes. Its test-update stages can begin after Phase 1 lands. Its final validation stages are blocked until Phases 1, 2, and 3 are merged. The final stale-reference sweep is the completion gate for Wave 10.

## Source PRD Docs

None. This backlog is derived from the `w10-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [04-tests-packaging-and-validation.md](../../plans/2026-04-21-w10-r0-make-docs-rename/04-tests-packaging-and-validation.md)

## Parallel Execution Role

Test and smoke worker, then integration worker. Write scope:

- `packages/cli/tests/` except renderer and consistency tests if Phase 2 owns them
- `scripts/smoke-pack.mjs`
- narrow final stale-reference fixes after worker merge

This phase must coordinate with Phase 2 if renderer or consistency tests are already assigned to the template worker.

## Stage 1 - Update test helpers and expectations

### Tasks

1. Update test helper temp prefixes from old product-name prefixes to `make-docs` prefixes.
2. Update mocked raw GitHub URLs and skill registry expectations to the future `make-docs` repository path.
3. Update CLI help, command, error, wizard, lifecycle, audit, backup, uninstall, install, and manifest package-name assertions.
4. Update expected workspace command strings to `make-docs`.
5. Coordinate with Phase 2 for renderer and consistency tests to avoid overlapping writes.

### Acceptance criteria

- [ ] Test helpers use `make-docs` temp prefixes and URLs.
- [ ] CLI tests expect `make-docs` command/help text.
- [ ] Install tests expect manifest `packageName: "make-docs"`.
- [ ] Lifecycle tests expect `make-docs` backup and uninstall copy.
- [ ] No test introduces an old-name allowlist.

### Dependencies

- Phase 1 Stage 1.

## Stage 2 - Update smoke-pack validation

### Tasks

1. Update `scripts/smoke-pack.mjs` temp prefixes to `make-docs`.
2. Update smoke invocations to call the packed `make-docs` binary.
3. Add or update a packed package assertion that only the `make-docs` bin is exposed.
4. Update smoke manifest assertions to expect `packageName: "make-docs"`.
5. Update smoke backup/uninstall text expectations to `make-docs`.

### Acceptance criteria

- [ ] Smoke-pack invokes `make-docs`.
- [ ] Smoke-pack asserts the packed package exposes only the `make-docs` bin.
- [ ] Smoke-pack validates manifest package identity as `make-docs`.
- [ ] Smoke-pack contains no old product-name strings.

### Dependencies

- Phase 1 Stage 1.

## Stage 3 - Run targeted tests

### Tasks

1. Run `npm test -w make-docs -- tests/cli.test.ts`.
2. Run `npm test -w make-docs -- tests/install.test.ts`.
3. Run `npm test -w make-docs -- tests/audit.test.ts`.
4. Run `npm test -w make-docs -- tests/backup.test.ts`.
5. Run `npm test -w make-docs -- tests/uninstall.test.ts`.
6. Run `npm test -w make-docs -- tests/lifecycle.test.ts`.
7. Run `npm test -w make-docs -- tests/wizard.test.ts`.
8. Run `npm test -w make-docs -- tests/skill-registry.test.ts`.
9. Include `tests/renderers.test.ts` and `tests/consistency.test.ts` if Phase 2 did not already validate them.

### Acceptance criteria

- [ ] Targeted CLI, install, lifecycle, wizard, and registry tests pass.
- [ ] Renderer and consistency coverage passes in either Phase 2 or this phase.
- [ ] Failures caused by stale expected text are fixed.
- [ ] Failures caused by real behavior regressions are resolved before final validation.

### Dependencies

- Stages 1-2.
- Phase 1 complete.
- Phase 2 renderer expectations if applicable.

## Stage 4 - Run full validation

### Tasks

1. Run `npm run build -w make-docs`.
2. Run `npm test -w make-docs`.
3. Run `npm run validate:defaults -w make-docs`.
4. Run `node scripts/smoke-pack.mjs`.
5. Run `bash scripts/check-instruction-routers.sh`.
6. Run `git diff --check`.
7. Remove any generated pack artifacts left by smoke validation if they are not meant to be tracked.

### Acceptance criteria

- [ ] Build passes.
- [ ] Full test suite passes.
- [ ] Default validation passes.
- [ ] Smoke-pack passes.
- [ ] Instruction router check passes.
- [ ] `git diff --check` passes.
- [ ] No generated smoke artifact is left in the worktree.

### Dependencies

- Stages 1-3.
- Phases 1-3 complete.

## Stage 5 - Enforce stale-reference completion gate

### Tasks

1. Run tracked-file checks:

   ```text
   git grep -n "starter-docs"
   git grep -n "Starter-Docs"
   git grep -n "Starter Docs"
   git grep -n "starter docs"
   git grep -n "STARTER_DOCS"
   git grep -n "@starter-docs"
   ```

2. Run tracked-path checks:

   ```text
   git ls-files | rg "starter-docs|Starter-Docs|Starter Docs|starter docs|STARTER_DOCS|@starter-docs"
   ```

3. Fix every tracked old-name string and pathname found by those checks.
4. Re-run the checks until all return no matches.
5. Confirm ignored generated/cache directories are not part of the tracked stale-reference result.

### Acceptance criteria

- [ ] `git grep` returns no old-name matches in tracked files.
- [ ] `git ls-files` returns no old-name path matches.
- [ ] No historical-doc allowlist remains.
- [ ] No compatibility command, alias, migration branch, or warning text remains.

### Dependencies

- Stage 4.
