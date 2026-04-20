# Phase 4 — Tests and Validation

## Objective

Lock the simplified command model with automated tests, packed smoke validation, and stale-reference checks before closing the wave.

## Depends On

- [2026-04-20-cli-command-simplification.md](../../designs/2026-04-20-cli-command-simplification.md)
- Phases 1 through 3 of this plan.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/cli.test.ts` | Replace old `init`/`update` expectations with apply/reconfigure tests and removed-command error tests. |
| `scripts/smoke-pack.mjs` | Ensure packed CLI validation uses bare `starter-docs` and, if needed, `starter-docs reconfigure` instead of removed verbs. |

## Detailed Changes

### 1. Update parser and help tests

Tests should assert:

- top-level help exposes the new command model
- `reconfigure --help` exists
- `init`, `update`, and `--reconfigure` fail with helpful messages
- lifecycle help remains stable

### 2. Add apply/reconfigure behavior tests

Tests should cover:

- first install with bare `starter-docs --yes`
- existing-install sync with bare `starter-docs --yes`
- existing-install desired-state change with bare `starter-docs --yes --no-skills`
- interactive reconfigure wizard path
- non-interactive reconfigure with selection flags
- non-interactive reconfigure without selection flags error
- reconfigure without manifest error

### 3. Preserve lifecycle regression coverage

Existing tests for backup and uninstall should continue to pass. Add focused assertions only if parser changes risk regressing lifecycle flag boundaries.

### 4. Run final validation

Run:

1. `npm run build -w starter-docs`
2. `npm test -w starter-docs`
3. `node scripts/smoke-pack.mjs`
4. a stale-reference search for `starter-docs init`, `starter-docs update`, `update --reconfigure`, and `--reconfigure`

Historical references may remain only when they are deliberately documenting removed behavior or migration errors.

## Acceptance Criteria

- [ ] All parser, help, behavior, and lifecycle regression tests pass.
- [ ] Packed smoke validation uses the simplified command model.
- [ ] Build passes.
- [ ] Full package test suite passes.
- [ ] Stale command references are removed or intentionally documented as migration/error coverage.
