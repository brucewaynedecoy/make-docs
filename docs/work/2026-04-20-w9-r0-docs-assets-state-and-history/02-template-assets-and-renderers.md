# Phase 2: Template Assets and Renderers

> Derives from [Phase 2 of the plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md).

## Purpose

Wire the new `.assets` routers into the CLI asset pipeline and generated renderer output so fresh installs receive the new namespace and stop creating `docs/guides/agent/`.

## Overview

This phase owns CLI-managed template assets. It should keep `packages/docs/template/docs/` complete, keep buildable renderer output synchronized with checked-in template files, and update reduced-profile/full-profile install expectations.

## Source PRD Docs

None. This backlog is derived from the `w9-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [02-template-assets-and-renderers.md](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md)

## Stage 1 - Update managed instruction asset paths

### Tasks

1. In `packages/cli/src/catalog.ts`, replace the `docs/guides/agent/${activeInstructionKind}` asset with `.assets` router paths.
2. Add managed paths for `docs/.assets/${activeInstructionKind}`.
3. Add managed paths for `docs/.assets/history/${activeInstructionKind}`.
4. Add managed paths for `docs/.assets/config/${activeInstructionKind}`.
5. Keep `docs/guides/${activeInstructionKind}` managed for user and developer guides.
6. Confirm `packages/cli/src/rules.ts` still always installs `history-record-contract.md`, `history-record.md`, and `session-to-history-record.prompt.md`.

### Acceptance criteria

- [x] `getDesiredAssets()` includes `.assets` router paths for selected instruction kinds.
- [x] `getDesiredAssets()` no longer includes `docs/guides/agent/AGENTS.md` or `docs/guides/agent/CLAUDE.md`.
- [x] Guide routers under `docs/guides/` remain managed.
- [x] History contract, template, and prompt remain always installed.

### Dependencies

- Phase 1.

## Stage 2 - Add `.assets` renderer support

### Tasks

1. In `packages/cli/src/renderers.ts`, add buildable-path support for `docs/.assets/AGENTS.md` and `docs/.assets/CLAUDE.md`.
2. Add buildable-path support for `docs/.assets/history/AGENTS.md` and `docs/.assets/history/CLAUDE.md`.
3. Add buildable-path support for `docs/.assets/config/AGENTS.md` and `docs/.assets/config/CLAUDE.md`.
4. Keep renderer output deterministic and aligned with the checked-in template sources.
5. Update `renderDocsRouter()` so root docs routing points history work at `docs/.assets/history/`.
6. Update `renderGuidesRouter()` so it only routes user and developer guide work.

### Acceptance criteria

- [x] `renderBuildableAsset()` can render every `.assets` router.
- [x] `renderDocsRouter()` references `docs/.assets/history/`.
- [x] `renderGuidesRouter()` no longer references `docs/guides/agent/`.
- [x] Renderer output matches the checked-in template router content.

### Dependencies

- Stage 1.

## Stage 3 - Remove legacy history routers from the template

### Tasks

1. Delete `packages/docs/template/docs/guides/agent/AGENTS.md`.
2. Delete `packages/docs/template/docs/guides/agent/CLAUDE.md`.
3. Confirm no other template file requires the `docs/guides/agent/` directory to exist in fresh installs.
4. Do not move active repo history records in this phase.

### Acceptance criteria

- [x] The package template no longer contains `docs/guides/agent/AGENTS.md`.
- [x] The package template no longer contains `docs/guides/agent/CLAUDE.md`.
- [x] Fresh-install asset planning does not recreate `docs/guides/agent/`.
- [x] Existing repo history files are still untouched until Phase 4.

### Dependencies

- Stages 1 and 2.

## Stage 4 - Update asset-pipeline tests

### Tasks

1. Update `packages/cli/tests/consistency.test.ts` `BUILDABLE_PATHS` for the new `.assets` routers.
2. Update `packages/cli/tests/renderers.test.ts` for root docs, guides, and `.assets` router output.
3. Update `packages/cli/tests/install.test.ts` to assert full-profile installs include the new routers.
4. Update reduced-profile assertions so history contract/template/prompt and `.assets` routers are still installed.
5. Add or update assertions that fresh installs do not create `docs/guides/agent/` routers.

### Acceptance criteria

- [x] `npm test -w starter-docs -- tests/consistency.test.ts` passes.
- [x] `npm test -w starter-docs -- tests/renderers.test.ts` passes.
- [x] Focused install tests for router/template asset presence pass.
- [x] Template completeness still reports no unmanaged template files.

### Dependencies

- Stages 1-3.
