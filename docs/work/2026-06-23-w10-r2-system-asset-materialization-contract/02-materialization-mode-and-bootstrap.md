# Phase 02: Materialization Mode and Bootstrap

## Purpose

Add typed materialization mode support while preserving the current full-snapshot default and the non-provider-backed local bootstrap.

## Overview

This phase introduces the internal model for materialization modes and local bootstrap classification. It should not implement provider-backed resolution yet; it should make the current full-snapshot behavior explicit and prepare the manifest/profile surfaces for later provenance work.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-revise-system-asset-materialization-contract.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-revise-package-and-deployment-boundaries.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Model materialization modes

### Tasks

- [x] t1: Add typed materialization mode values for `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache`.
- [x] t2: Route default install, sync, and reconfigure behavior through `full-snapshot` without changing existing file output.
- [x] t3: Reject or hide non-default modes unless the implementation has an explicit internal opt-in path guarded from public default use.

### Evidence

- `packages/cli/src/types.ts` now defines `SystemAssetMaterializationMode`, `DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE`, `SystemAssetMaterializationClass`, and `SystemAssetMaterializationPlan`.
- `packages/cli/src/planner.ts` and `packages/cli/src/install.ts` route the public install/sync/reconfigure path through `full-snapshot` unless a test/internal caller passes `systemAssetMaterializationMode`.
- `packages/cli/tests/install.test.ts` confirms default installs still materialize the existing full selected docs footprint while recording `full-snapshot` plan metadata.
- `packages/cli/tests/cli.test.ts` confirms public top-level, reconfigure, and skills help do not expose `full-snapshot`, `provider-backed`, or `hybrid-pinned-cache`.

### Acceptance criteria

- Current default installs still produce the same selected docs asset footprint.
- No public CLI path accidentally enables provider-backed or hybrid pinned-cache behavior.
- Mode values are typed and testable instead of stringly incidental flags.

### Dependencies

- Phase 01.

## Stage 2 - Preserve the local bootstrap

### Tasks

- [x] t4: Classify root and docs instruction routers, `.make-docs/manifest.json`, future local config, custom overlays, and project-owned overrides as always-local bootstrap surfaces.
- [x] t5: Ensure local bootstrap assets cannot be provider-resolved only.
- [x] t6: Add tests proving bootstrap surfaces remain materialized when non-default modes are internally selected.

### Evidence

- `packages/cli/src/catalog.ts` classifies `.make-docs/manifest.json`, `.make-docs/config.yaml`, `.make-docs/*/custom` overlay roots, and the active root/docs instruction routers as `always-local-bootstrap` for every materialization mode.
- Internally selected `provider-backed` and `hybrid-pinned-cache` plans defer non-bootstrap system assets but still materialize root/docs routers and write `.make-docs/manifest.json` during apply.
- Custom overlays and project-owned overrides remain outside `getDesiredSystemAssetPaths(...)`; they are classified as local surfaces rather than immutable product-owned system assets.
- `packages/cli/tests/install.test.ts` proves both non-default internal modes keep `AGENTS.md`, `CLAUDE.md`, `docs/AGENTS.md`, and `docs/CLAUDE.md` on disk, while deferring non-bootstrap docs assets.

### Acceptance criteria

- The repository remains inspectable without a provider, cache, network, or global runtime.
- The manifest/config/router guidance can explain how system assets are resolved and what to do when a provider is unavailable.
- Local custom overlays and project-owned overrides are not treated as immutable product-owned assets.

### Dependencies

- t1
- t2

## Stage 3 - Keep skills and plugins separate

### Tasks

- [x] t7: Confirm skills-only planning continues through the existing selected-skill path rather than the system asset mode model.
- [x] t8: Confirm plugin/shared-agentics work remains outside system asset mode selection.
- [x] t9: Add or preserve tests that default installs still write no skill files.

### Evidence

- `packages/cli/src/planner.ts` leaves `createSkillsOnlyInstallPlan(...)` on the existing selected-skill path and gives skills-only plans an empty system asset materialization plan.
- `packages/cli/src/tool-directory.ts` keeps reserved `agentics/skills` and `agentics/plugins` paths separate from system/custom tool resource tiers.
- `packages/cli/tests/install.test.ts` preserves default-install assertions that `skillFiles` is empty and `.claude/skills`, `.agents/skills`, `.claude/skill-assets`, and `.agents/skill-assets` are not created.

### Acceptance criteria

- `skillFiles` ownership remains separate from scaffold `files` ownership.
- Explicit selected-skill behavior remains opt-in.
- No system asset mode changes the skills command or plugin delivery boundary.

### Dependencies

- t4
- t5
