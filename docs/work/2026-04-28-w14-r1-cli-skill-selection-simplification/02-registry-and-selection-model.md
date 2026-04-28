# Phase 2: Registry and Selection Model

> Derives from [Phase 2 of the plan](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/02-registry-and-selection-model.md).

## Purpose

Replace the structural required-versus-optional skill model with a selected-skill model that can represent any subset of the recommended registry skills.

## Overview

This phase removes `required` metadata from the packaged registry and schema, replaces grouped skill choices with one recommended skill collection, updates desired skill asset resolution, and migrates persisted selections away from `optionalSkills`. It must preserve `skillFiles` as managed-output ownership tracking.

## Source PRD Docs

- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- Planned change doc: `docs/prd/12-revise-cli-skill-selection-simplification.md`

## Source Plan Phases

- [02-registry-and-selection-model.md](../../plans/2026-04-28-w14-r1-cli-skill-selection-simplification/02-registry-and-selection-model.md)

## Stage 1 - Remove Required Metadata From Registry Contract

### Tasks

1. Remove `required` from every entry in `packages/cli/skill-registry.json`.
2. Remove `required` from required properties and property definitions in `packages/cli/skill-registry.schema.json`.
3. Remove `required` from `SkillRegistryEntry` in `packages/cli/src/skill-registry.ts`.
4. Update registry validation so it does not read, normalize, or default `entry.required`.
5. Remove or replace `getRequiredSkills()` and `getOptionalSkills()` with a single registry-skill retrieval helper.
6. Preserve validation for `name`, `source`, `entryPoint`, `installName`, `description`, and `assets`.

### Acceptance criteria

- [ ] Packaged registry entries contain no `required` field.
- [ ] Packaged registry schema does not require or define `required`.
- [ ] TypeScript registry entries contain no `required` field.
- [ ] Registry validation still skips malformed entries for missing required install metadata.
- [ ] No production code imports required/optional grouping helpers.

### Dependencies

- Phase 1 requirement record.

## Stage 2 - Replace Grouped Choices With Recommended Skills

### Tasks

1. Replace `GroupedSkillChoices` fields such as `defaultSkills` and `optionalSkills` with a single skill collection.
2. Preserve `WizardSkillChoice` or an equivalent name/description view model for UI consumers.
3. Update `getGroupedSkillChoices()` or replace it with a helper whose name reflects the new model, such as `getSkillChoices()`.
4. Sort skill choices deterministically by skill name.
5. Remove category, defaultness, and immutability assumptions from catalog-facing types.

### Acceptance criteria

- [ ] The catalog exposes one recommended skill collection.
- [ ] No catalog type names imply `default` or `optional` categories.
- [ ] Skill choice ordering remains deterministic.
- [ ] UI callers can still access skill name and description for rendering.

### Dependencies

- Stage 1.

## Stage 3 - Replace `optionalSkills` With Selected Skills

### Tasks

1. Introduce a selection field that can represent any subset of registry skills, likely `selectedSkills: string[]`.
2. Update `InstallSelections` and related state helpers to use the selected-skill field.
3. Update default selection creation so fresh installs include every registry skill when `skills` is enabled.
4. Keep skill-disabled selections installing no skills.
5. Update `profileId` generation to hash the sorted selected-skill set.
6. Update any selection cloning, normalization, or review helper that currently sorts or formats `optionalSkills`.

### Acceptance criteria

- [ ] `InstallSelections` can represent any subset of registry skills.
- [ ] Fresh defaults include all registry skill names when skills are enabled.
- [ ] Skill-disabled selections produce no desired skill assets.
- [ ] Profile identity changes when selected skills change.
- [ ] No active selection helper depends on an implicit required skill set.

### Dependencies

- Stage 2.

## Stage 4 - Update Desired Skill Asset Resolution

### Tasks

1. Update `getDesiredSkillAssets()` to filter registry entries by selected skill name when `selections.skills` is true.
2. Remove the `entry.required || selectedOptionalSkills.has(entry.name)` selection rule.
3. Preserve project/global scope behavior for skill install roots.
4. Preserve harness fanout for Claude Code and Codex.
5. Preserve `ResolvedAsset` source id generation for entrypoints and supporting assets unless a test exposes a required source-id migration.

### Acceptance criteria

- [ ] Selected skills are the only skills expanded into desired assets.
- [ ] Deselecting a formerly required skill removes its desired assets.
- [ ] Project and global scope paths remain correct.
- [ ] Harness-specific install paths remain correct.
- [ ] Existing `skillFiles` ownership semantics are not collapsed into `manifest.files`.

### Dependencies

- Stage 3.

## Stage 5 - Migrate Legacy Manifests

### Tasks

1. Preserve `skills: false` as no skill installation.
2. For legacy manifests with `skills: true` and `optionalSkills`, migrate to selected skills equal to the formerly required entries plus listed optional entries.
3. Preserve existing fallback inference from `skillFiles` where old manifests reveal installed optional skill roots.
4. Persist the new selected-skill field in migrated selections.
5. Remove `optionalSkills` from new manifest writes once migration is complete.
6. Keep backward compatibility behavior covered in tests before deleting old helper code.

### Acceptance criteria

- [ ] Legacy manifests with `optionalSkills` migrate to the prior effective selected-skill set.
- [ ] Legacy manifests with `skills: false` remain skill-disabled.
- [ ] Legacy manifests with older skill-file layouts still migrate predictably.
- [ ] New manifests persist the selected-skill field.
- [ ] `skillFiles` remains the output ownership list for managed skill paths.

### Dependencies

- Stages 1-4.
