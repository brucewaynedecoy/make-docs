# Phase 03: Provider Cache Manifest Safety

## Purpose

Extend manifest provenance and provider/cache safety requirements without making provider-backed behavior the default.

## Overview

This phase prepares the manifest and safety model for provider-backed and hybrid pinned-cache behavior. It should prioritize compatibility and audit safety over broad provider feature work.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-revise-system-asset-materialization-contract.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Design manifest provenance migration

### Tasks

- [ ] t1: Extend manifest planning with fields for materialization mode, source package or provider, source version or immutable ref, hash algorithm, expected hash set, logical asset id, local path when materialized, materialization class, offline expectation, recovery guidance, and selection trigger.
- [ ] t2: Define schema migration behavior from current schema version 1 manifests.
- [ ] t3: Add stale-manifest tests that preserve safe behavior when provenance fields are absent.

### Acceptance criteria

- Existing manifests continue to load or fail with actionable recovery guidance.
- New provenance fields can be omitted only where backward compatibility explicitly allows it.
- Manifest updates do not collapse docs-file and skill-file ownership into one map.

### Dependencies

- Phase 02.

## Stage 2 - Add provider/cache safety checks

### Tasks

- [ ] t4: Add internal checks for provider identity, provider version or immutable ref, hash algorithm, and expected hash set.
- [ ] t5: Add cache-miss and stale-hash handling that rehydrates from an approved provider or falls back to a reviewed materialization path.
- [ ] t6: Ensure the CLI never silently accepts a different asset version.

### Acceptance criteria

- Cache state is treated as pinned state, not source of truth.
- Provider-backed writes fail closed or fall back to reviewed full-snapshot behavior when pins do not match.
- Error and recovery language is usable without reading implementation code.

### Dependencies

- t1
- t2

## Stage 3 - Preserve conflict and lifecycle safety

### Tasks

- [ ] t7: Route on-demand materialization through the same managed-file review and conflict path as ordinary install.
- [ ] t8: Verify backup and uninstall still operate from one reviewed audit snapshot and do not depend on provider availability to infer removability.
- [ ] t9: Add provider-outage and on-demand-conflict tests.

### Acceptance criteria

- Provider refresh cannot overwrite local edits invisibly.
- Backup and uninstall remain conservative when provider or cache state is missing.
- On-demand writes produce the same reviewable safety class as selected managed-file writes.

### Dependencies

- t4
- t5
