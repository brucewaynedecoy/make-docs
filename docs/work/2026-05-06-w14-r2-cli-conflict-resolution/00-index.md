# CLI Conflict Resolution - Work Backlog

## Purpose

Coordinate implementation for the W14 R2 CLI conflict-resolution revision derived from [2026-05-06-cli-conflict-resolution.md](../../designs/2026-05-06-cli-conflict-resolution.md) and [2026-05-06-w14-r2-cli-conflict-resolution](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/00-overview.md).

This is a delta backlog. It should revise the existing CLI install conflict workflow without regenerating the full PRD or implementation backlog set.

## Source Design

- [2026-05-06-cli-conflict-resolution.md](../../designs/2026-05-06-cli-conflict-resolution.md)

## Source Plan

- [00-overview.md](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/00-overview.md)
- [01-prd-change-and-baseline-annotations.md](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/01-prd-change-and-baseline-annotations.md)
- [02-conflict-model-and-planner.md](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/02-conflict-model-and-planner.md)
- [03-clack-review-flow.md](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/03-clack-review-flow.md)
- [04-tests-delta-backlog-and-validation.md](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/04-tests-delta-backlog-and-validation.md)

## Phase Map

| Phase | File | Owner Scope | Summary |
| --- | --- | --- | --- |
| 1 | [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md) | PRD docs | Create the PRD change doc and baseline annotations. |
| 2 | [02-conflict-model-and-planner.md](./02-conflict-model-and-planner.md) | CLI model and planner | Generalize conflict types and deterministic planner behavior. |
| 3 | [03-clack-review-flow.md](./03-clack-review-flow.md) | CLI interactive flow | Implement batch-first and grouped Clack review. |
| 4 | [04-tests-delta-backlog-and-validation.md](./04-tests-delta-backlog-and-validation.md) | Tests and closeout | Add focused regressions, validate, and record closeout evidence. |

## Execution Order

1. Complete Phase 1 before code implementation so the PRD contract is explicit.
2. Complete Phase 2 before Phase 3 so the UI consumes a stable generalized conflict model.
3. Complete Phase 3 before final tests so prompt names, labels, and cancellation behavior are settled.
4. Complete Phase 4 after implementation to validate the full delta and capture history.

## Global Constraints

- Do not archive active PRD docs for this change.
- Do not reintroduce optional reference or template installation prompts.
- Do not preserve the conflict-review `Update` option.
- Keep managed skill-file conflict behavior unchanged unless unavoidable shared refactor work is required.
- Keep tasks within each phase phase-local: `t1`, `t2`, and so on.
- Keep `### Acceptance criteria` as plain bullets.

## Completion Definition

The backlog is complete when all phase tasks are checked, focused and repo-level validation pass or blockers are documented, and history records exist for completed implementation phases.
