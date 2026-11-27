---
title: "Phase 6: Agent Tool Hooks"
kind: "work"
status: "draft"
coordinate: "W35 R0 P6"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 6: Agent Tool Hooks

## Purpose

Reach an agent that never commits, where its agent tool can run a hook. The owner chose design OD-10 option B: the Wave builds a hook for each agent tool that has proof of support. It depends on P1 for the command and on P5 for the PRD 28 sentence.

## Overview

Stage 1 gathers real capability evidence for each agent tool that setup supports today. The owner then confirms the evidence table at owner gate OG-7. Stage 2 builds a hook method only for a tool whose confirmed row shows proof. A tool with no proof gets no hook and a recorded reason. When no tool has proof, the phase ends after Stage 1 with no harm, and the git hooks, the router rule, the MCP instructions, and the reminder still cover every agent. The [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) claims no hook support for any agent tool. A hook method of an adapter is new.

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A person does not need to tell an agent to sync, also for an agent that never commits, where its tool supports a hook.
- Intended human outcome: the owner reads one table that says, for each agent tool, what a real run showed. A person who selects a hook method in setup sees what it adds and where, and gets the tool's configuration back as it was on removal.
- Human-facing surface or indirect effect: the capability evidence table, the method screen of setup for a tool with a hook method, and the removal plan.
- Implementation work: capability runs, the hook method of each confirmed adapter, and its tests.
- Evidence source or testing type selected under current authority: real runs in each agent tool, adapter tests for each built method, and a Guided Progress Review of the evidence table.
- Executor: the orchestrator starts each agent tool session under [standing rule 11](00-index.md#standing-rules). The implementing agent writes the records and builds. The owner confirms the evidence table at OG-7.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Adapter tests for plan, apply, verify, repair, and removal of each built hook method. |
| Performance Testing | not-needed-now | A hook method runs the checkpoint that `PERF-007` measured. A hook at the end of a turn that adds a wait a person notices is recorded as a finding. |
| Guided Progress Review | selected | The owner sees the capability evidence table at OG-7. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md): R-HARNESS-1, R-HARNESS-17, R-HARNESS-20, `Optional Agentics Boundary`. This phase adds R-HARNESS-23.
- [30 Plugin Substrate and Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md): R-ADMIT-1, R-ADMIT-2, R-ADMIT-4, R-ADMIT-5, R-SELECT-4, R-SELECT-5
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-ACCESS-3, R-ACCESS-5, R-ACCESS-16
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md): R-SETUP-CLI-2, R-SETUP-CLI-7, R-SETUP-CLI-8
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): R-HARNESS-STATE-1 to R-HARNESS-STATE-6

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: the access runs of [P4](04-git-hook-proofs.md) T10.

## Stage 1 - Capability evidence

### Tasks

- [ ] T1: For each of the three first-party adapters in `packages/cli/src/harness-access/registry.ts`, gather real capability evidence, as PRD 28 and PRD 30 R-ADMIT-1 require. Find whether the tool can run a command when a session starts and when a turn ends. Find where that configuration lives, whether Make Docs can own one entry there and keep every other entry, and what the tool passes to the command. Evidence is a real run in the tool, in a temporary project with a temporary Store. A page of documentation alone is not proof. [Standing rule 11](00-index.md#standing-rules) says who starts each session. Record which tool ran which proof. A tool with no run gets no hook method, with the recorded reason "no proof gathered".
- [ ] T2: For each tool with a working hook point, find whether a checkpoint that the hook starts passes that tool's Store access rules: write, read only, or nothing. Record what a person sees in each case.
- [ ] T3: Write the evidence table in `evidence.md`: one row for each tool, with what was run, what was seen for `session-start` and for `turn-end`, the configuration path, the ownership finding, the access finding, and the limits. Add one column that says who started the session. Bring owner gate OG-7 to the owner with the table. The generic MCP client profile gets no hook method.
- [ ] T4: Record in the [risk register](../../prd/03-open-questions-and-risk-register.md) each agent tool that gets no hook method, with what was tried and the reason.

### Acceptance criteria

- A63: Each of the three adapters has an evidence row with a real run and the name of who started the session, or the recorded reason "no proof gathered". No row claims support from documentation alone.
- A64: The evidence table is complete, with one row for each adapter and the events that each row supports, and the owner has it with owner gate OG-7.
- A65: Each tool with no hook method has its reason in the register.

### Dependencies

- P1.

## Stage 2 - Hook methods

This stage starts only when the owner confirmed the evidence table at OG-7. When no confirmed row shows proof, do only T9. Close each of T5 to T8 with `make-docs work close <task> --outcome superseded`, and say in the closeout notes that they were not needed. Do not close them as `cancelled`. Readiness counts only the outcomes `done` and `superseded` as met (`WORK_DEPENDENCY_MET_OUTCOMES` in `packages/cli/src/operations/work/work-store/catalog.ts`), and a unit that depends on a cancelled unit waits with the reason `dependency-cancelled`. Then close the phase as done after T9, so that P7 Stage 1 is not blocked.

### Tasks

- [ ] T5: For each confirmed tool, add a hook method to its adapter. The method fires `session-start`, `turn-end`, or both, as the evidence supports, and runs `make-docs project checkpoint --event <name>`, so each run is a trigger run. The method declares one owned native entry, planning, apply, verification, repair, and removal (PRD 28 R-HARNESS-1), and writes a receipt that records its history (R-HARNESS-17). It uses the separate system approval and the adapter-owned planner of PRD 25 R-ACCESS-5, and keeps unknown and user-owned entries.
- [ ] T6: Show the hook method in setup for a confirmed tool. The person selects it explicitly. It is off by default. A hook method is an extra choice beside the one connection method of an agent tool ([PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) R-SETUP-CLI-10, PRD 28 R-HARNESS-2). It does not replace that method or count as it. A non-interactive run with no hook input adds no hook method. The review says what the hook runs and when.
- [ ] T7: Add adapter tests for each built method: plan, apply, verify, drift, repair, and removal, with entries of another owner kept byte for byte. Add a test that a hook run with no Store, no Make Docs project, or no `make-docs` command does nothing and does not fail the tool's action.
- [ ] T8: Record one real session for each built method: the session starts or a turn ends, and the checkpoint runs with no prompt from the person.
- [ ] T9: Update [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) with new R-HARNESS-23 for the hook method and the tools that have one, and [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) only if the method screen needs a new rule, each with a `W35 R0 P6` Requirement History entry. When no tool has a hook method, PRD 28 says so in one sentence. Add the P6 section to `evidence.md`, with the owner's answer at OG-7 and its date.

### Acceptance criteria

- A66: Each built hook method passes its adapter tests, and removal leaves the tool's configuration byte-identical to its state before setup.
- A67: A hook method is selectable only for a confirmed tool, is off by default, and appears in the setup review with what it runs and when.
- A68: Each recorded session shows the checkpoint at the event with no prompt from the person, and names the trigger.
- A69: `make-docs check prd` passes, and PRD 28 names each tool with a hook method, or says that no adapter has one. The evidence records the owner's answer at OG-7 and its date.

### Dependencies

- Stage 1.
- P5.
- Owner gate OG-7: the owner confirms the evidence table.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
