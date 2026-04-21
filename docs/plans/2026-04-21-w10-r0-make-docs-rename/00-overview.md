# Make Docs Rename - Implementation Plan

## Purpose

Implement the rename defined in [2026-04-21-make-docs-rename.md](../../designs/2026-04-21-make-docs-rename.md). This is **Wave 10 Revision 0** (`w10-r0`): a comprehensive alpha-phase migration from `starter-docs` to `make-docs` across package identity, CLI command surface, generated template output, documentation, tests, and historical records.

The actual repository checkout and remote repository are not renamed by this plan. This plan prepares all tracked project content for that later repository rename.

## Objective

- The public package and CLI binary are `make-docs`.
- Workspace package names are `make-docs-monorepo`, `@make-docs/template`, `@make-docs/skills`, and `@make-docs/content`.
- CLI help, errors, lifecycle output, wizard copy, generated routers, and smoke tests use `make-docs`.
- Fresh manifests at `docs/.assets/config/manifest.json` record `packageName: "make-docs"`.
- The user install guide is renamed to `docs/guides/user/getting-started-installing-make-docs.md`, and all links are repaired.
- Historical design, plan, work, and history records are rewritten so tracked files and pathnames no longer contain the old product name.
- The final tracked tree contains no `starter-docs`, `Starter-Docs`, `Starter Docs`, `starter docs`, `STARTER_DOCS`, or `@starter-docs` references outside ignored generated/cache directories.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: active implementation plan derived from an approved design
- Cleanup rewrite requested: yes, for old product-name references across historical docs
- Full backlog regeneration requested: no
- Legacy compatibility required: no, because this is still alpha and there are no supported external installs

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Approved design | Markdown design doc | `docs/designs/2026-04-21-make-docs-rename.md` | High |
| Planning contract | Markdown references/templates | `docs/.references/planning-workflow.md`, `docs/.templates/plan-overview.md`, `docs/.templates/plan-prd-change.md` | High |
| Package identity | npm manifests and lockfile | `package.json`, `package-lock.json`, `packages/*/package.json` | High |
| CLI implementation | TypeScript source | `packages/cli/src/` | High |
| Shippable template | Markdown template tree | `packages/docs/template/` | High |
| Current docs corpus | Markdown docs | `README.md`, `docs/`, `packages/*/README.md` | High |
| Validation harness | tests and scripts | `packages/cli/tests/`, `scripts/smoke-pack.mjs`, `scripts/check-instruction-routers.sh` | High |

## Baseline Context

- Active PRD status: no PRD namespace change is planned.
- Impacted baseline docs: package READMEs, user/developer guides, references, prompts, routers, historical docs, plans, work items, and history records.
- Discovery pass required: yes during implementation, because the rename must cover both content and pathnames.
- Discovery scope: exact-match scans for old product-name variants across tracked files and tracked paths, plus package/bin validation after lockfile regeneration.

## Output Contract

