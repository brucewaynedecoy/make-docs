---
title: "W31 R0 P4 One-Time Rewrite and Acceptance"
kind: "plan"
status: "draft"
coordinate: "W31 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-22-task-id-case-and-project-doctor.md"
---

# W31 R0 P4 One-Time Rewrite and Acceptance

## Purpose

Use the doctor to rewrite this repository's active backlogs once, and prove the Wave.

## Outcome

This repository's active backlogs use `T`, except the excluded W22 R2 backlog. Archives and history records are unchanged. W29 R0 P3 can start.

## Scope

- Run `make-docs project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption/` on this repository. Record the totals and the digest.
- Review the findings with the owner, then run `make-docs project doctor fix --review <digest>` with the same exclusion.
- Confirm that a second check finds nothing outside the excluded path, and that no file under `.make-docs/archive/` or any history record changed.
- Confirm that the backlog snapshot facts are the same before and after, apart from the task ID case.
- Record a follow-up in register D-063: run the doctor on the W22 R2 backlog after W22 R2 closes.
- Run the full test suite and record known failures.
- Complete a Human Experience Review for each promise in the plan overview, including the owner's review of the check and fix wording.
- Record evidence in the work backlog's `evidence.md`.

## Exclusions

- No change to W22 R2 files, branches, or worktrees.
- No release or publish action without separate owner authority.

## Acceptance

- Every plan validation item has recorded evidence or a named limit.
- The second check is clean outside the excluded path.
- Register D-063 names the remaining W22 R2 run.

## Dependencies

- P2 and P3.
