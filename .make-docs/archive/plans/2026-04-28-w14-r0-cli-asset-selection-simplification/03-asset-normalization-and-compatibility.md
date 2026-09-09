# Phase 3 - Asset Field Removal and Stale-Manifest Validation

## Objective

Make all install, sync, and reconfigure paths converge on always-managed prompts, templates, and references while removing the old prompt/template/reference asset-selection fields from active state.

## Depends On

- Phase 1 PRD requirement
- Phase 2 alpha removal decision for legacy CLI flags and `WizardOptionSelections`
- Current `InstallSelections`, `resolveInstallProfile`, and asset rule behavior

## Files To Modify

Expected:

- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/tests/profile.test.ts`
- `packages/cli/tests/install.test.ts`

Possible after discovery:

- `packages/cli/src/types.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/renderers.test.ts`

## Detailed Changes

### 1. Remove asset-selection fields from active state

Remove these fields from the current selection contract:

- `prompts`
- `templatesMode`
- `referencesMode`

Update the active state surfaces together:

- `InstallSelections`
- profile defaults and `profileId` inputs
- wizard option state
- manifest-written selections
- tests and fixtures

The always-managed behavior should be encoded in asset rules, not in invariant user selection fields.

### 2. Validate stale manifests explicitly

Existing manifests may contain:

- `prompts: false`
- `templatesMode: "required"`
- `referencesMode: "required"`

Because this wave is an alpha cleanup, these manifests should not be normalized silently. The accepted behavior is:

- fail manifest validation before planning
- name the removed fields
- tell users to fix or remove the stale manifest
- tell users to rerun bare `make-docs` to rebuild the manifest
- avoid introducing or mentioning a new `make-docs update` command

### 3. Revisit profile identity

`resolveInstallProfile` currently includes `prompts`, `templatesMode`, and `referencesMode` in the `profileId` hash.

After field removal, these fields should be removed from profile identity inputs. Current selections that differ only by the removed legacy fields should not exist; stale persisted selections are rejected at manifest load instead.

The implementation should add profile tests that make the reduced active selection shape explicit.

### 4. Make asset rules match the always-managed contract

Review:

- `getPromptPaths`
- `getTemplatePaths`
- `getReferencePaths`
- `getPromptsDirInstalled`
- `getTemplateDirInstalled`
- `getReferenceDirInstalled`

Expected behavior:

- prompts are no longer gated by a user-facing `prompts` omission choice
- templates include the complete template set for effective capabilities
- references include the complete reference set for effective capabilities, including assets previously gated behind `referencesMode === "all"` when capabilities are selected
- directory routers remain installed only when the corresponding managed family has files

### 5. Remove fields coherently

The approved alpha policy requires deleting `prompts`, `templatesMode`, and `referencesMode` from active shared types and current manifests in this wave.

Required Phase 3 outcome:

- remove the fields from user-facing option types
- remove the fields from shared install types
- remove the fields from current manifest writes
- keep remaining references limited to stale-manifest validation, removed-flag tests, PRD/history text, or archived planning context

Do not mix partial removal with hidden behavior changes.

## Parallelism

This phase should be one write scope because profile resolution, asset rules, and manifest validation are tightly coupled. It can run in parallel with Phase 2 only if shared type changes are coordinated before either worker edits `wizard.ts` or `cli.ts`.

## Acceptance Criteria

- Legacy selections with omitted prompts or required-only asset modes fail with stale-manifest guidance before planning.
- Default selections satisfy the always-managed asset contract without storing invariant asset fields.
- Reconfigure and bare sync use the same stale-manifest validation behavior.
- Profile tests document the reduced `profileId` input behavior.
- Install tests prove prompts, templates, and references are still created/updated after the selection surface is simplified.
