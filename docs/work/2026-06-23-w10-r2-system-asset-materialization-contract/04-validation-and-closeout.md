# Phase 04: Validation and Closeout

## Purpose

Validate the W10 R2 implementation, update docs, and close the round without publishing or pushing.

## Overview

This phase proves the default full-snapshot path still works, future provider/cache surfaces are guarded, and docs describe the implemented contract without overstating provider readiness.

## Source PRD Docs

- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)

## Stage 1 - Run implementation validation

### Tasks

- [x] t1: Run `npm test -w packages/cli`.
- [x] t2: Run `npm run validate:defaults -w packages/cli`.
- [x] t3: Run `npm run build -w packages/cli`.
- [x] t4: Run `npm run smoke:pack`.

### Evidence

- `npm test -w packages/cli -- --reporter=dot` passed on 2026-06-25 with 15 test files and 241 tests.
- `npm run validate:defaults -w packages/cli` passed on 2026-06-25 with 24 tests.
- `npm run build -w packages/cli` passed on 2026-06-25.
- `npm run smoke:pack` passed on 2026-06-25, including prepack template copy, packaged install/sync, selected-skill sync, backup, and uninstall coverage.

### Acceptance criteria

- Existing full-snapshot package behavior still passes.
- Bare installs still produce no default skill files.
- Explicit selected-skill checks still pass.
- Packed template behavior is validated, not only local dev template resolution.

### Dependencies

- Phase 03.

## Stage 2 - Validate new provider/cache guards

### Tasks

- [x] t5: Run focused tests for provider outage behavior.
- [x] t6: Run focused tests for stale provider hashes and cache misses.
- [x] t7: Run focused tests for on-demand conflict handling.
- [x] t8: Run focused tests for manifest compatibility across old and new provenance state.

### Evidence

- `npm test -w packages/cli -- system-assets.test.ts install.test.ts audit.test.ts --reporter=dot` passed on 2026-06-25 with 4 test files and 68 tests.
- Provider/cache outage, fail-closed behavior, reviewed full-snapshot fallback, stale-hash rejection, provider-backed refresh conflicts, and schema 1 manifest compatibility are covered by focused tests.
- Default behavior remains `full-snapshot`; non-default provider-backed and hybrid pinned-cache paths remain internally selected test surfaces.

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

- [x] t9: Update implementation docs, PRD notes, or risk-register entries only where the implemented behavior changes the accepted contract.
- [x] t10: Run `git diff --check`.
- [x] t11: Read `docs/assets/references/commit-message-convention.md` and draft the commit message from the actual diff.
- [x] t12: Create a local commit and do not push.

### Evidence

- `docs/prd/17-system-asset-materialization-and-local-bootstrap.md` now includes the Phase 2 and Phase 3 implementation/test surfaces in its source anchors.
- No new guide files were created: provider/cache materialization remains internal, not user-ready, and the durable contract is already captured in PRD 17 plus the W10 R2 work/history records.
- No risk-register item was closed: R-006 remains broader than this TypeScript implementation because it also covers future Rust/MCP/provider paths, while Phase 3 added local audit-snapshot safety coverage.
- Manual-test coverage decision: `npm run smoke:pack` was the practical user-runnable scenario for this wave because it exercises the packaged CLI behavior with human-readable output; no extra bespoke UAT script was needed.
- Local commits were created for each phase and no push was performed.

### Acceptance criteria

- No implementation result is described as provider-ready unless tests prove it.
- Validation commands and any skipped checks are recorded in closeout.
- Local commit contains only W10 R2 implementation and docs.

### Dependencies

- t5
- t6
- t7
- t8
