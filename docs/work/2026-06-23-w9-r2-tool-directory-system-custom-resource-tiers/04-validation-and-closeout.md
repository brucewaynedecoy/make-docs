# Validation and Closeout

## Purpose

Validate and close implementation work for the tool-directory model.

## Source PRD Docs

- `docs/prd/21-project-tool-directory-and-resource-tiers.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`

## Stage 1 - Validation

### Tasks

- [x] t1: Run `npm test -w packages/cli`.
- [x] t2: Run `npm run validate:defaults -w packages/cli`.
- [x] t3: Run `npm run build -w packages/cli`.
- [x] t4: Run `npm run smoke:pack`.
- [x] t5: Run template/dogfood parity, managed-block/router, audit, backup, and uninstall checks relevant to touched paths.
- [x] t6: Update risk-register status only with implementation evidence.

### Acceptance Criteria

- Tool resources do not regress package validation.
- Runtime state stays out of `docs/assets/**`.
- Residual path, dogfood, provider, no-scripts, and shared-agentics risks are recorded.

### Dependencies

- Phase 3 migration plan.

## Implementation Notes

Phase 4 closed the W9 R2 validation loop with the full CLI test and packaging matrix. `npm test -w packages/cli` passed with 14 test files and 222 tests after updating stale backup/lifecycle fixtures in `packages/cli/tests/backup.test.ts` and `packages/cli/tests/lifecycle.test.ts`; the fixtures now derive backup count expectations from the actual backup result and explicitly select the global `archive-docs` skill before asserting its `_home` backup path. `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, and `npm run smoke:pack` passed.

Template, dogfood, managed-block/router, audit, backup, and uninstall coverage came from the full CLI test suite, `validate:defaults`, and `smoke:pack`. The smoke pack run rebuilt the package template, installed and synced a smoke project, validated skills sync, ran backup, and completed uninstall without moving runtime state under `docs/assets/**`.

Risk-register status remains unchanged. R-003, R-004, R-006, R-007, R-013, and R-014 still record residual path, dogfood, audit, restructure, no-scripts, and shared-agentics exposure that require broader release or migration evidence outside this phase. This wave adds tool-directory proof points and validation coverage, but it does not close those risks.

Final manual/UAT decision: the wave skipped per-phase UAT as requested and did not add a separate manual UI/UAT run at closeout because the W9 R2 surface is an internal CLI/tool-directory contract. Coverage for this wave is the automated package, lifecycle, backup, sync, uninstall, and validation matrix above.
