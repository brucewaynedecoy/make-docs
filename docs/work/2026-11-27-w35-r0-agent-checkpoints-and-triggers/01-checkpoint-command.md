---
title: "Phase 1: Checkpoint Command"
kind: "work"
status: "draft"
coordinate: "W35 R0 P1"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 1: Checkpoint Command

## Purpose

Build the one command that every trigger leads to, before any trigger exists. It depends only on W29 R0, which is released.

## Overview

This phase adds one registry operation with CLI and MCP parity, its two kinds of run, and its agent form in the work store reference. It also lands the PRD lines that name the command and the tool, because the name catalog must hold a name before a PRD line can name it. The command is new. The six event names, the direct run and trigger run split, "nothing is due", and the read-only caller result are new ideas of the [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md).

| Operation ID | CLI path | MCP name | Characters | Access | MCP profiles |
| --- | --- | --- | --- | --- | --- |
| `project.checkpoint.run` | `make-docs project checkpoint` | `project_checkpoint` | 18 | Store write and project write for the sync step. Store read and project read for the other steps. | `backlog`, `workflow`, `all` |

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. One command, the checkpoint, tells the person or agent all that is due: what it synced, each conflict with its settle command, each claim that ended, and the next ready work. Without a Store, nothing new happens and nothing fails.
- Intended human outcome: a person or agent runs one command and reads one summary line first. When nothing was due, the line says so. When something waits for a person, the result names it with the exact command.
- Human-facing surface or indirect effect: `make-docs project checkpoint`, its help, its plain and `--json` output, and the `project_checkpoint` tool.
- Implementation work: the operation module, registry entry, CLI command, MCP tool, rule IDs, the Checkpoint section of the work store reference, tests, and the package version with its digest file.
- Evidence source or testing type selected under current authority: name catalog test, CLI and MCP parity tests, six installed cases, the twin rule ID test, and a Guided Progress Review of the plain output.
- Executor: the implementing agent runs the tests. The owner reviews the plain output.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Name catalog, parity, access, trigger run, no-Store, repeat run, and twin rule ID tests. |
| Performance Testing | not-needed-now | [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record) already measured the sync that a direct run uses. [P4](04-git-hook-proofs.md) measures the trigger run with `PERF-007`. |
| Guided Progress Review | selected | The owner sees the plain output of the six cases. |
| Unassisted Goal Testing | not-needed-now | Agents reach the command through text and hooks. No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-1 to R-WORK-STORE-3, R-WORK-STORE-6, R-WORK-STORE-11, R-WORK-SYNC-1 to R-WORK-SYNC-9, R-WORK-QUEUE-4, R-WORK-QUEUE-5, R-WORK-QUEUE-11 to R-WORK-QUEUE-13, R-WORK-QUEUE-19. This phase adds R-WORK-CHECKPOINT.
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-TOP-1, R-TOP-4, R-NAME-1 to R-NAME-6, R-MIG-1. This phase adds R-CHECKPOINT-CMD.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-MCP-PROFILE-4, R-MCP-PROFILE-8, R-ACCESS-1, R-ACCESS-9, R-ACCESS-16, R-ACCESS-17. This phase adds R-MCP-PROFILE-12.
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md): R-WORK-RESOURCE-1
- [04 Glossary](../../prd/04-glossary.md)

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: none. T15 adds two register entries. T4 found that owner gate OG-1 was open, and the owner answered it on 2026-11-27 with option A.

## Stage 1 - Name gate and findings

### Tasks

