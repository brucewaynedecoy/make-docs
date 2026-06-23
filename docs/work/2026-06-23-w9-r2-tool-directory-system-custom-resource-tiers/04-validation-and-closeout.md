# Validation and Closeout

## Purpose

Validate and close implementation work for the tool-directory model.

## Source PRD Docs

- `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`

## Stage 1 - Validation

### Tasks

- [ ] t1: Run `npm test -w packages/cli`.
- [ ] t2: Run `npm run validate:defaults -w packages/cli`.
- [ ] t3: Run `npm run build -w packages/cli`.
- [ ] t4: Run `npm run smoke:pack`.
- [ ] t5: Run template/dogfood parity, managed-block/router, audit, backup, and uninstall checks relevant to touched paths.
- [ ] t6: Update risk-register status only with implementation evidence.

### Acceptance Criteria

- Tool resources do not regress package validation.
- Runtime state stays out of `docs/assets/**`.
- Residual path, dogfood, provider, no-scripts, and shared-agentics risks are recorded.

### Dependencies

- Phase 3 migration plan.
