# Make Docs Rename - Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the Wave 10 rename from `make-docs` to `make-docs`. It derives from [the `w10-r0` plan](../../plans/2026-04-21-w10-r0-make-docs-rename/00-overview.md) and the originating [design](../../designs/2026-04-21-make-docs-rename.md).

The work is alpha-phase scoped. It intentionally does not keep compatibility with the old package name, CLI binary, command examples, package scopes, or manifest package identity.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-core-package-and-cli-identity.md](./01-core-package-and-cli-identity.md) | Rename npm workspace identity, CLI package/bin, source constants, CLI copy, skill registry URLs, and package lock metadata. |
| [02-template-renderers-and-assets.md](./02-template-renderers-and-assets.md) | Rename template-owned resources, generated renderer text, router instructions, prompts, references, and sync the CLI bundled template. |
| [03-docs-history-and-pathnames.md](./03-docs-history-and-pathnames.md) | Rename the user guide and rewrite repo docs, historical records, plans, work items, links, and tracked pathnames. |
| [04-tests-packaging-and-validation.md](./04-tests-packaging-and-validation.md) | Update tests and smoke validation, run package checks, and enforce zero stale old-name strings and pathnames. |

## Parallel Execution Notes

The work can be parallelized after Phase 1 settles the package/bin identity and lockfile. If a harness supports parallel agents, use these workstreams:

| Workstream | Primary Phase | Write Scope | Blocks | Can Run In Parallel With |
| --- | --- | --- | --- | --- |
| Core identity worker | Phase 1 | package manifests, lockfile, `packages/cli/src/` except `renderers.ts`, skill registry files | All later validation, package/bin expectations | Read-only discovery only |
| Template worker | Phase 2 | `packages/docs/template/`, `packages/cli/src/renderers.ts`, renderer and consistency tests, synced `packages/cli/template/` | Fresh install output and template stale checks | Phase 3 after Phase 1 |
| Docs rewrite worker | Phase 3 | `README.md`, `docs/`, package READMEs, tracked Markdown pathnames | Link validation and final stale checks | Phase 2 after Phase 1 |
| Test and smoke worker | Phase 4 | `packages/cli/tests/`, `scripts/smoke-pack.mjs`, validation-only fixes | Final acceptance | Late Phase 2/3 expectation updates |
| Integration worker | Phase 4 final stages | narrow cross-scope fixes only | Completion | None; runs after all workers |

Rules:

- Only the core identity worker regenerates `package-lock.json`.
- Workers should keep write scopes disjoint. If a renamed link crosses scopes, record it and leave final repair to the integration worker.
- Final validation cannot start until Phase 1 package identity, Phase 2 template sync, and Phase 3 docs/pathname rewrites are complete.
- Old-name matches in tracked files or tracked pathnames are blockers. Do not create a historical-doc allowlist.

## Usage Notes

- Read phases in order for dependencies.
- Phase 1 is the shared blocker for package/bin identity.
- Phases 2 and 3 are intended to run in parallel after Phase 1.
- Phase 4 can update tests after Phase 1, but its final validation stages depend on all earlier phases.
- Use `jcodemunch` first for source search and `jdocmunch` first for docs search when available. Use `rg` and `git grep` as exact-match validation tools.
- The CLI state path stays `docs/.assets/config/manifest.json`.
- Do not add compatibility commands, aliases, migration branches, or old-name warning text.
