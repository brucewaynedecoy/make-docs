# Docs Assets, Starter-Docs State, and Session History - Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the docs assets, starter-docs state, and session history migration. It derives from [the `w9-r0` plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/00-overview.md) and the originating [design](../../designs/2026-04-20-docs-assets-state-and-history.md).

The work moves starter-docs operational state and agent-authored session history into the template-owned `docs/.assets/` namespace. It is alpha-phase scoped and intentionally does not implement legacy migration from existing `docs/.starter-docs/` installs.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-contracts-and-history-namespace.md](./01-contracts-and-history-namespace.md) | Update history contracts, templates, prompts, and router source files so `docs/.assets/history/` is the canonical destination. |
| [02-template-assets-and-renderers.md](./02-template-assets-and-renderers.md) | Wire `.assets` routers into the CLI asset pipeline and generated renderer output, and remove fresh-install `docs/guides/agent/` output. |
| [03-cli-state-paths.md](./03-cli-state-paths.md) | Move CLI manifest and conflict staging behavior to `docs/.assets/starter-docs/` across source, tests, docs, and smoke validation. |
| [04-history-and-documentation-migration.md](./04-history-and-documentation-migration.md) | Move current session history, update active docs, and update archive-skill history lookup references. |
| [05-tests-and-validation.md](./05-tests-and-validation.md) | Run focused and full validation, link checks, router checks, stale-reference checks, and final whitespace validation. |

## Usage Notes

- Read phases in order.
- Phase 1 establishes the docs contract and router destinations. Do not move history files before this lands.
- Phase 2 depends on Phase 1 because new template files must be managed by the CLI asset pipeline.
- Phase 3 can be implemented after Phase 1, but final user-facing docs should cite only implemented state paths.
- Phase 4 depends on Phases 1 and 2 because moved history records need the new destination and router contract.
- Phase 5 depends on all previous phases and should remain a dedicated validation/fixup pass.
- Use `jcodemunch` first for source search and `jdocmunch` first for docs search. Use `rg` only as an exact-match supplement for stale path checks.
- Do not add compatibility reads for `docs/.starter-docs/manifest.json`; existing alpha installs are out of scope.
