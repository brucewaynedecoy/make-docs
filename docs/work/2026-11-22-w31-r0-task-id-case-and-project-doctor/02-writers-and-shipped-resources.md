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

- [x] T1: Change `.make-docs/system/templates/work-phase.md`, `.make-docs/system/contracts/output-contract.md`, `.make-docs/system/references/execution-workflow.md`, and `.make-docs/system/references/wave-model.md` in `packages/docs/template/` to write `T`.
- [x] T2: Change `docs/AGENTS.md`, `docs/CLAUDE.md`, `docs/AGENTS.codex-only.md`, `docs/CLAUDE.claude-only.md`, `docs/work/AGENTS.md`, and `docs/work/CLAUDE.md` in `packages/docs/template/` to write `T`.
- [x] T3: Change CLI text and results that name task IDs to `T`: the phase check warning and the task `id` in `run` results from `packages/cli/src/operations/work/index.ts`.
- [x] T4: Search the shipped Skills and generated bundles for lower-case task IDs, and update any hit.
- [x] T5: Reseed each changed template-owned file into this repository, refresh the bundled template, and update `docs/assets/project/migrated-operations-inventory.md` if it names the task form.

### Acceptance criteria

- A4: A search of `packages/docs/template/` finds no lower-case task ID.
- A5: Each changed template-owned file matches its dogfood copy byte for byte.
- A6: The template validation suite passes.

### Dependencies

- P1.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 5 new writer tests, the shipped-file search (A4), the dogfood parity check (A5), the template validation suite (A6), the router check, 46 validator tests, the type check, and the full suite with only the 3 known failures ([evidence](evidence.md#p2-writers-and-shipped-resources)). Performance Testing `not-needed-now`: text changes only. Guided Progress Review `not-needed-now`: the wording change is mechanical. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: an agent that follows the shipped template, contracts, references, or routers now writes `- [ ] T1: ...`. The wave model and the output contract say to write `T` and that a lower-case `t` is read as the same task ID. `run` results give `T1` for a file with `t1`, and the phase check warning now says `expected task id T3, found T5`. The decompose-codebase Skill template, references, and validator errors use `T` too. A person who types `t3` still gets the same result.
- Optional experience handoff: not applicable. The wording change is mechanical.
- Explicit human acceptance gate: none beyond review of this phase.
- Evidence report: [P2 Writers and Shipped Resources](evidence.md#p2-writers-and-shipped-resources).
- Phase / capability status: Phase complete on commit and review. Capability partial: the doctor (P3) and the one-time rewrite (P4) remain.
