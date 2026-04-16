# Asset Pipeline Completeness — Implementation Plan

## Purpose

Implement the asset pipeline completeness fix designed in [2026-04-16-asset-pipeline-completeness.md](../../designs/2026-04-16-asset-pipeline-completeness.md). This plan adds the 7 remaining unmanaged template files to the CLI's managed asset pipeline so that every install profile — full or reduced — produces a complete, internally consistent documentation tree.

The guide-structure-contract work already established the `ALWAYS_REFERENCE_PATHS` and `GUIDE_TEMPLATE_PATHS` patterns in `rules.ts` and added guide instruction assets in `catalog.ts`. This plan extends those patterns for the remaining gaps.

## Objective

- `wave-model.md` and `agent-guide-contract.md` are added to `ALWAYS_REFERENCE_PATHS` and installed by every profile.
- `agent-guide.md` is added to an always-installed template path and installed by every profile.
- `plan-overview.md` is added to `PLAN_TEMPLATE_PATHS` and installed when plans are selected.
- `session-to-agent-guide.prompt.md` is added to `PROMPT_RULES` with no capability prerequisite and installed when prompts are enabled.
- `docs/.archive/AGENTS.md` and `CLAUDE.md` are added to instruction assets and installed for all profiles.
- A template-completeness test catches future omissions automatically.
- All existing tests pass, router checks pass, smoke-pack succeeds.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-cli-source-changes.md` | Update rules.ts, catalog.ts, and prompt rules to cover all 7 unmanaged files. |
| `02-tests-and-validation.md` | Add template-completeness test, update existing tests, run full validation suite. |

## Dependencies

- Phase 1 is self-contained (CLI source changes only).
- Phase 2 depends on Phase 1.
- No template or dogfood file changes needed — this plan modifies only CLI source and test files.

## Validation

1. `npm test -w starter-docs` — all tests pass, including the new template-completeness test.
2. `bash scripts/check-instruction-routers.sh` — routers validate.
3. `node scripts/smoke-pack.mjs` — pack/install/verify succeeds.
4. Manual verification: a reduced-profile install (e.g., `--no-work --no-prd`) includes `wave-model.md`, `agent-guide-contract.md`, `agent-guide.md`, `docs/.archive/AGENTS.md`, and `docs/.archive/CLAUDE.md`.
