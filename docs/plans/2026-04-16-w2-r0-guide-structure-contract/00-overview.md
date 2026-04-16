# Guide Structure Contract — Implementation Plan

## Purpose

Implement the guide structure contract designed in [2026-04-15-w2-r0-guide-structure-contract.md](../../designs/2026-04-16-w2-r0-guide-structure-contract.md). This plan adds YAML frontmatter, slug-mirrors-path naming, guide templates, a reference contract, router updates, CLI integration for the new files, migration of the two existing guides, and a test/validation pass.

## Objective

- A `guide-contract.md` reference file ships in the template and is installed by the CLI.
- Two guide templates (`guide-developer.md`, `guide-user.md`) ship in the template and are installed by the CLI.
- The `docs/guides/` router files reference the new contract and direct agents to the correct template per audience.
- The `docs/` router includes guide-contract routing alongside the existing design/plan/prd/work routing.
- The CLI's asset pipeline (`rules.ts`, `catalog.ts`, `renderers.ts`) is aware of the new reference, templates, and guide router instruction files.
- The two existing dogfood guides are migrated to the new naming and frontmatter convention.
- All tests pass, instruction-router checks pass, and smoke-pack succeeds.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-authority-and-templates.md` | Create the guide-contract reference and guide templates in the template package. |
| `02-router-updates.md` | Update guide routers, docs router, and templates router in the template package to reference the new contract. |
| `03-cli-integration.md` | Wire the new files into the CLI's asset pipeline (rules, catalog, renderers). |
| `04-migration-and-reseed.md` | Migrate existing guides, re-seed dogfood docs from the template. |
| `05-tests-and-validation.md` | Update tests, run full validation suite. |

## Dependencies

- The design doc [2026-04-16-w2-r0-guide-structure-contract.md](../../designs/2026-04-16-w2-r0-guide-structure-contract.md) is approved.
- Phases 1–2 can run in parallel (disjoint file sets within the template package).
- Phase 3 depends on Phases 1–2 (needs the new files to exist before wiring into the CLI).
- Phase 4 depends on Phase 3 (re-seed requires the template to be complete).
- Phase 5 depends on Phase 4 (tests run against the final state).

## Codebase Finding: Guides Not in the Managed Asset Pipeline

During planning, a gap was identified: the `docs/guides/` directory routers (`AGENTS.md`/`CLAUDE.md`), `docs/guides/agent/` routers, `wave-model.md`, `agent-guide-contract.md`, and the `agent-guide.md` template are NOT listed in the CLI's managed asset system (`rules.ts` / `catalog.ts`). They exist in the shipped template and get installed with full-default profiles (which read the entire template), but reduced profiles (e.g., `--no-work --no-prd`) may not install them.

This plan addresses the gap for guides-related files (adding guide routers and guide-contract to the managed asset pipeline). The broader gap for `wave-model.md`, `agent-guide-contract.md`, and `agent-guide.md` should be tracked separately — it pre-dates this design and has broader implications.

## Validation

1. `npm test -w starter-docs` — all existing and new tests pass.
2. `bash scripts/check-instruction-routers.sh` — routers validate in both the template and dogfood docs.
3. `node scripts/smoke-pack.mjs` — end-to-end pack/install/verify succeeds.
4. Manual verification: the two migrated guides have correct frontmatter and slug-mirrors-path filenames.
5. Manual verification: a fresh `init --yes` into a temp dir includes `guide-contract.md`, both guide templates, and the updated guide routers.
