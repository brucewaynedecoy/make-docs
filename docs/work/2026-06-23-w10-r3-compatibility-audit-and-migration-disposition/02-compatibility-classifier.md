# Phase 02: Compatibility Classifier

## Purpose

Implement the source-state classifier and conservative fallback recognition before any mutation path writes managed files.

## Overview

The classifier should be callable by install, reconfigure, migration, backup, uninstall, and future Rust-compatible paths. It should produce one source state plus evidence explaining the classification.

## Source PRD Docs

- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-revise-compatibility-audit-and-migration-disposition.md)
- [17 Revise System Asset Materialization Contract](../../prd/17-revise-system-asset-materialization-contract.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Classify manifest-present states

### Tasks

- [ ] t1: Validate manifest parseability, schema, package identity, selections, managed file records, skill records, and materialization provenance.
- [ ] t2: Compare managed-file hashes, managed-block state, selected-skill outputs, and required local bootstrap files against the filesystem.
- [ ] t3: Classify clean and modified v1/v2 states with evidence records.

### Acceptance criteria

- Valid clean states map to `sync` or `migrate` as PRD 18 specifies.
- Modified states do not become clean states because a manifest exists.
- Provider/cache states require trusted provenance and reachable provider/cache evidence.

### Dependencies

- Phase 01.

## Stage 2 - Classify manifest-missing and malformed states

### Tasks

- [ ] t4: Add conservative fallback recognition for known make-docs-managed paths and canonical content.
- [ ] t5: Classify malformed manifests separately from missing manifests.
- [ ] t6: Stop before mutation when fallback recognition is ambiguous.

### Acceptance criteria

- Unknown shapes produce `manual-review-required`.
- Missing-manifest recognizable shapes do not gain ownership unless every mutation is reviewable.
- Malformed manifest states do not silently become clean installs.

### Dependencies

- t1
- t2

## Stage 3 - Expose classifier evidence

### Tasks

- [ ] t7: Return structured evidence for manifest trust, filesystem trust, bootstrap trust, skill trust, and provider/cache trust.
- [ ] t8: Make classifier evidence printable in future migration UX without exposing internal-only noise.
- [ ] t9: Add focused tests for source-state evidence.

### Acceptance criteria

- Migration review can explain why a state was classified.
- Tests assert both state and evidence for representative fixtures.
- Evidence does not rely on implementation intent that cannot be inspected from disk.

### Dependencies

- t4
- t5
- t6
