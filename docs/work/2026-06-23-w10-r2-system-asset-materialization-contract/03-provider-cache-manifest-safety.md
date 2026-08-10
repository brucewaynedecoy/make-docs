# Phase 03: Provider Cache Manifest Safety

## Purpose

Extend manifest provenance and provider/cache safety requirements without making provider-backed behavior the default.

## Overview

This phase prepares the manifest and safety model for provider-backed and hybrid pinned-cache behavior. It should prioritize compatibility and audit safety over broad provider feature work.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Design manifest provenance migration

### Tasks

- [x] t1: Extend manifest planning with fields for materialization mode, source package or provider, source version or immutable ref, hash algorithm, expected hash set, logical asset id, local path when materialized, materialization class, offline expectation, recovery guidance, and selection trigger.
- [x] t2: Define schema migration behavior from current schema version 1 manifests.
- [x] t3: Add stale-manifest tests that preserve safe behavior when provenance fields are absent.

### Evidence

- `packages/cli/src/types.ts`, `packages/cli/src/manifest.ts`, and `packages/cli/src/system-assets.ts` add schema 2 `systemAssetMaterialization` provenance with source package/provider/version/ref, `sha256` hash metadata, logical asset ids, local materialized paths, materialization classes, offline expectations, recovery guidance, and selection triggers.
- `packages/cli/src/planner.ts` derives expected system asset hashes from the full-snapshot package assets, attaches file-backed provenance to manifest `files` entries, and keeps `skillFiles` ownership separate from docs-file ownership.
- `packages/cli/src/install.ts` preserves existing system asset provenance during skills-only manifest writes instead of replacing it with the empty skills-only plan.
- `packages/cli/tests/install.test.ts` verifies schema 1 manifests without system asset provenance migrate to schema 2 with an empty compatibility state and recovery guidance.

### Acceptance criteria

- Existing manifests continue to load or fail with actionable recovery guidance.
- New provenance fields can be omitted only where backward compatibility explicitly allows it.
- Manifest updates do not collapse docs-file and skill-file ownership into one map.

### Dependencies

- Phase 02.

## Stage 2 - Add provider/cache safety checks

### Tasks

- [x] t4: Add internal checks for provider identity, provider version or immutable ref, hash algorithm, and expected hash set.
- [x] t5: Add cache-miss and stale-hash handling that rehydrates from an approved provider or falls back to a reviewed materialization path.
- [x] t6: Ensure the CLI never silently accepts a different asset version.

### Evidence

- `packages/cli/src/system-assets.ts` adds `resolveSystemAssetMaterializationSafety(...)` to require provider identity, provider version or immutable ref, `sha256`, and a non-empty expected hash set before provider/cache materialization can be approved.
- Provider/cache outage handling fails closed by default and only returns a `reviewed-full-snapshot-fallback` result when a reviewed fallback path is explicitly allowed.
- Stale provider/cache hashes throw an actionable "different asset version" error instead of accepting unpinned or mismatched content.
- `packages/cli/tests/system-assets.test.ts` covers provider pin validation, provider/cache outage fallback, fail-closed outage behavior, and stale-hash rejection.

### Acceptance criteria

- Cache state is treated as pinned state, not source of truth.
- Provider-backed writes fail closed or fall back to reviewed full-snapshot behavior when pins do not match.
- Error and recovery language is usable without reading implementation code.

### Dependencies

- t1
- t2

## Stage 3 - Preserve conflict and lifecycle safety

### Tasks

- [x] t7: Route on-demand materialization through the same managed-file review and conflict path as ordinary install.
- [x] t8: Verify backup and uninstall still operate from one reviewed audit snapshot and do not depend on provider availability to infer removability.
- [x] t9: Add provider-outage and on-demand-conflict tests.

### Evidence

- `packages/cli/tests/install.test.ts` proves a provider-backed refresh of an edited local bootstrap instruction block produces the same `skip-conflict` review item and cannot be applied with unresolved conflicts.
- `packages/cli/tests/audit.test.ts` proves deferred provider-backed system assets are not inferred as removable when no local file exists; backup and uninstall continue to inherit that conservative behavior from the shared manifest-present audit snapshot.
- `packages/cli/tests/system-assets.test.ts` covers provider outage handling, while the provider-backed refresh conflict test covers the on-demand conflict safety class.

### Acceptance criteria

- Provider refresh cannot overwrite local edits invisibly.
- Backup and uninstall remain conservative when provider or cache state is missing.
- On-demand writes produce the same reviewable safety class as selected managed-file writes.

### Dependencies

- t4
- t5
