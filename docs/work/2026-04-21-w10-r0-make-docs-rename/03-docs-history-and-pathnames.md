# Phase 3: Docs, History, and Pathnames

> Derives from [Phase 3 of the plan](../../plans/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md).

## Purpose

Rewrite repo documentation and tracked Markdown pathnames so the dogfood docs, package docs, historical records, plans, work items, and links consistently use `make-docs`.

## Overview

This phase owns repo docs outside the shippable template. It should run in parallel with Phase 2 after Phase 1 settles the package/bin identity. Historical docs are explicitly in scope, so old product-name references in historical records are blockers, not accepted residuals.

## Source PRD Docs

None. This backlog is derived from the `w10-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [03-docs-history-and-pathnames.md](../../plans/2026-04-21-w10-r0-make-docs-rename/03-docs-history-and-pathnames.md)

## Parallel Execution Role

Docs rewrite worker. Write scope:

- `README.md`
- `docs/`
- `packages/cli/README.md`
- `packages/cli/src/README.md`
- `packages/docs/README.md`
- package or skill Markdown docs outside `packages/docs/template/`

This worker should not edit package manifests, CLI source, renderer source, or tests unless the integration worker explicitly reassigns a narrow link or stale-reference fix.

## Stage 1 - Rename the user install guide

### Tasks

1. Rename `docs/guides/user/getting-started-installing-starter-docs.md` to `docs/guides/user/getting-started-installing-make-docs.md`.
2. Update every link to the renamed guide across repo docs.
3. Update the guide title and frontmatter to `Installing Make Docs`.
4. Update command examples in the guide to `npx make-docs` and `make-docs`.
5. Update source-install examples to use the future `make-docs` repository path and temp directory names.

### Acceptance criteria

- [ ] The old install guide pathname no longer exists.
- [ ] The new install guide pathname exists.
- [ ] All links to the install guide resolve to the new path.
- [ ] The guide contains no old product-name strings.

### Dependencies

- Phase 1 Stage 1 canonical command/package names.

## Stage 2 - Rewrite active docs and package READMEs

### Tasks

1. Update `README.md` to use `Make Docs`, `make-docs`, and `npx make-docs`.
2. Update `packages/cli/README.md` and `packages/cli/src/README.md`.
3. Update `packages/docs/README.md` and any other package Markdown docs outside the template.
4. Update active references, prompts, routers, and guide docs under `docs/`.
5. Update GitHub clone, curl, degit, raw URL, npm, and temp-path examples.
6. Keep skill IDs such as `archive-docs` and `decompose-codebase` unchanged.

### Acceptance criteria

- [ ] Active repo docs use the new product name.
- [ ] Package READMEs use the new package/bin names.
- [ ] URL and temp-path examples use `make-docs`.
- [ ] No skill IDs were renamed just because they contain `docs`.

### Dependencies

- Stage 1.
- Phase 1 Stage 1.

## Stage 3 - Rewrite historical docs

### Tasks

1. Rewrite historical design docs under `docs/designs/` to replace old product-name references.
2. Rewrite plan directories under `docs/plans/` to replace old product-name references.
3. Rewrite work directories under `docs/work/` to replace old product-name references.
4. Rewrite history records under `docs/.assets/history/` to replace old product-name references.
5. Include the Wave 10 design, plan, and work docs in this rewrite when implementation reaches the final stale-reference pass.
6. Prefer wording such as "old product name" only if a sentence needs to describe the rename without reintroducing the old string.

### Acceptance criteria

- [ ] Historical docs contain no old product-name strings.
- [ ] Wave 10 docs themselves do not keep old-name strings after the implementation rewrite.
- [ ] Historical links remain usable after text and path rewrites.
- [ ] No historical-doc stale-reference allowlist is needed.

### Dependencies

- Stage 2.

## Stage 4 - Rename tracked doc pathnames

### Tasks

1. Run `git ls-files | rg "starter-docs|Starter-Docs|Starter Docs|starter docs|STARTER_DOCS|@starter-docs"` to find tracked pathnames.
2. Rename any tracked Markdown path segment containing the old product name.
3. Repair links to every renamed path.
4. Re-run the tracked-path search until it returns no matches.

### Acceptance criteria

- [ ] Tracked docs pathnames contain no old product-name variants.
- [ ] Links to renamed docs are repaired.
- [ ] No unrelated file moves are introduced.

### Dependencies

- Stages 1-3.

## Stage 5 - Phase validation

### Tasks

1. Run `git grep -n` checks over the Phase 3 write scope for all old-name variants.
2. Run a targeted link search for the renamed install guide.
3. Run `git diff --check`.
4. Hand off any cross-scope stale reference to the integration worker.

### Acceptance criteria

- [ ] Phase 3 write scope contains no old-name strings or pathnames.
- [ ] Old install-guide links are gone.
- [ ] Cross-scope stale references, if any, are documented for final integration.
- [ ] `git diff --check` passes.

### Dependencies

- Stages 1-4.
