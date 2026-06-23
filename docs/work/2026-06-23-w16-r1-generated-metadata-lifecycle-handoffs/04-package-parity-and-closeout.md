# Phase 04: Package Parity and Closeout

## Purpose

Prove metadata-bearing templates work in dogfood, local dev, and packed package contexts.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)

## Tasks

- [ ] `W16R1-P4-T1` Update `packages/docs/template/` first for metadata-bearing generated templates.
- [ ] `W16R1-P4-T2` Reseed root dogfood copies under review.
- [ ] `W16R1-P4-T3` Verify `packages/cli/template/` reflects metadata-bearing templates after copy/prepack.
- [ ] `W16R1-P4-T4` Update parity tests for metadata-bearing template files.
- [ ] `W16R1-P4-T5` Update PRD/risk closeout evidence and any required history records.

## Acceptance Criteria

- Template, dogfood, and package copies agree for metadata-bearing shipped defaults.
- Smoke-pack exercises the packed metadata-bearing template surface where applicable.
- Risk-register entries touched by PRD 23 are closed or narrowed with implementation evidence.

## Validation

- Run `npm test -w packages/cli`.
- Run `npm run validate:defaults -w packages/cli`.
- Run `npm run build -w packages/cli`.
- Run `npm run smoke:pack`.
- Run `git diff --check`.
- Run touched-file Markdown link checks.
