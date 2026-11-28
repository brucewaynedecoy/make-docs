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

- [x] T1: Add one line to the managed block of `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md`. Proposed text from the design: "When the work store is in charge (`make-docs work status` says so), read work with `make-docs work next` and `make-docs resource read`, not with file searches, and run `make-docs project checkpoint` after you change files under `docs/work/` and after you close a phase. Without the CLI or a usable Store, the `docs/work/` files are the authority." The command has no `--event`, so an agent that obeys it makes a direct run.
- [x] T2: Replace today's work store line in the managed block of `packages/docs/template/docs/work/AGENTS.md` and `packages/docs/template/docs/work/CLAUDE.md` (design OD-3 option A). Proposed text from the design: "When the work store is present, it is the authority (`make-docs work status` says which). Read it with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, read `.make-docs/system/references/work-store.md` or `make-docs://system/reference/work-store.md`." The note changes no work file. The owner replaced the word "present" on 2026-11-28, after the review finding: the shipped note says "When the work store is in charge", and the [evidence](evidence.md#the-lines-for-the-owner-a38) holds its exact text.
- [x] T3: Add the trigger text to the work store reference in `packages/docs/template/.make-docs/system/references/work-store.md`: an agent runs the checkpoint after an edit under `docs/work/`, after a phase closes, and at the start of a session, and each of these is a direct run. Name the six events and say that only a hook starts a trigger run.
- [x] T4: Copy each changed template file byte for byte to this repository's installed copy: `AGENTS.md`, `CLAUDE.md`, `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, and `.make-docs/system/references/work-store.md`. Add or extend a test that fails when a template file and its installed copy differ.
- [x] T5: Prove the update path. A project with an unchanged managed block gets the new line on update. A project whose block a person changed goes to the normal conflict review of PRD 15, and nothing is overwritten.

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

- [x] T6: Make `createMakeDocsMcpServer` in `packages/cli/src/mcp/server.ts` send short server instructions when an agent connects. The text is the same rule as the root router line, in the same conditional words, with the tool names `work_status`, `work_next`, and `project_checkpoint`. The design's event table makes these instructions the adapter of `session-start`. So the instructions also tell an agent that starts work on the project's backlog to run `project_checkpoint`, as a direct run with no event. The agent adds the write permission (`allowWrite`) only when its task may change the project's files. A profile that has no work tool sends no work rule.
- [x] T7: Add a test that each router line, the work store reference, and the MCP instructions name the current checkpoint command or tool from the name catalog ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-NAME-6). The test fails on a fixture with a former or unknown name.

### Acceptance criteria

- A35: The instructions appear for the `all`, `backlog`, and `workflow` profiles, name the checkpoint tool, and tell an agent that starts work on the backlog to run it. The instructions ask for the write permission only when the agent's task may change project files. A profile with no work tool sends no work rule.
- A36: The name test passes, and fails on a fixture that names a command or tool that the catalog does not hold.

### Dependencies

- P1.
- P2 Stage 2.

## Stage 3 - PRDs and evidence

### Tasks

- [x] T8: Update the PRDs with a `W35 R0 P3` Requirement History entry in each:
  - [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md): a new `### Work Store Router Discovery` section with R-WORK-ROUTER requirements for the meaning of the root router line and of the `docs/work/` note, and the rule that both hold without a Store.
  - [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): new R-MCP-INSTR requirements for the server instructions and the profile rule.
  - PRD 39 R-NAME-6, if the shipped-text set gains the MCP server instructions.
- [x] T9: Add the P3 section to `evidence.md`, with the final text of each line for the owner.

### Acceptance criteria

- A37: `make-docs check prd` and the shipped-text test pass.
- A38: The owner reads the two router lines and the MCP instructions as shipped, and the evidence records the final wording.

### Dependencies

