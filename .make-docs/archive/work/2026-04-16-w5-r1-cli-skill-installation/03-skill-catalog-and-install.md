# Phase 3: Skill Catalog and Install

> Derives from [Phase 3 of the plan](../../plans/2026-04-16-w5-r1-cli-skill-installation/03-skill-catalog-and-install.md).

## Purpose

Add skill discovery, path rewriting, and installation logic so the CLI can install skills into `.claude/skills/` and supporting assets into `.claude/skill-assets/<plugin>/` during `init` and `update`. Depends on Phase 1 (bundled skills) and Phase 2 (`skills` in `InstallSelections`).

## Overview

Wire the full skill installation pipeline: resolve the skills root, discover and map skill assets, plan skill actions, execute writes, and track in the manifest. Six stages across five files (`utils.ts`, `catalog.ts`, `planner.ts`, `install.ts`, `manifest.ts`).

## Source Plan Phases

- [03-skill-catalog-and-install.md](../../plans/2026-04-16-w5-r1-cli-skill-installation/03-skill-catalog-and-install.md)

## Stage 1 — Add SKILLS_ROOT to utils.ts

### Tasks

1. Add `resolveSkillsRoot(packageRoot)` function to `packages/cli/src/utils.ts`.
2. Try sibling path first: `path.resolve(packageRoot, "..", "skills")` (dev mode).
3. Fall back to bundled path: `path.join(packageRoot, "skills")` (packed mode).
4. Return `null` if neither directory exists.
5. Export `SKILLS_ROOT` constant using the resolver.

### Acceptance criteria

- [ ] `SKILLS_ROOT` resolves correctly in dev mode (sibling `../skills` exists)
- [ ] `SKILLS_ROOT` returns `null` gracefully when no skills directory is present

### Dependencies

- Phase 1 (skills must be bundled in the CLI package)

## Stage 2 — Add getDesiredSkillAssets to catalog.ts

### Tasks

1. Add `getDesiredSkillAssets(profile)` function to `packages/cli/src/catalog.ts`.
2. Return empty array if `!profile.selections.skills` or `SKILLS_ROOT` is null.
3. Walk `SKILLS_ROOT` recursively, discover all `SKILL.md` files and supporting assets.
4. Map SKILL.md files to install targets at `.claude/skills/<plugin>-<name>.md` (e.g., `archive-docs/skills/archive/SKILL.md` maps to `.claude/skills/archive-docs-archive.md`).
5. Map non-SKILL.md files to `.claude/skill-assets/<plugin>/<relative-path>` (e.g., `archive-docs/references/archive-workflow.md` maps to `.claude/skill-assets/archive-docs/references/archive-workflow.md`).
6. Rewrite relative references in SKILL.md content so links resolve from `.claude/skills/` to `.claude/skill-assets/<plugin>/`.

### Acceptance criteria

- [ ] Returns correct asset list with rewritten paths for SKILL.md files
- [ ] Supporting assets mapped to correct `.claude/skill-assets/<plugin>/` targets
- [ ] Relative references in SKILL.md content rewritten to resolve from installed location

### Dependencies

- Stage 1 (`SKILLS_ROOT` must be available)

## Stage 3 — Integrate into planner.ts

### Tasks

1. In `createInstallPlan` within `packages/cli/src/planner.ts`, call `getDesiredSkillAssets(profile)`.
2. For each skill asset, create a `PlannedAction` (create/noop/update based on manifest comparison).
3. Append skill actions to the plan's actions array.

### Acceptance criteria

- [ ] Skill actions appear in install plans when skills are selected
- [ ] Action types (create/noop/update) correctly reflect manifest state

### Dependencies

- Stage 2 (`getDesiredSkillAssets` must exist)

## Stage 4 — Integrate into install.ts

### Tasks

1. In `applyInstallPlan` within `packages/cli/src/install.ts`, handle skill actions.
2. Write skill files to `.claude/skills/` and supporting assets to `.claude/skill-assets/`.
3. Track installed files in `manifest.skillFiles`.

### Acceptance criteria

- [ ] Skill files written to `.claude/skills/` during install
- [ ] Supporting assets written to `.claude/skill-assets/<plugin>/` during install
- [ ] Installed skill files tracked in `manifest.skillFiles`

### Dependencies

- Stage 2 (`getDesiredSkillAssets` must exist)

## Stage 5 — Update manifest.ts

### Tasks

1. Add optional `skillFiles` field to manifest type in `packages/cli/src/manifest.ts`.
2. Handle `skillFiles` in manifest read (parse if present, default to empty if absent).
3. Handle `skillFiles` in manifest write (include when present).
4. Ensure backward compatibility with existing manifests that lack `skillFiles`.

### Acceptance criteria

- [ ] Manifests with `skillFiles` parse correctly
- [ ] Manifests without `skillFiles` parse correctly (backward-compatible)
- [ ] `skillFiles` written to manifest when skill files are installed

### Dependencies

- Phase 2 (`skillFiles` type must exist in manifest types)

## Stage 6 — Build and test

### Tasks

1. Run `npm run build -w make-docs` and verify success.
2. Run existing tests and verify they pass with the new changes.

### Acceptance criteria

- [ ] Build succeeds with no errors
- [ ] All existing tests pass

### Dependencies

- Stages 1-5 (all implementation complete)
