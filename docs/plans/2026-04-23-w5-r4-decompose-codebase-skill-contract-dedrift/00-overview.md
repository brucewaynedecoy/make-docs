# Decompose Codebase Skill Contract De-Drift - Implementation Plan

## Purpose

Implement the contract-alignment change defined in [2026-04-23-decompose-codebase-skill-contract-dedrift.md](../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md). This is **Wave 5 Revision 4** (`w5-r4`): a revision of the shipped skill-delivery wave that brings the `decompose-codebase` skill back into alignment with the repository's current lifecycle contract while preserving the self-contained remote skill model.

## Objective

- The shipped `decompose-codebase` skill uses the current v2 plan, backlog, and PRD archive model.
- Active skill instructions stop routing future work to `docs/prd/archive/...`, `docs/plans/YYYY-MM-DD-decomposition-plan.md`, and `docs/work/YYYY-MM-DD-rebuild-backlog.md`.
- The installed skill continues to rely on bundled local references, templates, and scripts rather than repo-root runtime dependencies.
- The obsolete single-file rebuild backlog template is retired from the skill surface and registry asset set.
- The validator, install tests, and parity checks enforce the v2 contract and fail on future package-vs-mirror drift.

## Coordinate Decision

- Coordinate: `W5 R4`
- Classification: `revision`
- Evidence: The originating design's lineage points to the Wave 5 skill-delivery work, especially the shipped `w5-r2` remote directory-based skill model and its follow-on `w5-r3` revision. The requested change corrects the shipped `decompose-codebase` skill contract rather than starting a new end-to-end initiative. Wave 6 touched one validator script and Wave 11 added a skills lifecycle command, but neither is the primary lineage for how this skill is packaged and delivered. The next unused revision on the relevant wave is `r4`.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: focused implementation plan derived from an approved `change-plan` design
- Active PRD namespace status: `docs/prd/` currently contains router files only, so this plan does not create PRD change docs
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no
- Local template filename preservation: yes for the skill-local projection files; retire the obsolete `assets/templates/rebuild-backlog.md` instead of renaming the remaining local templates

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Originating design | Markdown design doc | `docs/designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md` | High |
| Skill-delivery lineage | Markdown designs, plans, work, history | `docs/designs/2026-04-16-cli-skill-installation*.md`, `docs/designs/2026-04-21-cli-skills-command.md`, `docs/plans/2026-04-16-w5-r*/`, `docs/work/2026-04-16-w5-r*/`, `docs/assets/history/2026-04-16-w5-r*-*.md`, `docs/assets/history/2026-04-17-w5-r3-p1-cli-skill-installation.md` | High |
| Validator lineage | Markdown design, plan, work, history | `docs/designs/2026-04-16-validator-false-positive-links.md`, `docs/plans/2026-04-16-w6-r0-validator-false-positive-links/`, `docs/work/2026-04-16-w6-r0-validator-false-positive-links/`, `docs/assets/history/2026-04-16-w6-r0-*.md` | High |
| Active lifecycle contract | Markdown references and templates | `docs/assets/references/planning-workflow.md`, `docs/assets/references/output-contract.md`, `docs/assets/references/execution-workflow.md`, `docs/assets/references/wave-model.md`, `docs/assets/templates/plan-prd-decompose.md`, `docs/assets/templates/work-index.md`, `docs/assets/templates/work-phase.md` | High |
| Current shipped skill source | Markdown, Python, YAML | `packages/skills/decompose-codebase/` | High |
| Dogfood skill mirror | Markdown, Python, YAML | `.agents/skills/decompose-codebase/` | High |
| Install surface and tests | JSON, TypeScript tests | `packages/cli/skill-registry.json`, `packages/cli/tests/skill-catalog.test.ts`, `packages/cli/tests/skill-registry.test.ts`, `packages/cli/tests/install.test.ts`, `packages/cli/tests/consistency.test.ts` | High |

## Baseline Context

- Active `docs/prd/` status: router-only; there is no active PRD namespace to evolve in place.
- Impacted baseline docs: `packages/skills/decompose-codebase/` instructions, references, templates, validator scripts, `.agents/skills/decompose-codebase/` mirrored files, and the `decompose-codebase` asset declarations and install tests under `packages/cli/`.
- Discovery pass required: yes.
- Discovery scope: legacy archive and one-file backlog/path references, the current v2 plan/work/archive contract, the decompose skill registry asset list, mirror-only omissions, and validator rules that still encode the old path model.

## Output Contract

- Plan directory: `docs/plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/`
  - entry point: `docs/plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/00-overview.md`
  - phase files: `docs/plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/0N-<phase>.md`
- New PRD change docs: none
- Baseline docs to annotate: none in `docs/prd/`
- Expected follow-on backlog directory after plan approval: `docs/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/`
- Package skill target: `packages/skills/decompose-codebase/**`
- Dogfood mirror target: `.agents/skills/decompose-codebase/**`

## Change Doc Strategy

This change does not create PRD change docs because the repository does not have an active PRD namespace to evolve. Execution should instead update the shipped skill package, refresh the `.agents` mirror, adjust the decompose asset declarations and install tests, and add parity validation that keeps the shipped and dogfood copies aligned.

## Active Surface Update Plan

No `docs/prd/` annotations are required. These source-of-truth surfaces are updated in place:

