---
title: "W34 R0 P4 Removal and Guard"
kind: "plan"
status: "draft"
coordinate: "W34 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-23-skill-scripts-into-the-cli.md"
---

# W34 R0 P4 Removal and Guard

## Purpose

Remove the Python files only after the operations and the Skill text are in place. This is step 4 of the PRD 25 operation-first order.

## Outcome

No first-party Skill ships Python. An update removes old installed copies that Make Docs wrote and keeps changed ones. A guard test stops new Python and new hand-written Skill scripts.

## Scope

- Remove the `.py` entries from `packages/cli/skill-registry.json`.
- Update `skill-registry.test.ts`, `install.test.ts`, `skill-catalog.test.ts`, and the legacy path list in `scripts/smoke-pack.mjs`.
- Add a test for each removed file: `make-docs update` and `make-docs setup skills` remove an unchanged installed copy through `planStaleSkillFile` in `packages/cli/src/planner.ts`, and keep a changed copy as a conflict for review.
- In `packages/cli/src/operations/closeout/index.ts`, remove the `python3` commands, the `test_validate_output.py` special case, and the two stale `closeout-commit` and `closeout-phase` commands. Name the new vitest files in its test command.
- Delete the seven Python files and the tracked `packages/skills/decompose-codebase/scripts/__pycache__/validate_output.cpython-314.pyc`.
- Change step 3 of "Adding a Skill" in `packages/skills/README.md`: deterministic logic goes in a CLI operation, and `scripts/` holds only generated bundles.
- Add the guard test. It walks `packages/skills/` and fails on a `.py` file, a `.pyc` file, or a `__pycache__` folder. It fails when the registry declares a `.py` file. It fails on any file in a Skill `scripts/` folder that is not a generated bundle that matches a fresh build. It reuses the P3 byte-match check.
- The `platform-safety` workflow already runs the full `packages/cli` vitest suite, so it needs no change.

## Exclusions

- No change to history records, archives, or closed evidence that name the old scripts.

## Acceptance

- `npm run smoke:pack` passes, and the packed CLI embeds no `.py` file.
- Each managed-removal test passes for the unchanged and changed cases.
- The guard test passes, and fails on each planted case.
- A search of `packages/` finds no `python3` command and no removed script name outside tests that check the removal.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed`.
- Guided Progress Review: `not-needed-now`.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P2 and P3.
- Merge risk with W30 R0, which also changes `skill-registry.json` and `packages/skills/README.md`.
