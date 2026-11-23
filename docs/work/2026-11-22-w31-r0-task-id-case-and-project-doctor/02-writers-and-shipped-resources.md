---
title: "Phase 2: Writers and Shipped Resources"
kind: "work"
status: "active"
coordinate: "W31 R0 P2"
source:
  type: "prd"
  path: "docs/prd/06-template-contracts-and-generated-assets.md"
---

# Phase 2: Writers and Shipped Resources

## Purpose

Make every shipped file and every CLI text write `T`, so new backlogs use the right form from the start.

## Overview

Ten template-owned files and the phase check warning name `t1` today. This phase changes them upstream first, then reseeds this repository's copy.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Every coordinate that Make Docs writes uses upper-case letters ([PRD 06](../../prd/06-template-contracts-and-generated-assets.md) R-TASK-RESOURCE-1, [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-22).
- Intended human outcome: an agent that follows the shipped guidance writes `T1`, `T2`, and so on.
- Human-facing surface or indirect effect: the work phase template, contracts, references, routers, and CLI warnings.
- Implementation work: upstream template edits, CLI text, reseed, and bundled template refresh.
- Evidence source or testing type selected under current authority: shipped-file search and template parity checks.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Template validation, dogfood parity, and a search for lower-case task IDs in shipped files. |
| Performance Testing | not-needed-now | Text changes only. |
| Guided Progress Review | not-needed-now | The wording change is mechanical. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Shipped files

### Tasks

- [ ] t1: Change `.make-docs/system/templates/work-phase.md`, `.make-docs/system/contracts/output-contract.md`, `.make-docs/system/references/execution-workflow.md`, and `.make-docs/system/references/wave-model.md` in `packages/docs/template/` to write `T`.
- [ ] t2: Change `docs/AGENTS.md`, `docs/CLAUDE.md`, `docs/AGENTS.codex-only.md`, `docs/CLAUDE.claude-only.md`, `docs/work/AGENTS.md`, and `docs/work/CLAUDE.md` in `packages/docs/template/` to write `T`.
- [ ] t3: Change CLI text and results that name task IDs to `T`: the phase check warning and the task `id` in `run` results from `packages/cli/src/operations/work/index.ts`.
- [ ] t4: Search the shipped Skills and generated bundles for lower-case task IDs, and update any hit.
- [ ] t5: Reseed each changed template-owned file into this repository, refresh the bundled template, and update `docs/assets/project/migrated-operations-inventory.md` if it names the task form.

### Acceptance criteria

- A4: A search of `packages/docs/template/` finds no lower-case task ID.
- A5: Each changed template-owned file matches its dogfood copy byte for byte.
- A6: The template validation suite passes.

### Dependencies

- P1.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
