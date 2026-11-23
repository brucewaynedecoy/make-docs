---
title: "Phase 3: Project Register and Row Events"
kind: "work"
status: "active"
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

- [ ] t1: Update `project_register` at each Store write for a project: setup, adoption, legacy import, checkout register, checkout move, backlog cache write, and work evidence record.
- [ ] t2: Record `projectName` from config under PRD 38 R-ID-8, and refuse a name that another project holds, naming that project.
- [ ] t3: Add a test for each row event in the design that names the rows it creates, updates, or removes.
- [ ] t4: Rewrite project prune on the register under PRD 38 R-REGISTER-4. Keep `playbook_runs`. Add no new caller.
- [ ] t5: Keep the legacy `projects` table as a read-only legacy input.

### Acceptance criteria

- A11: Each row event touches only its named rows.
- A12: Two projects cannot hold the same name, and the refusal names the other project.
- A13: Project prune keeps `playbook_runs` and counts the remaining projects from `project_register`.

## Stage 2 - Project list

### Tasks

- [ ] t6: Add `project.register.list` (`make-docs project list`, MCP `project_list`) in `core` and `all`. Show each project's name first, then its ID, checkouts, last seen time, and each missing checkout folder.

### Acceptance criteria

- A14: `project list` CLI and MCP results match, and a missing checkout folder appears in plain words.

### Dependencies

- P2.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
