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
| Unassisted Goal Testing | not-needed-now | Reassessed in T10. The owner decided on 2026-11-24 to keep `not-needed-now`: the P4 Guided Progress Review passed the setup interview and the closing summary, and no normal-use discoverability question about first setup is open that can change a current decision. See the [evidence report](evidence.md#p6-owner-decisions-2026-11-24). |

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

- [x] T1: Proof A, smallest setup: one harness, its own subagents, and "wait in session". Run a staged backlog of at least two units through build then review, including one correction.
- [ ] T2: Proof B, multi-tool setup: a multiplexer plus a human channel that the person can use from a phone. Run one lead and specialists unit and one escalation that the person answers away from the session.
- [ ] T3: Record the real tools that the owner picked for each proof in the evidence. Limit support claims to the combinations tested (R-FACTORY-1, R-FACTORY-10).
- [x] T4: Drift test: remove a wired tool and show the blocked state and the fix step before new work (R-FACTORY-12, R-FACTORY-33).
- [x] T5: Outside-git test: run a unit in a folder without git and show the backup, its cleanup, and the backup folder note (R-FACTORY-44 to R-FACTORY-46).
- [x] T6: Create this backlog's `evidence.md` and link it from the index.

### Acceptance criteria

- A43: Proof A completes two units, including one correction, and ends with one acceptance request.
- A44: Proof B completes one lead and specialists unit, and the person answers one escalation away from the session.
- A45: The evidence names the real tools for each proof, and no support claim reaches past them.
- A46: The drift test shows the `drifted` state and one fix step, and no new work starts. Since 2026-11-24, `factory status` gives one fix step for a lost tool, by owner decision.
- A47: The outside-git test shows a recorded backup, its cleanup, and the folder note.

### Dependencies

- P2 to P5 and one identified package candidate.

## Stage 2 - Package Parity and Review

### Tasks

- [x] T7: Prove package and installed parity for both Skills, the four resources, and the operations.
- [x] T8: Search the shipped Skills, resources, and fixtures for any tool named as required or default, and fix each hit.
- [x] T9: Complete a Human Experience Review for each promise in the index.
- [x] T10: Reassess Unassisted Goal Testing for first setup, and record the decision. The owner decided on 2026-11-24: keep `not-needed-now`.

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
- [x] T12: Version drift test: report a new version for a wired tool, and show `drifted` with `tool-version-changed`, the re-proof step, and no new work until the proof runs again (R-FACTORY-10, R-FACTORY-12).
- [ ] T13: After both proofs, scan the Store factory records, the plan revisions, the status history, and the `.make-docs/factory/` copies for file contents, prompts, briefs, environment values, transcripts, and credentials (R-FACTORY-26).
- [x] T14: Update the Check column of the factory contract's Rule Catalog for the checks that W29 R0 P4 and W30 R0 P2 and P3 built. Choose a word for a built check, change the W30 R0 P1 test to accept it, and remove the note that rows marked "Planned in W30 R0 P3" are built (template first, then the dogfood and bundled copies). New on 2026-11-23.
- [x] T15: Moved from W30 R0 P3 T34 on 2026-11-23: a reviewed removal of a saved workflow, and of a pruned project's workflow rows. Built on 2026-11-24 as `factory.workflow.clean` (`make-docs factory workflow clean`, MCP `factory_workflow_clean`, R-FACTORY-73) and in the scoped cleanup of a pruned project (PRD 52 R-WORK-STORE-13); see [Stage 5](#stage-5---store-lifecycle-fixes). It deletes the workflow's backup records first, then its final assignments, then its grant use rows (`factory_grant_uses`, added on 2026-11-24), then its grants, test task results, plan revisions, and binding. It refuses while an assignment of the workflow is open, and it changes nothing on a refusal (P2 notes 1 and 2). A workflow removed from the config stays `drifted` and takes no new work until the person removes it with this command. No command reaches the prune path yet: `pruneProjectFromStore` has no caller, so the pruned-project cleanup is proved at the service level only. New on 2026-11-23.

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

## Stage 5 - Store Lifecycle Fixes

New on 2026-11-24. The owner audited the factory tables and decided each finding (option A for each). The fixes are here, before W30 R0 acceptance. All of it is new behavior.

### Tasks

- [x] T20: Readiness after a failed test task. The latest test result for a plan decides: `factory proof save` with a failed result for the plan of the `ready` revision ends its `ready` state in the same write. The workflow is `wired` with the readiness code `test-failed`, takes no new work, and returns to `ready` after a pass. `factory status` and `factory workflow show` say why and name the fix (R-FACTORY-12).
- [x] T21: A backup record goes only together with its file. Cleanup keeps and reports a due record whose file is in another checkout or in a folder that moved or is gone, with the path inside the project only. The scoped cleanup of a pruned project removes no backup record (R-FACTORY-74).
- [x] T22: Retention. Spent and expired grants stay until the workflow is removed, with indexed and bounded reads. A plan revision that any retained assignment names, open or final, is never removed by the keep rule (R-FACTORY-24, R-FACTORY-57, PRD 38).
- [x] T23: Tool fact freshness. `factory status` shows each bound tool with the age of each proof, and calls a proof older than 30 days old. The run Skill checks its bound tools again before it takes new work and saves any change with `factory tools save` (R-FACTORY-75).
- [x] T25: Fix the three defects and the four smaller points of the independent review of 2026-11-24. No delete goes through a symbolic link, in the removal and in cleanup. The removal checks every backup file before its first delete, and a delete that still fails gives the typed `stopped` result with a Store that matches the disk. The review digest binds record identities and versions. The prune result holds `factoryRemoved` and `factoryKept`. `factory workflow show --uses-before <use-id>` pages the use rows. The `not-ready` refusal of `factory assignment start` names `test-failed`. The removal result names `factory restore` for other checkouts, and `setup store check` shows a backup record whose folder is missing (R-FACTORY-12, R-FACTORY-24, R-FACTORY-73, R-FACTORY-74, PRD 38 R-MAINT-4).
- [x] T26: Build the owner's decisions of 2026-11-24 on register D-078 (option B) and D-079 (option A), and fix the five findings of the re-check. The reviewed removal drops a backup record whose files are not found on this computer now, and the review lists each one as "record dropped, files not reachable". The review names each checkout that holds a backup file. The review digest binds the bytes of each backup file. A refusal's text matches its code. A delete that fails after the checks uses general words. `STORE-DECISION-005` splits a path at the last backup folder marker. The not-ready refusal says once that the test task failed (R-FACTORY-12, R-FACTORY-73, R-FACTORY-74).
- [x] T27: Fix the five points of the round 4 check. The words no longer say "gone for good": the files are not found on this computer now (removed, renamed, or on a drive that is not connected), a file that still exists stays, and no later cleanup finds it. After a folder move, each matching copy goes and is listed, counted, and bound in the digest. A moved file with other bytes stops the removal with `backup-file-changed`. Two dropped records with one name both go. One shared function splits a backup path at the last marker that the assignment ID follows (R-FACTORY-73, R-FACTORY-74).
- [x] T28: Fix the points of the round 5 check. In cleanup and in the removal, a file that is the recorded backup of another record is that record's own file, so the moved-folder rule never takes it. The path split uses the record's original path. A fixed rule may have no derive step. The contract and PRD 53 R-FACTORY-74 wording is corrected (R-FACTORY-73, R-FACTORY-74).
- [x] T24: Correct the Store README for every factory table and command, including `factory_grant_uses`, and add the test assertion for the use row on the `--reset-rounds` path of `factory assignment start`.

### Acceptance criteria

- A89: `factory workflow clean` without a review digest changes nothing and gives the digest. With the digest it removes the workflow's backups with their files, final assignments, grant uses, grants, test task results, plan revisions, and binding, and the result names the project and each count. It refuses with no project, with an open assignment, with a digest that no longer matches, and with a backup file that it cannot reach.
- A90: The scoped cleanup removes a pruned project's factory rows in the same order, keeps a workflow whole while a backup record of it stays, and the prune result reports both. No command reaches the prune path yet, so this is a service-level proof only.
- A95: A symbolic link in a backup path (a linked assignment folder, a linked file, or a link into another checkout) makes the removal refuse with `backup-path-unsafe` and delete nothing, and cleanup keeps the record. A locked folder gives `backup-file-locked` before any delete. A delete that fails after the checks gives `stopped`, with one record removed for each removed file. A grant swapped for another after the review gives `review-mismatch`. No result holds a raw system error or an absolute backup path.
- A97: With a review digest, `factory workflow clean` drops a backup record whose files are not found on this computer now, and the review listed it by name. Cleanup during a normal command keeps the same record. A record whose file is still on the computer in a folder that is not a bound checkout stops the removal. The review names each checkout that holds a backup file.
- A98: A backup file whose bytes change after the review gives `review-mismatch`, and the changed file stays.
- A99: After a folder move, the removal deletes the record's file in a reachable checkout, and each copy when two checkouts hold one. A moved file with other bytes gives `backup-file-changed` and keeps the record. Two dropped records with one name both go. A backed-up file whose own path holds the backup folder marker gets the right path in cleanup, in the review, and in `setup store check`.
- A100: Cleanup and the removal work through a checkout folder that is a symbolic link, and a link below the checkout folder is still refused.
- A101: With an old record of a folder that is not found and a young record of the same assignment, path, and hash, cleanup keeps the young record's file, and the removal counts one file and drops the old record. A backed-up file whose own path holds the marker and the same assignment ID gets the right path.
- A96: `factory workflow show --uses-before` reads every use row in pages of 50. After a failed test task, the `factory assignment start` refusal names `test-failed` and the next step.
- A91: Cleanup removes a backup file and its record together in the same checkout, keeps and reports the record for another checkout and for a missing checkout, and no report holds an absolute path.
- A92: A `ready` workflow whose plan fails a new test is `wired` with `test-failed` and starts no assignment. A pass returns it to `ready`. A failed test of another plan leaves the `ready` revision.
- A93: The plan revision of a final assignment stays after more than 10 newer revisions. A spent grant and an expired grant stay, and `factory workflow show` returns at most 50 use rows with the total.
- A94: `factory status` shows the proof ages and marks a proof older than 30 days. The run Skill, its installed copy, and the contract say that the foreman checks its bound tools before new work.

### Dependencies

- P2 to P5, and Stage 4.

### Closeout Notes

- Four testing decisions: Pending. Automated Implementation Testing ran (see the evidence report). Guided Progress Review waits for the two proofs and the owner. Unassisted Goal Testing stays `not-needed-now`, by the owner's decision of 2026-11-24 (T10).
- Performance evidence: none applies. There is no performance candidate.
- Human Experience Review: recorded on 2026-11-24 as an agent review, in the [evidence report](evidence.md#human-experience-review-t9-a50). Four promises are `satisfied` within their limits. Three have `insufficient evidence` until the two proofs run.
- Optional experience handoff: Pending. It follows the two proofs.
- Explicit human acceptance gate: Pending. The owner accepts W30 R0.
- Evidence report: [P6 Proofs and Acceptance](evidence.md#p6-proofs-and-acceptance).
- Phase / capability status: `active`. Open: T1, T2, T3, T11, and T13. Each one waits for the owner. See [P6 Open for the Owner](evidence.md#p6-open-for-the-owner).

## Change History

### 2026-11-24 — W30 R0 P6 One Fix Step for a Lost Tool

- Kind: `edit`
- Affected scope: A46, and the output of `factory status`, `factory workflow list`, `factory workflow show`, and the `not-ready` refusal of `factory assignment start`.
- Previous scope: for a lost tool, one line gave two fix steps joined by "or": bring the tool back, or bind another tool.
- Replacement scope: status, the workflow list, and the refusal give one fix step, the smallest one: bring the tool back and report it. Only `factory workflow show` adds the second way, after the first. A drift entry has a new optional field, `otherStep`. This is a change of output. No readiness rule changed. Existing task and acceptance IDs do not change.
- Rationale: A46 asks for one fix step, and the round 1 drift test showed two.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-33.
- Owner approval: the owner's decision on 2026-11-24 (option B).
- Source: [W30 R0 evidence](evidence.md#p6-owner-decisions-2026-11-24)

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

### 2026-11-24 — W30 R0 Store Lifecycle Round 5

- Kind: `edit`
- Affected scope: new T28 and A101.
- Previous scope: no task covered an old record and a young record with one path, or a file path that holds the marker and the same assignment ID.
- Replacement scope: T28 holds the round 5 fixes, and they are built. Existing task and acceptance IDs do not change.
- Rationale: the round 5 check of 2026-11-24.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-74.
- Owner approval: none needed for defect fixes inside the owner's decisions.
- Source: [W30 R0 evidence](evidence.md#round-5)

### 2026-11-24 — W30 R0 Store Lifecycle Round 4

- Kind: `edit`
- Affected scope: new T27 and A99, and the words of T26 and A97.
- Previous scope: T26 and A97 said "gone for good". No task covered a second copy after a folder move, a moved file with other bytes, two dropped records with one name, or a file path that holds the backup folder marker.
- Replacement scope: T27 holds the round 4 fixes, and they are built. T26 and A97 say "not found on this computer now". Existing task and acceptance IDs do not change.
- Rationale: the round 4 check of 2026-11-24.
- PRD decision: `update-existing` — PRD 53 (R-FACTORY-73 and R-FACTORY-74).
- Owner approval: none needed for a wording correction and defect fixes inside the owner's decision on D-078. The owner answered both open points on 2026-11-24. No new refusal rule is added for a file that still exists, and the truthful words are the whole fix. A checkout folder can be a symbolic link (register D-080, option A); the build already worked this way.
- Source: [W30 R0 evidence](evidence.md#round-4-wording-and-moved-folder-fixes)

### 2026-11-24 — W30 R0 Store Lifecycle Owner Decisions and Re-Check Fixes

- Kind: `edit`
- Affected scope: new T26, and new A97 and A98.
- Previous scope: a backup record whose checkout folder was gone stopped the workflow removal, and register D-078 and D-079 were open. The review digest did not bind the bytes of a backup file.
- Replacement scope: T26 holds the two owner decisions and the five re-check fixes, and they are built. Existing task and acceptance IDs do not change. The dropped record is new behavior.
- Rationale: the owner decided D-078 (option B) and D-079 (option A) on 2026-11-24, and a re-check found one medium and four small defects.
- PRD decision: `update-existing` — PRD 53 (R-FACTORY-12, R-FACTORY-73, and R-FACTORY-74).
- Owner approval: the owner's decisions on 2026-11-24.
- Source: [W30 R0 evidence](evidence.md#round-3-owner-decisions-and-re-check-fixes)

### 2026-11-24 — W30 R0 Store Lifecycle Review Fixes

- Kind: `edit`
- Affected scope: new T25, new A95 and A96, and the text of T15 and A90.
- Previous scope: T15 said "Until it ships" after it shipped. A90 did not say that no command reaches the prune path. No task covered a symbolic link in a backup path, a file error mid-removal, a digest that binds only counts, or use rows older than the newest 50.
- Replacement scope: T25 holds the review fixes, and they are built. T15 and A90 say that the pruned-project cleanup is proved at the service level only. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: an independent review of the Store lifecycle fixes on 2026-11-24 found three defects and four smaller points.
- PRD decision: `update-existing` — PRD 53 (R-FACTORY-12, R-FACTORY-24, R-FACTORY-73, and R-FACTORY-74), PRD 38 R-MAINT-4, and PRD 52 R-WORK-STORE-13.
- Owner approval: none needed for defect fixes inside the owner's decisions of 2026-11-24. Register D-078 and D-079 stay open, and no behavior that they cover changed.
- Source: [W30 R0 evidence](evidence.md#review-fixes-2026-11-24)

### 2026-11-24 — W30 R0 Store Lifecycle Fixes

- Kind: `edit`
- Affected scope: T15 (now done), new Stage 5, tasks T20 to T24, and acceptance A89 to A94.
- Previous scope: T15 was an unscheduled follow-up. No task covered readiness after a failed test task, backup records without their files, the retention of grants and of a final assignment's plan revision, the age of tool facts, or the stale Store README.
- Replacement scope: T15 is built as `factory workflow clean` and in the scoped cleanup of a pruned project. Stage 5 holds T20 to T24, and they are built. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: the owner's audit of the factory tables found these gaps, and the owner required the fixes before W30 R0 acceptance.
- PRD decision: `update-existing` — PRD 53 (Operations table, project scope table, R-FACTORY-12, R-FACTORY-24, R-FACTORY-45, R-FACTORY-57, and the new R-FACTORY-73 to R-FACTORY-75), PRD 38 (six factory R-MIN rows), PRD 52 R-WORK-STORE-13, PRD 39 R-RUN-1, and PRD 25 R-MCP-PROFILE-2.
- Owner approval: the owner's decisions on 2026-11-24 (option A for each finding).
- Source: [W30 R0 evidence](evidence.md#store-lifecycle-fixes)

### 2026-11-24 — W30 R0 Grant-Use History

- Kind: `edit`
- Affected scope: new T19 and A88, and the text of T15 and T18.
- Previous scope: T18 recorded the time and the lifecycle run of the last use on the grant, in two columns of `factory_grants`. T15 did not name grant use rows.
- Replacement scope: T19 keeps one use row for each recorded grant use in the new `factory_grant_uses` table, and removes the two last-use columns. T15 deletes the use rows with the workflow. Existing task and acceptance IDs do not change. This is new behavior.
- Rationale: an independent review found that a last-use record loses the earlier uses of a `standing` or a `run` grant. The owner then chose a full history of uses.
- PRD decision: `update-existing` — PRD 53 R-FACTORY-24, R-FACTORY-71, and the new R-FACTORY-72, and PRD 38 (the factory grants row and the new factory grant uses R-MIN row).
- Owner approval: the owner's decision on 2026-11-24 (option B).
- Source: [W30 R0 evidence](evidence.md#grant-use-history)
