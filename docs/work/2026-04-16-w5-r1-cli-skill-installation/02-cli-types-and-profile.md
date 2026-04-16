# Phase 2: CLI Types and Profile

> Derives from [Phase 2 of the plan](../../plans/2026-04-16-w5-r1-cli-skill-installation/02-cli-types-and-profile.md).

## Purpose

Add a `skills` boolean to `InstallSelections` and an optional `skillFiles` map to `InstallManifest`, then propagate through all profile helpers so the rest of the CLI can gate on skill installation.

## Overview

Three sequential stages: extend the type interfaces, update the profile helper functions that consume them, and fix any tests broken by the new required field. Types must land first because profile.ts imports them; tests run last to catch fallout from both changes.

## Source Plan Phases

- [02-cli-types-and-profile.md](../../plans/2026-04-16-w5-r1-cli-skill-installation/02-cli-types-and-profile.md)

## Stage 1 — Update types.ts

### Tasks

1. Add `skills: boolean` to the `InstallSelections` interface in `packages/cli/src/types.ts`.
2. Add optional `skillFiles?: Record<string, ManifestFileEntry>` to the `InstallManifest` interface in the same file.

### Acceptance criteria

- [ ] `InstallSelections` has a `skills: boolean` field.
- [ ] `InstallManifest` has an optional `skillFiles?: Record<string, ManifestFileEntry>` field.
- [ ] `npm run build -w starter-docs` succeeds.

### Dependencies

- None.

## Stage 2 — Update profile.ts

### Tasks

1. Add `skills: true` to the object returned by `defaultSelections()` in `packages/cli/src/profile.ts`.
2. Add `skills: selections.skills` to the object returned by `cloneSelections()`.
3. Add `profile.selections.skills &&` to the return expression in `isFullDefaultProfile()`.

### Acceptance criteria

- [ ] `defaultSelections()` returns `skills: true`.
- [ ] `cloneSelections()` copies the `skills` field.
- [ ] `isFullDefaultProfile()` includes a `skills` check.
- [ ] `npm run build -w starter-docs` succeeds.

### Dependencies

- Stage 1 (types.ts must compile first).

## Stage 3 — Fix existing tests

### Tasks

1. Run `npm test -w starter-docs` and identify any tests that fail because they construct `InstallSelections` without the new `skills` field or call `defaultSelections()` expecting the old shape.
2. Add `skills: true` (or the appropriate value) to every test fixture that constructs `InstallSelections` manually.
3. Update any snapshot or assertion that checks the shape of `defaultSelections()` output.
4. Re-run `npm test -w starter-docs` and confirm all tests pass.

### Acceptance criteria

- [ ] All existing tests pass with `npm test -w starter-docs`.
- [ ] No test constructs `InstallSelections` without the `skills` field.

### Dependencies

- Stage 2 (all source changes must be in place before validating tests).