| Surface | Impact | Planned action |
| ------- | ------ | -------------- |
| `packages/skills/decompose-codebase/SKILL.md` and `assets/README.md` | Human-facing behavior and path contract | Revise to the v2 archive, plan, and backlog model and clarify local script resolution |
| `packages/skills/decompose-codebase/references/*.md` | Formal skill-local contract | Revise to mirror the current repo lifecycle semantics |
| `packages/skills/decompose-codebase/assets/templates/*` | Packaged generation shape | Rebase local templates on the current shared decomposition/work model and remove the obsolete single-file backlog template |
| `packages/skills/decompose-codebase/scripts/*` | Validation logic and tests | Revise validator rules to the v2 path model and extend tests accordingly |
| `packages/cli/skill-registry.json` and related tests | Installed optional skill surface | Remove obsolete asset declarations and assert the intended decompose skill file set |
| `.agents/skills/decompose-codebase/**` | Dogfood mirror of the shipped skill | Reseed from `packages/skills/decompose-codebase/**` for the mirrored file set and add automated parity enforcement |

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-authority-and-skill-contract.md` | Rewrite the skill-local contract surfaces to the current v2 archive, plan, and backlog model while keeping the installed skill self-contained. |
| `02-templates-and-output-model.md` | Realign the packaged decomposition and work templates to the shared v2 template model and retire the obsolete one-file backlog template. |
| `03-validator-registry-and-install-surface.md` | Update validator rules, skill asset declarations, and install/test coverage so the shipped decompose skill surface matches the new contract. |
| `04-dogfood-mirror-and-parity.md` | Refresh the `.agents` mirror from the packaged skill and add an automated mapped-file parity check. |
| `05-tests-and-validation.md` | Run the final targeted test, stale-path, router, and regression validation pass. |

## Dependencies

- Phase 1 goes first because it settles the human-facing contract and the local filename-retention decision.
- Phase 2 depends on Phase 1 because template content and template retirement follow the chosen contract language.
- Phase 3 depends on Phases 1 and 2 because validator rules and installed asset declarations must match the final template and path model.
- Phase 4 depends on Phases 1 through 3 because the mirror and parity test should reflect the settled packaged surface.
- Phase 5 depends on all prior phases.

## Research Findings

- `packages/skills/decompose-codebase/` and `.agents/skills/decompose-codebase/` both still route active work to `docs/prd/archive/...` and one-file plan/backlog paths.
- The current shared repo contract has moved to `docs/assets/archive/prds/...` plus directory-based `docs/plans/.../00-overview.md` and `docs/work/.../00-index.md` outputs.
- The shipped decompose skill still declares `assets/templates/rebuild-backlog.md` in `packages/cli/skill-registry.json`, even though the current backlog model is directory-based.
- `.agents/skills/decompose-codebase/` intentionally omits package-only files such as `assets/README.md`, `scripts/test_validate_output.py`, and `scripts/__pycache__/`, so parity enforcement needs an explicit mapped-file set instead of a naive whole-tree compare.
- Existing consistency tests cover template completeness but do not currently enforce packaged-skill-to-dogfood-mirror parity.

## Worker Ownership

If implementation is delegated, split ownership by write scope:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Skill contract worker | Human-facing skill instructions and local references | `packages/skills/decompose-codebase/SKILL.md`, `assets/README.md`, `references/*.md` | Originating design and current repo contracts | Updated skill-local contract with v2 paths and explicit skill-local script semantics |
| Template worker | Local packaged templates | `packages/skills/decompose-codebase/assets/templates/**` | Phase 1 contract language | Decomposition/work templates aligned to the shared v2 model and obsolete single-file backlog template removed |
| Validator/install-surface worker | Validator, registry, and install/test surface | `packages/skills/decompose-codebase/scripts/**`, `packages/cli/skill-registry.json`, `packages/cli/tests/skill-*.test.ts`, `packages/cli/tests/install.test.ts` | Phases 1 and 2 | Updated validator rules, v2 fixtures/tests, and matching installed asset declarations |
| Mirror/parity worker | Dogfood mirror and parity automation | `.agents/skills/decompose-codebase/**`, `packages/cli/tests/consistency.test.ts` or equivalent consistency coverage | Packaged surface from Phases 1-3 | Refreshed mirror plus an automated mapped-file parity guardrail |
| Validation worker | Final review and cleanup | Validation-only edits across affected files | All implementation workers | Passing focused tests, clean stale-path scans, and a final contract sanity pass |

## MCP Strategy

- Use `jdocmunch` first for design, plan, history, and lifecycle contract lookup.
- Use `jcodemunch` first for code/test discovery when the relevant repo index is available.
- Use `rg` as an exact-match supplement for stale path strings, registry asset references, and mirror file inventories.
- If either index is stale after edits, reindex or fall back to targeted local reads instead of broad repo sweeps.

## Non-Goals

- Do not change the CLI skills command behavior beyond the registry/test updates needed to reflect the corrected decompose skill asset surface.
- Do not add a runtime dependency on repo-root `docs/assets/**` or repo-root `scripts/` for installed skills.
- Do not add a new non-stdlib dependency to `validate_output.py`.
- Do not seed or evolve a PRD namespace for this repository as part of this change.
- Do not broaden the `decompose-codebase` feature set beyond contract alignment, parity, and validation correctness.

## Validation

1. Active `decompose-codebase` package and `.agents` mirror files no longer mention `docs/prd/archive/...`, `docs/plans/YYYY-MM-DD-decomposition-plan.md`, or `docs/work/YYYY-MM-DD-rebuild-backlog.md` as current behavior.
2. The decompose skill package still installs as a self-contained directory and its registry asset list matches the intended local file set.
3. The validator test suite covers v2 work-directory acceptance, `docs/assets/archive/prds/...` handling, and rejection of obsolete single-file backlog expectations.
4. The mapped-file parity check fails on package-vs-mirror drift and passes after the mirror refresh.
5. `npm run build -w make-docs`, `npm test -w make-docs`, and `bash scripts/check-instruction-routers.sh` pass.
6. `git diff --check` passes.
