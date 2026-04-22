# Phase 3: CLI Asset Pipeline and State Paths

> Derives from [Phase 3 of the plan](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/03-cli-asset-pipeline-and-state-paths.md).

## Purpose

Update the CLI so managed document resources install under `docs/assets/**`, while make-docs runtime state is written to root `.make-docs/**`.

## Overview

This phase updates the CLI path constants, asset catalog, generated renderers, rules, install behavior, lifecycle commands, tests, and smoke validation. Resource paths and state paths should remain conceptually separate throughout the implementation.

## Source PRD Docs

None. This backlog is derived from the W9 R1 plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 3 - CLI Asset Pipeline and State Paths](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/03-cli-asset-pipeline-and-state-paths.md)

## Stage 1: Update Managed Resource Paths

### Tasks

- [x] Update `packages/cli/src/catalog.ts` so `getDesiredAssets()` emits managed routers and resources under `docs/assets/**`.
- [x] Update prompt rules from `docs/.prompts/*.prompt.md` to `docs/assets/prompts/*.prompt.md`.
- [x] Update template rules from `docs/.templates/*.md` to `docs/assets/templates/*.md`.
- [x] Update reference rules from `docs/.references/*.md` to `docs/assets/references/*.md`.
- [x] Update archive and history managed asset paths to `docs/assets/archive/**` and `docs/assets/history/**`.

### Acceptance criteria

- [x] Managed resource assets use `docs/assets/archive/`, `docs/assets/history/`, `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/`.
- [x] No managed document resource is emitted to the retired hidden resource roots.
- [x] CLI resource rules agree with the checked-in template tree from Phase 2.

### Dependencies

- Phase 1 contract.
- Phase 2 target tree, or an agreed target tree if Phase 2 and Phase 3 are developed together.

## Stage 2: Update Buildable Renderers

### Tasks

- [x] Update `packages/cli/src/renderers.ts` so buildable router paths include `docs/assets/AGENTS.md` and `docs/assets/CLAUDE.md`.
- [x] Add or update buildable router paths for archive, history, prompts, references, and templates under `docs/assets/`.
- [x] Remove buildable renderer paths for retired hidden resource routers.
- [x] Remove renderer support for `docs/.assets/config/*` and avoid adding any config/state renderer under `docs/assets/`.

### Acceptance criteria

- [x] `renderBuildableAsset()` supports the new `docs/assets/**` router paths.
- [x] Retired hidden resource router paths are not registered as future generated output.
- [x] No docs-template renderer emits CLI state instructions under `docs/assets/`.

### Dependencies

- Stage 1 managed resource path changes.

## Stage 3: Move Manifest and Conflict State

### Tasks

- [x] Update `packages/cli/src/manifest.ts` so `MANIFEST_RELATIVE_PATH` resolves to `.make-docs/manifest.json`.
- [x] Update `CONFLICTS_RELATIVE_DIR` so skipped conflicts stage under `.make-docs/conflicts/`.
- [x] Update install logic that writes skipped-conflict files to use `.make-docs/conflicts/<run-id>/`.
- [x] Update audit, backup, uninstall, lifecycle, and CLI output paths that mention the manifest or conflicts.
- [x] Avoid compatibility reads from `docs/.assets/config/manifest.json` unless execution proves they are required for a concrete migration.

### Acceptance criteria

- [x] Fresh installs write `.make-docs/manifest.json`.
- [x] Skipped conflicts stage under `.make-docs/conflicts/<run-id>/`.
- [x] CLI output and tests do not describe `docs/assets/` as a state location.
- [x] Retired state paths are not used as canonical write targets.

### Dependencies

- Stage 1 can proceed in parallel, but final tests need both resource and state changes.

## Stage 4: Update CLI Tests and Smoke Expectations

### Tasks

- [x] Update consistency tests for managed paths and buildable paths.
- [x] Update install tests for fresh installs, reduced installs, manifest path, conflict staging, and absence of retired hidden resource roots.
- [x] Update audit tests for present and missing `.make-docs/manifest.json`.
- [x] Update backup tests for root `.make-docs/manifest.json` and `.make-docs/conflicts/`.
- [x] Update uninstall tests so CLI-owned `.make-docs/` state is removed safely and user-owned `docs/assets/` content is preserved as required.
- [x] Update `scripts/smoke-pack.mjs` to validate packed CLI behavior against the new resource and state paths.

### Acceptance criteria

- [x] Focused CLI tests pass for catalog, renderers, install, audit, backup, uninstall, lifecycle, and smoke expectations.
- [x] Tests assert `.make-docs/manifest.json` and `.make-docs/conflicts/` where state is involved.
- [x] Tests assert no CLI state under `docs/assets/`.

### Dependencies

- Stages 1 through 3.

## Implementation Notes

Completed on 2026-04-22.

- CLI-managed document resources now route through `docs/assets/archive/`, `docs/assets/history/`, `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/`.
- Runtime state now uses root `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.
- Retired hidden resource roots and `docs/assets/` state/config paths are no longer registered as canonical CLI output paths.

Validation completed:

- `npm test -- tests/consistency.test.ts tests/renderers.test.ts tests/install.test.ts tests/audit.test.ts tests/backup.test.ts tests/uninstall.test.ts tests/lifecycle.test.ts tests/cli.test.ts`
- `npm test -- tests/skills-ui.test.ts`
- `npm run smoke:pack`
- `git diff --check`
