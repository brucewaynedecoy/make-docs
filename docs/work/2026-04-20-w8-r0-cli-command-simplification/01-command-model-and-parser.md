# Phase 1: Command Model and Parser

> Derives from [Phase 1 of the plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/01-command-model-and-parser.md).

## Purpose

Replace the public install/update command grammar with the simplified command model before behavior and help text are rewritten.

## Overview

This phase owns parser shape, command validation, and removed-command guidance. It should not change install planning behavior beyond routing commands to the new model.

## Source Plan Phases

- [01-command-model-and-parser.md](../../plans/2026-04-20-w8-r0-cli-command-simplification/01-command-model-and-parser.md)

## Stage 1 — Replace the public command union

### Tasks

1. Update `packages/cli/src/cli.ts` so the public command union contains `reconfigure`, `backup`, and `uninstall`.
2. Treat no explicit command as the apply/sync path.
3. Keep `backup` and `uninstall` command detection unchanged.
4. Remove `init` and `update` from normal command dispatch.

### Acceptance criteria

- [ ] Public command parsing recognizes `reconfigure`, `backup`, and `uninstall`
- [ ] Bare `starter-docs` is still valid
- [ ] `init` and `update` do not dispatch to install/update execution
- [ ] `backup` and `uninstall` still dispatch to their existing paths

### Dependencies

- None

## Stage 2 — Remove `--reconfigure`

### Tasks

1. Remove `--reconfigure` from normal option parsing.
2. Add a specific error for any invocation containing `--reconfigure`.
3. Ensure the error points users to `starter-docs reconfigure`.

### Acceptance criteria

- [ ] `starter-docs --reconfigure` fails with `starter-docs reconfigure` guidance
- [ ] `starter-docs update --reconfigure` fails with `starter-docs reconfigure` guidance
- [ ] `--reconfigure` does not reach install planning

### Dependencies

- Stage 1

## Stage 3 — Add helpful removed-command errors

### Tasks

1. Detect `starter-docs init ...` and fail with guidance to use `starter-docs ...`.
2. Detect `starter-docs update ...` and fail with guidance to use `starter-docs ...`.
3. Prefer `starter-docs reconfigure` guidance when removed update invocations include reconfiguration intent.
4. Keep errors non-zero and clear enough for users and agents to self-correct.

### Acceptance criteria

- [ ] `starter-docs init --yes` fails with bare `starter-docs --yes` guidance
- [ ] `starter-docs update --yes` fails with bare `starter-docs --yes` guidance
- [ ] removed-command errors are not generic unknown-command failures

### Dependencies

- Stages 1 and 2

## Stage 4 — Preserve flag boundaries

### Tasks

1. Permit selection flags on bare `starter-docs`.
2. Permit selection flags on `starter-docs reconfigure`.
3. Keep selection flags rejected for `backup` and `uninstall`.
4. Keep `--backup` rejected outside `uninstall`.

### Acceptance criteria

- [ ] Selection flags are accepted for bare apply/sync
- [ ] Selection flags are accepted for `reconfigure`
- [ ] Selection flags are rejected for `backup`
- [ ] Selection flags are rejected for `uninstall`
- [ ] `--backup` remains uninstall-only

### Dependencies

- Stages 1-3

## Stage 5 — Update parser tests

### Tasks

1. Update `packages/cli/tests/cli.test.ts` command recognition expectations.
2. Add removed-command error tests.
3. Add `--reconfigure` migration error tests.
4. Keep lifecycle invalid-flag tests passing.

### Acceptance criteria

- [ ] Parser tests cover the final public command model
- [ ] Removed-command guidance is tested
- [ ] `--reconfigure` guidance is tested
- [ ] `npm test -w starter-docs -- tests/cli.test.ts` passes

### Dependencies

- Stages 1-4
