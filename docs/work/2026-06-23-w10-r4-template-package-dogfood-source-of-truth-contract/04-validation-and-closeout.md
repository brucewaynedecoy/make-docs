# Validation and Closeout

## Purpose

Prove template, dogfood, and package copy alignment before closing implementation.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Validation

### Tasks

- [ ] t1: Run `npm test -w packages/cli`.
- [ ] t2: Run `npm run validate:defaults -w packages/cli`.
- [ ] t3: Run `npm run smoke:pack`.
- [ ] t4: Run package dry-run checks when package contents change.
- [ ] t5: Run targeted dogfood/template parity and instruction-router checks.
- [ ] t6: Update the risk register and history only with evidence from completed implementation work.

### Acceptance Criteria

- Local development template and packed template paths are both proven.
- Dogfood freshness checks cover files expected to match exactly.
- Package validation remains dry-run unless separately authorized.
- Package/source-of-truth validation proves migration-relevant behavior comes from packaged CLI/shared-core code, or records deterministic Markdown link rewriting and destination-tree validation as a blocking dependency.
- W10 R4 validation remains scoped to package/template/dogfood source-of-truth proof and does not require full V1-to-V2 Markdown-tree migration validation unless W10 R4 implementation directly adds that behavior.
- Closeout records any residual D-006, D-007, D-014, Q-005, R-003, R-004, or R-007 risk.

### Dependencies

- Phase 3 reseed and package-copy changes.
