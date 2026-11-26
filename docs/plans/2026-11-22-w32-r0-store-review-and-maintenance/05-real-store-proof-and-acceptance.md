---
title: "W32 R0 P5 Real Store Proof and Acceptance"
kind: "plan"
status: "draft"
coordinate: "W32 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-11-22-store-review-and-maintenance.md"
---

# W32 R0 P5 Real Store Proof and Acceptance

## Purpose

Fix documentation drift and prove the Wave on a copy of a real Store before W29 R0 P2 starts.

## Outcome

The Store README and comments describe only what exists. Check and clean work on a copy of the maintainer machine's Store. W29 R0 P2 can start.

## Scope

- Correct the Store README and code comments: callers, backup names, recovery paths, and the table count in each comment.
- Copy the maintainer machine's Store to a temporary folder. Run `setup store check` and `setup store clean` on the copy with `MAKE_DOCS_HOME` pointed at it. Record the findings, the rows removed, and the space before and after. Never run `clean` on the real Store in this phase.
- On the copy, confirm that a `sqlite3` write fails after the migration, and that Make Docs reports a removed trigger as `store-unsafe`.
- Run `PERF-005`: characterize `clean` with the vacuum on the copy. Keep the result informational.
- Run the full test suite and record known failures.
- Complete a Human Experience Review for each promise in the plan overview, with the owner's review of `project list`, `check`, and `clean` wording.
- Record evidence in the work backlog's `evidence.md`.

## Exclusions

- No `clean` on the real Store without separate owner approval.
- No release or publish action without separate owner authority.

## Acceptance

- Every plan validation item has recorded evidence or a named limit.
- `PERF-005` has a recorded baseline and a recorded decision on the vacuum.

## Dependencies

- P3 and P4.
