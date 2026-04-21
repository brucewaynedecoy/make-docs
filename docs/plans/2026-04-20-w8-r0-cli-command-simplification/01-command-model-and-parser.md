# Phase 1 — Command Model and Parser

## Objective

Replace the public install/update command grammar with a simpler command model: bare `make-docs` for apply/sync, `make-docs reconfigure` for selection changes, and unchanged `backup`/`uninstall` lifecycle commands.

## Depends On

- [2026-04-20-cli-command-simplification.md](../../designs/2026-04-20-cli-command-simplification.md)
- The current `packages/cli/src/cli.ts` parser, command union, validation rules, and command-specific help dispatch.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Remove public `init`/`update` commands, add `reconfigure`, remove `--reconfigure`, preserve lifecycle commands, and add helpful migration errors for removed surfaces. |
| `packages/cli/tests/cli.test.ts` | Update parser and command-dispatch coverage for the new command model and removed-command errors. |

## Detailed Changes

### 1. Define the final public command union

The public command union should become:

- `reconfigure`
- `backup`
- `uninstall`

No explicit command means apply/sync. It should not be represented to users as inferred `init` or inferred `update`.

`backup` and `uninstall` behavior and validation remain unchanged.

### 2. Remove `--reconfigure`

`--reconfigure` should no longer be parsed as a valid option. Any invocation containing `--reconfigure` should fail with a specific error that points to `make-docs reconfigure`.

This applies to:

- `make-docs --reconfigure`
- `make-docs update --reconfigure`
- any other command combined with `--reconfigure`

### 3. Add helpful removed-command errors

The parser should recognize removed command names only to produce useful errors:

- `make-docs init ...` should fail with guidance to use `make-docs ...`.
- `make-docs update ...` should fail with guidance to use `make-docs ...`.
- If an `update` invocation includes `--reconfigure`, guidance should prefer `make-docs reconfigure`.

These errors should be non-zero and should not fall through to install planning.

### 4. Preserve invalid flag boundaries

Selection flags are valid only for:

- bare `make-docs`
- `make-docs reconfigure`

Selection flags remain invalid for:

- `make-docs backup`
- `make-docs uninstall`

`--backup` remains valid only for `uninstall`. Lifecycle `--yes` remains valid for `backup` and `uninstall` and also remains available to apply/reconfigure for non-interactive install flows.

## Acceptance Criteria

- [ ] The public command model contains `reconfigure`, `backup`, and `uninstall`.
- [ ] Bare `make-docs` remains a valid invocation.
- [ ] `init` and `update` no longer execute source behavior.
- [ ] `init`, `update`, and `--reconfigure` fail with helpful migration guidance.
- [ ] Selection flags are accepted for bare `make-docs` and `make-docs reconfigure`.
- [ ] Selection flags remain rejected for `backup` and `uninstall`.
- [ ] `--backup` remains uninstall-only.
- [ ] `npm test -w make-docs -- tests/cli.test.ts` passes after parser tests are updated.
