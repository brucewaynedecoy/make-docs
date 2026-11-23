---
title: "W34 R0 P5 Acceptance Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W34 R0 P5"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W34 R0 P5 Acceptance Closeout

## Changes

Proves the W34 R0 Wave and closes register D-064. The acceptance task ID check of `make-docs check decomposition` now uses the shared task line reader (P5 T8). `packages/cli/src/operations/work/task-line.ts` gives the task ID rule one home, the exported `TASK_ID_SOURCE`, and adds `readTaskLabel`, which reads a task ID label in a plain bullet such as `- T1: ...`. `readTaskLine` reads only a task line with a checkbox, and its pattern does not change. After an independent review, the work phase reader's `TASK_RE` builds on `TASK_ID_SOURCE` too, with the same pattern as before. `w34-r0-p5-acceptance-task-label.test.ts` (10 tests) proves the label reader, the two unchanged patterns, and the check result. A side-by-side run of the old Python check from Git history against the built command, on temporary fixtures, gave the same acceptance task ID findings and no new difference.

The other two old scripts ran again against the final commands. Every difference has a reason that P1 recorded: skipped router and managed-block files, `#fragment` links, and W/R numbers inside longer numbers. A Human Experience Review of the five promises in the backlog index found each one `satisfied` within its limits, on the real Skill text and the real plain output of the four commands on this repository. D-064 is closed. R-008 records that its helper-script part is closed and stays open for its other parts. New register entry D-067 holds two output limits that the review found: `project markdown validate` and `repair` skip a file that only names the managed-block marker and give a wrong reason, and `check decomposition` gives no hint on a project that is not a decomposition output. The owner chooses the marker rule. No code changed for D-067.

One task stays open: P3 T7 and A15, the refresh of the installed `backlog-review` copy in `.agents/skills/`. The owner does it with `make-docs update` after the release, so the backlog index stays `active`.

```text
packages/cli/
├── src/operations/work/task-line.ts                   (one task ID rule, readTaskLabel)
├── src/operations/work/index.ts                       (TASK_RE builds on TASK_ID_SOURCE)
├── src/operations/decomposition/output.ts             (uses readTaskLabel)
└── tests/w34-r0-p5-acceptance-task-label.test.ts      (new)
docs/
├── prd/03-open-questions-and-risk-register.md         (D-064 closed, R-008 updated, D-067 new)
└── work/2026-11-23-w34-r0-skill-scripts-into-the-cli/ (P5 closeout, evidence, index status)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P5 work](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/05-acceptance.md) | Closes T1 to T8 and records A20 to A22. |
| [Evidence report](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/evidence.md) | The T8 change and side-by-side run, the final operations against the P1 evidence, the validation items, the Human Experience Review, and the register result. |
| [Backlog index](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/00-index.md) | Status line, the end of the D-064 hold, and a Change History entry for T8. |
| [Register](../../../docs/prd/03-open-questions-and-risk-register.md) | D-064 is closed. R-008 records the helper-script result. New D-067 holds the two output limits. |

### Maintainer

None this session.

### User

None this session.
