# Phase 3: Asset Field Removal and Stale-Manifest Validation

> Derives from [Phase 3 of the plan](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md).

## Purpose

Make all install, sync, and reconfigure paths converge on always-managed prompt, template, and reference assets while removing the old asset-selection fields from active state.

## Overview

This phase owns the underlying selection and planning semantics. It follows the approved alpha cleanup policy: current selections no longer contain prompt/template/reference asset fields, legacy CLI overrides are removed, and stale or hand-edited manifests that still carry the removed fields fail with explicit guidance to fix or remove the manifest and rerun bare `make-docs`.

## Source PRD Docs

- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- Planned change doc: `docs/prd/11-revise-cli-asset-selection-simplification.md`

## Source Plan Phases

- [03-asset-normalization-and-compatibility.md](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md)

## Stage 1 - Remove Asset Selection Fields from Active State

### Tasks

1. Remove `prompts`, `templatesMode`, and `referencesMode` from `InstallSelections`.
2. Remove the fields from profile defaults and profile identity inputs.
3. Remove the fields from wizard option state and manifest-written selections.
4. Ensure new default selections satisfy the always-managed asset contract without storing invariant asset fields.
5. Ensure no active planning path can produce a reduced prompt/template/reference asset set from current selection state.

### Acceptance criteria

- [x] `InstallSelections` no longer includes `prompts`, `templatesMode`, or `referencesMode`.
- [x] New default selections satisfy the always-managed asset contract without invariant asset fields.
- [x] Profile identity no longer depends on removed asset-selection fields.
- [x] No current-state path can plan a reduced prompt/template/reference asset set.

### Dependencies

- Phase 1 requirement record.
- Phase 2 alpha removal policy for public flags.

## Stage 2 - Validate Stale Manifests Explicitly

### Tasks

1. Add tests with manifests containing `prompts: false`.
2. Add tests with manifests containing `templatesMode: "required"`.
3. Add tests with manifests containing `referencesMode: "required"`.
4. Ensure manifest loading rejects removed asset-selection fields before planning.
5. Ensure the error message tells users to fix or remove the stale manifest and rerun bare `make-docs`.
6. Do not introduce or mention a new `make-docs update` command in this wave.

### Acceptance criteria

- [x] Stale manifests fail with a clear, actionable validation error.
- [x] Old reduced asset selections cannot remove now-managed assets.
- [x] Recovery guidance tells users to fix or remove the stale manifest and rerun `make-docs`.
- [x] No new update command is introduced or referenced.

### Dependencies

- Stage 1.

## Stage 3 - Align Profile Identity

### Tasks

1. Inspect `resolveInstallProfile` and its `profileId` hash inputs.
2. Remove invariant asset fields from the profile identity hash.
3. Add profile tests proving removed fields do not exist in resolved selections.
4. Update comments or PRD text only if implementation chooses a non-obvious compatibility strategy.

### Acceptance criteria

- [x] Profile tests document that resolved selections omit removed asset fields.
- [x] The `profileId` decision is consistent with stale-manifest validation behavior.
- [x] No unrelated capability, harness, or skill profile identity behavior changes.

### Dependencies

- Stage 1.

## Stage 4 - Align Asset Rules

### Tasks

1. Update `getPromptPaths` so prompt inclusion is no longer gated by a user-facing omission choice.
2. Confirm `getTemplatePaths` includes the complete template set for effective capabilities.
3. Update `getReferencePaths` so references previously gated by `referencesMode === "all"` are included under the always-managed contract when relevant.
4. Confirm directory router helpers still reflect actual managed family presence.
5. Update renderer or consistency expectations if the full asset set changes.

### Acceptance criteria

- [x] Prompt starters for satisfied capability requirements are managed.
- [x] Templates for effective capabilities are managed.
- [x] References for effective capabilities are managed, including the harness-capability matrix when capabilities are selected.
- [x] Directory routers do not claim missing resource families.
- [x] Consistency and renderer tests reflect the new invariant asset set.

### Dependencies

- Stages 1-3.

## Stage 5 - Remove Asset Fields Coherently

### Tasks

1. Inspect uses of `prompts`, `templatesMode`, and `referencesMode` across `packages/cli/src/**` and `packages/cli/tests/**`.
2. Apply the approved cleanup path from the implementation plan.
3. Update `InstallSelections`, manifests, migrations, wizard option types, and tests in one coherent change.
4. Keep remaining references limited to stale-manifest validation, removed-flag tests, docs, and history.
5. Avoid partial removal that leaves stale public behavior.

### Acceptance criteria

- [x] Shared type state matches the approved alpha removal policy.
- [x] Current manifests remain readable and stale manifests fail with recovery guidance.
- [x] Tests cover the chosen field-removal behavior.
- [x] No stale public API suggests asset omission is supported.

### Dependencies

- Stages 1-4.
