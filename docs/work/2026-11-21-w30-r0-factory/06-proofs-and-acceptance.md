---
title: "Phase 6: Proofs and Acceptance"
kind: "work"
status: "active"
coordinate: "W30 R0 P6"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md"
---

# Phase 6: Proofs and Acceptance

## Purpose

Prove the factory with real tools on an installed package, without tying the product to those tools. This phase closes the Wave.

## Overview

Two capability proofs run on one package candidate. The owner picks the real tools at test time. The evidence and release notes name them. This phase also runs the drift test, the outside-git test, package parity, and the Human Experience Review for every promise.

## Human Experience Outcome

- Impact and governing promise: `direct`. All five promises in the [index](00-index.md#human-experience-trace).
- Intended human outcome: the person can set up a workflow, leave, and come back to results, evidence, and only the decisions that need them, with each tested combination named.
- Human-facing surface: the setup summary, status output, escalation messages, the acceptance request, and the backup folder note.
- Implementation work: Stages 1 and 2.
- Evidence source: Proof A and Proof B, the drift test, the outside-git test, package parity checks, and the Human Experience Review.
- Executor: the implementing agent, with the owner choosing the real tools.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-1 to R-FACTORY-61, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Full suite, package build, installed Skills, resources, and operations parity. |
| Performance Testing | not-needed-now | No performance candidate applies. |
| Guided Progress Review | selected | Owner review of the real setup summary, status, escalation messages, and acceptance request from the two proofs. |
| Unassisted Goal Testing | not-needed-now | Reassess here. Activate only if a normal-use discoverability question about first setup remains open and can change a current decision. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Capability Proofs

### Tasks

- [ ] T1: Proof A, smallest setup: one harness, its own subagents, and "wait in session". Run a staged backlog of at least two units through build then review, including one correction.
- [ ] T2: Proof B, multi-tool setup: a multiplexer plus a human channel that the person can use from a phone. Run one lead and specialists unit and one escalation that the person answers away from the session.
- [ ] T3: Record the real tools that the owner picked for each proof in the evidence. Limit support claims to the combinations tested (R-FACTORY-1, R-FACTORY-10).
- [ ] T4: Drift test: remove a wired tool and show the blocked state and the fix step before new work (R-FACTORY-12, R-FACTORY-33).
- [ ] T5: Outside-git test: run a unit in a folder without git and show the backup, its cleanup, and the backup folder note (R-FACTORY-44 to R-FACTORY-46).
- [ ] T6: Create this backlog's `evidence.md` and link it from the index.

### Acceptance criteria

- A43: Proof A completes two units, including one correction, and ends with one acceptance request.
- A44: Proof B completes one lead and specialists unit, and the person answers one escalation away from the session.
- A45: The evidence names the real tools for each proof, and no support claim reaches past them.
- A46: The drift test shows the `drifted` state and one fix step, and no new work starts.
- A47: The outside-git test shows a recorded backup, its cleanup, and the folder note.

### Dependencies

- P2 to P5 and one identified package candidate.

## Stage 2 - Package Parity and Review

### Tasks

- [ ] T7: Prove package and installed parity for both Skills, the four resources, and the operations.
- [ ] T8: Search the shipped Skills, resources, and fixtures for any tool named as required or default, and fix each hit.
- [ ] T9: Complete a Human Experience Review for each promise in the index.
- [ ] T10: Reassess Unassisted Goal Testing for first setup, and record the decision.

### Acceptance criteria

- A48: Installed Skills, resources, and operations match the package candidate.
- A49: No shipped file names a particular tool as required or default.
- A50: Each promise in the index has a recorded Human Experience Review conclusion and its limits.

### Dependencies

- Stage 1.

## Stage 3 - Capability Tags, Version Drift, and Never-Log Scan

New on 2026-11-23. The owner approved these changes after P1 was done.

### Tasks

- [ ] T11: Tag each proof case in the evidence with the capability IDs it exercised, the tool version each tool reported, and each proof result. List each "does not cover" item and each accepted known loss (R-FACTORY-10, R-FACTORY-14, R-FACTORY-53).
- [ ] T12: Version drift test: report a new version for a wired tool, and show `drifted` with `tool-version-changed`, the re-proof step, and no new work until the proof runs again (R-FACTORY-10, R-FACTORY-12).
- [ ] T13: After both proofs, scan the Store factory records, the plan revisions, the status history, and the `.make-docs/factory/` copies for file contents, prompts, briefs, environment values, transcripts, and credentials (R-FACTORY-26).
- [ ] T14: Update the Check column of the factory contract's Rule Catalog for the checks that W29 R0 P4 and W30 R0 P2 and P3 built. Choose a word for a built check, change the W30 R0 P1 test to accept it, and remove the note that rows marked "Planned in W30 R0 P3" are built (template first, then the dogfood and bundled copies). New on 2026-11-23.
- [ ] T15: Moved from W30 R0 P3 T34 on 2026-11-23: a reviewed removal of a saved workflow, and of a pruned project's workflow rows. It deletes the workflow's backup records first, then its final assignments, then its grant use rows (`factory_grant_uses`, added on 2026-11-24), then its grants, test task results, plan revisions, and binding. It refuses while an assignment of the workflow is open, and it changes nothing on a refusal (P2 notes 1 and 2). Until it ships, a workflow removed from the config stays `drifted` and takes no new work. New on 2026-11-23.

### Acceptance criteria

- A70: Each proof case in the evidence names the capability IDs it exercised, with the tool version and result of each.
- A71: The version drift test shows `tool-version-changed` and one fix step, and no new work starts.
- A72: The never-log scan finds no never-log item, or each finding is fixed and the scan runs again clean.

### Dependencies

- Stage 1.

## Stage 4 - Follow-Up Commands

New on 2026-11-23. The owner approved three follow-up commands after P3 to P5 were built. P3 is completed, so these command tasks are here, and P3 stays closed.

### Tasks

- [x] T16: Add the machine-level read `factory.tools.list` (`make-docs factory tools list`, MCP `factory_tools_list`): the saved tools of this machine, each with its state, its capability proofs, and its record version. It takes no project, ends with "Changes nothing.", and never creates or migrates a Store. The `factory-setup` Skill reads the saved tools through it, and no longer uses the `tools.md` copy as a hint (R-FACTORY-69).
- [x] T17: Add the project write `factory.file-backup.save` (`make-docs factory file-backup save`, MCP `factory_file_backup_save`): outside git, copy each named file to `.make-docs/backup/factory/` through the P2 backup function and record it for an open assignment, with the private claim ID. In a folder with git, report `not-needed` and change nothing. The run Skill calls it before a worker changes a file outside git, which closes P5 T10 (R-FACTORY-70).
- [x] T18: Add the project write `factory.grant-use.record` (`make-docs factory grant-use record`, MCP `factory_grant_use_record`): record a grant use on the live claim of a unit whose assignments are all final, with the grant checks of `factory.assignment.save`. T19 records each use. The run Skill's end-of-scope steps use it (R-FACTORY-24, R-FACTORY-71).

- [x] T19: Keep one use row for each recorded grant use, in the new `factory_grant_uses` table of the unreleased schema v9: grant ID, action, scope, work unit, lifecycle run ID, and use time, with no content and no claim ID. Both use commands write the row in the same transaction as the grant check. A revoke keeps the rows, and they stay until the workflow is removed (T15 deletes them with the workflow). `factory workflow show` lists them beside the grants. Remove the two last-use columns from `factory_grants` (R-FACTORY-72). New on 2026-11-24.

### Acceptance criteria

- A84: `factory tools list` gives the same result in CLI JSON and MCP, names this machine, shows each record version, and with no Store returns the typed Store outcome and creates no Store.
- A85: Outside git, `factory file-backup save` copies and records each file before the change, and a refused call leaves no copy and no record. In a folder with git it reports `not-needed`. No result or record holds file contents or a claim ID.
- A86: `factory grant-use record` records a use only for the holder of the live claim of a unit whose assignments are all final, refuses with each grant refusal code as `factory assignment save` does, and never shows the claim ID.
- A87: Setup admits each of the three commands as a native command rule, and each MCP name has at most 26 characters.
- A88: Two uses of a `standing` grant keep two use rows, a revoke of the grant keeps its rows, callers that race for one `once` grant keep one row, a refused use keeps none, and no copy or factory URI read shows a use row.

### Dependencies

- P2 to P5.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.

## Change History

### 2026-11-23 — W30 R0 P3 Review Follow-Up

- Kind: `edit`
- Affected scope: new T14.
- Previous scope: P6 had no task for the Rule Catalog Check column.
- Replacement scope: T14 updates the Check column for the built checks. Until then, a note in the contract says that rows marked "Planned in W30 R0 P3" are built. Existing task and acceptance IDs do not change.
- Rationale: an independent review of W30 R0 P3 on 2026-11-23 (item 5).
- PRD decision: `none`.
- Owner approval: none needed for a follow-up record.
- Source: [W30 R0 P3 evidence](evidence.md#review-fixes)

### 2026-11-23 — W30 R0 P3 T34 Moved to P6 T15

- Kind: `edit`
- Affected scope: P3 T34 and new P6 T15.
- Previous scope: P3 T34 held the reviewed workflow removal follow-up, but P3 is completed, so the work queue reads it as closed and would not offer T34.
- Replacement scope: P6 T15 holds the same follow-up, and P3 T34 points to it.
- Rationale: keep the follow-up on the work queue after P3 closed (W30 R0 P3 integration).
- PRD decision: `none`.
- Owner approval: none needed for a move of an unscheduled follow-up.
- Source: [W30 R0 P3 evidence](evidence.md#review-fixes)

### 2026-11-23 — W30 R0 Follow-Up Commands

- Kind: `edit`
- Affected scope: new Stage 4, tasks T16 to T18, and acceptance A84 to A87.
- Previous scope: no command read the machine's saved tools, saved a backup outside git, or recorded a grant use on a claim with no open assignment.
- Replacement scope: Stage 4 holds the three follow-up commands, and they are built. P3 is completed, so the tasks are here and P3 is not reopened. Existing task and acceptance IDs do not change. This is new behavior. The owner named the backup command `factory backup save` and gave `factory grant use` as an example. The shipped names are `factory file-backup save` and `factory grant-use record`, because a native command rule refuses the word `backup` and `use` is not an approved end word. The owner confirmed the names on 2026-11-24 (register D-077, option A, closed).
- Rationale: setup needs record versions that only the Store holds, the backup rule needs a command, and no action outside the default authority may happen without a recorded grant use.
- PRD decision: `update-existing` — PRD 53 (Operations table, R-FACTORY-24, R-FACTORY-44, R-FACTORY-50, R-FACTORY-63, project scope table, and the new R-FACTORY-69 to R-FACTORY-71), PRD 39 R-RUN-1, PRD 25 R-MCP-PROFILE-2, and PRD 38 (the factory grants and backup records R-MIN rows).
- Owner approval: the owner's decisions on 2026-11-23.
- Source: [W30 R0 evidence](evidence.md#follow-up-commands)

### 2026-11-24 — W30 R0 Grant-Use History

- Kind: `edit`
- Affected scope: new T19 and A88, and the text of T15 and T18.
- Previous scope: T18 recorded the time and the lifecycle run of the last use on the grant, in two columns of `factory_grants`. T15 did not name grant use rows.
- Replacement scope: T19 keeps one use row for each recorded grant use in the new `factory_grant_uses` table, and removes the two last-use columns. T15 deletes the use rows with the workflow. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: an independent review found that a last-use record loses the earlier uses of a `standing` or a `run` grant. The owner then chose a full history of uses.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-24, R-FACTORY-71, and the new R-FACTORY-72, and PRD 38 (the factory grants row and the new factory grant uses R-MIN row).
- Owner approval: the owner's decision on 2026-11-24 (option B).
- Source: [W30 R0 evidence](evidence.md#grant-use-history)
