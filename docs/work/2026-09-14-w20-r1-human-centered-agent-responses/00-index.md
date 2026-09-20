---
title: "W20 R1 Human-Centered Agent Responses Work Backlog"
kind: "work"
status: "complete"
coordinate: "W20 R1"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# W20 R1 Human-Centered Agent Responses Work Backlog

## Purpose

Implement the W20 R1 refinements that treat material agent replies as human-facing results and make each requested user action self-contained.

The work must make replies easier to understand and act on. It must also preserve exact evidence, useful technical detail, and honest uncertainty.

Authority inputs:

- [W20 R1 design](../../designs/2026-09-14-human-centered-agent-responses.md)
- [W20 R1 plan](../../plans/2026-09-14-w20-r1-human-centered-agent-responses/00-overview.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md)
- [Execution Workflow](../../../.make-docs/system/references/execution-workflow.md)
- Owner direction from 2026-09-17 for the exact P2 self-contained user-action rule and scope boundary

## Human Experience Trace

| Accepted promise | Work phase | Work | Acceptance |
| --- | --- | --- | --- |
| Adapt to what the user needs next | P1 | Add reference guidance and review varied reply cases | A2, A8 |
| Lead with result, meaning, or current state | P1 | Add result-first guidance and examples | A2, A8 |
| Restore context and distinguish work states | P1 | Cover long, partial, blocked, failed, and unverified cases | A3, A8 |
| Give a recommendation or next action | P1 | Cover decision and recovery cases | A3, A8 |
| Keep technical proof available after human meaning | P1 | Preserve progressive disclosure and audit detail | A4, A8 |
| Avoid claimed feelings and tacked-on experience text | P1 | Remove the fixed local closing rule and review the full reply | A5, A8 |
| Make expectation clear without hiding uncertainty | P1 | Add the expectation and action North Star | A1, A8 |
| Keep data in a supporting role | P1 | Require first-hand review of the actual result | A9 |
| Route agents to one authority | P1 | Update managed router templates and dogfood copies | A6, A7 |
| Make a requested user action self-contained | P2 | Add the exact Contract rule and the Reference checklist and example | A12, A13 |
| Keep meaning in the reply and audit detail in the linked record | P2 | Add the example boundary and review representative requests | A13, A19 |
| Do not replace a plain-language next step with an internal label | P2 | Update the Execution Workflow and Output Contract | A14, A15 |
| Keep router discovery thin | P2 | Prove no change or make one bounded routing correction | A16 |
| Deliver upstream first and prove dogfood and generated projection | P2 | Sync four resources and validate the CLI package projection | A17, A18 |

## Phase Map

| Coordinate | Phase | Status | File |
| --- | --- | --- | --- |
| W20 R1 P1 | Agent Response Guidance and Routing | Complete; committed as `51bd35c` | [01-agent-response-guidance-and-routing.md](01-agent-response-guidance-and-routing.md) |
| W20 R1 P2 | Self-Contained User Action Requests | Complete; committed under the 2026-09-17 authority | [02-self-contained-user-action-requests.md](02-self-contained-user-action-requests.md) |

## Usage Notes

- PRD 49 and PRD 15 are the current product authority.
- P1 is complete and committed as `51bd35c`.
- Complete P2 as one coupled phase. Do not split the Contract, Reference, Execution Workflow, and Output Contract meaning across separate owners.
- Author shipped resources in `packages/docs/template/` first. Then use the existing dogfood route.
- Treat `packages/cli/template/` as generated output from `scripts/copy-template-to-cli.mjs`. Do not author it.
- Preserve all unrelated user-owned text outside managed blocks.
- The worktree contains unrelated W19 R2 changes. The Execution Workflow target files overlap that work. Stop P2 implementation if the target hunks cannot be kept separate.
- Do not fold W19 R2 P3 performance rules into P2.
- Treat metrics, automated checks, and agent analysis as supporting evidence.
- Require an accountable reviewer to inspect or use the actual result and record direct observations and limits.
- Apply Human Experience Review to each promise. Do not add it as a fifth testing type.
- W20 R0 P5 stays separate. Do not use W20 R1 to close or redefine it.
- Implementation, staging, commit, publication, and release each need the authority required by the execution workflow.
- P1 implementation, focused checks, and Human Experience Review are complete. The owner approved all nine prepared conclusions and requested no correction. P1 was committed as `51bd35c`.
- P2 implementation and agent Human Experience Review are complete. The owner granted separate staging and commit authority on 2026-09-17 for the exact reviewed P2 set.

## Intended Follow-On

- **Route:** `implementation-loop`
- **Next Prompt:** [Execution Workflow](../../../.make-docs/system/references/execution-workflow.md)
- **Why:** W20 R1 P1 and P2 are complete. The next action is limited to later work that has its own authority.
- **Coordinate Handoff:** Verify the P2 commit and keep the remaining W19 R2 P3 worktree changes separate. Publication and push remain separate actions.
