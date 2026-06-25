# W10 R4 Template Package Dogfood Source of Truth Contract Work Index

## Purpose

Sequence implementation work for PRD 19 and the W10 R4 plan.

## W9 R4 Prerequisite

Before executing this backlog, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). W10 R4 should validate template/source-of-truth behavior against the W9 R4 paths, not the pre-pivot `docs/artifacts/**`, top-level `docs/archive/**`, `docs/assets/history/**`, or `docs/assets/{prompts,references,templates}/**` assumptions.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Phase Order

1. `01-requirements-and-register-reconciliation.md`
2. `02-template-source-ownership.md`
3. `03-dogfood-reseed-and-package-copy.md`
4. `04-validation-and-closeout.md`

## Validation

- `npm test -w packages/cli`
- `npm run validate:defaults -w packages/cli`
- `npm run smoke:pack`
- Package dry-run checks when package contents change
- Targeted dogfood/template parity and instruction-router checks
