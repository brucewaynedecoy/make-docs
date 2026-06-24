# CLI Conflict Resolution - Change Plan

**Date:** 2026-05-06
**Repository:** `/Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs`
**Purpose:** Produce a reviewable active-set evolution plan for the CLI conflict-resolution behavior captured in [2026-05-06-cli-conflict-resolution.md](../../../../designs/2026-05-06-cli-conflict-resolution.md).

## Objective

Implement a batch-first, Clack-styled conflict-resolution flow for divergent selected managed files, including agent instructions, prompts, references, templates, desired skill assets, and generic selected managed files.

The completed implementation should:

- inspect existing managed files before prompting;
- summarize all reviewable diffs before asking for decisions;
- support `Overwrite all`, `Skip all`, and `Review each`;
- review files through deterministic managed-file grouping that includes agent instructions, prompts, references, templates, desired skill assets, and generic selected managed files;
- remove the instruction-only `Update` option from the conflict flow;
- keep install application deterministic from the final plan and resolution map;
- cover planner, CLI, wizard, and tests without changing unrelated install behavior;
- ensure selected existing managed-file diffs are reviewable, unresolved non-interactive diffs fail before apply, and planned operations render as grouped user-facing `generate`, `update`, `skip`, and `remove` operations without internal reason suffixes.

## Coordinate Decision

- Coordinate: `W14 R2`
- Artifact path: `docs/assets/archive/plans/2026-05-06-w14-r2-cli-conflict-resolution/`
- Basis: the source design identifies this work as a targeted correction to existing CLI planning and interactive install behavior. It builds on `W14 R0` CLI asset-selection simplification and the completed `W7 R1` Clack lifecycle standardization. `W14 R1` is already occupied by the CLI skill-selection simplification, so the next unused revision in the same CLI simplification lineage is `W14 R2`.
- Route: `change-plan`

## Change Classification

- Change type: `revision`
- Reason: the work revises an established CLI conflict-resolution contract by replacing instruction-only, per-file `Update` / `Overwrite` / `Skip` handling with a generalized managed-file diff model and batch-first review flow.
- Expected PRD output: one new revision doc, `docs/prd/13-revise-cli-conflict-resolution.md`.
- Expected work output after this plan is approved: one delta backlog directory, `docs/assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/`.

## Change Inputs

