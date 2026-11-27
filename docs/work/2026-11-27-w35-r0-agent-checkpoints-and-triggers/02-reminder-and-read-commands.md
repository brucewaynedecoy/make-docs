---
title: "Phase 2: Reminder and Read Commands"
kind: "work"
status: "draft"
coordinate: "W35 R0 P2"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 2: Reminder and Read Commands

## Purpose

Make a Make Docs command that an agent already runs say when work files wait for sync. It depends on P1, because each line names the checkpoint command.

## Overview

This phase adds one reminder check to each command with Store read access. The check runs after the command's own operation ends, and it prints one line when work files still wait for import. The phase also changes the first lines of `work next` and `work status`, marks out-of-date units in `work next`, and adds one sentence to a project URI read. It measures the cost of the reminder check with `PERF-006`. The read commands still change nothing: under design OD-2 option A they detect the out-of-date state and name the checkpoint, and they do not sync. The reminder, the marks, the "list is not complete" line, and the URI sentence are new.

The reminder line is:

`Work files wait for sync. Run: make-docs project checkpoint`

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. When work files changed and the store does not have them yet, the next Make Docs command says so in one line with the exact command.
- Intended human outcome: a person or agent who runs any Make Docs command with Store read access learns in one line that the store is out of date and which command settles it. A person who reads `work next` does not act on an out-of-date line.
- Human-facing surface or indirect effect: the reminder line on standard error, the reminder field of an MCP result, the first lines and marks of `work next`, the first lines of `work status`, and the text of a project URI read.
- Implementation work: the reminder check in the operation runner, the render change, the read command changes, the URI sentence, and tests.
- Evidence source or testing type selected under current authority: reminder tests for the whole set, `PERF-006`, and a Guided Progress Review of the lines.
- Executor: the implementing agent runs the tests and the measurement. The owner reviews the lines.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Reminder set, exclusion, output channel, error drop, mark, and URI sentence tests. |
| Performance Testing | selected | `PERF-006`, `characterize-now`, informational. |
| Guided Progress Review | selected | The owner sees the reminder line and the first lines of `work next` and `work status`. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link or `none`: `PERF-006`, written in this phase file by T9 before any measurement, under a `## Performance Evidence` section, as [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs) is in its phase.
- Finite evidence budget and stop-rule reference or `not-applicable`: budget event `W35-R0-P2-PERF-006-1`. At most 3 characterization runs, 1 correction attempt for a harness defect only, 1 review cycle, 2 hours in all, the maintainer machine only, and no external spend. Stop after three runs or at the first correctness failure. The budget does not renew itself.
- Execution packet link or `not-applicable`: Stage 3 tasks T9 to T11.
- Outcome and evidence handoff or `none`: the result goes to the evidence report and to owner gate OG-2 when its condition holds.
- Gate disposition and supported-scope limit or `not-applicable`: informational for speed. One machine, this repository's work files, and the candidate build. Correctness of the check stays blocking.

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): R-WORK-STORE-1 to R-WORK-STORE-3, R-WORK-SYNC-8, R-WORK-QUEUE-5, R-WORK-URI-3, R-WORK-URI-5. This phase adds R-WORK-REMIND.
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-RENDER-1 to R-RENDER-3, R-TOP-4. This phase adds R-RENDER-4.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-ACCESS-1, R-ACCESS-2, R-ACCESS-9, R-ACCESS-17
- [48 Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: none. T14 adds one register entry.

## Stage 1 - The reminder

### Tasks

- [ ] T1: Build the reminder set from the registry, not from a hand list: each operation that runs in a Make Docs project and whose declared access includes a Store read. Exclude `work.queue.status`, `work.queue.next`, `work.queue.sync`, and `project.checkpoint.run`. Exclude the operations with Store access and no project access (`setup.store.check`, `setup.store.clean`, `factory.tools.save`, and `factory.tools.list`); this exclusion is new in the plan. `--help`, `mcp`, `update`, and `uninstall` show no reminder. At `86dc7dba` the set has 47 operations, and the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/02-reminder-and-read-commands.md#scope) lists them. Add a test that builds the set from the registry and fails when the set and the PRD 39 list differ. Six operations of the set sync first, through `syncFirst` in `packages/cli/src/operations/work/work-queue/queue.ts`: `work.queue.claim`, `work.queue.release`, `work.queue.report`, `work.queue.close`, `work.queue.add`, and `work.queue.export`. They stay in the set. The other 41 do not sync.
- [ ] T2: Confirm, for each tool that this phase changes, which path `formatMcpToolResult` takes. A tool with an `mcpResultSchema` has a fixed result schema and shows no reminder. `backlog.review.refresh` is the only one in the set today. Record the list in the evidence report. Add the reminder to such a tool only with proof that its schema stays valid.
- [ ] T3: Add the reminder check. The check runs after the operation ends, on the state that the operation left, and never before the operation. So a command that syncs first shows no line after a good sync, because its own sync imported the files and nothing waits when it ends. Put the check in the operation runner after the handler returns. The check runs the authority rule first and stops with no line when the work store is not in charge. It then runs the exact read-only sync check that `work status` and `work next` run (design OD-6 option A). It counts only files that the next checkpoint run would import. It does not count a conflict or a file that waits for a write or a removal. It never opens a Store that the command may not open: for an operation with `optional` or `handler` Store admission, it passes the same access check for a Store read first. Any error in the check is dropped and never changes the command's result or exit code. `work.backlog.snapshot` already runs the same sync check in store mode (`previewWorkSync` in `packages/cli/src/operations/work/backlog/store-snapshot.ts`), so the reminder reuses that result there and runs no second check. If the reuse is not possible, say so in the evidence report, and T9 measures the cost of the second check.
- [ ] T4: Print the line in the CLI on standard error, after the normal output of the operation, and only one time for each command run. JSON on standard output does not change.
- [ ] T5: Add the reminder to an MCP tool result as one field of the result object, so that it reaches a host through the `content` text and through `structuredContent`.

### Acceptance criteria

- A16: Each of the 41 commands in the set that do not sync first shows the line when one work file waits for import. None of the 47 shows it when nothing waits, when only a conflict waits, when only a file waits for a write or a removal, when the work store is not in charge, and when no usable Store exists.
- A17: Each of the six commands that sync first shows no line after a good sync, when one work file waited for import before the run. The store holds that file after the run. This test fails for a check that runs before the operation, because such a check sees the waiting file and prints the line.
- A18: `work status`, `work next`, `work sync`, the checkpoint, `--help` of any command, and each operation with no Store read in its declared access show no reminder line.
- A19: With `--json`, standard output is byte-identical with and without the reminder, and the line is on standard error.
- A20: After a checkpoint run with write access, the next command shows no reminder. A caller with read access only still sees it.
- A21: A forced error inside the check leaves the command's output and exit code unchanged.
- A22: An MCP tool result in the set carries the reminder field in both `content` and `structuredContent`. `backlog_review_refresh` carries none and still passes its schema.

### Dependencies

- P1.

## Stage 2 - The read commands and the project URI read

### Tasks

- [ ] T6: When the sync check finds files that wait for import, make `work next` and `work status` put the checkpoint command first in their result, before the list. Both keep "Changes nothing" in their help and change nothing. Each work tool result that finds files waiting names the checkpoint tool as its next step, in its `lines` and `summary` fields.
- [ ] T7: Make `work next` mark each listed unit whose file waits for import. When a new work file waits for import, or the first sync of this checkout is not done, make it say in one line that the list is not complete, and name the checkpoint command.
- [ ] T8: Add one fixed sentence to the text of a project URI read in `packages/cli/src/operations/work/work-queue/project-resource.ts`: the read does not know whether work files wait for sync in a checkout, and `make-docs project checkpoint` there finds out. The read still runs no sync and no sync check.

### Acceptance criteria

- A23: With one changed work file, the first line of `work next` and of `work status` names `make-docs project checkpoint`, and each unit of that file in `work next` has the mark. Units of other files have none.
- A24: With a new work file that the store does not hold, and in a checkout whose first sync is not done, `work next` says in one line that the list is not complete and names the checkpoint command.
- A25: `work next` and `work status` change no store record and no file in each of these cases.
- A26: Each project URI read carries the fixed sentence, and its Store session stays read-only.

### Dependencies

- Stage 1.

## Stage 3 - Measurement

### Tasks

- [ ] T9: Write the `PERF-006` profile in this phase file, under the performance evidence profile template, before any counted measurement. Reuse the method of `PERF-004`: the installed package candidate, fresh clones of this repository, a temporary Store at a fixed, checked path, and the CLI floor (`make-docs --version`) beside each measured command. The workload is a sample of commands from the reminder set, at least one from each group, each with and without a file that waits for import. Measure each sampled command with the reminder check and with no check, so that the record gives the time that the check adds, and say in the profile how the run with no check is made. For a command that syncs first, the run with a waiting file also measures that command's own sync, and the record says so. Put `work.backlog.snapshot` in the sample, because it already runs the sync check, and record whether the reminder reused that result or the command paid for the check two times.
- [ ] T10: Run `PERF-006` within its budget. Record the work file count, each median, the CLI floor, and the time that the check adds over the same command with no check.
- [ ] T11: Record the result in the evidence report next to [`PERF-004-R1`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record). State what it means for the owner's decision "Fast path: not now" of 2026-11-23, which design OD-6 opens again. The record of 2026-11-23 used the line "more than 1 second over the CLI floor" for a sync with no change. If the check adds more than 1 second over the same command with no check, owner gate OG-2 opens: record that, and Stage 4 waits for the owner's answer.

### Acceptance criteria

- A27: `PERF-006` has a profile written before the runs, a recorded result with its limits, and a recorded statement about the fast path. `make-docs check performance-evidence` reports no error for `PERF-006`.

### Dependencies

- Stage 1.

## Stage 4 - Agent form, PRDs, and register

### Tasks

- [ ] T12: Update the work store reference in `packages/docs/template/`: what the reminder line means, what a mark in `work next` means, and what to do when the list is not complete. Give each new `work next` rule an ID in the catalog `make-docs.work-store-rules.v1`. Copy the file byte for byte to the installed copy.
- [ ] T13: Update the PRDs with a `W35 R0 P2` Requirement History entry in each:
  - [PRD 52](../../prd/52-work-store-and-work-queue.md): new R-WORK-REMIND requirements for what the reminder counts, the exact check, and the authority rule first; R-WORK-SYNC-8, so that the read commands name the checkpoint first and still change nothing; R-WORK-QUEUE-5 for the marks and the "list is not complete" line; and R-WORK-URI-3 for the fixed sentence.
  - [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md): new R-RENDER-4 for the reminder output rule and the commands that show it.
  - [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): the reminder as a result field, and no reminder for a tool with a fixed result schema.
- [ ] T14: Add one entry to the [risk register](../../prd/03-open-questions-and-risk-register.md) under `## Open Questions`: the reminder puts the cost of the exact check on more commands than the 2026-11-23 decision covered. Record the `PERF-006` result and when to look again.
- [ ] T15: Add the P2 section to `evidence.md`, with the plain lines for the owner.

### Acceptance criteria

- A28: The twin rule ID test and the byte-match test pass. `make-docs check prd` passes. The risk register holds the entry of T14.
- A29: The owner reviews the reminder line, the first lines of `work next` and `work status`, one marked unit, and the "list is not complete" line. Each one names the exact command.

### Dependencies

- Stage 2.
- Stage 3.
- Owner gate OG-2, when the reminder check adds more than 1 second over the same command with no check: the owner keeps the exact check on fewer commands or takes a stored signal.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
