---
title: "W19 R7 P1 — Setup Interview and Recovery Correction"
kind: "plan"
status: "draft"
coordinate: "W19 R7 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-15-setup-interview-and-recovery-correction.md"
---

# W19 R7 P1 — Setup Interview and Recovery Correction

## Purpose

Deliver the full correction in one phase. The phase joins setup admission, Skills interaction, Store recovery, package proof, and owner acceptance under one close gate.

## Outcome

One extracted CLI candidate uses the same Skills interview in full and focused setup. It stops before questions when recovery owns the checkout. It gives only actions that the saved Store evidence permits. It safely rolls back a proved zero-effect incomplete operation. It retains useful failure detail. It passes the fixed legacy-project matrix.

## Scope

In scope:

- `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, and the setup dispatch in `packages/cli/src/cli.ts`;
- installation operation schema and state services under `packages/cli/src/store/`;
- exact CLI, JSON, and MCP recovery results that use the shared operation service;
- focused, integration, package, and isolated installed-project tests;
- the central backlog evidence report and Human Experience Review.

Out of scope:

- a new command family, a new Skill type, or a new setup mode;
- a rewrite of the install planner or Store;
- any write to the affected real project or its Store before the candidate gate;
- publication, release, branch creation, commit, or push without separate approval;
- unrelated W19 R6, W20, or W21 work.

## Ordered Stages

### Stage 1 - Shared interview and early setup admission

Create one Skills interaction model and renderer. Make full setup and `setup skills` use it. Read pending checkout state before all editable setup questions. Remove the path that collects a Skill change and rejects it only after the interview.

Stage 1 closes only when both entry points produce the same frames and key results for the same state, and pending work produces no editable question or write.

### Stage 2 - Plan-aware recovery and failure detail

Add a compatible Store migration for safe failure fields. Derive the permitted recovery action from plan completeness, steps, ledgers, lock state, and live file evidence. Add the zero-effect rollback transaction. Keep complete partial operations recoverable. Keep changed or unknown evidence blocked.

Stage 2 closes only when CLI, JSON, MCP, status, setup errors, and recovery use the same action rule and facts.

### Stage 3 - Packaged candidate and acceptance

Build one tarball after Stages 1 and 2 pass. Install that exact tarball in isolated homes. Run the fixed legacy and recovery cases with isolated Store roots. Prepare the Human Experience Review. Then let the owner use the candidate through Guided Progress Review.

Stage 3 closes only after the owner response is recorded and all six experience promises have an approved conclusion or a clear open defect. Any open release-blocking defect keeps P1 open.

## Verification Set

- V1 — Interview parity: compare full setup and `setup skills` frames, labels, details, selected summary, instructions, keys, cancellation, and saved result from the same inputs.
- V2 — Early admission: prove `setup`, `setup reconfigure`, and `setup skills` read pending state before the first editable question and produce no file, Store, backup, or config write.
- V3 — Incomplete zero-step recovery: use equal ledgers and no lock. Prove resume is not offered. Prove rollback dry-run is no-effect. Prove apply changes only the operation status and final time.
- V4 — Complete partial recovery: prove verified resume and rollback work from one saved plan. Prove later file changes block mutation and remain intact.
- V5 — Failure detail: inject an operation failure, restart the process, and prove the stable code, safe summary, stage, and next action remain available in human and machine output without private content.
- V6 — Legacy project safety: test a pre-v2 Skills-disabled project and old managed instruction blocks. Prove review, verified backup, apply, repeat, and rollback while preserving user-owned files.
- V7 — Package identity: build one tarball, record its name and digest, extract it with the repository unavailable, install it in isolated homes, and run V1-V6 through the packed executable.
- V8 — Human Experience Review: present per-promise evidence, observations, conclusions, limits, and next actions. Record the owner's response. Apply corrections before the approved result is recorded.

## Exit Criteria

- D-034 and D-035 have evidence that meets their close rules. They remain open until the owner accepts that evidence.
- All focused and full CLI tests pass.
- Default validation and complete package smoke proof pass.
- PRD authority, link, path, and diff checks pass.
- The packaged candidate and tested executable identity match.
- The source real project and its Store records have not changed during candidate proof.
- HX-1 through HX-6 have actual evidence and an owner-reviewed conclusion.
- The implementation record states its test scope and limits. It does not turn a knowledgeable owner review into an Unassisted Goal Test.

## Failure and Scope Rules

Keep P1 open when a required case fails. Fix the bounded defect within this phase. Bring any new product choice to the owner. Do not add a local recovery file, delete a pending row, weaken user-content checks, skip package proof, or use the real project to bypass an isolated failure.
