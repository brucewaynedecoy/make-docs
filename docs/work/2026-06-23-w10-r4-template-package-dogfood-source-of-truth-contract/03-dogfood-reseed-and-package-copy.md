# Dogfood Reseed and Package Copy

## Purpose

Preserve reviewed dogfood reseeding while ensuring `packages/cli/template/` stays generated from the template source.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`

## Stage 1 - Reseed and Copy Flow

### Tasks

- [ ] t1: Define or update reseed guidance so template-owned files are copied into dogfood only under review.
- [ ] t2: Keep `packages/cli/template/` regeneration tied to `scripts/copy-template-to-cli.mjs` and package `prepack`.
- [ ] t3: Surface local managed-file changes through compatibility/conflict review rather than overwriting them.
- [ ] t4: Reconcile package README or release docs when they describe package contents or template sources incorrectly.

### Acceptance Criteria

- No task or helper performs a blind recursive copy into root `docs/`.
- Hand edits in `packages/cli/template/` are treated as drift, not source changes.
- Local managed-file conflicts preserve PRD 18 review semantics.

### Dependencies

- Phase 2 ownership boundary.
