---
title: "W31 R0 P1 Readers Accept Both Cases Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W31 R0 P1"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W31 R0 P1 Readers Accept Both Cases Closeout

## Changes

Makes every task ID reader accept `t` and `T` as the same ID, before any writer changes. The work phase parser reads both cases and keeps each ID as written. The phase task check compares IDs without regard to case, so a file with only `T` passes with no warning. The backlog snapshot now reads `- [ ] T1: ...` as task `T1`, not as a task with no ID, and still writes upper-case IDs. The shipped decompose-codebase validator also reads both cases. Task coordinate input needed no code change: phase targets and the W29 R0 P1 project URI grammar already read both cases, and a new test holds that. No template, router, CLI text, or backlog file changed.

Validation passed: 8 new reader tests on lower-case, upper-case, and mixed files, 45 validator tests, and the type check. The full suite has 3 failures that exist without this phase: two Node v26 stderr warnings and one sandbox-only fixture. Without the reader changes, 7 of the 8 new tests fail. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/01-readers-accept-both-cases.md) | Closes t1–t5 and A1–A3. |
| [Evidence report](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/evidence.md) | Records the P1 checks, results, and limits. |
| [W31 R0 backlog](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) | Links the evidence report. |

### Maintainer

None this session.

### User

None this session.
