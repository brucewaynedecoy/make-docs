---
title: "Phase 4: Factory Setup Skill"
kind: "work"
status: "completed"
coordinate: "W30 R0 P4"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/04-factory-setup-skill.md"
---

# Phase 4: Factory Setup Skill

## Purpose

Teach any agent to set up the factory with whatever tools the person has. This phase depends on the P1 contract and the P3 operations.

## Overview

This phase adds a new first-party Skill, `factory-setup`, in `packages/skills/factory-setup/`. It is explicit-invocation-only and off by default, like the other first-party Skills. It runs six steps: find, read, interview, wire, prove, and save.

## Human Experience Outcome

- Impact and governing promise: `direct`. Setup ends with a plain summary of roles, wake method, human channel, test result, and open manual steps (R-FACTORY-13, R-FACTORY-14).
- Intended human outcome: the person answers only preference and permission questions, one at a time, and leaves setup knowing what works, what was proved, and what they still must do.
- Human-facing surface: the setup interview and the closing summary.
- Implementation work: Stages 1 and 2.
- Evidence source: fixture runs for the smallest setup and a multi-tool setup, and Guided Progress Review of the interview and the summary.
- Executor: the implementing agent, with owner feedback invited.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-1 to R-FACTORY-3, R-FACTORY-8 to R-FACTORY-16, R-FACTORY-21, R-FACTORY-35, R-FACTORY-36, R-FACTORY-43, R-FACTORY-48, R-FACTORY-55, R-FACTORY-57, and R-FACTORY-60, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Skill bundle and registry tests, and fixture runs of the Skill instructions that reach a saved `ready` workflow. |
| Performance Testing | not-needed-now | No performance candidate applies. |
| Guided Progress Review | selected | Owner review of the interview questions and the closing summary. Feedback can change both before closeout. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. P6 reassesses it for first setup. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [25 TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Find, Read, and Interview

### Tasks

- [x] T1: Create `packages/skills/factory-setup/` and its registry entry. Keep it explicit-invocation-only and off by default (R-FACTORY-48).
- [x] T2: Stop when the CLI or a usable Store is missing. Name which one and the setup step that fixes it (R-FACTORY-3).
- [x] T3: Find agent tools on the machine and in the project, by capability: tools that run agents, launch agents, wake on a schedule or event, message the person, or expose MCP servers. Reuse the machine's saved tool list when it is current (R-FACTORY-15).
- [x] T4: Read each tool's help, docs, MCP tool list, and Skills. Record what each tool says it can do.
- [x] T5: Interview the person for preferences and permissions only: workflow type, human channel, wake method, limits, grants, and optional steps such as preflight. Ask one decision at a time, with a recommendation (R-FACTORY-21, R-FACTORY-35, R-FACTORY-36).
- [x] T6: Save the worktree method of each workflow, and obey a repository or user rule that forbids worktrees (R-FACTORY-43).

### Acceptance criteria

- A26: With the CLI or the Store missing, the Skill stops and names the missing part and its fix.
- A27: The interview asks no question whose answer the Skill could find in the tools or the project.
- A28: No Skill text names a particular app, harness, provider, multiplexer, scheduler, or messaging tool as required or default.

### Dependencies

- P1 and P3.

## Stage 2 - Wire, Prove, and Save

### Tasks

- [x] T7: Give each role a tool by capability. Mark each capability as proved or unproved (R-FACTORY-9, R-FACTORY-10).
- [x] T8: Support the smallest setup: one tool that is the front desk and the foreman, with its own subagents as builders and reviewers, and "wait in session" as the channel (R-FACTORY-8, R-FACTORY-36).
- [x] T9: Run one small test task from intake to return through the real workflow (R-FACTORY-11).
- [x] T10: List each one-time manual step with what the person must do, why, and what it unblocks (R-FACTORY-13).
- [x] T11: Save through the P3 operations, then show the closing summary (R-FACTORY-14).
- [x] T12: On a rerun, update the same workflow, show what changed, and prove again each boundary that changed (R-FACTORY-16).
- [x] T13: Make no install, sign-in, billing, or authentication change on the person's behalf.

### Acceptance criteria

- A29: A fixture run reaches a saved `ready` workflow for the smallest setup.
- A30: A fixture run reaches a saved `ready` workflow for a multi-tool setup, where the same roles are filled by tools with different names.
- A31: The closing summary names the tool for each role, the wake method, the human channel, the test result, and each open manual step.
- A32: A rerun after one changed binding shows the change and proves that boundary again.

### Dependencies

- Stage 1.

## Stage 3 - Proof Records, Known Losses, Grants, and the Resolved Plan

New on 2026-11-23. The owner approved these changes after P1 was done.

### Tasks

- [x] T14: For each proof, record the tool version that the tool reports, the proof time, a result of `proved`, `unproved`, or `contradicted`, and a "does not cover" list. When a bound tool reports a new version, run its proofs again before the workflow takes new work (R-FACTORY-10).
- [x] T15: Name each known loss, ask the person to accept it, save each accepted one, and list each one in the closing summary (R-FACTORY-14).
- [x] T16: Ask for each grant with its action, its scope (`once`, `run`, or `standing`), and an optional expiry. Recommend the narrowest scope that does the job (R-FACTORY-24).
- [x] T17: Set each role's context kinds, with the defaults from the contract. Save through `factory workflow save`, show the plan revision and its digest in plain words, run the test task under that revision, and save the proof with that digest (R-FACTORY-55, R-FACTORY-57, R-FACTORY-60).

### Acceptance criteria

- A64: The closing summary lists each accepted known loss, and for each role the tool, its version, and its proof result.
- A65: The interview asks for each grant's scope and recommends the narrowest one. No grant is saved without a scope.
- A66: A fixture run saves a plan revision, runs the test task under it, saves the proof with the same digest, and reaches `ready`.

### Dependencies

- Stage 2 and P3 Stages 3 and 4.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing is selected and done: 24 new tests in `packages/cli/tests/w30-r0-p4-factory-setup-skill.test.ts` cover the bundle and its explicit-use policy (T1), no script and no Python, the tool-agnostic text (A28), the twin checks of commands, MCP tools, flags, reason codes, record values, one-word values and field paths, default context lists, and contract rule IDs, the two-option interview rule, the tools copy as a hint only, the grants file, the example config entry, and fixture runs for A26, A29, A30, A32, A65, A66, and T14, and the two sample summaries (A31, A64). The Skill registry, embedded, catalog, and UI tests list the new Skill. Guided Progress Review is selected and waits for the owner: the interview questions and the closing summary. Performance Testing and Unassisted Goal Testing stay `not-needed-now`.
- Performance evidence: none. No performance candidate applies.
- Human Experience Review: the interview asks one decision at a time, recommendation first, and only for preferences and permissions; a Never Ask list keeps out facts that setup finds. Each internal term has plain words beside it. The summary puts the outcome first, then the tool, version, and proof result of each role, the wake method (and says when no tool can wake on its own), the human channel, the test result with the plan revision, each accepted known loss, each grant, and each open manual step in the Do, Why, Required or Optional, Unblocks form. Limit: the samples use neutral placeholders; no live setup with real tools ran in this phase. P6 proves two real setups.
- Optional experience handoff: none.
- Explicit human acceptance gate: closed. The owner passed the Guided Progress Review of the setup interview and the closing summary on 2026-11-24 (option A), with no change.
- Evidence report: [W30 R0 Evidence Report, P4](evidence.md#p4-factory-setup-skill).
- Independent review (2026-11-23): no broken code; eight text and test items. Items 1 to 7 are fixed: the tools copy is a hint only after a restore, the grants file shape and a rerun revoke, at most two options for each question, the one-word and field path check, a wider product name list, the version that a refusal names, and one `store-denied` row. Item 8, an email address accepted in `grantedBy`, is a P3 follow-up. See [Review Fixes](evidence.md#review-fixes-1).
- Phase / capability status: T1 to T17 are built, and A26 to A32 and A64 to A66 are met by the fixture runs and the twin test. Phase complete: the owner's Guided Progress Review passed on 2026-11-24, and no task is open. Capability partial: the proofs and acceptance (P6) remain. Since the follow-up of 2026-11-23, `make-docs factory tools list` reads the machine tool list with its record versions, and this Skill uses it ([P6](06-proofs-and-acceptance.md) T16). Follow-ups: the CLI accepts an email address in `grantedBy` (P3), and this repository's installed Skill copies do not include `factory-setup` yet, because installing it writes the real Store.

## Change History

### 2026-11-24 — W30 R0 P4 Guided Progress Review Passed

- Kind: `edit`
- Affected scope: the Closeout Notes and the phase status.
- Previous scope: the phase waited for the owner's Guided Progress Review of the setup interview and the closing summary, and the phase was `active`.
- Replacement scope: the review passed: the owner found the samples clear (option A), with no change. The phase status is `completed`, as for the other finished phases. No task is open. Task and acceptance IDs do not change.
- Rationale: the owner's decision on 2026-11-24.
- PRD decision: `none`.
- Owner approval: the owner's decision on 2026-11-24 (option A).
- Source: [W30 R0 evidence](evidence.md#sample-closing-summary-guided-progress-review-passed)
