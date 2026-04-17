# Phase 4: Skill Install Pipeline

> Derives from [Phase 4 of the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/04-skill-install-pipeline.md).

## Purpose

Add a harness-aware skill catalog that computes multi-target install paths, rewrites references per harness, and integrates with the planner and installer. Depends on Phase 1 (harness types, `HARNESSES` const, `InstallSelections` shape) and Phase 2 (skill registry, `local:` protocol resolver).

> Implemented divergence: the shipped installer preserves each skill as a full directory under the harness root and colocates support files inside that directory. There is no `skill-assets/` projection model in the final implementation. See the [updated design](../../designs/2026-04-16-cli-skill-installation-r2.md) and [phase-5 agent guide](../../guides/agent/2026-04-17-w5-r2-p5-cli-skill-installation.md).

## Overview

Wire the full multi-harness skill installation pipeline: load the registry, compute per-harness install targets, rewrite asset references, plan skill actions, execute writes, and track in the manifest. Five stages across four files (`skill-catalog.ts`, `planner.ts`, `install.ts`, `manifest.ts`).

## Source Plan Phases

- [04-skill-install-pipeline.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/04-skill-install-pipeline.md)

## Stage 1 — Create skill-catalog.ts (multi-harness asset discovery + path rewriting)

### Tasks

1. Create `packages/cli/src/skill-catalog.ts` exporting `getDesiredSkillAssets(selections: InstallSelections)`.
2. Return an empty array when `!selections.skills`.
3. Load the skill registry via the Phase 2 registry loader.
4. Determine the install root from `selections.skillScope`: `.` for `"project"`, `os.homedir()` for `"global"`.
5. Iterate over `HARNESSES`, skipping any harness where `selections.harnesses[harness]` is false.
6. For each active harness and each registry skill entry, resolve harness-specific directories (`.claude/skills/` and `.claude/skill-assets/` for `claude-code`; `.agents/skills/` and `.agents/skill-assets/` for `codex`).
7. Compute the skill install path as `<install-root>/<harness-skills-dir>/<installName>`.
8. Read entry point content via the Phase 2 protocol resolver.
9. Implement reference rewriting: parse relative markdown links in entry point content, resolve each against the source location, match against declared assets, compute a relative path from the skill install location to the asset install location, and replace.
10. For each active harness and each declared asset on each skill entry, compute the asset install path as `<install-root>/<harness-skill-assets-dir>/<installPath>` and read source content via the protocol resolver.
11. Return an array of `DesiredAsset` objects with `relativePath`, `content`, and `sourceId`.

### Acceptance criteria

- [ ] `skill-catalog.ts` exists and exports `getDesiredSkillAssets`
- [ ] When both harnesses are selected, returned assets include entries for both `.claude/skills/` and `.agents/skills/`
- [ ] When only one harness is selected, assets are returned only for that harness's directories
- [ ] Project scope uses `.` as the install root; global scope uses `os.homedir()`
- [ ] Relative references in SKILL.md content are rewritten to resolve from the harness-specific install location
- [ ] Rewritten references correctly point to `../skill-assets/<plugin>/<path>` for both harnesses

### Dependencies

- Phase 1 (`Harness` type, `HARNESSES` const, `harnesses` and `skillScope` in `InstallSelections`)
- Phase 2 (skill registry loader, `local:` protocol resolver)

## Stage 2 — Integrate into planner.ts

### Tasks

1. In `createInstallPlan` within `packages/cli/src/planner.ts`, call `getDesiredSkillAssets(profile.selections)` after building docs-template actions.
2. For each returned `DesiredAsset`, create a `PlannedAction` by comparing against `manifest.skillFiles` to determine `create`, `update`, or `noop`.
3. Use the `sourceId` for content-hash comparison when deciding `update` vs `noop`.
4. Append skill actions to the plan's actions array.

### Acceptance criteria

- [ ] Skill actions appear in install plans when skills are selected
- [ ] Action types (`create`/`update`/`noop`) correctly reflect manifest state
- [ ] Planner treats fully resolved paths from the skill catalog opaquely (no harness awareness needed)

### Dependencies

- Stage 1 (`getDesiredSkillAssets` must exist)

## Stage 3 — Integrate into install.ts

### Tasks

1. In `applyInstallPlan` within `packages/cli/src/install.ts`, handle skill-related `PlannedAction` entries with status `create` or `update`.
2. Ensure parent directories exist before writing (skill and asset directories may not exist, especially on first install or global scope).
3. Write skill files to the computed harness-specific paths.
4. Collect all installed skill file paths into the manifest update.

### Acceptance criteria

- [ ] Skill files written to correct harness-specific directories during install (`.claude/skills/`, `.agents/skills/`, etc.)
- [ ] Supporting assets written to correct harness-specific asset directories (`.claude/skill-assets/`, `.agents/skill-assets/`)
- [ ] Parent directories created automatically when they do not exist
- [ ] Installed skill file paths collected for manifest tracking

### Dependencies

- Stage 1 (`getDesiredSkillAssets` must exist)

## Stage 4 — Update manifest.ts for skillFiles support

### Tasks

1. Add or update the `skillFiles` field in the manifest type within `packages/cli/src/manifest.ts` as an array of relative path strings tracking all installed skill and asset files across all harnesses and scopes.
2. On manifest read, treat a missing `skillFiles` field as an empty array (backward-compatible with R1 manifests).
3. On manifest write, persist the full `skillFiles` list.
4. Plan `remove` actions for files that were previously in `skillFiles` but are no longer in the desired set (e.g., when a harness is deselected on reconfigure).

### Acceptance criteria

- [ ] Manifests with `skillFiles` parse correctly
- [ ] Manifests without `skillFiles` parse correctly (backward-compatible with R1 shape)
- [ ] `skillFiles` written to manifest when skill files are installed
- [ ] Removing a harness on reconfigure plans `remove` actions for that harness's skill files

### Dependencies

- Phase 1 (manifest type must include harness-aware fields)

## Stage 5 — Build and test

### Tasks

1. Run `npm run build -w starter-docs` and verify success.
2. Run `npm test -w starter-docs` and verify all tests pass.
3. Verify that the skill catalog, planner integration, install integration, and manifest changes work together end-to-end.

### Acceptance criteria

- [ ] `npm run build -w starter-docs` succeeds with no errors
- [ ] `npm test -w starter-docs` passes with no failures
- [ ] End-to-end: selecting both harnesses produces two copies of each skill in the correct directories

### Dependencies

- Stages 1-4 (all implementation complete)
