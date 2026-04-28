# Phase 3: Asset Normalization and Compatibility

> Derives from [Phase 3 of the plan](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md).

## Purpose

Make all install, sync, and reconfigure paths converge on always-managed prompt, template, and reference assets.

## Overview

This phase owns the underlying selection and planning semantics. It should ensure legacy manifests, CLI overrides, wizard output, profile resolution, and asset rules all produce the same effective behavior: included prompts, templates, and references are managed automatically and cannot be omitted through stale selection state.

## Source PRD Docs

- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- Planned change doc: `docs/prd/11-revise-cli-asset-selection-simplification.md`

## Source Plan Phases

- [03-asset-normalization-and-compatibility.md](../../plans/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md)

## Stage 1 - Introduce an Asset Selection Normalization Boundary

### Tasks

1. Add or reuse a helper that normalizes `InstallSelections` to `prompts: true`, `templatesMode: "all"`, and `referencesMode: "all"` if those fields remain.
2. Apply the helper before resolving install profiles.
3. Apply the helper before planning desired assets.
4. Apply the helper before manifest writes.
5. Apply the helper before wizard review rendering if review still receives raw selections.

### Acceptance criteria

- [ ] Legacy reduced asset selections normalize to always-managed values.
- [ ] New default selections already satisfy the always-managed asset contract.
- [ ] Normalization has one clear ownership boundary or a small documented set of call sites.
- [ ] No path can plan a reduced prompt/template/reference asset set from stale user state.

### Dependencies

- Phase 1 requirement record.
- Phase 2 compatibility policy for public flags.

## Stage 2 - Preserve Existing Manifest Compatibility

### Tasks

1. Add tests with manifests containing `prompts: false`.
2. Add tests with manifests containing `templatesMode: "required"`.
3. Add tests with manifests containing `referencesMode: "required"`.
4. Ensure sync and reconfigure normalize these manifests before planning.
5. Ensure refreshed manifests record the chosen always-managed representation after apply.

### Acceptance criteria

- [ ] Old manifests load without crashing.
- [ ] Old reduced asset selections do not remove now-managed assets.
- [ ] Applying after old manifest sync writes normalized asset selections.
- [ ] Reconfigure from an old manifest behaves the same as sync after normalization.

### Dependencies

- Stage 1.

## Stage 3 - Align Profile Identity

### Tasks

1. Inspect `resolveInstallProfile` and its `profileId` hash inputs.
2. Decide whether invariant asset fields remain in the hash or are removed from the profile identity.
3. Add profile tests for semantically equivalent legacy asset selections.
4. Update comments or PRD text only if implementation chooses a non-obvious compatibility strategy.

### Acceptance criteria

- [ ] Profile tests document whether legacy reduced asset selections collapse to the same `profileId` as always-managed selections.
- [ ] The `profileId` decision is consistent with manifest compatibility behavior.
- [ ] No unrelated capability, harness, or skill profile identity behavior changes.

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

- [ ] Prompt starters for satisfied capability requirements are managed.
- [ ] Templates for effective capabilities are managed.
- [ ] References for effective capabilities are managed, including the harness-capability matrix when capabilities are selected.
- [ ] Directory routers do not claim missing resource families.
- [ ] Consistency and renderer tests reflect the new invariant asset set.

### Dependencies

- Stages 1-3.

## Stage 5 - Decide Whether to Retain or Remove Asset Fields

### Tasks

1. Inspect uses of `prompts`, `templatesMode`, and `referencesMode` across `packages/cli/src/**` and `packages/cli/tests/**`.
2. Choose the conservative or cleanup path described in the plan.
3. If retaining fields, document them as invariant compatibility fields through tests and change-doc wording.
4. If removing fields, update `InstallSelections`, manifests, migrations, wizard option types, and tests in one coherent change.
5. Avoid partial removal that leaves stale public behavior.

### Acceptance criteria

- [ ] Shared type state matches the chosen compatibility policy.
- [ ] Manifests remain readable.
- [ ] Tests cover the chosen field-retention or field-removal behavior.
- [ ] No stale public API suggests asset omission is supported.

### Dependencies

- Stages 1-4.
