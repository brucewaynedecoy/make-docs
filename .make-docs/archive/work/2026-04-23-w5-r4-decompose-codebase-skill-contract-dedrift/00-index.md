# Decompose Codebase Skill Contract De-Drift - Work Backlog

> See `docs/assets/references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the `w5-r4` decompose skill contract correction. It derives from [the `w5-r4` plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/00-overview.md) and the originating [design](../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-skill-contract.md](01-authority-and-skill-contract.md) | Rewrite the human-facing decompose skill contract to the current v2 archive, plan, and backlog model. |
| [02-templates-and-output-model.md](02-templates-and-output-model.md) | Realign the packaged decomposition and work templates to the shared v2 model and remove the obsolete single-file backlog template. |
| [03-validator-registry-and-install-surface.md](03-validator-registry-and-install-surface.md) | Update validator rules, registry asset declarations, and install/test coverage to match the corrected skill surface. |
| [04-dogfood-mirror-and-parity.md](04-dogfood-mirror-and-parity.md) | Refresh the `.agents` mirror from the packaged skill and add an automated mapped-file parity guardrail. |
| [05-tests-and-validation.md](05-tests-and-validation.md) | Run focused tests, stale-path scans, router checks, and final hygiene validation for the `w5-r4` revision. |

## Usage Notes

- Read phases in order.
- Phase 1 settles the active skill-local contract before template, validator, or mirror updates.
- Phase 2 depends on Phase 1 because the packaged templates should reflect the finalized v2 contract language.
- Phase 3 depends on Phases 1 and 2 because validator rules, registry assets, and install expectations must match the settled packaged surface.
- Phase 4 depends on Phases 1 through 3 because the mirror and parity guardrail should be based on the final packaged file set.
- Phase 5 depends on all prior phases and should remain a dedicated proof pass.
- Do not reintroduce `docs/prd/archive/...`, one-file decomposition plans, or one-file rebuild backlogs as active behavior.
- Do not turn the installed skill into a runtime consumer of repo-root `docs/assets/**` or repo-root `scripts/`.
