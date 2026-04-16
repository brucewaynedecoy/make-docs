# Design Naming Simplification — Implementation Plan

## Purpose

Implement the design naming simplification described in [2026-04-16-design-naming-simplification.md](../../designs/2026-04-16-design-naming-simplification.md). This plan removes W/R encoding from design document filenames across the template references, contract, workflow, template, routers, CLI renderers, and dogfood docs.

## Objective

- The design contract requires `YYYY-MM-DD-<slug>.md` (no W/R).
- The wave model exempts designs (parallel to the existing PRD exemption).
- The design workflow references the simplified path pattern.
- The design template uses the simplified filename blockquote.
- The design routers show the simplified naming convention and example.
- The CLI renderers emit the simplified patterns for all install profiles.
- The dogfood docs are re-seeded from the updated template.
- All tests pass, router checks pass, smoke-pack succeeds.
- Existing `w2-r0` designs in `docs/designs/` are NOT renamed.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-template-references-and-contract.md` | Update wave-model.md, design-contract.md, and design-workflow.md in the template package. |
| `02-template-and-routers.md` | Update design.md template and design directory routers in the template package. |
| `03-cli-renderers.md` | Update renderDesignWorkflow, renderDesignContract, and renderDesignTemplate in renderers.ts. |
| `04-reseed-and-validation.md` | Re-seed dogfood docs and run the full validation suite. |

## Dependencies

- Phases 1 and 2 can run in parallel (disjoint file sets within the template package).
- Phase 3 depends on Phases 1 and 2 (renderers must reflect the same patterns as the static templates).
- Phase 4 depends on Phase 3 (re-seed and validate against the final state).

## Validation

1. `npm test -w starter-docs` — all tests pass.
2. `bash scripts/check-instruction-routers.sh` — routers validate.
3. `node scripts/smoke-pack.mjs` — pack/install/verify succeeds.
4. Manual verification: a fresh `init --yes` into a temp dir produces design-related files with the simplified naming pattern (no W/R references).
5. Manual verification: existing `w2-r0` designs in `docs/designs/` are untouched.
