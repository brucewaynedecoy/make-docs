# Phase 4 - Tests, Delta Backlog, and Validation

## Objective

Lock the revised conflict behavior with focused tests, generate the plan-derived work backlog, and validate the completed change.

## Depends On

- [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md)
- [02-conflict-model-and-planner.md](./02-conflict-model-and-planner.md)
- [03-clack-review-flow.md](./03-clack-review-flow.md)
- `docs/assets/references/execution-workflow.md`
- `docs/assets/templates/work-phase.md`

## Files To Modify

- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/cli.test.ts`
- any existing wizard test files, if present or created by the implementation
- `docs/assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/`
- `docs/assets/history/`, only after implementation phases are completed

## Detailed Changes

1. Replace tests for instruction `update` conflict handling with tests for overwrite/skip-only behavior.
2. Add planner tests for:
   - divergent agent instructions;
   - divergent references;
   - divergent templates;
   - overwrite all across multiple groups;
   - skip all across multiple groups;
   - unchanged automatic update/noop paths.
3. Add CLI or wizard tests for:
   - batch-level prompt before per-file review;
   - grouped review order;
   - progress text;
   - cancellation without partial apply.
4. Generate `docs/assets/archive/work/2026-05-06-w14-r2-cli-conflict-resolution/` from this plan after the plan is accepted for backlog generation.
5. Add history records only for completed implementation phases, not for this planning step alone.
6. Run focused validation first, then repo-level validation.

## Parallelism

Focused test cases can be drafted while Phases 2 and 3 are in progress, but final assertions should be aligned after the model and prompt names settle. Backlog generation should happen after the PRD change doc and this plan are stable.

## Acceptance Criteria

- Tests prove references and templates are not silently skipped when a user chooses overwrite.
- Tests prove `Skip all` preserves every reviewable diff.
- Tests prove grouped review order is agent instructions, references, then templates.
- Tests prove `Update` no longer appears as a conflict decision.
- The delta backlog traces to `docs/prd/13-revise-cli-conflict-resolution.md` and this plan.
- Validation commands pass or failures are documented with concrete blockers.

## Validation Commands

Run these before closeout:

```sh
npm test -w make-docs
npm run validate:defaults -w make-docs
bash scripts/check-instruction-routers.sh
git diff --check
```

Also run a literal stale-reference scan for old instruction-only conflict names and user-facing `Update` wording after implementation.
