# Phase 1: Type System and Harness Model

> Derives from [Phase 1 of the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/01-type-system-and-harness-model.md).

## Purpose

Replace the `instructionKinds: Record<InstructionKind, boolean>` selection model with `harnesses: Record<Harness, boolean>`, add `skillScope` to `InstallSelections`, update all profile functions, and add backward-compatible manifest migration for existing installs.

## Overview

Four sequential stages: introduce the new type and const, swap the selection interface and update profile helpers, add manifest backward-compat migration, and fix compile errors across the codebase. Types land first because profile.ts and manifest.ts import them; compile-error cleanup runs last to catch all downstream breakage.

## Source Plan Phases

- [01-type-system-and-harness-model.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/01-type-system-and-harness-model.md)

## Stage 1 — Add Harness type and update InstallSelections in types.ts

### Tasks

1. Add the `Harness` type alias and `HARNESSES` const array to `packages/cli/src/types.ts`.
2. Replace `instructionKinds: Record<InstructionKind, boolean>` with `harnesses: Record<Harness, boolean>` in the `InstallSelections` interface.
3. Add `skillScope: "project" | "global"` to the `InstallSelections` interface.

### Acceptance criteria

- [ ] `Harness` type and `HARNESSES` const exist in `types.ts`.
- [ ] `InstallSelections` uses `harnesses: Record<Harness, boolean>` (no `instructionKinds`).
- [ ] `InstallSelections` has `skillScope: "project" | "global"`.

### Dependencies

- None.

## Stage 2 — Update profile.ts helpers

### Tasks

1. Update `defaultSelections()` in `packages/cli/src/profile.ts` to return `harnesses: { "claude-code": true, "codex": true }` and `skillScope: "project"` instead of the old `instructionKinds` object.
2. Verify `cloneSelections()` requires no change (uses `structuredClone`; new fields are plain objects/primitives).
3. Replace the `instructionKinds` checks in `isFullDefaultProfile()` with checks for both harnesses, `skills`, and `skillScope === "project"`.
4. Replace the `instructionKinds` segment in `profileId` hash input with a `harnesses` + `skillScope` segment.

### Acceptance criteria

- [ ] `defaultSelections()` returns both harnesses true and `skillScope` "project".
- [ ] `cloneSelections()` correctly clones the new fields (verified by existing `structuredClone` behavior).
- [ ] `isFullDefaultProfile()` checks both harnesses, skills, and skillScope.
- [ ] `profileId` hash includes harnesses and skillScope instead of instructionKinds.

### Dependencies

- Stage 1 (types.ts must compile first).

## Stage 3 — Manifest backward-compat migration

### Tasks

1. Add a `migrateSelections()` function in `packages/cli/src/manifest.ts` that detects old manifests with `instructionKinds` but no `harnesses` and derives the new fields (`"CLAUDE.md" -> "claude-code"`, `"AGENTS.md" -> "codex"`).
2. Call `migrateSelections()` in the manifest-loading path before returning the parsed manifest.
3. Remove the `instructionKinds` key from the migrated object so downstream code never sees it.

### Acceptance criteria

- [ ] Loading an old manifest with `instructionKinds` produces correct `harnesses` values (`"CLAUDE.md" -> "claude-code"`, `"AGENTS.md" -> "codex"`).
- [ ] Migrated manifest object does not contain `instructionKinds`.
- [ ] Loading a new manifest with `harnesses` already present passes through unchanged.

### Dependencies

- Stage 1 (needs `Harness` type for return type).

## Stage 4 — Fix compile errors and validate

### Tasks

1. Grep for all remaining references to `instructionKinds` across the codebase and update each to use `harnesses` (keep `InstructionKind` type available only for the migration path in manifest.ts).
2. Run `npm run build -w starter-docs` and fix any type errors.
3. Run `npm test -w starter-docs` and fix any failing tests (update test fixtures that construct `InstallSelections` without the new fields).

### Acceptance criteria

- [ ] No source file outside manifest.ts references `instructionKinds` for selection purposes.
- [ ] `npm run build -w starter-docs` succeeds with zero type errors.
- [ ] `npm test -w starter-docs` passes.

### Dependencies

- Stages 1, 2, and 3 (all source changes must be in place before full validation).
