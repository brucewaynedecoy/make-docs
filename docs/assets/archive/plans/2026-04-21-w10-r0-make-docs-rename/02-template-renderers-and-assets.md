# Template, Renderers, and Assets

## Purpose

Rename every template-owned and generated output surface so fresh installs receive `make-docs` documentation, instructions, prompts, references, and router guidance.

## Scope

- `packages/docs/template/` files.
- Generated renderer text in `packages/cli/src/renderers.ts`.
- Asset catalog or consistency expectations affected by renamed template files.
- Prompt and reference text shipped to consumers.
- `packages/cli/template/` after running the normal template sync.

## Implementation Steps

1. Update template-owned Markdown and router files under `packages/docs/template/` from the old product name to `make-docs`.
2. Rename template pathnames that include the old product name, including the user guide copy when present in the template.
3. Update generated renderer text so installed `AGENTS.md`, `CLAUDE.md`, directory routers, fallback guidance, and next-step instructions refer to `make-docs`.
4. Update asset catalog, renderer, install, and consistency tests for any renamed template files or generated text.
5. Run `node scripts/copy-template-to-cli.mjs` after template edits so the CLI bundled template matches the shippable docs template.

## Parallelization

This phase can run in parallel with the docs rewrite phase after Phase 1 fixes canonical package/bin names. Keep the write scope limited to template-owned files, renderer source, and renderer/template tests. Do not rewrite historical repo docs in this phase.

## Dependencies and Blockers

- Depends on the canonical name table from Phase 1.
- Blocks fresh-install validation because generated routers and bundled template output must use `make-docs`.
- Blocks stale-reference completion because `packages/docs/template/` and `packages/cli/template/` must not contain old-name strings or pathnames.

## Acceptance Criteria

- Fresh rendered router text uses `make-docs`.
- `packages/docs/template/` has no old product-name strings or tracked pathnames.
- `packages/cli/template/` is synced from `packages/docs/template/`.
- Template completeness and renderer tests pass with renamed files and text.
