# Phase 3: Instruction Derivation

> Derives from [Phase 3 of the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/03-instruction-derivation.md).

## Purpose

Replace all direct reads of `instructionKinds` in the asset pipeline and renderers with a derivation layer that maps harness selection to instruction kinds. After this phase, catalog and renderer code no longer reference `instructionKinds` directly; they call `getActiveInstructionKinds`.

## Overview

Four sequential stages: introduce the derivation helper in types.ts, update catalog.ts to consume it, update renderers.ts to consume it, then build and test. The helper must land first because both catalog and renderers import it; build+test runs last to catch regressions from all three source changes.

## Source Plan Phases

- [03-instruction-derivation.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/03-instruction-derivation.md)

## Stage 1 — Create getActiveInstructionKinds helper

### Tasks

1. Add the `HARNESS_TO_INSTRUCTION` const mapping each `Harness` to its `InstructionKind` in `packages/cli/src/types.ts`.
2. Export `HARNESS_TO_INSTRUCTION` so tests and the wizard summary can consume it.
3. Add and export the `getActiveInstructionKinds` function that accepts `Pick<InstallSelections, "harnesses">` and returns `Set<InstructionKind>` by iterating `HARNESSES` and checking the boolean on `selections.harnesses`.

### Acceptance criteria

- [ ] `HARNESS_TO_INSTRUCTION` maps `"claude-code"` to `"CLAUDE.md"` and `"codex"` to `"AGENTS.md"`.
- [ ] `getActiveInstructionKinds` returns `Set(["CLAUDE.md"])` when only `claude-code` is `true`.
- [ ] `getActiveInstructionKinds` returns `Set(["AGENTS.md"])` when only `codex` is `true`.
- [ ] `getActiveInstructionKinds` returns both kinds when both harnesses are `true`.
- [ ] `getActiveInstructionKinds` returns an empty set when both harnesses are `false`.
- [ ] Both `HARNESS_TO_INSTRUCTION` and `getActiveInstructionKinds` are exported.

### Dependencies

- Phase 1 (needs `Harness`, `HARNESSES`, and `harnesses` field on `InstallSelections`).

## Stage 2 — Update catalog.ts addInstructionAssets

### Tasks

1. Import `getActiveInstructionKinds` from `types.ts` in `packages/cli/src/catalog.ts`.
2. Replace the `for (const instructionKind of INSTRUCTION_KINDS)` loop with `const activeKinds = getActiveInstructionKinds(profile.selections)` followed by iteration over the derived set.
3. Remove the `instructionKinds` guard inside `addInstructionAssets` (the `if (!profile.selections.instructionKinds[instructionKind])` check) since the caller now pre-filters.

### Acceptance criteria

- [ ] `catalog.ts` imports `getActiveInstructionKinds` from `./types`.
- [ ] `addInstructionAssets` no longer reads `instructionKinds` directly from `profile.selections`.
- [ ] The outer loop iterates over `getActiveInstructionKinds(profile.selections)` instead of `INSTRUCTION_KINDS`.
- [ ] When a harness is disabled, its corresponding instruction-kind assets are excluded from the catalog.

### Dependencies

- Stage 1 (helper must exist before catalog can import it).

## Stage 3 — Update renderers.ts

### Tasks

1. Import `getActiveInstructionKinds` from `types.ts` in `packages/cli/src/renderers.ts`.
2. Update `renderBuildableAsset` to derive active instruction kinds via `getActiveInstructionKinds(profile.selections)` instead of reading `profile.selections.instructionKinds[kind]`.
3. Replace any guard that checks `instructionKinds[kind]` with a membership check against the derived set (e.g., `activeKinds.has(kind)`).

### Acceptance criteria

- [ ] `renderers.ts` imports `getActiveInstructionKinds` from `./types`.
- [ ] `renderBuildableAsset` uses `getActiveInstructionKinds` for instruction-file gating.
- [ ] No remaining reference to `instructionKinds` on `profile.selections` in `renderers.ts`.
- [ ] A disabled harness causes its instruction file to be skipped during rendering.

### Dependencies

- Stage 1 (helper must exist before renderers can import it).

## Stage 4 — Build and test

### Tasks

1. Run `npm run build -w starter-docs` and fix any compilation errors.
2. Run `npm test -w starter-docs` and fix any test failures caused by the new derivation path.
3. Update any test fixtures that construct `InstallSelections` with `instructionKinds` to instead use `harnesses` where the derivation is now expected.
4. Verify no remaining direct references to `instructionKinds` in `catalog.ts` or `renderers.ts`.

### Acceptance criteria

- [ ] `npm run build -w starter-docs` succeeds with zero errors.
- [ ] `npm test -w starter-docs` passes with no regressions.
- [ ] No test fixture in catalog or renderer tests references `instructionKinds` directly.
- [ ] Grep for `instructionKinds` in `catalog.ts` and `renderers.ts` returns zero matches.

### Dependencies

- Stages 1, 2, and 3 (all source changes must be in place before validation).
