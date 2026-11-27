---
title: "W35 R0 P2 Reminder and Read Commands"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P2 Reminder and Read Commands

## Purpose

Make a Make Docs command that an agent already runs say when work files wait for sync. This is the second part of the design's Phase 1, and it holds what owner decision 1 calls "sync on read". Under OD-2 option A the read commands do not sync.

## Outcome

Each command with Store read access runs one check after its own operation ends, and prints one line when files still wait for import:

`Work files wait for sync. Run: make-docs project checkpoint`

`work next` and `work status` name the checkpoint first, `work next` marks each out-of-date unit, and a project URI read says what it does not know.

## Scope

- The reminder set comes from the registry, not from a hand list: each operation that runs in a Make Docs project and whose declared access includes a Store read. A test builds the set from the registry and fails when the set and PRD 39 differ. At `86dc7dba` the registry holds 75 operations, and the set has 47 of them:
  - `project`: `checkout-register.preview` and `apply`, `checkout-move.preview` and `apply`, `state.status`, `state.recover`, `register.list`, `surface.ensure`, `layout.prepare`, `apply`, and `verify`, and `doctor.fix`;
  - `work`: `evidence.record` and `read`, `backlog.snapshot`, `backlog-cache.lookup` and `write`, and the queue operations `claim`, `release`, `report`, `close`, `export`, and `add`;
  - `backlog.review.refresh`, in the CLI only, because its MCP result has a fixed schema;
  - `resource.ensure`;
  - the ten `lifecycle` operations;
  - the twelve `factory` operations that declare project access.
- No reminder on: `--help`, `mcp`, `update`, `uninstall`, `work status`, `work next`, `work sync`, the checkpoint itself, any operation with no Store read in its declared access, and the four operations with Store access and no project access (`setup.store.check`, `setup.store.clean`, `factory.tools.save`, and `factory.tools.list`). The last group is new in this plan.
- The check runs after the operation, on the state that the operation left. It never runs before the operation. Six operations of the set sync first, through `syncFirst` in `packages/cli/src/operations/work/work-queue/queue.ts`: the queue operations `claim`, `release`, `report`, `close`, `add`, and `export`. Such a command imports the waiting files itself, so it shows no line after a good sync. The other 41 do not sync, so they show the line.
- The check is the exact check of OD-6 option A: the read-only sync check that `work status` and `work next` run today. It runs the authority rule first and stops with no line when the work store is not in charge. It counts only files that the next checkpoint run would import. It does not count a conflict or a file that waits for a write or a removal.
- `work.backlog.snapshot` already runs the same sync check in store mode (`previewWorkSync` in `packages/cli/src/operations/work/backlog/store-snapshot.ts`). The reminder reuses that result there, or `PERF-006` records the cost of the second check.
- The check never opens a Store that the command may not open. For an operation with `optional` or `handler` Store admission, the check passes the same access check for a Store read first.
- Any error in the check is dropped and never fails the command or changes its exit code.
- In the CLI the line goes to standard error after the normal output, so JSON on standard output does not change. At most one reminder appears for each run.
- In an MCP result the reminder is one field of the result object, so it reaches a host through `content` and through `structuredContent`. A tool with an `mcpResultSchema` shows no reminder, unless the phase proves a way that keeps its schema valid.
- `work next` and `work status` put the checkpoint command first in their result when the sync check finds files that wait for import. They keep "Changes nothing".
- `work next` marks each listed unit whose file waits for import. When a new work file waits for import, or the first sync of the checkout is not done, it says in one line that the list is not complete and names the checkpoint.
- A project URI read gains one fixed sentence: the read does not know whether work files wait for sync in a checkout, and the checkpoint command there finds out. Its code still runs no sync and no sync check.
- Each work tool result that finds files waiting names the checkpoint tool as its next step, in the `lines` and `summary` fields that work results already have. The phase confirms the plain MCP path for each tool that it changes.
- `PERF-006`: write the profile under the performance evidence profile template before any measurement. Reuse the `PERF-004` method. Measure the CLI floor and a sample of commands from the reminder set with and without the check, on this repository's work files, with a temporary Store.
- PRD changes: PRD 52 (new R-WORK-REMIND, R-WORK-SYNC-8, R-WORK-QUEUE-5, R-WORK-URI-3), PRD 39 R-RENDER-4, and PRD 25 for the result field, each with a Requirement History entry.
- Agent form: the work store reference says what the reminder and the marks mean, with rule IDs for the new `work next` rules.
- Register: one question for the reminder cost and the "Fast path: not now" decision of 2026-11-23, which OD-6 opens again.

## Exclusions

- No sync inside a read command.
- No stored change signal and no Store schema change (OD-6 option B).
- No uniform next-step field on every operation.

## Acceptance

- Each of the 41 commands in the set that do not sync first shows the line when a file waits for import. No command in the set shows it when none waits, when a conflict alone waits, and when the work store is not in charge.
- Each of the six commands that sync first shows no line after a good sync. The test fails for a check that runs before the operation.
- Each excluded command shows no line.
- JSON on standard output is byte-identical with and without the reminder.
- A checkpoint run with write access clears the reminder.
- A forced error in the check does not change the command's output or exit code.
- `work next` marks the right units and says when the list is not complete.
- `PERF-006` has a recorded result, and OG-2 is settled or did not open.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: selected, `PERF-006`, `characterize-now`, informational.
- Guided Progress Review: selected. The owner sees the reminder line and the first lines of `work next`.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1.
- Owner gate OG-2, only if the reminder check adds more than 1 second over the same command with no check. The measurement stage finds whether it opens, and it blocks only the last stage.
