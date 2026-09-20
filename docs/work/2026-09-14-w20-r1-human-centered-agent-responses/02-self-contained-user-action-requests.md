---
title: "Phase 2: Self-Contained User Action Requests"
kind: "work"
status: "complete"
coordinate: "W20 R1 P2"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 2: Self-Contained User Action Requests

## Purpose

Make each requested user action complete enough to understand and answer without opening another document or decoding an internal label.

## Overview

The owner identified a cross-cutting Human Experience gap on 2026-09-17. A completion reply can report correct internal state but still fail to give a useful request.

The [P2 plan](../../plans/2026-09-14-w20-r1-human-centered-agent-responses/02-self-contained-user-action-requests.md) is the exact implementation authority after the owner grants P2 implementation authority. It assigns the binding rule to the Human Experience Contract. It assigns the checklist and example to the Human Experience Reference. It assigns one final check to the Execution Workflow. It assigns the plain-language handoff rule to the Output Contract.

The linked work record supplies audit detail. The reply supplies the meaning and action.

W19 R2 P3 performance rules are outside this phase.

## Human Experience Outcome

- **Impact and governing promise or preserved boundary:** `direct`. PRD 49 requires material replies to give useful meaning, state, and next actions. The Human Experience Contract will require each requested action to be self-contained.
- **Intended human outcome:** The user can tell what to do, why it is needed now, whether it is required or optional, what work waits for it, where detail is available, and what happens after the action.
- **Human-facing surface or indirect effect:** Completion replies, phase gates, authorization requests, decision requests, blocker reports, and other material replies that ask the user to act.
- **Implementation work:** Update four upstream Human Experience and workflow resources. Audit the short `AGENTS.md` route. Dogfood the result. Generate the CLI template projection. Add focused checks and representative request evidence.
- **Evidence source or testing type selected under current authority:** Focused Automated Implementation Testing, selected Guided Progress Review of real example replies, and Human Experience Review.
- **Executor:** One authorized implementation owner controls the coupled resource set. A separate reviewer can inspect the exact result and evidence.
- **Accepted obligation or deferral route:** None.

Authority: [PRD 49](../../prd/49-human-experience-standard-and-intent.md), [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), and the owner's 2026-09-17 P2 direction.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Selected | Focused resource, parity, projection, router, and packed-resource checks can find current implementation defects. |
| Performance Testing | `not-needed-now` | P2 makes no speed, load, memory, or resource-use claim. Do not absorb W19 R2 P3 performance work. |
| Guided Progress Review | Selected | Direct review of representative user-action requests can change the rule wording, example, or acceptance result. |
| Unassisted Goal Testing | `not-needed-now` | P2 verifies an exact accepted communication rule. It does not make a new unassisted discovery or completion claim. |

Human Experience Review is separate required agent review work. It inspects the real example replies. It records evidence, observations, conclusions, reviewer limits, and follow-up. A normal review does not require a human response.

## Source PRD Docs

- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)

## Source Obligations, Scenarios, And Findings

- Obligations: None.
- Existing scenarios: P1 representative material replies in [evidence.md](evidence.md).
- Current finding: A reply can give correct internal state, route, coordinate, workflow term, task ID, or link but still omit the plain-language request that the user needs.

## Stage 1 - Authority And Upstream Sources

### Tasks

- [x] t1: Recheck branch, HEAD, dirty state, and the exact P2 allowlist. Stop if a target hunk overlaps user work that cannot be preserved and separated.
- [x] t2: Read the current P2 plan, PRD 49, PRD 15, Human Experience Contract, Human Experience Reference, Execution Workflow, Output Contract, and upstream-first dogfood contract.
- [x] t3: Add the exact self-contained user-action rule from the P2 plan to `packages/docs/template/.make-docs/system/contracts/human-experience-contract.md`.
- [x] t4: Add the five required checklist questions and one weak-versus-useful example to `packages/docs/template/.make-docs/system/references/human-experience.md`.
- [x] t5: Add a final check to `packages/docs/template/.make-docs/system/references/execution-workflow.md` that a requested action is understandable without another document.
- [x] t6: Update `packages/docs/template/.make-docs/system/contracts/output-contract.md` to state that a route, coordinate, workflow term, or task ID does not replace a plain-language next step.
- [x] t7: Audit `packages/docs/template/AGENTS.md`. Record a no-change result unless a small routing correction is required. Do not copy the detailed rule into the router.

### Acceptance criteria

- A12: The Contract contains the exact rule. It states the action, reason, required or optional state, blocked work, supporting detail location, next event, explanation of internal terms, and link boundary.
- A13: The Reference contains all five required questions and one weak-versus-useful example. The useful request is understandable without opening its link. The link supplies audit detail only.
- A14: The Execution Workflow final check rejects a requested action that depends on another document for meaning.
- A15: The Output Contract states that a route, coordinate, workflow term, or task ID does not replace a plain-language next step.
- A16: `AGENTS.md` stays short. It is unchanged unless a bounded routing gap is proved. It never copies the detailed P2 rule.

### Dependencies

