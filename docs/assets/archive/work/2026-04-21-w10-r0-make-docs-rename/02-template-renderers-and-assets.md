# Phase 2: Template, Renderers, and Assets

> Derives from [Phase 2 of the plan](../../plans/2026-04-21-w10-r0-make-docs-rename/02-template-renderers-and-assets.md).

## Purpose

Ensure every shippable template file and generated router output installed by the CLI uses `make-docs`.

## Overview

This phase owns template and renderer output. It can run in parallel with the docs rewrite phase after Phase 1 has landed package/bin identity. The worker should avoid repo-root historical docs except for template-owned copies under `packages/docs/template/`.

## Source PRD Docs

None. This backlog is derived from the `w10-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [02-template-renderers-and-assets.md](../../plans/2026-04-21-w10-r0-make-docs-rename/02-template-renderers-and-assets.md)

## Parallel Execution Role

Template worker. Write scope:

- `packages/docs/template/`
- `packages/cli/src/renderers.ts`
- `packages/cli/tests/renderers.test.ts`
- `packages/cli/tests/consistency.test.ts`
- synced `packages/cli/template/`

This phase can run alongside Phase 3 after Phase 1. It blocks fresh-install output validation and template stale-reference checks.

## Stage 1 - Rename template-owned resources

### Tasks

1. Search `packages/docs/template/` for `make-docs`, `Make-Docs`, `Make Docs`, `make docs`, `MAKE_DOCS`, and `@make-docs`.
2. Replace template-owned old-name text with the canonical `make-docs` form.
3. Rename any tracked template filename or directory segment containing the old product name.
4. Update links inside the template after path renames.
5. Keep `docs/.assets/config/manifest.json` unchanged.

### Acceptance criteria

- [ ] `packages/docs/template/` contains no old-name strings.
- [ ] Template pathnames contain no old product-name segments.
- [ ] Template links affected by renamed files are repaired.
- [ ] The CLI state path remains `docs/.assets/config/manifest.json`.

### Dependencies

- Phase 1 Stage 1 canonical package/bin names.

## Stage 2 - Rename generated renderer output

### Tasks

1. Update `packages/cli/src/renderers.ts` headings, router text, fallback guidance, and next-step commands to use `make-docs`.
2. Confirm generated guidance uses `npx make-docs reconfigure` where reconfiguration is referenced.
3. Update renderer tests for the new text.
4. Update consistency tests only where renamed template files or expected managed paths changed.
5. Avoid changing non-renderer CLI source owned by Phase 1.

### Acceptance criteria

- [ ] Generated router text uses `make-docs`.
- [ ] Generated command examples use `npx make-docs`.
- [ ] Renderer tests assert the new product name and command examples.
- [ ] Consistency tests reflect renamed template files.

### Dependencies

- Stage 1.
- Phase 1 Stage 1.

## Stage 3 - Sync CLI bundled template

### Tasks

1. Run `node scripts/copy-template-to-cli.mjs`.
2. Verify `packages/cli/template/` mirrors `packages/docs/template/`.
3. Search the synced template for old-name variants.
4. Confirm no old template pathnames remain under the synced CLI template.

### Acceptance criteria

- [ ] Template sync completes successfully.
- [ ] `packages/cli/template/` matches the renamed shippable template.
- [ ] Synced template files contain no old-name strings.
- [ ] Synced template pathnames contain no old product-name segments.

### Dependencies

- Stages 1-2.

## Stage 4 - Phase validation

### Tasks

1. Run `npm test -w make-docs -- tests/renderers.test.ts tests/consistency.test.ts`.
2. Run exact-match searches over the Phase 2 write scope.
3. Run `git diff --check`.
4. Report any cross-scope link repairs needed by the integration worker.

### Acceptance criteria

- [ ] Renderer and consistency tests pass.
- [ ] Phase 2 write scope contains no old-name strings or pathnames.
- [ ] Cross-scope link issues, if any, are documented for final integration.
- [ ] `git diff --check` passes.

### Dependencies

- Stages 1-3.
- Phase 1 Stage 1.
