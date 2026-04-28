# Phase 2 - Registry and Selection Model

## Objective

Remove the structural required-versus-optional skill model from the registry, install selections, catalog resolution, profile identity, and manifest migration.

## Depends On

- Phase 1 requirement record
- Originating design section `Remove required/optional metadata from the registry contract`
- Current code in `packages/cli/src/skill-registry.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/types.ts`, `packages/cli/src/profile.ts`, and `packages/cli/src/manifest.ts`

## Files To Modify

Expected write scope:

- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- related fixture or helper files as required by tests

## Detailed Changes

### 1. Remove `required` from registry entries

Delete `required` from the packaged registry entries and schema.

Runtime validation should stop reading `entry.required` and should stop classifying entries as required or optional. Keep validation for:

- `name`
- `source`
- `entryPoint`
- `installName`
- `description`
- `assets`

Remove or replace helper APIs whose only purpose is required/optional grouping, including `getRequiredSkills()` and `getOptionalSkills()`.

### 2. Replace grouped choices with recommended choices

Replace `GroupedSkillChoices` fields like `defaultSkills` and `optionalSkills` with a single recommended skill collection.

Recommended shape:

```ts
interface SkillChoices {
  skills: WizardSkillChoice[];
}
```

The exact type name can vary, but downstream code should no longer infer category, defaultness, or immutability from registry metadata.

### 3. Replace `optionalSkills` with selected-skill state

Introduce a selection field that can represent any subset of the recommended skill set.

Recommended shape:

```ts
selectedSkills: string[];
```

Fresh defaults should include all known registry skill names when `skills` is enabled. Skill-disabled selections should continue to install no skills.

Profile identity should hash the sorted selected-skill set so sync/reconfigure behavior remains deterministic.

### 4. Update desired skill asset resolution

`getDesiredSkillAssets()` should install registry entries whose names are in the selected-skill set when `selections.skills` is true.

It should not install anything merely because a registry entry used to be required. It should not need a category-specific code path.

### 5. Migrate legacy manifests

Manifest migration must preserve the effective prior install intent:

- `skills: false` remains no skill installation.
- Legacy manifests with `skills: true` and `optionalSkills` migrate to selected skills equal to the formerly required registry entries plus the listed optional entries.
- Legacy manifests without explicit optional-skill state use the same compatibility inference currently provided by `migrateOptionalSkills()` where older `skillFiles` reveal installed optional skills.

Once migrated, the manifest should persist the new selected-skill field. Keep `skillFiles` as output ownership tracking; do not merge it into `files`.

## Parallelism

This phase should be owned by one worker because registry validation, profile identity, selected state, and manifest migration must converge on one field name and one compatibility rule.

The UX worker can inspect the current wizard and skills UI in parallel, but should wait for the selected-skill type before editing state application code.

## Acceptance Criteria

- Registry JSON and schema no longer include `required`.
- TypeScript registry entries no longer include `required`.
- Required/optional grouping helpers are removed or replaced with a single recommended-skill helper.
- `InstallSelections` can represent any subset of registry skills.
- Default selections include all registry skills when skills are enabled.
- Legacy manifest migration preserves the prior effective installed skill set.
- Skill asset planning uses selected skills only.
