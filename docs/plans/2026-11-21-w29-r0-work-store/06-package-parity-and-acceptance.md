---
title: "W29 R0 P6 Package Parity and Acceptance"
kind: "plan"
status: "draft"
coordinate: "W29 R0 P6"
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
---

# W29 R0 P6 Package Parity and Acceptance

## Purpose

Prove the whole work store on an installed package before W30 builds on it.

## Outcome

One package candidate passes installed, two-checkout, no-Store, parity, performance characterization, and Human Experience checks. W30 can start.

## Scope

- Install the candidate in a clean fixture project and in this repo's dogfood instance.
- Run first import, then edit the same backlog in two checkouts that share git, and prove import, write, conflict stop, and settle.
- Prove a project without Store access keeps `docs/work/` as the authority and every existing command behaves as before.
- Prove a folder without git works with the same commands.
- Run `PERF-004`: characterize automatic sync time on a project with many backlogs. Keep the result informational.
- Complete a Human Experience Review for each promise in the plan overview.
- Record evidence in the work backlog's `evidence.md`.

## Exclusions

- No release or publish action without separate owner authority.

## Acceptance

- Every plan validation item has recorded evidence or a named limit.
- `PERF-004` has a recorded baseline and a recorded decision on the fast path.

## Dependencies

- P2 to P5 and one identified package candidate.
