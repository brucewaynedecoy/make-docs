---
title: "Phase 3: Routers and MCP Instructions"
kind: "work"
status: "draft"
coordinate: "W35 R0 P3"
source:
  type: "prd"
  path: "docs/prd/15-agent-instruction-ownership-and-managed-blocks.md"
---

# Phase 3: Routers and MCP Instructions

## Purpose

Put the same rule in front of an agent at three more points: the root router, the `docs/work/` router, and the MCP connection. It depends on P1 for the command name.

## Overview

This phase changes shipped text only, and one small part of the MCP server. Every text is written in `packages/docs/template/` first and then copied byte for byte to this repository's installed copy. The managed block of the root router changes in every installed project on its next update, so the phase proves the normal conflict review. The exact wording of the lines is new in the [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md), and the MCP server sends instructions for the first time.

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Without a Store, nothing new happens and nothing fails, and the routers still say the true thing: the files are the authority. With a Store, an agent meets the rule with no person who tells it.
- Intended human outcome: a person who reads a router line can tell who is in charge of the work records, which command to read work with, and which command to run after an edit, in both cases: with a Store and without one.
- Human-facing surface or indirect effect: the managed block of `AGENTS.md` and `CLAUDE.md` at the project root and in `docs/work/`, the work store reference, and the instructions that an MCP host shows or passes to its agent.
- Implementation work: the template text, the dogfood copies, the MCP server instructions, and the name test.
- Evidence source or testing type selected under current authority: byte-match tests, the name test, MCP instruction tests for each profile, an update test with a changed block, and a Guided Progress Review of the lines.
- Executor: the implementing agent runs the tests. The owner reads the lines.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Byte-match, name, MCP instruction, and update conflict tests. |
| Performance Testing | not-needed-now | Text only. No performance candidate exists in this phase. |
| Guided Progress Review | selected | The owner reads the two router lines and the MCP instructions. |
| Unassisted Goal Testing | not-needed-now | The recorded agent sessions of [P7](07-acceptance.md) show whether an agent obeys the text. |

## Source PRD Docs

- [15 Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md): R-ROUTER-STATE-1, `Managed-Block Conflict Resolution`, `Discovery Without the CLI`. This phase adds R-WORK-ROUTER.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-MCP-PROFILE-1 to R-MCP-PROFILE-4, R-MCP-PROFILE-8, `Current MCP Surface`. This phase adds R-MCP-INSTR.
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-NAME-6
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-1 to R-WORK-STORE-3, R-WORK-STORE-6
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md): R-WORK-RESOURCE-1

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: none

## Stage 1 - Router lines and the reference

Merge risk: W22 R1 and W22 R2 are not complete, and they own the managed block rules of the root routers. This stage adds one line to that block in `packages/docs/template/AGENTS.md`, `packages/docs/template/CLAUDE.md`, and the installed copies. The branch that merges second rebases and reruns the router and byte-match tests. This note is not a dependency, so it stands here and not under `### Dependencies`. See the [index](00-index.md#wave-sequence).

### Tasks

- [ ] T1: Add one line to the managed block of `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md`. Proposed text from the design: "When the work store is in charge (`make-docs work status` says so), read work with `make-docs work next` and `make-docs resource read`, not with file searches, and run `make-docs project checkpoint` after you change files under `docs/work/` and after you close a phase. Without the CLI or a usable Store, the `docs/work/` files are the authority." The command has no `--event`, so an agent that obeys it makes a direct run.
- [ ] T2: Replace today's work store line in the managed block of `packages/docs/template/docs/work/AGENTS.md` and `packages/docs/template/docs/work/CLAUDE.md` (design OD-3 option A). Proposed text from the design: "When the work store is present, it is the authority (`make-docs work status` says which). Read it with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, read `.make-docs/system/references/work-store.md` or `make-docs://system/reference/work-store.md`." The note changes no work file.
- [ ] T3: Add the trigger text to the work store reference in `packages/docs/template/.make-docs/system/references/work-store.md`: an agent runs the checkpoint after an edit under `docs/work/`, after a phase closes, and at the start of a session, and each of these is a direct run. Name the six events and say that only a hook starts a trigger run.
- [ ] T4: Copy each changed template file byte for byte to this repository's installed copy: `AGENTS.md`, `CLAUDE.md`, `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, and `.make-docs/system/references/work-store.md`. Add or extend a test that fails when a template file and its installed copy differ.
- [ ] T5: Prove the update path. A project with an unchanged managed block gets the new line on update. A project whose block a person changed goes to the normal conflict review of PRD 15, and nothing is overwritten.

### Acceptance criteria

- A30: Each of the five template files and its installed copy are byte-identical.
- A31: Each router line names who is in charge, the read command, and the checkpoint command, and says what holds without the CLI or a usable Store. A reader needs no other document to act on it.
- A32: The work store reference names the three moments when an agent runs the checkpoint: after an edit under `docs/work/`, after a phase closes, and at the start of a session. It says that each of them is a direct run, names the six events, and says that only a hook starts a trigger run.
- A33: An update applies the new line to an unchanged block and sends a changed block to conflict review with the person's text kept.
- A34: No work file under `docs/work/` changes in this phase, so no digest changes and no sync starts.

### Dependencies

- P1.

## Stage 2 - MCP server instructions

### Tasks

- [ ] T6: Make `createMakeDocsMcpServer` in `packages/cli/src/mcp/server.ts` send short server instructions when an agent connects. The text is the same rule as the root router line, in the same conditional words, with the tool names `work_status`, `work_next`, and `project_checkpoint`. The design's event table makes these instructions the adapter of `session-start`. So the instructions also tell the agent to run `project_checkpoint` at the start of a session, as a direct run with no event. A profile that has no work tool sends no work rule.
- [ ] T7: Add a test that each router line, the work store reference, and the MCP instructions name the current checkpoint command or tool from the name catalog ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-NAME-6). The test fails on a fixture with a former or unknown name.

### Acceptance criteria

- A35: The instructions appear for the `all`, `backlog`, and `workflow` profiles, name the checkpoint tool, and tell the agent to run it at the start of a session. A profile with no work tool sends no work rule.
- A36: The name test passes, and fails on a fixture that names a command or tool that the catalog does not hold.

### Dependencies

- P1.
- P2 Stage 2.

## Stage 3 - PRDs and evidence

### Tasks

- [ ] T8: Update the PRDs with a `W35 R0 P3` Requirement History entry in each:
  - [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md): a new `### Work Store Router Discovery` section with R-WORK-ROUTER requirements for the meaning of the root router line and of the `docs/work/` note, and the rule that both hold without a Store.
  - [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): new R-MCP-INSTR requirements for the server instructions and the profile rule.
  - PRD 39 R-NAME-6, if the shipped-text set gains the MCP server instructions.
- [ ] T9: Add the P3 section to `evidence.md`, with the final text of each line for the owner.

### Acceptance criteria

- A37: `make-docs check prd` and the shipped-text test pass.
- A38: The owner reads the two router lines and the MCP instructions as shipped, and the evidence records the final wording.

### Dependencies

- Stage 1.
- Stage 2.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
