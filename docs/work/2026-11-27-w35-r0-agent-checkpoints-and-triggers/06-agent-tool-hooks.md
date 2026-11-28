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

Reach an agent that never commits, where its agent tool can run a hook. The owner chose design OD-10 option B, and decided on 2026-11-27 that each of the three agent tools that setup supports gets a hook method (design OD-13). It depends on P1 for the command and on P5 for the PRD 28 sentence.

## Overview

The agent tools are the three that setup supports today: Codex, Claude Code, and GitHub Copilot CLI. The owner states, from the owner's own check, that each of them supports hooks, and that for GitHub Copilot CLI the hook support is the vendor's hook support for that harness, in preview. This is the owner's statement of 2026-11-27. It answered owner gate OG-7 early: all three get a hook method. Stage 1 records the real hook contract of each tool, with one real run and its honest support status. The record no longer decides whether a tool gets a hook method. Stage 2 builds a hook method for each of the three. If the builder cannot find a real, usable hook contract for a tool, the task stops and asks the owner. It does not drop the tool silently. The [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) records no result of its own about hook support. A hook method of an adapter is new.

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A person does not need to tell an agent to sync, also for an agent that never commits, where its tool supports a hook.
- Intended human outcome: the owner reads one table that says, for each agent tool, what its hook contract is, what a real run showed, and its support status. A person who selects a hook method in setup sees what it adds and where, and gets the tool's configuration back as it was on removal.
- Human-facing surface or indirect effect: the hook contract table, the method screen of setup for a tool with a hook method, and the removal plan.
- Implementation work: the hook contract runs, the hook method of each of the three adapters, and its tests.
- Evidence source or testing type selected under current authority: real runs in each agent tool, adapter tests for each built method, and a Guided Progress Review of the hook contract table.
- Executor: the orchestrator starts each agent tool session under [standing rule 11](00-index.md#standing-rules). The implementing agent writes the records and builds. The owner sees the hook contract table in the phase report, and answers a stop for a tool when one happens.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Adapter tests for plan, apply, verify, repair, and removal of each built hook method. |
| Performance Testing | not-needed-now | A hook method runs the checkpoint that `PERF-007` measured. A hook at the end of a turn that adds a wait a person notices is recorded as a finding. |
| Guided Progress Review | selected | The owner sees the hook contract table in the phase report. |
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

The stage keeps its name. Its purpose changed on 2026-11-27: it records the hook contract that the builder needs, and it no longer decides whether a tool gets a hook method.

### Tasks

- [ ] T1: For each of the three first-party adapters in `packages/cli/src/harness-access/registry.ts` (Codex, Claude Code, and GitHub Copilot CLI), record the real hook contract that the builder needs, as PRD 28 and PRD 30 R-ADMIT-1 require. Record the events: whether the tool runs a command when a session starts, when a turn ends, or both. Record the configuration file and its place, and whether Make Docs can own one entry there and keep every other entry. Record the input that the hook receives, how the tool uses the hook result, and the install and removal steps. Make one real run in the tool, in a temporary project with a temporary Store. A page of documentation alone is not a contract record. Record the honest support status of the hook support, for example "preview". [Standing rule 11](00-index.md#standing-rules) says who starts each session. Record which tool ran which proof. If no real, usable hook contract is found for a tool, stop this task and ask the owner, with what was tried. Do not drop the tool silently, and do not build for it before the owner answers.
- [ ] T2: For each of the three tools, find whether a checkpoint that the hook starts passes that tool's Store access rules: write, read only, or nothing. Record what a person sees in each case.
- [ ] T3: Write the hook contract table in `evidence.md`: one row for each tool, with what was run, what was seen for `session-start` and for `turn-end`, the configuration path, the input that the hook receives, how the hook result is used, the install and removal steps, the ownership finding, the access finding, the support status, and the limits. Add one column that says who started the session. Owner gate OG-7 is answered, so this task brings no gate. The phase report shows the table to the owner. The generic MCP client profile gets no hook method.
- [ ] T4: Record in the [risk register](../../prd/03-open-questions-and-risk-register.md) the support status and the limits of the hook support of each tool, for example a hook contract in preview that can change. If T1 stopped for a tool, record what was tried, the owner's answer, and its date.

### Acceptance criteria

- A63: Each of the three adapters has a hook contract row with one real run, the support status, and the name of who started the session. No row rests on documentation alone. For a tool with no usable hook contract, T1 stopped, the owner was asked, and the evidence records the owner's answer and its date.
- A64: The hook contract table is complete, with one row for each adapter, the events that each row supports, the configuration file and its place, the input that the hook receives, how the hook result is used, and the install and removal steps. The phase report shows it to the owner.
- A65: The register holds the support status and the limits of the hook support of each tool. No tool is without a hook method unless the owner said so in answer to a stop.

### Dependencies

- P1.

## Stage 2 - Hook methods

Owner gate OG-7 is answered: each of the three agent tools gets a hook method. So this stage starts when Stage 1 and P5 are done, and T5 to T8 run for each of the three tools. The "not needed" closing rule changed on 2026-11-27. The builder never closes a task of this stage as not needed by its own choice. Only the owner's answer to a stop under T1 can take a tool out. If the owner's answer takes out every tool, do only T9, close each of T5 to T8 with `make-docs work close <task> --outcome superseded`, and record the owner's answer in the closeout notes. Do not close them as `cancelled`. Readiness counts only the outcomes `done` and `superseded` as met (`WORK_DEPENDENCY_MET_OUTCOMES` in `packages/cli/src/operations/work/work-store/catalog.ts`), and a unit that depends on a cancelled unit waits with the reason `dependency-cancelled`.

### Tasks

- [ ] T5: For each of the three tools, add a hook method to its adapter, from the hook contract that T1 recorded. The method fires `session-start`, `turn-end`, or both, as the contract supports, and runs `make-docs project checkpoint --event <name>`, so each run is a trigger run. The method declares one owned native entry, planning, apply, verification, repair, and removal (PRD 28 R-HARNESS-1), and writes a receipt that records its history (R-HARNESS-17). It uses the separate system approval and the adapter-owned planner of PRD 25 R-ACCESS-5, and keeps unknown and user-owned entries.
- [ ] T6: Show the hook method in setup for each of the three tools, with its support status. The person selects it by an explicit input, in every mode. It is off by default. The machine preference for git hooks never installs it (the owner's answer to OG-5, design OD-11). A hook method is an extra choice beside the one connection method of an agent tool ([PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) R-SETUP-CLI-10, PRD 28 R-HARNESS-2). It does not replace that method or count as it. A non-interactive run with no hook input adds no hook method. The review says what the hook runs and when.
- [ ] T7: Add adapter tests for each built method: plan, apply, verify, drift, repair, and removal, with entries of another owner kept byte for byte. Add a test that a hook run with no Store, no Make Docs project, or no `make-docs` command does nothing and does not fail the tool's action.
- [ ] T8: Record one real session for each built method: the session starts or a turn ends, and the checkpoint runs with no prompt from the person.
- [ ] T9: Update [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) with new R-HARNESS-23 for the hook method, the tools that have one, and the support status of each, and [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) only if the method screen needs a new rule, each with a `W35 R0 P6` Requirement History entry. If the owner's answer to a stop took a tool out, PRD 28 names that tool and says so in one sentence. Add the P6 section to `evidence.md`, with the owner's statement of 2026-11-27 that answered OG-7, and each owner answer to a stop with its date.

### Acceptance criteria

- A66: Each built hook method passes its adapter tests, and removal leaves the tool's configuration byte-identical to its state before setup.
- A67: A hook method is selectable for each of the three tools, is off by default, and appears in the setup review with what it runs, when, and its support status. It is installed only by an explicit input. With the machine preference for git hooks on, a setup run with no hook input for an agent tool installs no hook method.
- A68: Each recorded session shows the checkpoint at the event with no prompt from the person, and names the trigger.
- A69: `make-docs check prd` passes, and PRD 28 names each tool with a hook method and its support status. The evidence records the owner's statement of 2026-11-27 that answered OG-7.

### Dependencies

- Stage 1.
- P5.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
