---
title: "Phase 3: Execution Modes and Digest-Aware Resume"
kind: "work"
status: "active"
coordinate: "W18 R7 P3"
source:
  type: "prd"
  path: "docs/prd/35-run-playbook-state-machine-and-portability.md"
---

# Phase 3: Execution Modes and Digest-Aware Resume

## Purpose

Make `playbook.advance` mode-aware and make re-entry safe. The step execution mode is the mechanism of the degradation guarantee, and the digest check is what prevents silently resuming against a changed workflow.

## Overview

Implement the deterministic, delegated, and manual behaviors of `playbook.advance` using the mode dimension from the W18 R6 step model, and implement `playbook.resume` as a digest-checked re-entry that blocks by default on mismatch. Optional step-remapping migration is an enhancement, never the default.

## Source PRD Docs

- [35 Revise Run Playbook State Machine](../../prd/35-run-playbook-state-machine-and-portability.md)
- [34 Revise Playbook Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/35-run-playbook-state-machine-and-portability.md#requirements)

## Stage 1 - Execution by Step Mode

### Tasks

- [x] t1: Implement `deterministic` execution — resolve the step's `operation` or `command`, execute an operation through the operation core and a command through the shell, capture the structured result as run evidence, and transition automatically (R-MODE-1).
- [x] t2: Implement the CLI-absent deterministic path — resolve the operation identifier to its human CLI form and present that command for the reader to run by hand (R-MODE-1, R-TIER-1).
- [x] t3: Implement `delegated` execution — present the step instructions, set the step to `waiting-for-user`, and wait for a subsequent `playbook.advance` carrying the reported outcome and evidence (R-MODE-1).
- [x] t4: Implement `manual` execution — record acknowledgment only, executing nothing (R-MODE-1).
- [x] t5: Treat a step with no declared mode as `delegated`, consistent with the W18 R6 default (R-MODE-2).

### Acceptance criteria

- A deterministic step executes its resolved operation or command, captures structured evidence, and auto-transitions; without the CLI it presents the resolved human command form instead.
- A delegated step holds at `waiting-for-user` and advances only on a reported outcome with evidence, and the same instructions are usable directly without the CLI.
- A manual step records acknowledgment and executes nothing.
- An unspecified mode behaves as `delegated`.

### Dependencies

- Phase 2 `playbook.advance` shell and evidence capture.
- The W18 R6 step model's mode dimension and `operation`-versus-`command` split (PRD 34).

## Stage 2 - Digest-Aware Resume

### Tasks

- [x] t6: On `playbook.resume`, compare the stored source digest with the current Playbook digest and resume at the stored cursor when they match (R-RESUME-1).
- [x] t7: On mismatch, mark the run stale, block by default, require an explicit re-plan, and emit a diagnostic that names the change; never silently resume against a changed workflow (R-RESUME-1).
- [x] t8: If migration is implemented, offer it only as an explicit opt-in enhancement that re-maps still-present step identifiers and flags added or removed steps, never as the default mismatch behavior (R-RESUME-2).

### Acceptance criteria

- A matching digest resumes at the stored cursor.
- A mismatched digest blocks by default with a diagnostic naming the change and requires an explicit re-plan.
- Migration, if present, is opt-in and its algorithm details remain an implementer decision.

### Dependencies

- Stage 1 mode execution.
- The source digest captured at `playbook.start` in Phase 2.