- Owner approval of this P2 plan and backlog.
- Explicit P2 implementation authority.
- Safe separation from the existing W19 R2 edits in both Execution Workflow target files.

### Closeout Notes

- Stage status: Complete.
- Evidence: The four upstream resources contain the bounded P2 additions. The router audit found no routing gap, so `AGENTS.md` and `CLAUDE.md` remain unchanged. Exact hunks and the no-change result are recorded in [evidence.md](evidence.md).

## Stage 2 - Dogfood, Projection, And Focused Checks

### Tasks

- [x] t8: Use the existing dogfood route to update the four matching files under `.make-docs/system/`. Preserve every unrelated W19 R2 hunk.
- [x] t9: Update root `AGENTS.md` only if t7 required an upstream router correction. Preserve all text outside the managed block.
- [x] t10: Add or update focused assertions in `packages/cli/tests/human-experience-resources.test.ts` and `packages/cli/tests/human-experience-propagation.test.ts`.
- [x] t11: Run `node scripts/copy-template-to-cli.mjs`. Compare the four generated files under `packages/cli/template/` with their upstream sources. Do not author the generated files.
- [x] t12: Run the focused Human Experience tests, the affected default checks, the CLI build, and the package smoke check.
- [x] t13: Prove upstream and dogfood byte parity, generated projection parity, router no-change or bounded-correction behavior, and path-limited diff cleanliness.

### Acceptance criteria

- A17: Each changed upstream resource is byte-equal to its dogfood copy. Each generated CLI template resource is byte-equal to its upstream source.
- A18: Focused tests, affected default checks, the CLI build, and the package smoke check pass. The evidence states what each check proves and what it does not prove.

### Dependencies

- Stage 1 is complete.
- The overlapping W19 R2 Execution Workflow hunks have a safe separation path.
- The existing template copy and package smoke paths remain valid.

### Closeout Notes

- Stage status: Complete.
- Evidence: Focused tests, default checks, the CLI build, and the full package smoke check pass. Upstream, dogfood, and generated bytes match for all four resources. Details and limits are in [evidence.md](evidence.md).

## Stage 3 - Representative Requests And Human Experience Review

### Tasks

- [x] t14: Prepare representative replies for required authorization, optional feedback, a named blocker, a linked audit record, and an internal route or task label.
- [x] t15: Apply Human Experience Review to each P2 promise. Record the human goal, surface, evidence, observation, conclusion, reviewer limits, and follow-up.
- [x] t16: Fix accepted in-scope defects and rerun only the affected checks. Stop for any new product decision or scope expansion.
- [x] t17: Update [evidence.md](evidence.md) with P2 findings, acceptance-case results, and claim limits.
- [x] t18: Inspect the exact P2 allowlist and hunks. Prove that no W19 R2 P3 change is part of the P2 candidate.

### Acceptance criteria

- A19: Each representative request states the action, reason, required or optional state, blocked work, supporting detail location, and next event. It explains any internal term that the user needs.
- A20: Human Experience Review reaches a bounded conclusion for each P2 promise. It does not claim lived human understanding without human evidence.
- A21: The final P2 candidate contains only P2 files and exact P2 hunks. It contains no W19 R2 P3 rule or unrelated user change.

### Dependencies

- Stages 1 and 2 are complete.
- Real example replies and focused evidence exist.

### Closeout Notes

- Four testing decisions: Automated selected; Performance `not-needed-now`; Guided selected; Unassisted `not-needed-now`.
- Human Experience Review: Satisfied by the implementation agent for the prepared policy and representative replies. The review does not claim lived human understanding.
- Optional experience handoff: Available after closeout, but not required and not blocking.
- Explicit human acceptance gate: None.
- Evidence report: [evidence.md](evidence.md).
- Phase / capability status: The P2 implementation candidate and agent review are complete. Staging and commit have not started.

## Stage 4 - Separate Staging And Commit Gates

### Tasks

- [x] t19: Present the P2 closeout, exact allowlist, Human Experience Review, test results, and remaining limits. Request explicit staging authority.
- [x] t20: Only after staging authority, stage the exact P2 allowlist. Inspect the staged diff and prove that it contains no W19 R2 or unrelated user change.
- [x] t21: Present the staged result and request separate commit authority.
- [x] t22: Only after commit authority, read the current commit-message convention, create the P2 commit, and verify its exact contents and status.

### Acceptance criteria

- A22: Implementation authority does not stage files. Staging authority does not create a commit. Commit authority applies only to the reviewed staged P2 set.
- A23: The P2 commit, if authorized, contains only the accepted allowlist and exact P2 hunks. Publication and push remain separate actions.

### Dependencies

- Stage 3 is complete.
- The owner grants each named gate separately.

### Closeout Notes

- P2 closeout: Prepared on 2026-09-17 for the implementation reply.
- Staging authority: Granted on 2026-09-17 for the exact reviewed P2 set.
- Commit authority: Granted on 2026-09-17 for that staged set.
- Commit closeout: This phase record is included in the authorized P2 commit. The commit ID is reported after git verification because a commit cannot contain its own ID.
- Publication or push authority: Not granted.
