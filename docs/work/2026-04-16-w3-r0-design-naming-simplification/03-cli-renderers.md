# Phase 3: CLI Renderers

> Derives from [Phase 3 of the plan](../../plans/2026-04-16-w3-r0-design-naming-simplification/03-cli-renderers.md).

## Purpose

Update the three design-related renderer functions in `packages/cli/src/renderers.ts` to emit the simplified `YYYY-MM-DD-<slug>.md` path pattern.

## Overview

Six occurrences of `YYYY-MM-DD-w{W}-r{R}-<slug>.md` in design renderer output need changing, plus associated wave-model.md references. All changes are within one file.

## Source Plan Phases

- [03-cli-renderers.md](../../plans/2026-04-16-w3-r0-design-naming-simplification/03-cli-renderers.md)

## Stage 1 — Update renderDesignWorkflow

### Tasks

1. In `renderDesignWorkflow` (full variant — designs + plans installed):
   - Replace `YYYY-MM-DD-w{W}-r{R}-<slug>.md` with `YYYY-MM-DD-<slug>.md` in the output form description.
   - Replace `See \`docs/.references/wave-model.md\` for W/R semantics.` with `See \`docs/.references/design-contract.md\` for naming and structural rules.`
   - Update the validation checklist entry to `YYYY-MM-DD-<slug>.md`.
2. In `renderDesignWorkflow` (reduced variant — designs only, no plans):
   - Same three changes as the full variant.

### Acceptance criteria

- [x] Full variant: no `w{W}-r{R}` in path patterns, references `design-contract.md`
- [x] Reduced variant: no `w{W}-r{R}` in path patterns, references `design-contract.md`
- [x] All other workflow text unchanged (Preflight, Create vs Update, Lineage, Follow-On, Stop Rule)

### Dependencies

- Phases 1 and 2 (template must match)

## Stage 2 — Update renderDesignContract

### Tasks

1. In `renderDesignContract`, replace the Required Path entry:
   - From: `YYYY-MM-DD-w{W}-r{R}-<slug>.md`
   - To: `YYYY-MM-DD-<slug>.md`
2. Replace the wave-model reference line:
   - From: `See \`docs/.references/wave-model.md\` for W/R semantics and resolution rules.`
   - To: `\`YYYY-MM-DD\` is today's date (never backdated). \`<slug>\` is lowercase, hyphens only.`

### Acceptance criteria

- [x] Required Path shows `YYYY-MM-DD-<slug>.md`
- [x] No wave-model.md reference in Required Path section
- [x] All other contract sections unchanged

### Dependencies

- Parallel with Stage 1

## Stage 3 — Update renderDesignTemplate

### Tasks

1. In `renderDesignTemplate`, replace the filename blockquote:
   - From: `> Filename: \`YYYY-MM-DD-w{W}-r{R}-<slug>.md\`. See \`docs/.references/wave-model.md\` for W/R semantics.`
   - To: `> Filename: \`YYYY-MM-DD-<slug>.md\`. See \`docs/.references/design-contract.md\` for naming and structural rules.`

### Acceptance criteria

- [x] Blockquote uses simplified pattern
- [x] References `design-contract.md` instead of `wave-model.md`

### Dependencies

- Parallel with Stages 1 and 2

## Stage 4 — Build and test

### Tasks

1. Run `npm run build -w make-docs` — verify compilation succeeds.
2. Run `npm test -w make-docs` — verify all tests pass with no regressions.

### Acceptance criteria

- [x] Build succeeds
- [x] All tests pass (43 tests, 6 files)
- [x] No occurrences of `w{W}-r{R}` remain in design-related renderer output

### Dependencies

- Stages 1-3
