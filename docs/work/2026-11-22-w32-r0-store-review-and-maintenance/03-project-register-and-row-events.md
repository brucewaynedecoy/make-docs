---
title: "Phase 3: Project Register and Row Events"
kind: "work"
status: "completed"
coordinate: "W32 R0 P3"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 3: Project Register and Row Events

## Purpose

Fill the project register from every row event, prove each event, and let a person list the projects.

## Overview

Every Store write for a project updates `project_register`. Each row event gets a test. Project prune moves onto the register. `make-docs project list` shows every project.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. `make-docs project list` shows every project that the Store knows ([PRD 38](../../prd/38-global-store-and-project-state.md) R-REGISTER-3, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-STORE-CMD-2).
- Intended human outcome: a person sees each project by name first, with its checkouts and any missing folder in plain words.
- Human-facing surface or indirect effect: `project list` CLI and `project_list` MCP output.
- Implementation work: register writes, name refusal, row-event tests, prune rewrite, and the list operation.
- Evidence source or testing type selected under current authority: row-event tests, parity, Guided Progress Review.
- Executor: the implementing agent prepares the review. The owner gives feedback.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | A test for each row event, name refusal, prune on the register, and `project list` CLI and MCP parity. |
| Performance Testing | not-needed-now | Small reads and writes. |
| Guided Progress Review | selected | The owner reviews `project list` output on this machine's projects. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Register and row events

### Tasks

- [x] T1: Update `project_register` at each Store write for a project: setup, adoption, legacy import, checkout register, checkout move, backlog cache write, and work evidence record.
- [x] T2: Record `projectName` from config under PRD 38 R-ID-8, and refuse a name that another project holds, naming that project.
- [x] T3: Add a test for each row event in the design that names the rows it creates, updates, or removes.
- [x] T4: Rewrite project prune on the register under PRD 38 R-REGISTER-4. Keep `playbook_runs`. Add no new caller.
- [x] T5: Keep the legacy `projects` table as a read-only legacy input.

### Acceptance criteria

- A11: Each row event touches only its named rows.
- A12: Two projects cannot hold the same name, and the refusal names the other project.
- A13: Project prune keeps `playbook_runs` and counts the remaining projects from `project_register`.

## Stage 2 - Project list

### Tasks

- [x] T6: Add `project.register.list` (`make-docs project list`, MCP `project_list`) in `core` and `all`. Show each project's name first, then its ID, checkouts, last seen time, and each missing checkout folder.

### Acceptance criteria

- A14: `project list` CLI and MCP results match, and a missing checkout folder appears in plain words.

### Dependencies

- P2.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 30 new tests, 29 in `packages/cli/tests/w32-r0-p3-project-register.test.ts` (16 row-event tests, 7 name tests, 4 `project list` tests, 2 path-comparison tests) and 1 in `packages/cli/tests/w32-r0-p3-recover-lock-doubt.test.ts`, the updated prune, tool-list, and name-catalog tests, the type check, and the full suite with only the 3 known failures and one load timeout that passes alone. Mutation runs show that the tests catch the old path comparisons, a commit that refuses a taken name, and a recovery that deletes a lock on doubt. After an independent review, a taken name no longer blocks a commit or a recovery, lifecycle writes record the register row, a project ID that is another project's name is refused, and recovery deletes only locks that match by the platform key. Guided Progress Review selected and pending: the owner runs `make-docs project list` on this machine's projects. The builder ran it only on fixture Stores, because no test or builder may open the real Store. Performance Testing and Unassisted Goal Testing are `not-needed-now`, as decided above.
- Performance evidence: none. Each Store write for a project adds two small reads and one upsert on `project_register`, inside the same transaction as the write. `project list` reads two tables and checks each checkout folder once.
- Human Experience Review: `project list` puts each project's name first, then its ID, last seen time, and checkouts. A missing folder reads "The folder is missing. It was moved or deleted." A project with no name reads "(no project name)". A checkout with no register row reads "Last seen: not recorded yet. The next Make Docs write for this project records it." A name that another project holds stops the start of a write with the other project's ID and checkout path and the next step "Choose another projectName in .make-docs/config.yaml". A recovery never stops on a name: `project state recover` prints "Project name: …" with the kept name and the next step. In `setup`, that message is the `failedCondition`, but the general `nextAction` still says "Correct the reported Store prerequisite"; P5 reviews that wording.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: pending owner review of the decisions in the [evidence report](evidence.md#decisions-for-the-owner-1) and the Guided Progress Review of `project list`.
- Evidence report: [P3 Project Register and Row Events](evidence.md#p3-project-register-and-row-events).
- Phase / capability status: Phase complete on commit after owner review. Capability partial: the maintenance commands and rule activation (P4) and the real Store proof (P5) remain.