- Stage 1.
- Stage 2.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done. `packages/cli/tests/w35-r0-p3-routers-and-mcp-instructions.test.ts` (36 tests) covers the byte match of the five template files and their installed copies, with a fixture that fails; the root line and the `docs/work/` note, each sentence; the trigger text of the reference; the name check on each text, with fixtures of a former name, an unknown name, and a changed catalog; the MCP instructions through a real client connection for each of the seven profiles; and the update path through the planner, for an unchanged block, a changed block, and a reviewed overwrite. Performance Testing `not-needed-now`: the phase is text and one fixed string at server start. Guided Progress Review `selected`, prepared and not done: the owner reads the lines. Unassisted Goal Testing `not-needed-now`.
- Performance evidence: none needed. No performance candidate exists in this phase.
- Human Experience Review: prepared, not done. The final text of each line is in the [evidence](evidence.md#the-lines-for-the-owner-a38), with a table that shows how each text holds with a Store, with a Store that is not in charge, with no Store, and with no CLI.
- The wording: the exact words of the root line, the trigger text, and the MCP instructions are a proposal. The owner did not decide them. The owner chose the exact words of the `docs/work/` note on 2026-11-28. The PRDs fix the meaning of each text and not its words.
- T2: the `docs/work/` routers have a managed block, and the note is in it. No work file changed (A34).
- T4: this repository's `AGENTS.md` and `CLAUDE.md` hold their own text after the managed block. So for these two files the installed block is the template file byte for byte, and the text after the block did not change. The other three files match whole.
- T5: a real update by hand, from the released 2.1.0 package to the built CLI, with a temporary Store. An unchanged block got the new line. A changed block ended `blocked` with the conflict review, and no file changed. The [evidence](evidence.md#the-update-path-t5-a33) holds the commands and the results.
- The independent review of 2026-11-27 and its fix pass: the review found that the MCP instructions told every agent to pass the write permission at the start of every session, that a missing catalog name stopped the MCP server, that the last sentence of the root line did not cover a checkout that is not bound, and that the reference named the tool argument as `--event`. The fix pass changed all four. The review also found that the `docs/work/` note is not true for a Store that is present and not in charge. The note kept the owner's word "present" then, so that finding waited for the owner, and the fix pass did not change the note. The [evidence](evidence.md#the-review-finding-on-the-note-answered-by-the-owner) holds the finding and the reviewer's proposed text.
- The owner's decision of 2026-11-28 on the note (question P3-1, option a): replace the word "present", because a Store can be present and not in charge, as in a fresh clone or a linked worktree. The note is now the text that the reviewer proposed: it starts with "When the work store is in charge" and goes on with "Otherwise, or without the CLI, these files are the authority". The template files changed first, and the installed copies match them byte for byte. The test file pins the new note and fails on the word "present". PRD 15 R-WORK-ROUTER-2 and R-WORK-ROUTER-3 changed, with a Requirement History entry of 2026-11-28. The design records the decision. The conditional intent of the owner's first decision is kept.
- T6: the `all`, `backlog`, and `workflow` profiles send the same text. The `core`, `setup`, `quality`, and `factory` profiles send no instructions. A real run over stdio shows it in the [evidence](evidence.md#the-mcp-instructions-t6-a35).
- T8: PRD 15 holds R-WORK-ROUTER-1 to R-WORK-ROUTER-5, PRD 25 holds R-MCP-INSTR-1 to R-MCP-INSTR-4, and PRD 39 R-NAME-6 names the MCP server instructions as shipped text with their own test. Each has a `W35 R0 P3` Requirement History entry. PRD 06 did not change.
- No pinned digest, size limit, or snapshot changed. The root router block has 11 lines, and its budget is 12.
- Merge risk: this phase did not touch a W22 R2 file and did not change a managed block rule. The branch that merges second reruns the router tests and the byte-match tests.
- New behavior that the documents did not state: 15 points, listed in the [evidence](evidence.md#p3-new-behavior-that-the-documents-did-not-state). Each point waits for the owner's review at the phase report. None is recorded as an owner decision.
- Known limits: the [evidence](evidence.md#p3-known-limits) lists them. Two of them are not from this phase: `make-docs setup --yes --conflicts keep` ended `blocked` on a changed block, and a blocked project keeps the old text in its unchanged router of the same pair.
- Optional experience handoff: none.
- Explicit human acceptance gate: A38 waits for the owner's reading of the root line and the MCP instructions. The owner chose the words of the `docs/work/` note on 2026-11-28. The Wave gate OG-9 is in [P7](07-acceptance.md).
- Evidence report: the [P3 section](evidence.md#p3-routers-and-mcp-instructions) of the evidence report.
- Package digest: not recorded in this pass. This phase changed package bytes, so the orchestrator records the digest again after the review, under [standing rule 10](00-index.md#standing-rules).
- Phase / capability status: built, not complete. The first independent review ran, and its fix pass is done. The owner answered on the `docs/work/` note on 2026-11-28, and the note changed. The phase waits for the check of that fix pass and of the note change, and for the owner's reading of the lines. The note change is a change of package bytes, so the orchestrator records the digest again under standing rule 10.
