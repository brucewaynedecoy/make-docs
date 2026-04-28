# CLI Command Simplification — Implementation Plan

## Purpose

Implement the CLI command model defined in [2026-04-20-cli-command-simplification.md](../../designs/2026-04-20-cli-command-simplification.md). This is **Wave 8 Revision 0** (`w8-r0`): a design-first simplification of the install/update/reconfigure surface before any CLI source changes are made.

## Objective

- Bare `make-docs [options]` becomes the primary idempotent apply/sync command for both first install and existing installs.
- `make-docs reconfigure [options]` becomes the explicit selection-change command for existing installs.
- `init`, `update`, and `--reconfigure` are removed from the public command model and replaced with helpful migration errors.
- `backup` and `uninstall` remain unchanged.
- Help, generated router text, tests, and smoke validation reflect the new command model without stale `init`, `update`, or `update --reconfigure` guidance.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-command-model-and-parser.md` | Replace the public parser command model with bare apply/sync, `reconfigure`, `backup`, and `uninstall`, including helpful removed-command errors. |
| `02-apply-and-reconfigure-behavior.md` | Implement the apply/sync and reconfigure semantics on top of the existing install planner and selection model. |
| `03-help-router-and-doc-text.md` | Update CLI help, generated router guidance, and project docs so users and agents see the simplified command vocabulary. |
| `04-tests-and-validation.md` | Add regression coverage and run build, test, smoke-pack, and stale-reference validation for the final command surface. |

## Dependencies

- Phase 1 depends on the design doc and should land before behavior or help rewrites.
- Phase 2 depends on Phase 1 because apply/reconfigure behavior needs the final command grammar.
- Phase 3 depends on Phases 1 and 2 so help text reflects implemented behavior, but generated router text can be prepared in parallel after command names are fixed.
- Phase 4 depends on all prior phases and is the final validation/fixup pass.

## Validation

1. `make-docs --help`, `make-docs reconfigure --help`, `make-docs backup --help`, and `make-docs uninstall --help` render the new command surface.
2. `make-docs init`, `make-docs update`, and `--reconfigure` fail with helpful migration guidance.
3. Automated tests cover first install, existing-install sync, existing-install desired-state changes, interactive reconfigure, non-interactive reconfigure, and lifecycle command regressions.
4. Generated router text no longer tells users to rerun `npx make-docs update --reconfigure`.
5. `npm run build -w make-docs`, `npm test -w make-docs`, and `node scripts/smoke-pack.mjs` pass.