- Source design: [2026-05-06-cli-conflict-resolution.md](../../../../designs/2026-05-06-cli-conflict-resolution.md)
- Related archived design: [2026-04-28-cli-asset-selection-simplification.md](../../designs/2026-04-28-cli-asset-selection-simplification.md)
- Related archived design: [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- Planning contract: [planning-workflow.md](../../../references/planning-workflow.md)
- W/R coordinate contract: [wave-model.md](../../../references/wave-model.md)
- PRD change contract: [prd-change-management.md](../../../references/prd-change-management.md)

## Baseline Context

The implementation touches the CLI install path and the managed-asset model:

- `packages/cli/src/types.ts` currently defines instruction-specific conflict resolution types with `update`, `overwrite`, and `skip`.
- `packages/cli/src/planner.ts` plans divergent managed files as conflicts and only applies explicit instruction conflict resolutions.
- `packages/cli/src/install.ts` exposes instruction-only conflict discovery to the CLI.
- `packages/cli/src/wizard.ts` prompts per instruction conflict and still offers `Update`.
- `packages/cli/src/cli.ts` wires the first plan, conflict prompt, second plan, and apply flow.
- `packages/cli/tests/install.test.ts` and `packages/cli/tests/cli.test.ts` cover current instruction conflict behavior and should become the focused regression surface.

## Output Contract

Execution should produce:

- `docs/prd/13-revise-cli-conflict-resolution.md`
- any required index or baseline annotations in `docs/prd/00-index.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, and `docs/prd/11-revise-cli-asset-selection-simplification.md`
- implementation changes under `packages/cli/src/`
- focused test updates under `packages/cli/tests/`
- a plan-derived work backlog under `docs/assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/`
- history records only after implementation phases are actually completed

Do not execute implementation as part of this planning artifact.

## Change Doc Strategy

Create one revision PRD change doc:

- `docs/prd/13-revise-cli-conflict-resolution.md`
- Change type: `revision`
- Scope: replace instruction-only conflict decisions with a selected managed-file diff review model covering agent instructions, prompts, references, templates, desired skill assets, and generic selected managed files.
- Required traceability: link to this plan and the source design.

The PRD change doc should preserve the user-facing behavior from the design and P5 cleanup: one initial batch prompt, optional grouped review, no `Update` option, visible group/file progress during review, pre-apply failure for unresolved non-interactive diffs, and plan output that groups `generate`, `update`, `skip`, and `remove` operations without internal reason labels.

## Baseline Annotation Plan

Execution should update baseline docs only where needed:

- `docs/prd/00-index.md`: add the new PRD change doc and status.
- `docs/prd/07-cli-command-surface-and-lifecycle.md`: annotate the install/reconfigure conflict-resolution behavior as superseded or revised by the new change doc.
- `docs/prd/11-revise-cli-asset-selection-simplification.md`: add a follow-on note that selected managed-file diffs across prompts, references, templates, desired skill assets, and generic selected managed files now receive explicit conflict handling where reviewable.
- `docs/prd/03-open-questions-and-risk-register.md`: record any unresolved risks discovered during implementation, especially around non-interactive `--yes` behavior or cancellation semantics.

## Phase Map

| Phase | File | Goal |
| --- | --- | --- |
| 1 | [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md) | Create the PRD change doc and baseline annotations that define the revised conflict contract. |
| 2 | [02-conflict-model-and-planner.md](./02-conflict-model-and-planner.md) | Replace instruction-only conflict resolution types with a general reviewable managed-file diff model. |
| 3 | [03-clack-review-flow.md](./03-clack-review-flow.md) | Implement the batch-first and grouped per-file Clack review flow. |
| 4 | [04-tests-delta-backlog-and-validation.md](./04-tests-delta-backlog-and-validation.md) | Update tests, generate the delta backlog, and validate the change. |
| 5 | [05-managed-file-diff-review-and-plan-output-cleanup.md](./05-managed-file-diff-review-and-plan-output-cleanup.md) | Capture the retroactive cleanup that made selected managed-file diffs reviewable, blocked unresolved non-interactive apply, and cleaned plan output labels. |

## Dependencies

- Phase 1 should complete before implementation changes so the revised PRD contract can guide code work.
- Phase 2 must complete before Phase 3 because the review UI needs the generalized conflict model and resolution map.
- Phase 3 depends on the CLI orchestration shape from Phase 2 and should not reintroduce instruction-only `Update`.
- Phase 4 depends on Phases 2 and 3 for test targets and on Phase 1 for work-backlog source docs.
- Phase 5 is retroactive cleanup after Phases 2 through 4: it depends on the generalized conflict model, CLI orchestration, and validation harness already being in place.

## Worker Ownership

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Worker 1 | PRD change and baseline docs | `docs/prd/13-revise-cli-conflict-resolution.md`, selected `docs/prd/` annotations | Source design and this plan | PRD change doc, index update, baseline annotations |
| Worker 2 | Conflict model and planner | `packages/cli/src/types.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/install.ts` | Phase 1 contract | generalized conflict types, reviewable diff classification, deterministic resolution mapping |
| Worker 3 | Clack review flow and CLI orchestration | `packages/cli/src/wizard.ts`, `packages/cli/src/cli.ts` | Worker 2 model | batch prompt, grouped review, cancellation handling, progress text |
| Worker 4 | Tests, backlog, and validation | `packages/cli/tests/`, `docs/assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/` | Workers 1-3 | focused tests, delta backlog, validation evidence |
| Worker 5 | Managed-file diff review and plan output cleanup | `packages/cli/src/cli.ts`, `packages/cli/src/install.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/skills-ui.ts`, `packages/cli/src/types.ts`, `packages/cli/src/wizard.ts`, focused CLI/install/wizard tests | Workers 2-4 | selected managed-file diff review coverage, non-interactive unresolved-diff failure, grouped plan output cleanup |

If delegation is unavailable, execute the same phases serially in this order.

## MCP Strategy

- Use `jdocmunch` first for project docs, PRD contracts, and plan/work templates.
- Use `jcodemunch` first for CLI symbols, signatures, and code surfaces.
- Reindex `jdocmunch` after docs artifacts are created or updated.
- Reindex `jcodemunch` after implementation changes before final code validation, if code indexing is needed for closeout.
- Fall back to direct file reads only if the relevant index is unavailable or stale and reindexing fails.

## Non-Goals

- Do not reintroduce optional reference or template installation prompts.
- Do not redesign the full install wizard.
- Do not broaden unrelated skill-file behavior beyond the selected managed-file diff review cleanup captured by P5.
- Do not implement textual diffs or side-by-side file previews unless explicitly requested later.
- Do not execute this plan until the user separately approves implementation.

## Validation

Execution should run:

- focused CLI unit tests for install planning and conflict prompts;
- any wizard or CLI tests updated for the renamed conflict flow;
- `npm test -w make-docs`;
- `npm run validate:defaults -w make-docs`;
- `bash scripts/check-instruction-routers.sh`;
- `git diff --check`;
- a literal scan for stale `InstructionConflictResolution`, `Update`, and instruction-only conflict wording where those names no longer match behavior.
