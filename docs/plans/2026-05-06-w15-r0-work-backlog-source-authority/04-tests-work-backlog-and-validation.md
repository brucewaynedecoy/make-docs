# Phase 4 - Tests, Work Backlog, and Validation

## Objective

Update focused tests or validators, generate the delta work backlog, and validate the source-authority guidance change.

## Depends On

- [01-prd-change-and-baseline-annotations.md](./01-prd-change-and-baseline-annotations.md)
- [02-contract-and-template-guidance.md](./02-contract-and-template-guidance.md)
- [03-skill-projection-and-mirror-alignment.md](./03-skill-projection-and-mirror-alignment.md)
- `docs/assets/references/execution-workflow.md`
- `docs/assets/templates/work-phase.md`

## Files To Modify

- `packages/cli/tests/consistency.test.ts`, if parity expectations need updates
- `packages/skills/decompose-codebase/scripts/validate_output.py`, only if validation assumptions require adjustment
- `packages/skills/decompose-codebase/scripts/test_validate_output.py`, if validator behavior changes
- `docs/work/2026-05-06-w15-r0-work-backlog-source-authority/`
- `docs/assets/history/`, only after implementation phases are completed

## Detailed Changes

1. Review consistency tests for root template, skill projection, and mirror parity assumptions.
2. Update tests only where source-authority wording changes require new assertions.
3. Keep validator changes narrow; do not add a new validator path when existing hooks already cover work phase shape.
4. Generate `docs/work/2026-05-06-w15-r0-work-backlog-source-authority/` from this plan.
5. Run focused validation and record results.
6. Add history records after implementation phases complete.

## Parallelism

Test review can start while Phase 3 is underway, but final validation should wait until package skill and mirrors are synced.

## Acceptance Criteria

- Consistency tests still enforce root, package, and mirror alignment.
- Validator tests pass or documented blockers explain failures.
- The generated delta backlog traces to `docs/prd/14-revise-work-backlog-source-authority.md` and this plan.
- Final validation evidence is available for closeout.

## Validation Commands

Run these before closeout:

```sh
python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py
npm test -w make-docs -- consistency renderers install skill-catalog skill-registry
npm run build -w make-docs
bash scripts/check-instruction-routers.sh
bash scripts/check-wave-numbering.sh
git diff --check
```

Also scan for stale wording that implies skill projections or mirrored skills are the primary backlog-shape authority.
