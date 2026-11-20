---
title: "Phase 9: Windows Store Session Admission Retry"
kind: "work"
status: "complete"
coordinate: "W22 R0 P9"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 9: Windows Store Session Admission Retry

## Purpose

Stop a Windows Store session from failing with `access-denied` when many processes open Store sessions at the same time. Windows returns `EPERM` when a process opens or creates a path that another process is deleting. Store session admission races with the cleanup of the empty `store-access.lock` session directory, so that `EPERM` is transient and must be retried.

Revises: [P7](07-setup-bridge-order-and-recovery-loop-repair.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure. P6 and P7 added the bounded session-admission retries: P6 for Windows `EPERM`, `EACCES`, and `EBUSY` during dead-session recovery, and P7 for the macOS `EINVAL` race. Both Phases are complete and committed. The fix extends the same bounded retry to the three remaining session steps on Windows. It reverses no approach, redoes no other completed Phase, and needs no design or multi-phase plan, so no revision Wave test passes.

The defect showed in the "windows-latest installed package" job of PR #65. The source safety test "keeps shared Store sessions safe under 20 processes and five checkouts" in `packages/cli/tests/installation-state.test.ts` failed twice on 2026-11-19 and 2026-11-20 and then passed. The failure was `access-denied` with `EPERM` on `store-access.lock` at the "secure session directory" step in `packages/cli/src/store/database.ts`. A `workflow_dispatch` run on `main` passed, so the failure depends on timing. The defect is recorded as D-059 in [PRD 03](../../prd/03-open-questions-and-risk-register.md).

The retry stays bounded by the admission deadline. A real permission problem still fails with `access-denied`, after that deadline. Other platforms keep `EPERM` fatal on the first attempt.

## Human Experience Outcome

- **Impact and governing promise:** `indirect`. A Windows user whose agents and CLI open the Store at the same time no longer sees a false request to grant Store access.
- **Intended human outcome:** concurrent Store use on Windows waits and continues. It does not fail with an access error that the person cannot fix.
- **Human-facing surface:** every Store-backed CLI and MCP operation on Windows.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing, including the Windows installed-package CI job.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirement is [PRD 38](../../prd/38-global-store-and-project-state.md) R-DB-3, which requires bounded busy retry for concurrent Store writers. It already states the correct behavior, so no requirement changes.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | A deterministic fault-injection test for each session step, a test that a lasting `EPERM` still fails after the deadline, a test that other platforms keep `EPERM` fatal, `npm test`, `validate:defaults`, the build, `smoke:pack:local`, and the three-platform CI. |
| Performance Testing | not-needed-now | The retry uses the existing admission backoff and deadline. No performance decision depends on it. |
| Guided Progress Review | not-needed-now | No owner choice depends on a progress review. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md) (R-DB-3, unchanged)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) (D-059)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- D-059 in [PRD 03](../../prd/03-open-questions-and-risk-register.md), from the PR #65 Windows installed-package job

## Stage 1 - Bounded Windows Retry

### Tasks

- [x] t1: In `packages/cli/src/store/database.ts`, add one helper for transient Windows access codes. Retry them until the admission deadline when the session directory is created, when it is opened and secured, and when the session file is created. Use the helper at the two existing Windows retries too.
- [x] t2: Add `packages/cli/tests/w22-r0-p9-windows-session-admission.test.ts`. Inject `EPERM` at each step on a simulated Windows platform, and confirm that the tests fail without the change.
- [x] t3: Run the focused Store tests, `npm test`, `validate:defaults`, the build, and `smoke:pack:local`. The three-platform CI then runs on the PR. A CI pass alone cannot prove a timing fix, so the deterministic test is the proof.
- [x] t4: Last, pack the 2.0.9 candidate twice and save its matching SHA-256 in `.github/release-candidates/v2.0.9.sha256`. This digest also covers W19 R5 P3 in the same PR.

### Acceptance criteria

- A71: On Windows, a transient `EPERM` when Store session admission creates the session directory, opens it, or creates the session file is retried, and the session opens.
- A72: An `EPERM` that lasts past the admission deadline still fails with `access-denied`. On other platforms, `EPERM` still fails on the first attempt.
- A73: Two packs of the 2.0.9 candidate have the same SHA-256, and `.github/release-candidates/v2.0.9.sha256` holds it as one lowercase hex line.

### Dependencies

- P1 to P8 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p9-windows-store-session-admission-retry). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: the change has no new output. A transient Windows race now waits instead of showing a false request for Store access. A lasting access problem still shows the same `access-denied` guidance, after the admission deadline. Limit: the race is reproduced by fault injection on macOS. A real Windows run is only the PR's CI, which cannot prove a timing fix by itself.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P9 Windows Store Session Admission Retry](evidence.md#p9-windows-store-session-admission-retry).
- Phase / capability status: Phase complete on commit. D-059 is closed.
