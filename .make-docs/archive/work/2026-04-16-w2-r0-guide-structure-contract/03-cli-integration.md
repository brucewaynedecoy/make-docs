# Phase 3: CLI Integration

> Derives from [Phase 3 of the plan](../../plans/2026-04-16-w2-r0-guide-structure-contract/03-cli-integration.md).

## Purpose

Wire the guide-contract reference, guide templates, and guide router instruction files into the CLI's managed asset pipeline so they are installed by every profile — not just the full-default.

## Overview

Three CLI source files need changes: `rules.ts` (always-installed references and templates), `catalog.ts` (guide directory instruction assets), and `renderers.ts` (buildable guide routers and updated docs/templates routers). After this phase, reduced profiles will correctly install all guide-related files.

## Source Plan Phases

- [03-cli-integration.md](../../plans/2026-04-16-w2-r0-guide-structure-contract/03-cli-integration.md)

## Stage 1 — Update rules.ts

### Tasks

1. Add `ALWAYS_REFERENCE_PATHS` constant after the `REQUIRED_REFERENCE_PATHS` block:
   ```ts
   const ALWAYS_REFERENCE_PATHS = [
     "docs/.references/guide-contract.md",
   ];
   ```
2. In `getReferencePaths()`, add a loop before the capability-gated loop to unconditionally add all `ALWAYS_REFERENCE_PATHS` to the paths set.
3. Add `GUIDE_TEMPLATE_PATHS` constant after `WORK_TEMPLATE_PATHS`:
   ```ts
   const GUIDE_TEMPLATE_PATHS = [
     "docs/.templates/guide-developer.md",
     "docs/.templates/guide-user.md",
   ];
   ```
4. In `getTemplatePaths()`, add a loop before the capability-gated blocks to unconditionally add all `GUIDE_TEMPLATE_PATHS` to the paths set.

### Acceptance criteria

- [x] `ALWAYS_REFERENCE_PATHS` constant exists with `guide-contract.md`
- [x] `getReferencePaths()` includes always-installed paths unconditionally
- [x] `GUIDE_TEMPLATE_PATHS` constant exists with both guide templates
- [x] `getTemplatePaths()` includes guide templates unconditionally
- [x] `getReferenceDirInstalled()` returns true for all profiles (always at least one reference)
- [x] `getTemplateDirInstalled()` returns true for all profiles (always at least one template)

### Dependencies

- Phases 1 and 2 (template files must exist)

## Stage 2 — Update catalog.ts

### Tasks

1. In `addInstructionAssets()`, add two lines after `relativePaths.add(\`docs/${instructionKind}\`)` and before the capability-gated blocks:
   ```ts
   relativePaths.add(`docs/guides/${instructionKind}`);
   relativePaths.add(`docs/guides/agent/${instructionKind}`);
   ```
2. These lines are NOT gated on any capability (guides are always relevant) but ARE gated on the instruction kind being selected (the existing early return handles this).

### Acceptance criteria

- [x] `addInstructionAssets()` adds `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` for selected instruction kinds
- [x] `addInstructionAssets()` adds `docs/guides/agent/AGENTS.md` and `docs/guides/agent/CLAUDE.md` for selected instruction kinds
- [x] Lines are placed after the root/docs adds and before capability-gated blocks

### Dependencies

- Phases 1 and 2 (template files must exist)

## Stage 3 — Update renderers.ts

### Tasks

1. Add `GUIDES_ROUTER_INSTRUCTIONS` constant:
   ```ts
   const GUIDES_ROUTER_INSTRUCTIONS = new Set([
     "docs/guides/AGENTS.md",
     "docs/guides/CLAUDE.md",
   ]);
   ```
2. Add `GUIDES_ROUTER_INSTRUCTIONS.has(relativePath)` to the `isBuildablePath()` return expression.
3. Add switch cases in `renderBuildableAsset()` for `"docs/guides/AGENTS.md"` and `"docs/guides/CLAUDE.md"`, dispatching to `renderGuidesRouter(profile)`.
4. Add new function `renderGuidesRouter(profile: InstallProfile): string` that renders guide router content referencing:
   - `docs/.references/guide-contract.md` for developer/user guide structure
   - `docs/.templates/guide-developer.md` and `docs/.templates/guide-user.md` as templates
   - `docs/.references/agent-guide-contract.md` for agent guides
   - The directory-creation-on-demand instruction
5. In `renderDocsRouter()`, add an unconditional (not capability-gated) `lines.push()` for the guides routing line, placed after the prd/work/change-management blocks and before the prompts block. The line should reference `guide-contract.md` for developer/user guides and `agent-guide-contract.md` for agent guides.
6. In `renderTemplatesRouter()`, add an unconditional `templateFamilies.push()` for guide templates ("`guide-developer.md` and `guide-user.md` for guides"), placed after the designs block.

### Acceptance criteria

- [x] `GUIDES_ROUTER_INSTRUCTIONS` constant exists
- [x] `isBuildablePath()` recognizes guide router paths
- [x] `renderBuildableAsset()` dispatches guide routers to `renderGuidesRouter()`
- [x] `renderGuidesRouter()` returns content referencing guide-contract, both guide templates, and agent-guide-contract
- [x] `renderDocsRouter()` emits guides routing line for all profiles
- [x] `renderTemplatesRouter()` mentions guide templates for all profiles
- [x] Full-default profile still short-circuits to static template files (existing behavior preserved)

### Dependencies

- Stages 1 and 2 of this phase (new assets must be in the pipeline before renderers reference them)
