# Work Backlog Source Authority - Change Plan

**Date:** 2026-05-06
**Repository:** `/Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs`
**Purpose:** Produce a reviewable active-set evolution plan for the backlog source-authority behavior captured in [2026-05-06-work-backlog-source-authority.md](../../designs/2026-05-06-work-backlog-source-authority.md).

## Objective

Make work backlog generation consistently use repo-local contracts and templates as the source of truth before falling back to skills, archived examples, or mirrors.

The completed implementation should:

- document the source-priority ladder for `docs/work/` generation;
- make the approved plan the content driver for plan-derived backlogs;
- clarify that `decompose-codebase` is a workflow, validation, and installed-skill surface, not the root backlog-shape authority when repo contracts exist;
- update package skill guidance before mirror copies;
- keep validators and consistency tests aligned with the source-authority model;
- avoid changing the existing W14 R2 CLI conflict-resolution plan or backlog.

## Coordinate Decision

- Coordinate: `W15 R0`
- Artifact path: `docs/assets/archive/plans/2026-05-06-w15-r0-work-backlog-source-authority/`
- Basis: the source design has `Route: change-plan` and no resolved W/R handoff. It is related to the W14 R2 backlog-generation conversation, but it is a distinct docs, skill-guidance, and workflow-authority initiative rather than another CLI conflict-resolution revision. The latest active planned coordinate is `W14 R2`, so this new initiative uses `W15 R0`.
- Route: `change-plan`

## Change Classification

- Change type: `revision`
- Reason: this revises the established plan-to-work backlog generation workflow by making source authority explicit and by demoting skill projections and mirrored skill copies to secondary alignment surfaces.
- Expected PRD output: `docs/prd/14-revise-work-backlog-source-authority.md`.
- Expected work output: `docs/assets/archive/work/2026-05-06-w15-r0-work-backlog-source-authority/`.

## Change Inputs

- Source design: [2026-05-06-work-backlog-source-authority.md](../../designs/2026-05-06-work-backlog-source-authority.md)
- Related active design: [2026-05-06-cli-conflict-resolution.md](../../../../designs/2026-05-06-cli-conflict-resolution.md)
- Planning contract: [planning-workflow.md](../../../../../.make-docs/references/system/planning-workflow.md)
- Execution contract: [execution-workflow.md](../../../../../.make-docs/references/system/execution-workflow.md)
- Output contract: [output-contract.md](../../../../../.make-docs/contracts/system/output-contract.md)
- Work router: [docs/work/AGENTS.md](../../../../work/AGENTS.md)
- Work templates: [work-index.md](../../../../../.make-docs/templates/system/work-index.md), [work-phase.md](../../../../../.make-docs/templates/system/work-phase.md)

## Baseline Context

The current repo already has the needed authority surfaces, but the authority order is spread across multiple places:

- `docs/work/AGENTS.md` names the active work templates and task/acceptance syntax.
- `docs/assets/references/execution-workflow.md` defines backlog rules and active-set evolution behavior.
- `docs/assets/references/output-contract.md` defines required artifact paths.
- `docs/assets/templates/work-index.md` and `docs/assets/templates/work-phase.md` define the active root templates.
- `packages/skills/decompose-codebase/SKILL.md` states that root `docs/assets/` contracts are authoritative in this repo and skill-local assets are projections.
- `packages/cli/tests/consistency.test.ts` and `packages/skills/decompose-codebase/scripts/validate_output.py` are the likely validation surfaces for template, mirror, and validator alignment.

## Output Contract

Execution should produce:

