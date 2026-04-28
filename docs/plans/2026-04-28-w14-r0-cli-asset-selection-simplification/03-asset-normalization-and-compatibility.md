# Phase 3 - Asset Normalization and Compatibility

## Objective

Make all install, sync, and reconfigure paths converge on always-managed prompts, templates, and references before asset planning or manifest persistence.

## Depends On

- Phase 1 PRD requirement
- Phase 2 interface decision for legacy CLI flags and `WizardOptionSelections`
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

### 1. Add one normalization boundary for always-managed assets

Introduce or reuse a helper that takes `InstallSelections` and returns selections with:

- `prompts = true`
- `templatesMode = "all"`
- `referencesMode = "all"`

Use this boundary before:

- resolving install profiles
- planning desired assets
- writing manifests
- rendering wizard review output
- comparing or restoring manifest selections

Avoid scattering the same assignments across unrelated modules unless there is already a local pattern that strongly favors that shape.

### 2. Preserve manifest compatibility

Existing manifests may contain:

- `prompts: false`
- `templatesMode: "required"`
- `referencesMode: "required"`

Execution should define how those manifests behave on the next sync or reconfigure. Recommended behavior:

- load old selections without crashing
- normalize them to always-managed assets before planning
- write the refreshed manifest with always-managed values after apply
- avoid treating old omitted/required-only modes as authority to remove now-included assets

### 3. Revisit profile identity

`resolveInstallProfile` currently includes `prompts`, `templatesMode`, and `referencesMode` in the `profileId` hash.

After normalization, those fields may remain in the hash as invariant values, or they may be removed if the fields are retired. The accepted outcome is that semantically equivalent legacy selections all resolve to the same effective asset-management behavior.

The implementation should add profile tests that make the intended identity behavior explicit.

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

### 5. Retire fields only if blast radius stays small

The design does not require deleting `prompts`, `templatesMode`, or `referencesMode` from all shared types immediately.

Acceptable Phase 3 outcomes:

- Conservative: keep the fields as compatibility/invariant fields and normalize them everywhere.
- Cleanup: remove the fields from user-facing option types and, only if safe, from shared install types and manifests with explicit migration.

Do not mix partial removal with hidden behavior changes. If the fields remain, their values must be invariant after normalization.

## Parallelism

This phase should be one write scope because profile resolution, asset rules, and manifest compatibility are tightly coupled. It can run in parallel with Phase 2 only if shared type changes are coordinated before either worker edits `wizard.ts` or `cli.ts`.

## Acceptance Criteria

- Legacy selections with omitted prompts or required-only asset modes no longer produce reduced asset plans.
- Default selections and legacy reduced asset selections normalize to the always-managed asset contract.
- Reconfigure and bare sync use the same normalization behavior.
- Profile tests document the intended `profileId` behavior.
- Install tests prove prompts, templates, and references are still created/updated after the selection surface is simplified.
