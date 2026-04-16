# Phase 1: CLI Source Changes

> Derives from [Phase 1 of the plan](../../plans/2026-04-16-w4-r0-asset-pipeline-completeness/01-cli-source-changes.md).

## Purpose

Update `packages/cli/src/rules.ts` and `packages/cli/src/catalog.ts` to include all 7 unmanaged template files in the asset pipeline.

## Overview

Five changes across two files. After this phase, every install profile produces a complete doc tree with no missing references, templates, prompts, or archive routers.

## Source Plan Phases

- [01-cli-source-changes.md](../../plans/2026-04-16-w4-r0-asset-pipeline-completeness/01-cli-source-changes.md)

## Stage 1 — Extend ALWAYS_REFERENCE_PATHS

### Tasks

1. In `packages/cli/src/rules.ts`, add `"docs/.references/wave-model.md"` and `"docs/.references/agent-guide-contract.md"` to the existing `ALWAYS_REFERENCE_PATHS` constant.
2. The constant should become:
   ```ts
   const ALWAYS_REFERENCE_PATHS = [
     "docs/.references/guide-contract.md",
     "docs/.references/wave-model.md",
     "docs/.references/agent-guide-contract.md",
   ];
   ```
3. No changes needed to `getReferencePaths` — it already loops over `ALWAYS_REFERENCE_PATHS`.

### Acceptance criteria

- [ ] `ALWAYS_REFERENCE_PATHS` contains all three entries
- [ ] A reduced profile (no capabilities) installs `wave-model.md` and `agent-guide-contract.md`

### Dependencies

- None

## Stage 2 — Rename GUIDE_TEMPLATE_PATHS to ALWAYS_TEMPLATE_PATHS and add agent-guide.md

### Tasks

1. In `packages/cli/src/rules.ts`, rename `GUIDE_TEMPLATE_PATHS` to `ALWAYS_TEMPLATE_PATHS`.
2. Add `"docs/.templates/agent-guide.md"` to the array:
   ```ts
   const ALWAYS_TEMPLATE_PATHS = [
     "docs/.templates/guide-developer.md",
     "docs/.templates/guide-user.md",
     "docs/.templates/agent-guide.md",
   ];
   ```
3. Update the loop in `getTemplatePaths` to reference `ALWAYS_TEMPLATE_PATHS` instead of `GUIDE_TEMPLATE_PATHS`.

### Acceptance criteria

- [ ] Constant renamed from `GUIDE_TEMPLATE_PATHS` to `ALWAYS_TEMPLATE_PATHS`
- [ ] `agent-guide.md` included in the array
- [ ] `getTemplatePaths` loop references the renamed constant
- [ ] A reduced profile (no capabilities) installs `agent-guide.md`

### Dependencies

- None (parallel with Stage 1)

## Stage 3 — Add plan-overview.md to PLAN_TEMPLATE_PATHS

### Tasks

1. In `packages/cli/src/rules.ts`, add `"docs/.templates/plan-overview.md"` to `PLAN_TEMPLATE_PATHS`:
   ```ts
   const PLAN_TEMPLATE_PATHS = [
     "docs/.templates/plan-overview.md",
     "docs/.templates/plan-prd.md",
     "docs/.templates/plan-prd-decompose.md",
     "docs/.templates/plan-prd-change.md",
   ];
   ```

### Acceptance criteria

- [ ] `PLAN_TEMPLATE_PATHS` includes `plan-overview.md`
- [ ] A plans-enabled profile installs `plan-overview.md`

### Dependencies

- None (parallel with Stages 1 and 2)

## Stage 4 — Add session-to-agent-guide.prompt.md to PROMPT_RULES

### Tasks

1. In `packages/cli/src/rules.ts`, add a new entry at the end of `PROMPT_RULES`:
   ```ts
   {
     relativePath: "docs/.prompts/session-to-agent-guide.prompt.md",
     requires: [],
   },
   ```
2. The empty `requires` array means this prompt is installed whenever prompts are enabled, regardless of capability selection.

### Acceptance criteria

- [ ] `PROMPT_RULES` includes `session-to-agent-guide.prompt.md` with `requires: []`
- [ ] A prompts-enabled profile (even with no capabilities) installs this prompt

### Dependencies

- None (parallel with Stages 1-3)

## Stage 5 — Add archive instruction assets

### Tasks

1. In `packages/cli/src/catalog.ts`, in `addInstructionAssets`, add one line after the `docs/guides/agent/` entry and before the capability-gated blocks:
   ```ts
   relativePaths.add(`docs/.archive/${instructionKind}`);
   ```
2. This is not capability-gated but IS gated on the instruction kind being selected.

### Acceptance criteria

- [ ] `addInstructionAssets` adds `docs/.archive/AGENTS.md` and `docs/.archive/CLAUDE.md`
- [ ] A reduced profile (no capabilities) includes archive routers when instruction kinds are selected

### Dependencies

- None (parallel with Stages 1-4)

## Stage 6 — Build and smoke test

### Tasks

1. Run `npm run build -w starter-docs` — verify compilation succeeds.
2. Run `npm test -w starter-docs` — verify all existing tests pass with no regressions.

### Acceptance criteria

- [ ] Build succeeds
- [ ] All existing tests pass

### Dependencies

- Stages 1-5 (all source changes complete)
