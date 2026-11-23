---
title: "Phase 4: Removal and Guard"
kind: "work"
status: "active"
coordinate: "W34 R0 P4"
source:
  type: "prd"
  path: "docs/prd/08-skills-catalog-and-distribution.md"
---

# Phase 4: Removal and Guard

## Purpose

Remove the Python files only after the operations and the Skill text are in place. This is step 4 of the [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) operation-first order. It depends on P2 and P3.

## Overview

No first-party Skill ships Python after this phase. An update removes old installed copies that Make Docs wrote and keeps changed ones. A guard test stops new Python and new hand-written Skill scripts.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. An update removes the old Python files from an installed Skill when Make Docs wrote them, and keeps any file that a person changed ([PRD 08](../../prd/08-skills-catalog-and-distribution.md) R-SKILL-BUNDLE-7 and Validation Boundary).
- Intended human outcome: a person who runs `make-docs update` or `make-docs setup skills` sees each old file in the plan and result. A file they changed stays and shows as a conflict for review.
- Human-facing surface or indirect effect: the `update` and `setup skills` plans and results.
- Implementation work: registry entries, package checks, managed-removal tests, closeout code, file deletion, README, and the guard test.
- Evidence source or testing type selected under current authority: managed-removal tests for each removed file, the guard test, and `npm run smoke:pack`.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Managed-removal, guard, registry, install, Skill catalog, and package smoke tests. |
| Performance Testing | not-needed-now | Removing files does not change run time. |
| Guided Progress Review | not-needed-now | The existing update plan shows the removals. The tests prove both cases. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md): R-SKILL-BUNDLE-1, R-SKILL-BUNDLE-7, Validation Boundary
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): `Domain and Script Classification`, `Operation-First Migration Sequence`, `Managed Removal and MCP Safety`

## Source Obligations, Scenarios, And Findings

- [D-064 and R-008](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Registry, package, and managed removal

### Tasks

- [ ] T1: Remove the `.py` entries from `packages/cli/skill-registry.json`.
- [ ] T2: Update `skill-registry.test.ts`, `install.test.ts`, `skill-catalog.test.ts`, and the legacy path list in `scripts/smoke-pack.mjs`.
- [ ] T3: Add a test for each removed file: `make-docs update` and `make-docs setup skills` remove an unchanged installed copy through `planStaleSkillFile` in `packages/cli/src/planner.ts`, and keep a changed copy as a conflict for review.

### Acceptance criteria

- A16: `npm run smoke:pack` passes, and the packed CLI embeds no `.py` file.
- A17: The managed-removal test passes for each removed file, in the unchanged case and the changed case.

### Dependencies

- P2 and P3.
- Merge risk with W30 R0, which also changes `skill-registry.json`. See the [index](00-index.md#wave-sequence).

## Stage 2 - Closeout code, deletion, and guard

### Tasks

- [ ] T4: In `packages/cli/src/operations/closeout/index.ts`, remove the `python3` commands, the `test_validate_output.py` special case, and the two stale `closeout-commit` and `closeout-phase` commands. Name the new vitest files in its test command.
- [ ] T5: Delete the seven Python files and the tracked `packages/skills/decompose-codebase/scripts/__pycache__/validate_output.cpython-314.pyc`.
- [ ] T6: Change step 3 of "Adding a Skill" in `packages/skills/README.md`: deterministic logic goes in a CLI operation, and `scripts/` holds only generated bundles.
- [ ] T7: Add the guard test. It walks `packages/skills/` and fails on a `.py` file, a `.pyc` file, or a `__pycache__` folder. It fails when the registry declares a `.py` file. It fails on any file in a Skill `scripts/` folder that is not a generated bundle that matches a fresh build, and it reuses the P3 byte-match check. The `platform-safety` workflow already runs the full `packages/cli` vitest suite, so it needs no change.

Do not change history records, archives, or closed evidence that name the old scripts.

### Acceptance criteria

- A18: The guard test passes, and fails on each planted case: a `.py` file, a `.pyc` file, a `__pycache__` folder, a registry `.py` entry, and a hand-written `scripts/` file.
- A19: A search of `packages/` finds no `python3` command and no removed script name outside tests that check the removal.

### Dependencies

- Stage 1.
- Merge risk with W30 R0, which also changes `packages/skills/README.md`.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
