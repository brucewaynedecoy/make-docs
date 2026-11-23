---
title: "Phase 6: Proofs and Acceptance"
kind: "work"
status: "active"
coordinate: "W30 R0 P6"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md"
---

# Phase 6: Proofs and Acceptance

## Purpose

Prove the factory with real tools on an installed package, without tying the product to those tools. This phase closes the Wave.

## Overview

Two capability proofs run on one package candidate. The owner picks the real tools at test time. The evidence and release notes name them. This phase also runs the drift test, the outside-git test, package parity, and the Human Experience Review for every promise.

## Human Experience Outcome

- Impact and governing promise: `direct`. All five promises in the [index](00-index.md#human-experience-trace).
- Intended human outcome: the person can set up a workflow, leave, and come back to results, evidence, and only the decisions that need them, with each tested combination named.
- Human-facing surface: the setup summary, status output, escalation messages, the acceptance request, and the backup folder note.
- Implementation work: Stages 1 and 2.
- Evidence source: Proof A and Proof B, the drift test, the outside-git test, package parity checks, and the Human Experience Review.
- Executor: the implementing agent, with the owner choosing the real tools.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-1 to R-FACTORY-52, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Full suite, package build, installed Skills, resources, and operations parity. |
| Performance Testing | not-needed-now | No performance candidate applies. |
| Guided Progress Review | selected | Owner review of the real setup summary, status, escalation messages, and acceptance request from the two proofs. |
| Unassisted Goal Testing | not-needed-now | Reassess here. Activate only if a normal-use discoverability question about first setup remains open and can change a current decision. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Capability Proofs

### Tasks

- [ ] T1: Proof A, smallest setup: one harness, its own subagents, and "wait in session". Run a staged backlog of at least two units through build then review, including one correction.
- [ ] T2: Proof B, multi-tool setup: a multiplexer plus a human channel that the person can use from a phone. Run one lead and specialists unit and one escalation that the person answers away from the session.
- [ ] T3: Record the real tools that the owner picked for each proof in the evidence. Limit support claims to the combinations tested (R-FACTORY-1, R-FACTORY-10).
- [ ] T4: Drift test: remove a wired tool and show the blocked state and the fix step before new work (R-FACTORY-12, R-FACTORY-33).
- [ ] T5: Outside-git test: run a unit in a folder without git and show the backup, its cleanup, and the backup folder note (R-FACTORY-44 to R-FACTORY-46).
- [ ] T6: Create this backlog's `evidence.md` and link it from the index.

### Acceptance criteria

- A43: Proof A completes two units, including one correction, and ends with one acceptance request.
- A44: Proof B completes one lead and specialists unit, and the person answers one escalation away from the session.
- A45: The evidence names the real tools for each proof, and no support claim reaches past them.
- A46: The drift test shows the `drifted` state and one fix step, and no new work starts.
- A47: The outside-git test shows a recorded backup, its cleanup, and the folder note.

### Dependencies

- P2 to P5 and one identified package candidate.

## Stage 2 - Package Parity and Review

### Tasks

- [ ] T7: Prove package and installed parity for both Skills, the four resources, and the operations.
- [ ] T8: Search the shipped Skills, resources, and fixtures for any tool named as required or default, and fix each hit.
- [ ] T9: Complete a Human Experience Review for each promise in the index.
- [ ] T10: Reassess Unassisted Goal Testing for first setup, and record the decision.

### Acceptance criteria

- A48: Installed Skills, resources, and operations match the package candidate.
- A49: No shipped file names a particular tool as required or default.
- A50: Each promise in the index has a recorded Human Experience Review conclusion and its limits.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
