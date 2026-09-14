---
title: "Phase 1: Agent Response Guidance and Routing"
kind: "work"
status: "draft"
coordinate: "W20 R1 P1"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 1: Agent Response Guidance and Routing

## Purpose

Add one clear Human Experience route for material agent replies. Make the reply useful to the user before it exposes internal proof.

## Overview

Update the Human Experience Reference and managed root routers upstream. Dogfood the reviewed change into this maintainer repo. Prove safe preservation and parity. Then review representative replies against the accepted promises.

Implementation is not authorized by the creation of this backlog.

## Human Experience Outcome

- **Impact and governing promise or preserved boundary:** `direct`. PRD 49 requires material agent replies to preserve meaning, state, action, uncertainty, and useful proof. PRD 15 requires one short and safe discovery route.
- **Intended human outcome:** The user can understand what happened, what it means, what the agent knows, and what useful action comes next without first decoding internal detail.
- **Human-facing surface or indirect effect:** Material task updates, decisions, recommendations, error or limit reports, and completion replies.
- **Implementation work:** Add adaptive guidance, the owner-provided North Star, and the direct-review principle to the Human Experience Reference. Expand managed router discovery. Dogfood the change. Remove the replaced local rule. Add focused checks and representative response evidence.
- **Evidence source or testing type selected under current authority:** Focused Automated Implementation Testing, selected Guided Progress Review, representative response review, and Human Experience Review.
- **Executor:** An authorized implementation agent owns the coupled file set. An accountable maintainer or owner performs or joins the first-hand response review.
- **Accepted obligation or deferral route:** None.

Authority: [PRD 49](../../prd/49-human-experience-standard-and-intent.md), [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Selected | Focused resource, router, preservation, parity, and scenario checks can find current implementation defects. |
| Performance Testing | `not-needed-now` | The change makes no speed, load, memory, or resource-use claim. |
| Guided Progress Review | Selected | Direct review of representative replies can change the reference wording and acceptance result. The reviewer must record observations and limits. |
| Unassisted Goal Testing | `not-needed-now` | This revision tests response framing against accepted goals. It does not need a fresh unassisted discovery claim. |

Human Experience Review is separate. It applies as the acceptance lens over the actual replies and suitable test evidence.

## Source PRD Docs

- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)

## Source Obligations, Scenarios, And Findings

- Obligations: None.
- Existing scenarios: None.
- Existing findings: The current local `Agent Responses` rule can produce a fixed closing statement or unnecessary loss of technical detail. The accepted design replaces that behavior through the shared Human Experience authority.

## Stage 1 - Authority And Upstream Source

### Tasks

- [ ] t1: Recheck branch, HEAD, dirty state, and the exact W20 R1 implementation allowlist. Stop if user work overlaps a target hunk.
- [ ] t2: Read the current PRD 49 and PRD 15 requirements, the Human Experience Contract, the Human Experience Reference, and the upstream-first dogfood contract.
- [ ] t3: Update `packages/docs/template/.make-docs/system/references/human-experience.md` with the owner-provided North Star, the direct-review principle, and adaptive agent-response guidance.
- [ ] t4: State that data and automated checks support Human Experience judgment. Require first-hand review while keeping one reviewer's limits clear.
- [ ] t5: Update `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md` with one short route for governed work and material agent replies.
- [ ] t6: Keep the Human Experience Contract, response layout, lifecycle stages, schemas, and Skill requirements unchanged.

### Acceptance criteria

- A1: The reference explains that clear expectations support action and that uncertainty must remain visible.
- A2: The reference tells an agent to adapt to the user's next need and lead with result, meaning, or current state.
- A3: The reference covers context recovery, distinct work states, recommendations, next actions, and visible limits.
- A4: The reference keeps exact technical proof available after human meaning when that proof helps the user.
- A5: The guidance does not require a fixed layout, ban technical language, claim the user's feelings, or add a separate experience summary.

### Dependencies

- Owner approval of the W20 R1 design, plan, PRD reconciliation, and backlog.
- Explicit implementation authority.

### Closeout Notes

- Stage status: Planned.
- Evidence: Not started.

## Stage 2 - Dogfood And Preservation

### Tasks

- [ ] t7: Use the existing projection and dogfood route to update `.make-docs/system/references/human-experience.md`, `AGENTS.md`, and `CLAUDE.md`.
- [ ] t8: Remove the unmanaged root `Agent Responses` section only after the managed block supplies the replacement route.
- [ ] t9: Add or update focused checks in `packages/cli/tests/human-experience-resources.test.ts` and `packages/cli/tests/human-experience-propagation.test.ts`.
- [ ] t10: Prove resource parity, router parity, and preservation of all unrelated content outside managed blocks.

### Acceptance criteria

- A6: Each managed root router has one short route to lifecycle and Human Experience authority for governed work and material replies. It does not copy the detailed policy.
- A7: Upstream and dogfood resources agree. Unrelated content outside managed blocks is unchanged. The old local reply section is absent only after the replacement route exists.

### Dependencies

- Stage 1 authority text is reviewed.
- The existing package projection and managed-block contracts remain unchanged.

### Closeout Notes

- Stage status: Planned.
- Evidence: Not started.

## Stage 3 - Response Evidence And Review

### Tasks

- [ ] t11: Run focused resource, router, preservation, parity, and response-scenario checks.
- [ ] t12: Prepare representative replies for long completion, partial completion, blocked or failed work, a proposal, an expert technical explanation, and a no-action status.
- [ ] t13: Have an accountable reviewer inspect or use the actual replies while keeping the core idea in view. Record who reviewed, direct observations, conclusions, and limits.
- [ ] t14: Apply Human Experience Review to every accepted promise. Record `satisfied`, `material gap`, or `insufficient evidence`.
- [ ] t15: Fix accepted in-scope defects and rerun affected checks. Stop for any new product decision.
- [ ] t16: Update the central `evidence.md` report with results and claim limits.
- [ ] t17: Inspect only the allowlisted W20 R1 files and hunks. Present the exact thin-commit set without staging or committing.

### Acceptance criteria

- A8: Representative replies restore needed context, state the result and exact work state, give a recommendation or next action when one exists, keep uncertainty visible, and put supporting detail after human meaning.
- A9: Human Experience Review includes first-hand use or inspection of the actual result. Data and automated results support the conclusion but do not replace it. The record states the reviewer's perspective and limits.
- A10: Focused checks pass. The evidence report states what each check proves and what it does not prove.
- A11: The final proposed commit contains only W20 R1 files and exact W20 R1 hunks. No W19 R6 or other user change is staged.

### Dependencies

- Stages 1 and 2 are complete.
- A meaningful result exists for Guided Progress Review.

### Closeout Notes

- Four testing decisions: Automated selected; Performance `not-needed-now`; Guided selected; Unassisted `not-needed-now`.
- Human Experience Review: Pending implementation and first-hand review.
- Evidence report: Create during implementation.
- Phase / capability status: Planned. Implementation has not started.
