# Phase 01: Requirements and State Fixtures

## Purpose

Confirm the W10 R3 requirements and create the fixture matrix needed for implementation.

## Overview

This phase gates source work on a complete set of state/disposition fixtures so the classifier is not implemented only for the happy path.

## Source PRD Docs

- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-compatibility-classification-and-migration-safety.md)
- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Confirm classifier contract

### Tasks

- [x] t1: Verify PRD 18 still lists all source states and dispositions.
- [x] t2: Verify affected PRDs carry backlinks to PRD 18.
- [x] t3: Verify risk-register entries still preserve one-audit safety, no-default-skills migration, and template/package/dogfood boundaries.

### Evidence

- `docs/prd/18-compatibility-classification-and-migration-safety.md` lists the nine source states and five dispositions used by the fixture matrix: `clean-v1`, `clean-v2-full-snapshot`, `clean-v2-provider-backed`, `clean-v2-hybrid-pinned-cache`, `modified-v1`, `partial-install`, `malformed-manifest`, `missing-manifest-recognizable`, `unknown-shape`, plus `sync`, `migrate`, `migrate-with-review`, `backup-and-reinstall`, and `manual-review-required`.
- Required PRD 18 backlinks were verified in `docs/prd/02-architecture-overview.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/10-packaging-validation-and-release-reference.md`, `docs/prd/16-package-runtime-and-deployment-boundaries.md`, and `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`.
- The existing register entries still cover the relevant risk surfaces without duplicates: D-007/R-007 for dogfood and source-state drift, R-003 for template/package divergence, and PRD 18 plus the downstream skill migration PRDs for one-audit safety and no-default-skills migration.

### Acceptance criteria

- Implementation starts from PRD 18, not only from the design doc.
- No duplicate risk-register entries are created for already tracked lifecycle, skills, dogfood, package, or remote-source risks.
- Out-of-scope Rust implementation and provider defaults remain deferred.

### Dependencies

- None.

## Stage 2 - Build fixture matrix

### Tasks

- [x] t4: Add fixtures for `clean-v1`, `clean-v2-full-snapshot`, `clean-v2-provider-backed`, and `clean-v2-hybrid-pinned-cache`.
- [x] t5: Add fixtures for `modified-v1`, `partial-install`, `malformed-manifest`, `missing-manifest-recognizable`, and `unknown-shape`.
- [x] t6: Add fixture variants for provider unavailable, stale cache hashes, malformed managed blocks, canonical missing-manifest files, ambiguous missing-manifest files, and non-make-docs path collisions.

### Evidence

- Added `packages/cli/tests/compatibility-fixtures.ts` with `COMPATIBILITY_SOURCE_STATES`, `COMPATIBILITY_DEFAULT_DISPOSITIONS`, `COMPATIBILITY_FIXTURE_CASES`, `createCompatibilityFixture`, and `createCompatibilityFixtureMatrix` for reuse by classifier, migration, backup, uninstall, and lifecycle tests.
- Added `packages/cli/tests/compatibility-fixtures.test.ts` to prove every PRD 18 source state and disposition has fixture coverage, every named edge variant materializes, malformed manifest fixtures remain unloadable, missing-manifest fixtures remove `.make-docs/manifest.json`, and unknown-shape fixtures remain manifest-free.
- `npm test -w packages/cli -- compatibility-fixtures.test.ts --reporter=dot` passed on 2026-06-25 with 1 test file and 17 tests.

### Acceptance criteria

- Every PRD 18 state has at least one fixture.
- Every PRD 18 default disposition has at least one fixture.
- Fixtures are reusable by classifier, migration, backup, uninstall, and lifecycle tests.

### Dependencies

- t1
- t2
- t3

## Link-Rewrite Hardening Addendum

This addendum captures required V2 migration hardening that was identified after the original W10 R3 closeout. The existing W10 R3 fixture matrix is not sufficient acceptance for documentation tree moves during V1-to-V2 migration until these cases are added to packaged CLI/shared-core tests.

### Future Backlog Requirements

- Add fixtures for moved Markdown trees with relative links, image links, same-file and cross-file anchors, reference-style links, code spans, fenced code blocks, deleted targets, and unmapped targets.
- Add fixtures for user-authored project Markdown, modified managed Markdown, manifest-owned Markdown, canonical managed Markdown, missing-manifest recognizable Markdown, and ambiguous Markdown trees.
- Add fixtures that prove dogfooded W9 R2 and W9 R5 directory moves are evidence sources for migration tests, not proof that shipped migration behavior exists.

### Acceptance Criteria

- Fixture expected output distinguishes clean managed rewrites, reviewable rewrites, blocked rewrites, deleted-target failures, and manual-review-required ambiguity.
- Fixtures are reusable by classifier, migration disposition, package-smoke, and destination-tree validation tests.
- The fixture contract does not infer product ownership from path shape alone.
