---
title: "W19 R7 Setup Interview and Recovery Correction Work Backlog"
kind: "work"
status: "superseded"
coordinate: "W19 R7"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "Implement and prove the bounded setup and recovery correction from one current authority set."
  coordinate_handoff: "Carry W19 R7 P1 into the phase history and implementation commit only after explicit implementation authority."
---

# W19 R7 Setup Interview and Recovery Correction Work Backlog

> Superseded on 2026-09-16 by [W19 R8 Store Access Bootstrap and Remediation](../2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-index.md). Do not implement this backlog separately.

## Purpose

Implement one complete correction for the duplicate Skills interview and invalid recovery route. The backlog has one phase with three ordered stages. The phase cannot close after only one fault is fixed.

Read the [design](../../designs/2026-09-15-setup-interview-and-recovery-correction.md), [plan](../../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-overview.md), and current PRDs before implementation. Current PRDs own product requirements. This backlog owns tasks and gates.

Implementation is not authorized by this package. The affected real project and its Store records stay read-only until a later explicit approval and the packaged-candidate gate passes.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| HX-1: one Skills interview | [Design](../../designs/2026-09-15-setup-interview-and-recovery-correction.md) and [plan](../../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-overview.md) | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) and [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | [P1](01-setup-interview-and-recovery-correction.md) | Automated parity and owner Guided Progress Review | A1-A3 and A9 pass | None |
| HX-2: state check before questions | Same | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-setup-interview-and-recovery-correction.md) | No-question/no-write tests and packed transcript | A4 passes | None |
| HX-3 and HX-4: valid action and no-effect rollback | Same | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-setup-interview-and-recovery-correction.md) | Recovery matrix and packed proof | A5-A7 pass | None |
| HX-5: retained failure detail | Same | [PRD 38](../../prd/38-global-store-and-project-state.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-setup-interview-and-recovery-correction.md) | Failure injection and restart | A8 passes | None |
| HX-6: verified backup promise | Same | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md) and [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md) | [P1](01-setup-interview-and-recovery-correction.md) | Extracted-package legacy case | A10 passes | None |

## Phase Map

| Phase | File | Ordered stages | Required result |
| --- | --- | --- | --- |
| P1 | [Setup Interview and Recovery Correction](01-setup-interview-and-recovery-correction.md) | Shared interview and early admission; plan-aware recovery and failure detail; packaged candidate and acceptance | One identified package passes all cases. The owner accepts the Human Experience Review. The real project remains unchanged. |

## Usage Notes

- Use task IDs t1-t16 across the one phase. Do not reset IDs between stages.
- Recheck branch, HEAD, dirty files, disk, installed CLI, and relevant Store state before implementation. Preserve concurrent edits. Do not create or switch a branch or worktree without explicit user permission.
- Do not edit the affected real project or its Store. Build fixtures in disposable roots. Use an isolated copy only after its source and privacy boundary are reviewed.
- Build one tarball after source tests pass. Record its digest. Use that exact tarball for every packed case and the owner review.
- Do not repair a pending operation by deleting its row, editing SQLite by hand, deleting project state, or inventing missing steps.
- Keep one central `evidence.md` only when implementation starts and evidence exists. Link source test results when useful. Do not create an empty report during package drafting.
- Automated Implementation Testing is required. Performance Testing is `not-needed-now`. Guided Progress Review is required. Unassisted Goal Testing is `not-needed-now` for the current knowledgeable owner review.
- Human Experience Review is a separate acceptance lens. The agent prepares per-promise observations and limits. The owner response is required before the approved result is recorded.
- D-034 and D-035 remain open until accepted installed evidence meets their close rules.
- No `O-###` or `NUAT-###` is active for this correction. Create neither as a placeholder.
- A failed required case keeps P1 open. Do not add another phase to hide a partial result.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: After explicit implementation approval, start [P1](01-setup-interview-and-recovery-correction.md) at Stage 1 and continue through its single close gate.
- Why: The one phase is the implementation queue derived from the accepted design, current PRDs, and correction plan.
- Coordinate Handoff: Carry `W19 R7 P1` into implementation evidence, closeout history, and the implementation commit.

Package acceptance does not authorize implementation, a real-project recovery, CLI installation, commit, push, publication, or release.
