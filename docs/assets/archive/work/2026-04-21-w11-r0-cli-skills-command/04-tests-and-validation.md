# Phase 4: Tests and Validation

> Derives from [Phase 4 of the plan](../../plans/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md).

## Purpose

Close the skills command wave with automated coverage, packed CLI smoke validation, stale-reference checks, and focused manual dry runs.

## Overview

This phase is a validation and fixup pass. It should not introduce new user-facing behavior beyond closing test gaps discovered while validating Phases 1-3.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Plan Phases

- [04-tests-and-validation.md](../../plans/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md)

## Stage 1 - Finalize parser and help coverage

### Tasks

1. Ensure top-level help tests assert the `skills` command.
2. Ensure `make-docs skills --help` is covered.
3. Ensure `make-docs --skills` is rejected.
4. Ensure content-selection flags are rejected under `skills`.
5. Ensure `--remove --optional-skills` is rejected.

### Acceptance criteria

- [x] Top-level help coverage includes `skills`.
- [x] Skills help coverage includes usage, options, and examples.
- [x] Root-level `--skills` is tested as invalid.
- [x] Skills invalid flag boundaries are tested.
- [x] Parser/help tests pass.

### Dependencies

- Phase 1.

## Stage 2 - Finalize skills-only sync coverage

### Tasks

1. Cover first-time `make-docs skills --yes`.
2. Cover existing full install preservation.
3. Cover global scope paths.
4. Cover disabled harness paths.
5. Cover optional skill add and removal.
6. Mock remote skill resolution using existing test patterns.

### Acceptance criteria

- [x] First-time sync writes only skill files plus minimal manifest state.
- [x] Existing non-skill managed files remain unchanged and tracked.
- [x] Global skill writes are covered.
- [x] Harness-constrained writes are covered.
- [x] Optional skill add/remove behavior is covered.
- [x] No unit test hits live network.

### Dependencies

- Phase 2.

## Stage 3 - Finalize removal coverage

### Tasks

1. Cover `make-docs skills --remove --yes`.
2. Cover preservation of non-skill manifest files.
3. Cover preservation of unrelated files under skill directories.
4. Cover modified managed skill files.
5. Cover no-manifest and no-tracked-skill no-op summaries.

### Acceptance criteria

- [x] Removal deletes only manifest-tracked skill files.
- [x] Non-skill manifest files remain in place and tracked.
- [x] Unrelated skill-directory files are preserved.
- [x] Modified managed skill file safety is covered.
- [x] No-op removal cases are covered.

### Dependencies

- Phase 2 and Phase 3 output behavior.

## Stage 4 - Finalize interactive flow coverage

### Tasks

1. Cover sync action flow.
2. Cover remove action flow.
3. Cover platform selection.
4. Cover scope selection.
5. Cover optional skill selection.
6. Cover review apply/edit/cancel behavior.

### Acceptance criteria

- [x] Interactive sync is covered without a live TTY.
- [x] Interactive removal is covered without a live TTY.
- [x] Review edit behavior is covered.
- [x] Cancellation prevents apply.
- [x] Existing full wizard tests still pass.

### Dependencies

- Phase 3.

## Stage 5 - Update smoke validation

### Tasks

1. Add packed CLI smoke coverage for `make-docs skills --help`.
2. Add packed CLI smoke coverage for a skills-only dry run if it can run without live network instability.
3. Add packed CLI smoke coverage for `make-docs skills --remove --dry-run` when a manifest fixture is available.
4. Keep existing packed install, backup, and uninstall validation intact.

### Acceptance criteria

- [x] Smoke-pack validates the skills command help surface.
- [x] Smoke-pack validates at least one non-mutating skills command path.
- [x] Existing smoke-pack validation still passes.

### Dependencies

- Phases 1-3.

## Stage 6 - Run final validation and stale-reference checks

### Tasks

1. Run `npm run build -w make-docs`.
2. Run `npm test -w make-docs`.
3. Run `node scripts/smoke-pack.mjs`.
4. Search docs, help text, and tests for stale root-level `--skills` guidance.
5. Run focused manual dry runs in a temp target for `make-docs skills --dry-run`, `make-docs skills --yes`, and `make-docs skills --remove --yes`.
6. Fix failures before closeout.

### Acceptance criteria

- [x] Build passes.
- [x] Full package tests pass.
- [x] Smoke-pack passes.
- [x] No docs or help text advertise root-level `--skills`.
- [x] Manual dry runs confirm skills-only sync and removal boundaries.
- [x] No validation failures remain.

### Dependencies

- Stages 1-5.
