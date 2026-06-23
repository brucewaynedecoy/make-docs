# Phase 04: Validation and Closeout

## Purpose

Validate the W10 R2 implementation, update docs, and close the round without publishing or pushing.

## Overview

This phase proves the default full-snapshot path still works, future provider/cache surfaces are guarded, and docs describe the implemented contract without overstating provider readiness.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-revise-system-asset-materialization-contract.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)

## Stage 1 - Run implementation validation

### Tasks

- [ ] t1: Run `npm test -w packages/cli`.
- [ ] t2: Run `npm run validate:defaults -w packages/cli`.
- [ ] t3: Run `npm run build -w packages/cli`.
- [ ] t4: Run `npm run smoke:pack`.

### Acceptance criteria

- Existing full-snapshot package behavior still passes.
- Bare installs still produce no default skill files.
- Explicit selected-skill checks still pass.
- Packed template behavior is validated, not only local dev template resolution.

### Dependencies

- Phase 03.

## Stage 2 - Validate new provider/cache guards

### Tasks

- [ ] t5: Run focused tests for provider outage behavior.
- [ ] t6: Run focused tests for stale provider hashes and cache misses.
- [ ] t7: Run focused tests for on-demand conflict handling.
- [ ] t8: Run focused tests for manifest compatibility across old and new provenance state.

### Acceptance criteria

- Provider-backed and hybrid pinned-cache paths cannot become default accidentally.
- Failure modes are actionable and conservative.
- The local bootstrap remains inspectable in every mode.

### Dependencies

- t1
- t2
- t3

## Stage 3 - Close docs and commit

### Tasks

- [ ] t9: Update implementation docs, PRD notes, or risk-register entries only where the implemented behavior changes the accepted contract.
- [ ] t10: Run `git diff --check`.
- [ ] t11: Read `docs/assets/references/commit-message-convention.md` and draft the commit message from the actual diff.
- [ ] t12: Create a local commit and do not push.

### Acceptance criteria

- No implementation result is described as provider-ready unless tests prove it.
- Validation commands and any skipped checks are recorded in closeout.
- Local commit contains only W10 R2 implementation and docs.

### Dependencies

- t5
- t6
- t7
- t8
