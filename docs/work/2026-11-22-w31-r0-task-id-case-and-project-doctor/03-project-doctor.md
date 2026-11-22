---
title: "Phase 3: Project Doctor"
kind: "work"
status: "active"
coordinate: "W31 R0 P3"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Project Doctor

## Purpose

Give every Make Docs project one reviewed way to find and fix project problems, starting with lower-case task IDs.

## Overview

This phase admits `project.doctor.check` and `project.doctor.fix`, builds the check list and the `task-id-case` check, and authors the agent twin reference.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. `check` names each problem in plain words, shows the exact change, and changes nothing. `fix` changes only what the person reviewed and says how to undo it ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-DOCTOR-3, R-DOCTOR-4).
- Intended human outcome: a person can see every planned change before anything changes, and can undo the fix.
- Human-facing surface or indirect effect: `project doctor check` and `project doctor fix` CLI and MCP output.
- Implementation work: registry admission, the check list, `task-id-case`, the digest-bound fix, MCP tools, and the `project-doctor` reference.
- Evidence source or testing type selected under current authority: no-write, parity, digest, stale-file, and exclusion tests; Guided Progress Review.
- Executor: the implementing agent prepares the review. The owner gives feedback.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | No-write check, CLI and MCP parity, digest-bound fix, stale-file refusal, exclusions, and skip rules on fixtures. |
| Performance Testing | not-needed-now | The doctor reads a few hundred small files once per run. |
| Guided Progress Review | selected | The owner reviews the check and fix wording on this repository before P4 applies the fix. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Commands

### Tasks

- [ ] t1: Admit `project.doctor.check` and `project.doctor.fix` in the registry with their CLI paths under `make-docs project doctor` and MCP tools in the `quality`, `setup`, and `all` profiles.
- [ ] t2: Build the check list. Each check has a stable ID, a scope, plain finding text, and an optional fix.
- [ ] t3: Build `check`: totals first in plain words, then each finding with file, line, current text, and replacement, and a review digest that binds the findings, the exclusions, and the file bytes.
- [ ] t4: Build `fix`: the project write permission, the digest check, a stale-file refusal that names the file, the existing reviewed write path with its backup, and a report of each changed file and the undo path.
- [ ] t5: Add the repeated `--exclude <path>` option to both commands, and refuse traversal and paths outside the project.

### Acceptance criteria

- A7: `check` writes nothing, and its CLI and MCP results match.
- A8: `fix` writes only the reviewed changes and refuses a file that changed after the check.
- A9: `--exclude` keeps every file under the excluded path unchanged, and the digest records the exclusion.
- A10: A clean project returns no findings and says so in plain words.

## Stage 2 - Check and agent twin

### Tasks

- [ ] t6: Build `task-id-case` for Markdown under `docs/work/`. Find task checkbox lines and whole-word task references in prose. Skip `.make-docs/archive/`, history records, fenced code, inline code, and link targets.
- [ ] t7: Author `make-docs://system/reference/project-doctor.md` in `packages/docs/template/`, add it to the system resource catalog, and reseed it. State that it is the agent twin of the doctor operations, and that a change to either form needs a review of the other.
- [ ] t8: Add shared fixtures that the CLI and the agent twin must answer the same way.

### Acceptance criteria

- A11: On fixtures, the check finds every lower-case task line and prose reference, and skips archives, history records, code, and link targets.
- A12: The resource catalog, the template, and the dogfood copy of `project-doctor.md` agree.

### Dependencies

- P1. It can run beside P2.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
