---
title: "Phase 5: Tests and Verification"
kind: "work"
status: "active"
coordinate: "W18 R7 P5"
source:
  type: "prd"
  path: "docs/prd/35-run-playbook-state-machine-and-portability.md"
---

# Phase 5: Tests and Verification

## Purpose

Land the D10 verification suite so every non-negotiable behavior of the state machine is proven rather than asserted, including the boundary rule that run state never lands in the repository.

## Overview

Cover every progression operation's success and failure transitions, both resume outcomes, all three execution modes, the guardrail stops, and the no-repo-run-state assertion. Tests run against the engine through its operations, using the storage seam from Phase 1.

## Source PRD Docs

- [35 Revise Run Playbook State Machine](../../prd/35-run-playbook-state-machine-and-portability.md)
- [34 Revise Playbook Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/35-run-playbook-state-machine-and-portability.md#requirements)

## Stage 1 - Operation and Resume Tests

### Tasks

- [x] t1: Test every progression operation for its success and failure transitions — `playbook.start`, `playbook.status`, `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` (R-TEST-1).
- [x] t2: Test that `playbook.next` never mutates state, asserting the run record is byte-identical before and after (R-TEST-1, R-OP-3).
- [x] t3: Test resume with a matching digest, which resumes at the stored cursor (R-TEST-2).
- [x] t4: Test resume with a mismatched digest, which blocks with a diagnostic naming the change (R-TEST-2).

### Acceptance criteria

- Every operation has success and failure transition coverage.
- `playbook.next` is proven side-effect free.
- Both resume outcomes are covered: match resumes, mismatch blocks with a diagnostic.

### Dependencies

- Phases 2 and 3 complete.

## Stage 2 - Mode, Guardrail, and Boundary Tests

### Tasks

- [x] t5: Test a deterministic step that executes and auto-transitions with captured structured evidence (R-TEST-3).
- [x] t6: Test a delegated step that holds at `waiting-for-user` and advances on a reported outcome with evidence (R-TEST-3).
- [x] t7: Test a manual step that records acknowledgment without executing (R-TEST-3).
- [x] t8: Test a parallel child run blocked by output-surface overlap (R-TEST-4).
- [x] t9: Test an unattended run that holds at a gate requiring a human (R-TEST-4).
- [x] t10: Assert that no run state is written under `.make-docs/runs/` or any repository path across the full test suite (R-TEST-5).

### Acceptance criteria

- All three execution modes have behavioral coverage.
- The overlap guardrail and the unattended gate hold are proven by failing-path tests.
- The suite fails if any run state appears under `.make-docs/runs/` or any other repository path.
- Step status assertions use only the shared eight-value vocabulary.

### Dependencies

- Stage 1 and Phase 4 complete.