- Plan directory: `docs/plans/2026-04-21-w10-r0-make-docs-rename/`
- Entry point: `docs/plans/2026-04-21-w10-r0-make-docs-rename/00-overview.md`
- Phase files: `docs/plans/2026-04-21-w10-r0-make-docs-rename/0N-<phase>.md`
- Expected follow-on backlog directory: `docs/work/2026-04-21-w10-r0-make-docs-rename/`
- New PRD docs: none
- Baseline PRD annotations: none

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-core-package-and-cli-identity.md` | Rename npm workspace identity, CLI package/bin, source constants, CLI copy, skill registry URLs, and package lock metadata. |
| `02-template-renderers-and-assets.md` | Rename template-owned resources, generated renderer text, router instructions, prompts, references, and sync the CLI bundled template. |
| `03-docs-history-and-pathnames.md` | Rename the user guide and rewrite repo docs, historical records, plans, work items, links, and tracked pathnames. |
| `04-tests-packaging-and-validation.md` | Update tests and smoke validation, run package checks, and enforce zero stale old-name strings and pathnames. |

## Parallel Execution Strategy

Use a coordinator plus parallel workers when the harness supports delegation. The coordinator owns sequencing, conflict review, and final acceptance only; it should not write implementation files while workers own disjoint write scopes.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Core identity worker | Package metadata, lockfile, CLI source identity, command/help strings, skill registry URLs | `package.json`, `package-lock.json`, `packages/*/package.json`, `packages/cli/src/`, `packages/cli/skill-registry*` | None | New package/bin identity and CLI text using `make-docs` only |
| Template worker | Shippable template, renderer output, routers, prompts, references, package docs template sync | `packages/docs/template/`, `packages/cli/src/renderers.ts`, renderer/consistency tests, generated `packages/cli/template/` sync | Canonical name table from design; can run parallel with docs worker after core identity decisions are fixed | Template-owned output and generated routers use `make-docs` |
| Docs rewrite worker | Repo docs and tracked Markdown pathnames, including historical docs | `README.md`, `docs/`, `packages/*/README.md`, non-template Markdown docs | Canonical name table from design; should avoid files owned by template worker | All tracked docs and links use `make-docs`; user guide path is renamed |
| Test and smoke worker | Tests, smoke-pack, stale-reference checks, pack/bin assertions | `packages/cli/tests/`, `scripts/smoke-pack.mjs`, validation-only fixes | Depends on core identity worker for package/bin names and on template/docs workers for expected output | Test expectations match `make-docs`; stale-reference gates are enforced |
| Integration worker | Final merge, conflict repair, lockfile/package validation, stale-path review | Narrow final fixes only | Blocks on all other workers | Clean build/test/smoke output and zero stale old-name tracked references |

Parallelism rules:

- Phase 1 has the main shared blockers: package names, bin name, workspace name, and lockfile. Only one worker should own lockfile regeneration.
- Phases 2 and 3 can run in parallel after the canonical names are fixed because template-owned files and repo-doc rewrite files are mostly disjoint.
- Phase 4 starts after Phase 1 and can update tests in parallel with late Phase 2/3 docs edits, but final validation waits until all content changes land.
- Any worker renaming a file must update links in its own write scope and leave cross-scope links for the integration worker if another worker owns the target file.
- The final stale-reference sweep is a blocker for completion; old-name matches are not accepted in tracked files or tracked pathnames.

## Dependencies and Blockers

- `package-lock.json` must be regenerated after package names change; stale lockfile package names block tests and smoke packaging.
- Root npm scripts must switch to `-w make-docs` before validation commands in this wave can run.
- The packed CLI must expose only the `make-docs` bin; any remaining `starter-docs` bin entry blocks completion.
- `packages/docs/template/` must be synced into `packages/cli/template/` after template edits.
- The user guide rename blocks link validation until every old `getting-started-installing-starter-docs.md` link is repaired.
- Historical docs are in scope for rewrite, so stale-reference allowlists should be avoided except for ignored generated/cache directories.

## MCP Strategy

- Use `jcodemunch` first for source search, symbol outlines, and targeted code reads.
- Use `jdocmunch` first for docs contracts, templates, existing plans, and active documentation references when the docs index is available.
- Use `rg` as the exact-match authority for final stale-name scans across tracked files and pathnames.
- If an MCP index is stale, read the specific local files needed and avoid broad manual reads unless exact-match verification requires them.

## Non-Goals

- Do not rename the local checkout directory or remote repository.
- Do not preserve a `starter-docs` command, npm alias, manifest migration path, or compatibility warning.
- Do not rename skill IDs such as `archive-docs` or `decompose-codebase`; they do not contain the old product name.
- Do not change the CLI state path `docs/.assets/config/manifest.json`.
- Do not create new PRD docs for this rename.

## Validation

1. `npm run build -w make-docs` passes.
2. `npm test -w make-docs` passes.
3. `npm run validate:defaults -w make-docs` passes.
4. `node scripts/smoke-pack.mjs` passes and validates a manifest with `packageName: "make-docs"`.
5. `bash scripts/check-instruction-routers.sh` passes.
6. `git diff --check` passes.
7. Packed package validation confirms only the `make-docs` bin is exposed.
8. Exact-match searches over tracked files and tracked pathnames find zero old-name variants: `starter-docs`, `Starter-Docs`, `Starter Docs`, `starter docs`, `STARTER_DOCS`, and `@starter-docs`.