- [x] T1: Add the entry for `project.checkpoint.run` to `packages/cli/src/operations/name-catalog.ts` as `planned` with `plannedBy: "W35 R0"`, and add `W35 R0` to `NameCatalogPlanner`. Do this before T2, because no PRD line may name the command before the catalog holds it.
- [x] T2: Land the PRD lines that name the command and the tool, each with a `W35 R0 P1` Requirement History entry in its PRD:
  - [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-TOP-1: `project` also owns the checkpoint.
  - PRD 39, a new command section R-CHECKPOINT-CMD with a `Registry identifier | Canonical CLI` table: `make-docs project checkpoint`, `project_checkpoint`, the `--event` input with its six names, `--target-root`, and `--json`.
  - [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-MCP-PROFILE-12: `project_checkpoint` belongs to `backlog`, `workflow`, and `all`, with its access.
- [x] T3: Add a name catalog test check that compares the new PRD 39 table with the catalog, as the R-SKILL-CHECK table is checked. Change PRD 39 R-RUN-1 only if the name catalog test asks for it, because R-RUN-1 lists no `project` command today.
- [x] T4: Find how the registry admits one operation whose sync step needs Store write and project write access while its other steps need only read access. Read `assertOperationStoreAdmission` and `runOperation` in `packages/cli/src/operations/registry.ts`, the `handler` admission kind, and the access check inside the `work.queue.status` handler. Record the answer in the evidence report before T6 starts. `storeAdmission: "optional"` is allowed today only for a read-only operation. If no existing admission kind fits, stop at owner gate OG-1. Result: no existing kind fitted, and the gate opened. The owner answered it on 2026-11-27 with option A.
- [x] T5: Find whether the import-only sync of a trigger run can reuse the first-import path or the `holdWrites` option of `syncWorkFiles` in `packages/cli/src/operations/work/work-store/sync.ts`, with no second copy of the sync table. Record the answer in the evidence report.

### Acceptance criteria

- A1: The name catalog test passes with the planned entry, and fails on a broken fixture row in the new PRD 39 table. The shipped-text test and `make-docs check prd` pass with the PRD lines that name the command and the tool.
- A2: The evidence report states, for T4, which admission kind the checkpoint uses and why a caller with read access only still gets a result, or that OG-1 is open. It states, for T5, which sync path the trigger run uses.

### Dependencies

- None.

## Stage 2 - The operation

The owner answered owner gate OG-1 on 2026-11-27 with option A: a new access rule in PRD 25 R-ACCESS-17, in place of two operations. A write operation may check its write access inside its handler, at the step that needs it, as `work status` does for its read access. The checkpoint stays one registry operation with one MCP tool. A caller with read access only gets the read steps, a line that says the sync did not run, and exit code 0. An MCP call without the write permission (`allowWrite`) gets that same result. The orchestrator told the owner this consequence with option A. So no gate stops this stage, and the dependency list holds no gate.

### Tasks

- [x] T6: Add `project.checkpoint.run` with the first two steps of a direct run: the operation module, registry entry, CLI command, MCP tool, and input schema. A direct run has no `--event`. Step 1 finds who is in charge with the rule of `work status`. Step 2, when the work store is in charge, runs the same two-way sync as `work sync`. The operation uses the admission kind that the owner chose at OG-1 on 2026-11-27 (option A): the `step` Store admission of PRD 25 R-ACCESS-17, with which the handler checks its write access at the sync step. It adds no Store table.
- [x] T7: Add the last three steps of a direct run, in order: list each claim of the project that ended or ends soon, with the release or renew command and no claim ID; list the next ready work as a short form of `work next`; and end with one summary line. A direct run always prints its result.
- [x] T8: Add the trigger run. `--event <name>` accepts `session-start`, `files-changed`, `turn-end`, `commit`, `branch-change`, and `phase-closed`, and refuses any other name with the list. A trigger run imports only, writes and removes no project file, reports each file that waits for a direct run, and prints nothing when nothing is due. With `--event branch-change` it imports nothing and does the read steps only. "Nothing is due" means that this run imported no file, no file waits for a write or a removal, and no conflict waits. Ready work and a claim that ended do not make a trigger run print.
- [x] T9: Add the results for a caller with less access and for no Store. A caller with read access only gets step 1, the read-only sync check, the claim list, the next work, one line that says the sync waits, how many files wait, and that a caller with write access must run the checkpoint, exit 0, and a result field that says that the sync did not run. An MCP call without the write permission (`allowWrite`) gets that same result (owner decision of 2026-11-27 on OG-1). A caller with no Store access, and a project with no usable Store, get one line that says the `docs/work/` files are the authority, and exit 0. A folder that is not a Make Docs project gets one line that says so, and exit 0.
- [x] T10: Make the result name the checkout that it synced, and say when this run was the first sync of that checkout. Make the result name the next ready unit and the claim command for it, in the `lines` and `summary` fields that work results already have.
- [x] T11: Write the help of `make-docs project checkpoint`, and add one sentence to the help of `make-docs lifecycle checkpoint`, so that each says how it differs from the other. Turn the catalog entry `current`. Update the registry inventory and the MCP profile count tests.
- [x] T12: Add tests: CLI and MCP parity in plain and `--json` output for a direct run and each event name; a second run right after the first changes nothing and says that nothing is due; a trigger run leaves every project file byte-identical; `--event branch-change` leaves the store unchanged; a conflict is reported with its settle commands and never settled; the claim list shows no claim ID; each case of T9; and the two help texts of T11. Every test uses a temporary `MAKE_DOCS_HOME` at a fixed, checked path.

### Acceptance criteria

- A3: The CLI and MCP return the same result for the same input, for a direct run and for each of the six event names, in plain and JSON output.
- A4: The plain output of a direct run starts with one summary line. When nothing was due, the line says that nothing is due. When a conflict waits, the result names the file and one settle command for each choice.
- A5: A second run right after the first changes no store record and no file, and says that nothing is due.
- A6: A trigger run leaves every project file byte-identical, also when the store holds a record that a direct run would write. It prints nothing when nothing is due. With `--event branch-change` the store is unchanged, and the result says how many files wait.
- A7: A caller with read access only gets the read steps, the line that the sync waits with the count of files, exit 0, and the field that says the sync did not run. An MCP call without the write permission (`allowWrite`) gets the same result. Every other write operation still refuses a call without the write permission.
- A8: With no usable Store the result says that the `docs/work/` files are the authority, and the exit code is 0. In a folder that is not a Make Docs project the result says so, and the exit code is 0. Neither case creates a Store.
- A9: The result names the checkout that it synced. A run that is the first sync of its checkout says so.
- A10: The name catalog test passes with the entry `current`, `project_checkpoint` has 18 characters, and PRD 25 R-MCP-PROFILE-12 matches the profile lists in code. The help of `make-docs project checkpoint` and the help of `make-docs lifecycle checkpoint` each name the other command and say in one sentence how the two differ.

### Dependencies

- Stage 1.

## Stage 3 - Agent form, PRDs, and register

### Tasks

- [x] T13: Write the "Checkpoint" section of `packages/docs/template/.make-docs/system/references/work-store.md`: when to run it, what it does in order, the two kinds of run, what "nothing is due" means, and what to do by hand when the CLI is missing. Without the CLI or a Store there is nothing to sync, and the section says so. Give each checkpoint rule an ID from `WORK-RULE-055` on in the catalog `make-docs.work-store-rules.v1`, and use the same IDs in the section. Copy the file byte for byte to `.make-docs/system/references/work-store.md`. Extend the twin test so that it fails when a checkpoint rule ID is on one side only.
- [x] T14: Update the PRDs with a `W35 R0 P1` Requirement History entry in each one whose contract changes:
  - [PRD 52](../../prd/52-work-store-and-work-queue.md): a new `### Checkpoint` section with R-WORK-CHECKPOINT requirements for the steps and their order, the direct run, the trigger run and its event names, "nothing is due", the read-only caller result, the no-Store and not-a-project results, the named checkout, and no new Store table; a new row in the Operations table; R-WORK-SYNC-9, which gains the import-only sync of a trigger run; and R-WORK-STORE-6 and R-WORK-QUEUE-11, so that the agent form covers the checkpoint.
  - [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) R-WORK-RESOURCE-1: the agent twin states the checkpoint rules.
  - [PRD 04](../../prd/04-glossary.md): the terms checkpoint (project), checkpoint (lifecycle), direct run, trigger run, and event.
  - PRD 25 R-ACCESS-17, as the owner chose at OG-1 on 2026-11-27 (option A): a write operation may check its write access inside its handler, at the step that needs it. The new admission is narrow, and a test proves that the registry refuses every other operation as before.
- [x] T15: Add two entries to the [risk register](../../prd/03-open-questions-and-risk-register.md) under `## Rebuild Risks`: one project store serves every branch and worktree, so a checkpoint in a worktree on another branch imports that branch's work files; and a trigger run can be the first sync of a checkout, at a moment that no person chose. Each entry names what this Wave does and does not remove.
- [x] T16: Create `evidence.md` in this backlog folder with the P1 section, and add its link to the [index](00-index.md#usage-notes). Record the six installed cases, the plain output of each for the owner, the final rule ID list, and the T4 and T5 findings.

### Acceptance criteria

- A11: The twin rule ID test passes, and fails on a fixture with a checkpoint rule ID in the catalog only, and on one with a rule ID in the reference only.
- A12: The template reference and the installed reference are byte-identical, and the shipped-text test passes.
- A13: `make-docs check prd` passes. PRD 52 states each checkpoint rule inline, and R-WORK-SYNC-9 states the import-only sync of a trigger run. The risk register holds the two entries of T15.
- A14: The owner reviews the plain output of the six cases: nothing due, files imported, a conflict, a claim that ended, no Store, and a folder that is not a Make Docs project. In each case the first line gives the meaning, and the next useful command is visible when one exists.

### Dependencies

- Stage 2.

## Stage 4 - Version and digest

The owner answered owner gate OG-8 on 2026-11-27: the version is 2.1.1, a patch release. The owner's reason: this Wave is a patch for something that was deferred in order to ship 2.1.0 quickly. So no gate stops this stage.

### Tasks

- [x] T17: Set version 2.1.1 in `packages/cli/package.json` and in the CLI workspace entries of `package-lock.json`. The owner chose this version on 2026-11-27 (owner gate OG-8, answered). Version 2.1.0 is released, so its digest file `.github/release-candidates/v2.1.0.sha256` must not change.
- [x] T18: Record the package digest for the phase commit under [standing rule 10](00-index.md#standing-rules). This creates `.github/release-candidates/v2.1.1.sha256`. Do this after the reviewer passes the phase and after the last change of package bytes.

### Acceptance criteria

- A15: The evidence records the owner's answer to OG-8, version 2.1.1, and its date, 2026-11-27. `packages/cli/package.json` and `package-lock.json` hold version 2.1.1. The digest file `.github/release-candidates/v2.1.1.sha256` holds one lowercase hex line that equals the SHA-256 of the tarball packed from the phase commit. `v2.1.0.sha256` is unchanged.

### Dependencies

- Stage 3.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done. `packages/cli/tests/w35-r0-p1-checkpoint-surfaces.test.ts` (43 tests) covers the `step` Store admission, its three skips, the route guard on the CLI and MCP surfaces, and that the registry refuses every other operation as before; the CLI command in plain and JSON output for a direct run and each of the six event names; the repeat run; the trigger run with every project file byte-identical; `--event branch-change`; a conflict; the claim list with no claim ID; no Store; a folder that is not a Make Docs project; the refusal of an unknown event name; the MCP tool, its profiles, and PRD 25 R-MCP-PROFILE-12 against the code; the two help texts; the twin rule IDs with four broken fixtures; the eleven parity fixtures `WSF-073` to `WSF-083` run through the real checkpoint; and one run with the built CLI, a real setup, and the tool function called in the same process with a real connection key and each access limit. `packages/cli/tests/w35-r0-p1-checkpoint-core.test.ts` (33 tests) runs the core, with a held file, a file that sync could not write, a file that cannot be read, a checkout that is not bound, an old Store schema, an unsafe Store, a copy that waits for a removal, and more than three ready units. The name catalog test (49 tests) checks the current entry and the PRD 39 and PRD 52 tables. Performance Testing `not-needed-now`: [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record) measured the sync that a direct run uses, and [P4](04-git-hook-proofs.md) measures the trigger run. Guided Progress Review `selected` and open: the plain output of the six installed cases is in the evidence for the owner. Unassisted Goal Testing `not-needed-now`.
- Performance evidence: none needed in this phase. No measurement was taken.
- Human Experience Review: prepared, not done. The plain output of the six installed cases, from the built CLI with a temporary Store, is in the [evidence](evidence.md#the-six-installed-cases-a14) for the owner's review.
- Owner decision, 2026-11-27: owner gate OG-1, option A. PRD 25 R-ACCESS-17 gains the `step` Store admission: a write operation may check its write access inside its handler, at the step that needs it. A caller with read access only, and an MCP call without the write permission (`allowWrite`), get the read steps, a line that says the sync did not run, and exit code 0. The orchestrator told the owner this consequence with option A. The [evidence](evidence.md#the-step-store-admission-og-1-option-a) says how the admission works and how it stays narrow.
- Owner decision, 2026-11-27: with the machine preference on, setup installs the git hooks automatically only in new projects. This phase recorded it in the design, the plan, the backlog index, and [P5](05-git-hooks-in-setup.md), and built no hook code. The owner also decided the meaning of "new project" on 2026-11-27: the same as for the project name in PRD 38 R-ID-8, a fresh setup target with no config file (R3a of the plan).
- Recorded deviation from the stage order: the earlier builder wrote the core function of the checkpoint before the gate answer, and did T15 and T17 before Stage 2. This pass built the operation on that core after the owner's answer.
- Review and fix pass, 2026-11-27: a review found that the `step` admission skipped the route guard, that the summary line could say "match" when it was false, and that the first sync line could be false. The fix pass corrected each one, made a direct run name the next command without a usable Store, and added tests. The [evidence](evidence.md#the-failing-cases-of-the-review-run-again) shows the cases again.
- New behavior that the documents did not state: 23 points, listed in the [evidence](evidence.md#new-behavior-that-the-documents-did-not-state). Each point waits for the owner's review at the phase report. None is recorded as an owner decision.
- T18: done on 2026-11-27. The orchestrator recorded the digest `a2aca036f93c2ae20a2266f733e5e59bafebe9485592ca703c87ad52e4f79038` in `.github/release-candidates/v2.1.1.sha256` after the second review, under [standing rule 10](00-index.md#standing-rules). The pull request run confirms it on Linux.
- Optional experience handoff: none.
- Explicit human acceptance gate: Pending. The owner reviews the plain output of the six cases (A14) and the points of new behavior.
- Evidence report: [P1 Checkpoint Command](evidence.md#p1-checkpoint-command).
- Phase / capability status: implementation complete and committed after two independent reviews. T1 to T18 are done. A1 to A13 have automated or recorded evidence. A14 waits for the owner. A15 has its version part and its digest file. The phase is not marked complete, because A14 waits for the owner.
