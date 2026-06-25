# Phase 04: Package Parity and Closeout

## Purpose

Prove metadata-bearing templates work in dogfood, local dev, and packed package contexts.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)

## Tasks

- [x] t1: Update `packages/docs/template/` first for metadata-bearing generated templates.
- [x] t2: Reseed root dogfood copies under review.
- [x] t3: Verify `packages/cli/template/` reflects metadata-bearing templates after copy/prepack.
- [x] t4: Update parity tests for metadata-bearing template files.
- [x] t5: Update PRD/risk closeout evidence and any required history records.

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

## Implementation Notes

- Confirmed the Phase 2 metadata-bearing generated templates and prompts were already present in the package source under `packages/docs/template/` and the root dogfood `.make-docs/` copy.
- Ran `node scripts/copy-template-to-cli.mjs` and confirmed the ignored `packages/cli/template/` package copy matches the package source for representative generated templates and prompts.
- Added parity fixtures in `packages/cli/tests/consistency.test.ts` so generated metadata templates and prompts must match across `packages/docs/template/`, the root dogfood copy, and the ignored CLI package copy.
- Updated [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) to narrow Q-011, R-004, R-011, and R-014 with W16 R1 implementation evidence while leaving broader configuration, downstream consumer, and no-scripts follow-ons open.
- Added a Phase 4 closeout breadcrumb under `docs/assets/archive/history/`.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/04-package-parity-and-closeout.md --json`
- `node scripts/copy-template-to-cli.mjs`
- `npm run dev -w packages/cli -- --target <repo-root> --dry-run --yes`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for modified and untracked Markdown files.
- `jdocmunch.index_local`
- `jcodemunch.index_folder`
