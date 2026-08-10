# Phase 01: Requirements and Register Reconciliation

## Purpose

Confirm the active PRD requirements and risk-register scope for W10 R2 before source implementation begins.

## Overview

This phase is a guard phase. It ensures implementation starts from PRD 17, the affected baseline annotations, and the existing D/Q/R items rather than reinterpreting the design in isolation.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Stage 1 - Confirm active requirement state

### Tasks

- [x] t1: Verify PRD 17 still lists `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache` as the only accepted system asset materialization modes.
- [x] t2: Verify baseline PRD docs still carry backlinks to PRD 17 in the sections affected by W10 R2.
- [x] t3: Verify risk-register entries for skills delivery, remote source trust, package/template validation, dogfood freshness, lifecycle safety, and no-scripts transition still match the implementation scope.

### Evidence

- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md) remains the source of truth and still defines exactly three materialization modes: `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache`.
- Required baseline backlinks were verified in `docs/prd/02-architecture-overview.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/10-packaging-validation-and-release-reference.md`, and `docs/prd/16-package-runtime-and-deployment-boundaries.md`.
- Existing risk-register items cover the implementation scope: D-005/Q-001 for long-term skills delivery, Q-007 for remote source trust, R-003/R-004 for package/template and path-surface validation, Q-005/R-007/D-014 for dogfood freshness, R-006 for lifecycle safety, and R-014 for the no-scripts transition. No duplicate D/Q/R item was needed.
- Implementation scope distinguishes immutable system assets from selected skills, plugins, mutable authored docs, custom overlays, local config, runtime state, conformance-lab artifacts, and user-owned project content.

### Acceptance criteria

- PRD 17 is the source of truth for W10 R2 implementation.
- No duplicate D/Q/R item is added for an already tracked risk.
- Implementation notes distinguish system assets from selected skills, plugins, mutable authored docs, custom overlays, and local config.

### Dependencies

- None.

## Stage 2 - Freeze implementation scope

### Tasks

- [x] t4: Record that provider-backed mode is not allowed to become the default in this backlog.
- [x] t5: Record that remote system asset providers remain deferred until trust, pinning, caching, and confirmation policy are resolved.
- [x] t6: Identify source files and tests that must change in phases 02 through 04.

### Scope Notes

- `full-snapshot` remains the public/default mode for W10 R2. `provider-backed` and `hybrid-pinned-cache` may be modeled and internally testable, but they must not become the default install, sync, or reconfigure path in this backlog.
- Remote providers remain deferred until Q-007 resolves protocol, pinning, caching, trust, and confirmation policy.
- W10 R2 does not rewrite skills/plugin delivery, does not implement the Rust provider, and does not promote provider-backed behavior into public default UX.

### Source and Test Map

- Phase 02 should touch the materialization model and bootstrap path through `packages/cli/src/types.ts`, `packages/cli/src/profile.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, and focused tests in `packages/cli/tests/install.test.ts`, `packages/cli/tests/consistency.test.ts`, and `packages/cli/tests/cli.test.ts`.
- Phase 03 should touch manifest provenance and provider/cache guardrails through `packages/cli/src/types.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, and focused tests for manifest compatibility, cache/provider safety, conflict routing, backup, and uninstall behavior.
- Phase 04 should aggregate validation through the package test suite, default validation, build, smoke-pack, provider/cache focused tests, docs hygiene, PRD/risk reconciliation, and final UAT/manual-test coverage after the wave work is complete.

### Acceptance criteria

- Phase 02 starts with an explicit source-file list.
- Out-of-scope provider defaults, remote source policy, skill/plugin delivery rewrites, and Rust implementation are named before coding starts.

### Dependencies

- t1
- t2
- t3
