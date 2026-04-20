# Phase 4: Tests and Validation

> Derives from [Phase 4 of the plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/04-tests-and-validation.md).

## Purpose

Close the command simplification wave with automated coverage, packed CLI validation, and stale-reference checks.

## Overview

This phase should happen after parser, behavior, help, and generated guidance changes are complete. It is a validation/fixup pass, not a new feature phase.

## Source Plan Phases

- [04-tests-and-validation.md](../../plans/2026-04-20-w8-r0-cli-command-simplification/04-tests-and-validation.md)

## Stage 1 — Finalize parser and help regression coverage

### Tasks

1. Ensure parser tests cover bare apply/sync, `reconfigure`, `backup`, and `uninstall`.
2. Ensure help tests cover top-level help and command-specific help.
3. Ensure removed-command guidance is asserted.
4. Ensure invalid flag boundary tests still cover lifecycle commands.

### Acceptance criteria

- [ ] Parser coverage reflects the final command model
- [ ] Help coverage reflects the final command model
- [ ] Removed-command guidance is tested
- [ ] Lifecycle invalid flag tests still pass

### Dependencies

- Phases 1-3

## Stage 2 — Finalize behavior regression coverage

### Tasks

1. Verify tests cover first install with bare `starter-docs`.
2. Verify tests cover existing-install sync with bare `starter-docs`.
3. Verify tests cover bare desired-state selection changes.
4. Verify tests cover interactive and non-interactive reconfigure.
5. Verify tests cover reconfigure failure cases.

### Acceptance criteria

- [ ] First install behavior is covered
- [ ] Existing install sync behavior is covered
- [ ] Desired-state selection changes are covered
- [ ] Reconfigure success paths are covered
- [ ] Reconfigure failure paths are covered

### Dependencies

- Phase 2

## Stage 3 — Update packed smoke validation

### Tasks

1. Update `scripts/smoke-pack.mjs` to invoke bare `starter-docs` for install/apply.
2. Use `starter-docs reconfigure` only if the smoke needs to verify selection changes.
3. Keep existing packed backup and uninstall validation intact.

### Acceptance criteria

- [ ] Smoke-pack no longer depends on `init` or `update`
- [ ] Smoke-pack still validates packed install/apply behavior
- [ ] Smoke-pack still validates backup and uninstall behavior

### Dependencies

- Phases 1-3

## Stage 4 — Run final validation

### Tasks

1. Run `npm run build -w starter-docs`.
2. Run `npm test -w starter-docs`.
3. Run `node scripts/smoke-pack.mjs`.
4. Search for stale `starter-docs init`, `starter-docs update`, `update --reconfigure`, and `--reconfigure` references.
5. Fix any validation failures before closeout.

### Acceptance criteria

- [ ] Build passes
- [ ] Full test suite passes
- [ ] Smoke-pack passes
- [ ] Stale command references are removed or intentionally documented as migration/error coverage
- [ ] No validation failures remain

### Dependencies

- Stages 1-3
