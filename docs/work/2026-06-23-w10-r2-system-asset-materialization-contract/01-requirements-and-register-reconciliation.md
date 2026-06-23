# Phase 01: Requirements and Register Reconciliation

## Purpose

Confirm the active PRD requirements and risk-register scope for W10 R2 before source implementation begins.

## Overview

This phase is a guard phase. It ensures implementation starts from PRD 17, the affected baseline annotations, and the existing D/Q/R items rather than reinterpreting the design in isolation.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-revise-system-asset-materialization-contract.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-revise-package-and-deployment-boundaries.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Stage 1 - Confirm active requirement state

### Tasks

- [ ] t1: Verify PRD 17 still lists `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache` as the only accepted system asset materialization modes.
- [ ] t2: Verify baseline PRD docs still carry backlinks to PRD 17 in the sections affected by W10 R2.
- [ ] t3: Verify risk-register entries for skills delivery, remote source trust, package/template validation, dogfood freshness, lifecycle safety, and no-scripts transition still match the implementation scope.

### Acceptance criteria

- PRD 17 is the source of truth for W10 R2 implementation.
- No duplicate D/Q/R item is added for an already tracked risk.
- Implementation notes distinguish system assets from selected skills, plugins, mutable authored docs, custom overlays, and local config.

### Dependencies

- None.

## Stage 2 - Freeze implementation scope

### Tasks

- [ ] t4: Record that provider-backed mode is not allowed to become the default in this backlog.
- [ ] t5: Record that remote system asset providers remain deferred until trust, pinning, caching, and confirmation policy are resolved.
- [ ] t6: Identify source files and tests that must change in phases 02 through 04.

### Acceptance criteria

- Phase 02 starts with an explicit source-file list.
- Out-of-scope provider defaults, remote source policy, skill/plugin delivery rewrites, and Rust implementation are named before coding starts.

### Dependencies

- t1
- t2
- t3
