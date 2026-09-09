# Phase 5 - Tests and Validation

## Objective

Close the `w5-r4` revision with focused automated validation, targeted stale-path scans, router checks, and a final sanity pass over the shipped and mirrored `decompose-codebase` surfaces.

## Depends On

- Phases 1 through 4
- Existing CLI test runner and consistency test suite
- Existing instruction-router validation script

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/consistency.test.ts` and any focused decompose install tests | Final cleanup if validation reveals missing assertions or stale assumptions. |
| `packages/skills/decompose-codebase/**` and `.agents/skills/decompose-codebase/**` | Final stale-path or parity cleanup only if surfaced by validation. |

## Detailed Changes

### 1. Run focused automated tests

Run the validation surfaces added or updated in earlier phases:

1. `python packages/skills/decompose-codebase/scripts/test_validate_output.py`
2. `npm run build -w make-docs`
3. `npm test -w make-docs`
4. `bash scripts/check-instruction-routers.sh`

If a command fails because the updated test surface reveals a stale assumption, fix the assumption in the relevant phase-owned file rather than weakening the test.

### 2. Run active-surface stale-path scans

Use targeted `rg` scans over the active surfaces, not over historical docs, to confirm the old contract is gone from the shipped skill and mirror. At minimum, scan:

- `packages/skills/decompose-codebase/`
- `.agents/skills/decompose-codebase/`
- `packages/cli/skill-registry.json`
- `packages/cli/tests/`

The scan should confirm the active surfaces no longer document these as current behavior:

- `docs/prd/archive`
- `docs/plans/YYYY-MM-DD-decomposition-plan.md`
- `docs/work/YYYY-MM-DD-rebuild-backlog.md`
- `assets/templates/rebuild-backlog.md` as a retained installed asset

### 3. Confirm installed-surface correctness through tests

Do not rely solely on source inspection. Use the updated install and skill-catalog tests to prove that:

- optional `decompose-codebase` installs still work
- the intended local files install into the skill directory
- the retired one-file backlog template does not install
- no legacy `skill-assets` projection behavior reappears

### 4. Finish with a whitespace and diff sanity pass

Run `git diff --check` and treat trailing whitespace, malformed patch fallout, and accidental mixed-path leftovers as blockers to closeout.

## Acceptance Criteria

- [ ] `python packages/skills/decompose-codebase/scripts/test_validate_output.py` passes.
- [ ] `npm run build -w make-docs` passes.
- [ ] `npm test -w make-docs` passes.
- [ ] `bash scripts/check-instruction-routers.sh` passes.
- [ ] Targeted active-surface scans find no current-use references to the retired archive or one-file plan/backlog paths.
- [ ] Updated install tests prove the retained decompose skill asset set installs and the retired backlog template does not.
- [ ] `git diff --check` passes.
