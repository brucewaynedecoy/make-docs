---
title: "W31 R0 P4 One-Time Rewrite and Acceptance Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W31 R0 P4"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W31 R0 P4 One-Time Rewrite and Acceptance Closeout

## Changes

Uses the project doctor to rewrite this repository's active backlogs once. A read-only `make-docs project doctor check`, with the W22 R2 backlog excluded, found 3,288 lower-case task IDs on 2,915 lines in 268 files across 54 backlogs, skipped the two managed routers, and returned a review digest. The owner reviewed the findings, including a sorted list of the 730 prose references with no false hit, and approved the fix. `make-docs project doctor fix` then changed exactly those 3,288 `t` to `T`, with backups and one Store operation record. A byte comparison proved that no other byte changed and that archives, history records, and the W22 R2 backlog are untouched, and a second check found nothing. Register D-063 records W31 R0 as complete, with one remaining doctor run on the W22 R2 backlog after W22 R2 closes.

Validation passed: the second doctor check, the byte proof, the backlog snapshot comparison, and the full suite with only known failures. The Human Experience Review found all four promises hold. Performance Testing and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P4 work](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/04-one-time-rewrite-and-acceptance.md) | Closes T1–T7 and A13–A16. |
| [Evidence report](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/evidence.md) | Records the check, review, fix, byte proof, and Human Experience Review. |
| [Risk register](../../../docs/prd/03-open-questions-and-risk-register.md) | D-063 records W31 R0 complete and the remaining W22 R2 run. |

### Maintainer

None this session.

### User

None this session.
