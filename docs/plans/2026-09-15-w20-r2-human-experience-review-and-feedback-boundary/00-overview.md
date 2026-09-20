---
title: "W20 R2 Human Experience Review and Feedback Boundary"
kind: "plan"
status: "complete"
coordinate: "W20 R2"
source:
  type: "design"
  path: "docs/designs/2026-09-15-human-experience-review-and-feedback-boundary.md"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "W20 R2 is complete. Later Human Experience changes need new accepted authority."
  coordinate_handoff: "Keep W20 R2 as the completed boundary correction."
---

# W20 R2 Human Experience Review and Feedback Boundary

## Purpose

Implement the accepted correction without removing the Human Experience capability or changing its historical evidence.

## Coordinate Decision

- Coordinate: `W20 R2`
- Classification: `revision`
- Prior coordinate: `W20 R1`
- Evidence: The change revises the W20 Human Experience completion boundary. No W20 R2 plan or work package existed before this plan.
- Lifecycle departure: The owner directed one combined implementation after accepting the plan. The work still records design, plan, PRD, backlog, implementation, review, and closeout in the normal order.

## Inputs

- [W20 R2 design](../../designs/2026-09-15-human-experience-review-and-feedback-boundary.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- [D-037](../../prd/03-open-questions-and-risk-register.md#d-037-human-experience-review-creates-a-default-owner-close-gate)
- [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md)
- [W20 R0 active work](../../work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md)
- [W19 R6 active work](../../work/2026-09-12-w19-r6-unified-setup-and-harness-access/00-index.md)

## Human Experience Propagation

| Promise | Owner | Surface | Phase | Evidence | Gate |
| --- | --- | --- | --- | --- | --- |
| Keep agent review required | PRD 49 | Contract, reference, lifecycle, work records | P1 and P2 | Resource and propagation tests | Agent review record exists |
| Make normal feedback optional | PRD 49 and PRD 14 | Completion handoff and phase close | P1 through P3 | Default-direct and unanswered-handoff cases | No human response gate |
| Keep explicit human acceptance available | PRD 50 | Existing gate-effect model | P1 and P2 | Explicit-gate case | Named scope remains blocked |
| Preserve historical evidence | PRD requirement history and completed work | W20 R0 and W20 R1 records | P1 and P3 | Diff review | No historical rewrite |
| Reconcile active work | Current W20 R0 and W19 R6 work | Active status and close rules | P3 | Current technical close rules | Only remaining technical gates apply |

## PRD Change Matrix

| Candidate | Owner | Decision | Reason |
| --- | --- | --- | --- |
| Review, handoff, and human gate boundary | PRD 49 | `update-existing` | PRD 49 owns Human Experience Review and completion claims. |
| Phase-close behavior | PRD 14 | `update-existing` | PRD 14 owns lifecycle and close gates. |
| Testing and gate effects | PRD 50 | `update-existing` | PRD 50 owns testing selection and explicit gate effects. |
| Unassisted Goal Testing | PRD 46 | `none` | Its conditional and advisory boundary remains valid. |
| Managed router discovery | PRD 15 | `none` | Routers already point to the shared authority and do not state the owner gate. |
| Drift and risk record | PRD 03 | `update-existing` | D-037 records the defect. R-033 records the checklist and burden risk. |
| New product PRD | None | `none` | The correction belongs to existing owners. |

## Output Contract

- A new W20 R2 design, plan, and work package.
- Current requirements in PRDs 49, 14, and 50.
- One new requirement-history entry in each changed owner.
- Upstream-first system-resource changes and matching package and dogfood copies.
- Focused tests for default, optional, explicit-gate, indirect, `none`, evidence-limit, and later-feedback cases.
- Supersession notes in active W20 R0 P5 and current W19 R6 P3 records.
- No runtime command, MCP tool, Store field, frontmatter field, or new lifecycle stage.

## Phase Map

| Coordinate | Phase | File | Outcome |
| --- | --- | --- | --- |
| W20 R2 P1 | Authority and Contract Boundary | [01-authority-and-contract-boundary.md](01-authority-and-contract-boundary.md) | Current authority separates agent review, optional handoff, and explicit gate. |
| W20 R2 P2 | Resource Propagation and Validation | [02-resource-propagation-and-validation.md](02-resource-propagation-and-validation.md) | Upstream, package, dogfood, and focused tests agree. |
| W20 R2 P3 | Active Work Reconciliation and Closeout | [03-active-work-reconciliation-and-closeout.md](03-active-work-reconciliation-and-closeout.md) | Active W20 R0 and W19 R6 use the corrected gate. |

## Execution and Ownership

Use one implementation owner for the coupled authority and resource wording. Preserve the current dirty worktree. Touch only W20 R2 targets and the exact active W20 R0 and W19 R6 lines that state the former gate.

Do not stage, commit, push, change branches, remove the Human Experience capability, or include D-036 and the separate plugin technical-debt work.

## Validation

- Run the focused Human Experience resource and propagation tests.
- Prove all changed upstream resources match package and dogfood copies.
- Run the full CLI test set, build, package smoke tests, default validation, PRD authority validation, path and link checks, and `git diff --check`.
- Confirm W20 R0 and W20 R1 completed evidence is unchanged.
- Confirm PRD 46 and PRD 15 have no direct contradiction and remain unchanged.
- Confirm no default `owner-approved`, `required acceptance work`, or required owner-response rule remains in current authority or shipped resources.

## Intended Follow-On

- Route: `implementation-loop`
- Next Prompt: [Execution Workflow](../../../.make-docs/system/references/execution-workflow.md)
- Why: W20 R2 P1 through P3 are complete. Later changes need new accepted authority.
- Coordinate Handoff: Keep W20 R2 as the completed review and feedback boundary. Commit remains a separate action.