- `docs/prd/14-revise-work-backlog-source-authority.md`
- targeted annotations in `docs/prd/00-index.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, and any baseline doc that already describes plan-to-work generation behavior
- guidance updates in `docs/work/AGENTS.md`, `docs/assets/references/execution-workflow.md`, and optionally `docs/assets/references/output-contract.md`
- package-skill guidance updates under `packages/skills/decompose-codebase/`
- mirrored updates under `.agents/skills/decompose-codebase/` and `.claude/skills/decompose-codebase/` only by syncing from package sources
- focused consistency or validator updates only if the guidance change exposes stale assumptions
- `docs/assets/archive/work/2026-05-06-w15-r0-work-backlog-source-authority/`
- history records after implementation phases complete

## Change Doc Strategy

Create one revision PRD change doc:

- `docs/prd/14-revise-work-backlog-source-authority.md`
- Change type: `revision`
- Scope: source-priority behavior for plan-derived `docs/work/` generation.
- Required traceability: link to this plan and the source design.

The PRD change doc should preserve the design's ladder:

1. repo contracts and templates;
2. approved plan;
3. archived examples;
4. package skill projection;
5. mirrors only as parity outputs or installed-skill-specific inputs.

## Baseline Annotation Plan

Execution should update baseline docs only where needed:

- `docs/prd/00-index.md`: add the new PRD change doc and status.
- `docs/prd/09-dogfood-and-maintainer-operations.md`: annotate maintainer workflow behavior if it covers skill, mirror, or generated-doc maintenance.
- `docs/prd/03-open-questions-and-risk-register.md`: record any unresolved ambiguity around source-authority precedence or mirror parity.
- Any additional impacted baseline doc discovered during execution should receive a focused `Change Notes` backlink rather than a broad rewrite.

## Phase Map

| Phase | File | Goal |
| --- | --- | --- |
| 1 | [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md) | Create the PRD change doc and baseline annotations. |
| 2 | [02-contract-and-template-guidance.md](./02-contract-and-template-guidance.md) | Update repo-local work-generation contracts and templates with the source-priority ladder. |
| 3 | [03-skill-projection-and-mirror-alignment.md](./03-skill-projection-and-mirror-alignment.md) | Align `decompose-codebase` package skill guidance, skill-local projections, mirrors, and validators. |
| 4 | [04-tests-work-backlog-and-validation.md](./04-tests-work-backlog-and-validation.md) | Add or adjust focused checks, generate the delta backlog, and validate the change. |

## Dependencies

- Phase 1 should complete before contract and skill text changes so implementation follows the PRD change doc.
- Phase 2 should complete before Phase 3 so package skill projections align to the updated root authority.
- Phase 3 should complete before final validation because mirror parity and validator checks depend on package skill updates.
- Phase 4 depends on the final changed surfaces from Phases 1 through 3.

## Worker Ownership

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Worker 1 | PRD change and baseline annotations | `docs/prd/14-revise-work-backlog-source-authority.md`, selected `docs/prd/` files | Source design and this plan | PRD change doc, index update, baseline notes |
| Worker 2 | Root contracts and templates | `docs/work/AGENTS.md`, `docs/assets/references/execution-workflow.md`, `docs/assets/references/output-contract.md`, `docs/assets/templates/work-index.md`, `docs/assets/templates/work-phase.md` | Worker 1 | source-priority guidance in active repo contracts |
| Worker 3 | Package skill and mirror alignment | `packages/skills/decompose-codebase/`, `.agents/skills/decompose-codebase/`, `.claude/skills/decompose-codebase/` | Worker 2 | skill guidance aligned to root authority, mirrors synced |
| Worker 4 | Tests, backlog, and validation | `packages/cli/tests/`, `packages/skills/decompose-codebase/scripts/`, `docs/assets/archive/work/2026-05-06-w15-r0-work-backlog-source-authority/` | Workers 1-3 | focused tests or validator updates, delta backlog, validation evidence |

If delegation is unavailable, execute the same phases serially.

## MCP Strategy

- Use `jdocmunch` first for docs contracts, design, plan, and generated work backlog validation.
- Use `jcodemunch` first for code-adjacent surfaces such as `packages/cli/tests/consistency.test.ts`, renderers, and validator scripts.
- Reindex `jdocmunch` after docs edits.
- Reindex `jcodemunch` after implementation changes if code or test symbol inspection is needed.
- Fall back to direct reads only after reindexing fails.

## Non-Goals

- Do not change the W14 R2 CLI conflict-resolution design, plan, or backlog.
- Do not rewrite the full `decompose-codebase` workflow.
- Do not remove skill-local bundled assets; clarify their relationship to root contracts.
- Do not treat mirrored `.agents` or `.claude` skill copies as independent source material.
- Do not regenerate the full PRD or work backlog set.

## Validation

Execution should run:

- `python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py`
- `npm test -w make-docs -- consistency renderers install skill-catalog skill-registry`
- `npm run build -w make-docs`
- `bash scripts/check-instruction-routers.sh`
- `bash scripts/check-wave-numbering.sh`
- `git diff --check`
- focused literal scans for stale wording that implies `decompose-codebase` or mirrored skills are the primary backlog-shape authority
