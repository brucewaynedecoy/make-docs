# Phase 01: Requirements and State Fixtures

## Purpose

Confirm the W10 R3 requirements and create the fixture matrix needed for implementation.

## Overview

This phase gates source work on a complete set of state/disposition fixtures so the classifier is not implemented only for the happy path.

## Source PRD Docs

- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-revise-compatibility-audit-and-migration-disposition.md)
- [17 Revise System Asset Materialization Contract](../../prd/17-revise-system-asset-materialization-contract.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-revise-package-and-deployment-boundaries.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Confirm classifier contract

### Tasks

- [ ] t1: Verify PRD 18 still lists all source states and dispositions.
- [ ] t2: Verify affected PRDs carry backlinks to PRD 18.
- [ ] t3: Verify risk-register entries still preserve one-audit safety, no-default-skills migration, and template/package/dogfood boundaries.

### Acceptance criteria

- Implementation starts from PRD 18, not only from the design doc.
- No duplicate risk-register entries are created for already tracked lifecycle, skills, dogfood, package, or remote-source risks.
- Out-of-scope Rust implementation and provider defaults remain deferred.

### Dependencies

- None.

## Stage 2 - Build fixture matrix

### Tasks

- [ ] t4: Add fixtures for `clean-v1`, `clean-v2-full-snapshot`, `clean-v2-provider-backed`, and `clean-v2-hybrid-pinned-cache`.
- [ ] t5: Add fixtures for `modified-v1`, `partial-install`, `malformed-manifest`, `missing-manifest-recognizable`, and `unknown-shape`.
- [ ] t6: Add fixture variants for provider unavailable, stale cache hashes, malformed managed blocks, canonical missing-manifest files, ambiguous missing-manifest files, and non-make-docs path collisions.

### Acceptance criteria

- Every PRD 18 state has at least one fixture.
- Every PRD 18 default disposition has at least one fixture.
- Fixtures are reusable by classifier, migration, backup, uninstall, and lifecycle tests.

### Dependencies

- t1
- t2
- t3
