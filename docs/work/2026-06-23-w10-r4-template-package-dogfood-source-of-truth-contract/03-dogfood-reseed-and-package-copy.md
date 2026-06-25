# Dogfood Reseed and Package Copy

## Purpose

Preserve reviewed dogfood reseeding while ensuring `packages/cli/template/` stays generated from the template source.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`

## Stage 1 - Reseed and Copy Flow

### Tasks

- [x] t1: Define or update reseed guidance so template-owned files are copied into dogfood only under review.
- [x] t2: Keep `packages/cli/template/` regeneration tied to `scripts/copy-template-to-cli.mjs` and package `prepack`.
- [x] t3: Surface local managed-file changes through compatibility/conflict review rather than overwriting them.
- [x] t4: Reconcile package README or release docs when they describe package contents or template sources incorrectly.

### Acceptance Criteria

- No task or helper performs a blind recursive copy into root `docs/`.
- Hand edits in `packages/cli/template/` are treated as drift, not source changes.
- Local managed-file conflicts preserve PRD 18 review semantics.
- Any documentation-tree move or reseed that affects Markdown links depends on CLI/shared-core move planning and reviewed link rewriting; dogfood-only link repair is insufficient.

### Dependencies

- Phase 2 ownership boundary.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | `packages/docs/README.md`, the root `README.md`, and the dogfood maintainer guide now state that dogfood reseeding is reviewed and limited to affected template-owned routers, system resources, prompt starters, templates, and selected helper scripts. They explicitly reject blind recursive copies from `packages/docs/template/docs/` into repo-root `docs/`. |
| t2 | `packages/cli/package.json` already binds package copy to `prepack` with `node ../../scripts/copy-template-to-cli.mjs && npm run build`. `packages/cli/src/README.md` now states that `packages/cli/template/` is generated package input and must be refreshed through the copy/prepack path rather than hand-edited as source. |
| t3 | The package README and maintainer README preserve the existing compatibility/conflict semantics: changed managed files are skipped or staged under `.make-docs/conflicts/<run-id>/`, and project-owned dogfood content is excluded from reseeding. This keeps PRD 18 review behavior authoritative for local managed-file changes. |
| t4 | `packages/cli/README.md` now describes installed v2 package contents with `.make-docs/{contracts,references,templates}/system/**`, `.make-docs/scripts/**`, and `docs/assets/{archive,artifacts,library,playbooks}/**` instead of the stale `docs/assets/` prompts/templates/references wording. |
