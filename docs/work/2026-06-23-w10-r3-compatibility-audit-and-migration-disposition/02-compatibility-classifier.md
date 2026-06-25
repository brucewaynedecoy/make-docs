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

- [x] t1: Validate manifest parseability, schema, package identity, selections, managed file records, skill records, and materialization provenance.
- [x] t2: Compare managed-file hashes, managed-block state, selected-skill outputs, and required local bootstrap files against the filesystem.
- [x] t3: Classify clean and modified v1/v2 states with evidence records.

### Acceptance criteria

- Valid clean states map to `sync` or `migrate` as PRD 18 specifies.
- Modified states do not become clean states because a manifest exists.
- Provider/cache states require trusted provenance and reachable provider/cache evidence.

### Dependencies

- Phase 01.

## Stage 2 - Classify manifest-missing and malformed states

### Tasks

- [x] t4: Add conservative fallback recognition for known make-docs-managed paths and canonical content.
- [x] t5: Classify malformed manifests separately from missing manifests.
- [x] t6: Stop before mutation when fallback recognition is ambiguous.

### Acceptance criteria

- Unknown shapes produce `manual-review-required`.
- Missing-manifest recognizable shapes do not gain ownership unless every mutation is reviewable.
- Malformed manifest states do not silently become clean installs.

### Dependencies

- t1
- t2

## Stage 3 - Expose classifier evidence

### Tasks

- [x] t7: Return structured evidence for manifest trust, filesystem trust, bootstrap trust, skill trust, and provider/cache trust.
- [x] t8: Make classifier evidence printable in future migration UX without exposing internal-only noise.
- [x] t9: Add focused tests for source-state evidence.

### Acceptance criteria

- Migration review can explain why a state was classified.
- Tests assert both state and evidence for representative fixtures.
- Evidence does not rely on implementation intent that cannot be inspected from disk.

### Dependencies

- t4
- t5
- t6

## Implementation Notes

Phase 2 adds `packages/cli/src/compatibility.ts` as the reusable source-state classifier. The classifier reads `.make-docs/manifest.json` when present, validates loadable manifest shape through the existing manifest parser, compares manifest-managed files and managed instruction blocks to disk, verifies selected skill outputs, checks local bootstrap presence while treating optional project-owned bootstrap scaffolds as non-blocking, and evaluates system asset provider/cache provenance before allowing clean v2 classifications.

| Surface | Implementation |
| --- | --- |
| Manifest-present states | `classifyCompatibilityState` distinguishes `clean-v1`, `clean-v2-full-snapshot`, `clean-v2-provider-backed`, `clean-v2-hybrid-pinned-cache`, `modified-v1`, and `partial-install` from manifest and filesystem evidence. Modified managed files, malformed managed blocks, missing managed files, missing selected skill outputs, unavailable providers, and stale pinned cache hashes keep the source out of clean states. |
| Manifest-missing and malformed states | Missing manifests use conservative fallback recognition for known make-docs paths and path-specific canonical fingerprints. Ambiguous canonical paths route to `backup-and-reinstall`; unknown shapes route to `manual-review-required`; malformed manifests remain distinct from missing manifests. |
| Evidence model | The classifier returns structured manifest, filesystem, bootstrap, skill, and provider/cache trust evidence plus printable evidence lines for future migration UX. The evidence is derived from disk and manifest contents rather than fixture intent. |
| Shared types and fixtures | `packages/cli/src/types.ts` exports the accepted compatibility state/disposition unions, and `packages/cli/tests/compatibility-fixtures.ts` continues to provide the fixture matrix consumed by classifier tests. |
| Validation | `packages/cli/tests/compatibility.test.ts` validates every Phase 1 fixture case against state, disposition, evidence, provider/cache trust, malformed-manifest handling, ambiguous fallback handling, and non-product path collision evidence. |

Guide coverage: no developer or user guide change was needed because Phase 2 introduces an internal classifier and test contract, not a new maintainer-operated or user-facing workflow. PRD coverage: no new PRD change doc was needed because Phase 2 implements PRD 18; `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` was updated with classifier source anchors. Risk-register status is unchanged.

UAT/manual testing remains deferred until full W10 R3 wave closeout. Phase validation so far: `npm test -w packages/cli -- compatibility-fixtures.test.ts compatibility.test.ts --reporter=dot` and `npm run build -w packages/cli`.

## Link-Rewrite Hardening Addendum

Future migration work that moves documentation trees must extend the classifier before any move or rewrite path writes files. The classifier must identify documentation files as one of these ownership classes: manifest-owned, canonical managed, user-authored project docs, modified managed docs, missing-manifest recognizable docs, or ambiguous.

### Required Future Tasks

- [ ] t10: Add classifier evidence for documentation-tree ownership, including manifest records, canonical fingerprints, managed-block state, local modifications, missing manifests, and ambiguous path/content matches.
- [ ] t11: Ensure user-authored project Markdown never becomes a clean rewrite candidate only because it sits under a recognized docs path.
- [ ] t12: Route ambiguous documentation trees to `migrate-with-review` or `manual-review-required` before move planning can write files.

### Acceptance Criteria

- Classification output can explain why each moved Markdown file is owned, reviewable, or blocked.
- Missing-manifest recognizable docs remain reviewable unless ownership is proven from canonical managed content.
- Ambiguous docs stop before mutation in non-interactive runs.
