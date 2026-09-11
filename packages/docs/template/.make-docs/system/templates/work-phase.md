---
title: "Phase {{PHASE_NUMBER}}: {{PHASE_TITLE}}"
kind: "work"
status: "active"
coordinate: "W{{W}} R{{R}} P{{PHASE_NUMBER}}"
# source:
#   type: "prd"
#   path: "{{SOURCE_PATH}}"
---

# Phase {{PHASE_NUMBER}}: {{PHASE_TITLE}}

> Shape for `0N-<phase>.md` files inside a work directory. See `.make-docs/system/references/wave-model.md` for W/R semantics.

## Purpose

Explain why this phase exists and what foundation it depends on.

## Overview

Explain the work covered by this phase and the value it unlocks.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: {{IMPACT_AND_PROMISE_OR_BOUNDARY}}
- Intended human outcome: {{OBSERVABLE_HUMAN_OUTCOME_OR_UNCHANGED_BOUNDARY}}
- Human-facing surface or indirect effect: {{SURFACE_OR_EFFECT}}
- Implementation work: {{IMPLEMENTATION_WORK}}
- Evidence source or testing type selected under current authority: {{EVIDENCE_OR_TESTING_TYPE}}
- Executor: {{EXECUTOR}}
- Accepted obligation or deferral route: {{O_REF_OR_NONE}}

Link to the owning PRD requirement and `.make-docs/system/contracts/human-experience-contract.md`. For `none`, state how evidence will prove the boundary unchanged. Do not copy the standard.

## Current Testing Decisions

Record the current decision for each testing type. Do not activate a test only to fill this table. Use `not-needed-now` when evidence from that type cannot change a current decision. For each activated type, add or link the compact decision record required by current testing authority.

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | {{AUTOMATED_IMPLEMENTATION_TESTING_DECISION}} | {{AUTOMATED_IMPLEMENTATION_TESTING_RECORD_OR_REASON}} |
| Performance Testing | {{PERFORMANCE_TESTING_DECISION}} | {{PERFORMANCE_TESTING_RECORD_OR_REASON}} |
| Guided Progress Review | {{GUIDED_PROGRESS_REVIEW_DECISION}} | {{GUIDED_PROGRESS_REVIEW_RECORD_OR_REASON}} |
| Unassisted Goal Testing | {{UNASSISTED_GOAL_TESTING_DECISION}} | {{UNASSISTED_GOAL_TESTING_RECORD_OR_REASON}} |

Human Experience Review is separate. Apply it as the required acceptance lens for each applicable promise. Reuse suitable evidence. Do not record it as a fifth testing type.

## Source PRD Docs

- {{SOURCE_PRD_LINK_ONE}}
- {{SOURCE_PRD_LINK_TWO}}

## Source Obligations, Scenarios, And Findings

- `{{O_REF_OR_NONE}}`
- `{{NUAT_REF_OR_NONE}}`
- `{{FINDING_REF_OR_NONE}}`

## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}

### Tasks

- [ ] t1: {{TASK}}
- [ ] t2: {{TASK}}

### Acceptance criteria

Use stable `A<number>` case IDs that are unique across this backlog's phases. When retaining evidence for acceptance or review, create or update the owning backlog's central `evidence.md` report. Link the relevant report sections from this phase's acceptance or closeout record. The report must explain the findings even when supporting evidence already exists elsewhere and no new capture folder is needed. Keep new acceptance-case captures in `evidence/a<number>/` only when needed; detailed reports in case folders are optional. Follow the Acceptance-Case Evidence Retention section in `.make-docs/system/contracts/coverage-pass-contract.md`.

Reject `UX is good`, `easy to use`, `intuitive`, and similar criteria. Replace each vague claim with an observable result on the named surface or evidence tied to the stated indirect effect. Use only examples that apply to this phase:

- The person can identify the current subject before machine detail.
- The person can understand how the result relates to its parent, prior state, or next item.
- Success, partial success, waiting, failure, and blocked state are distinct when applicable.
- The next useful action is visible when one exists.
- The person can understand an error and use the stated recovery path.
- Useful meaning appears first, and exact detail remains available through a clear secondary path.
- The person can complete the goal without first learning an unexplained internal identifier.

- A{{CASE_NUMBER}}: {{ACCEPTANCE}}
- A{{NEXT_CASE_NUMBER}}: {{ACCEPTANCE}}

### Dependencies

- {{DEPENDENCY}}

### Closeout Notes

- Four testing decisions: {{AUTOMATED_PERFORMANCE_GUIDED_UNASSISTED_DECISIONS}}
- Human Experience Review: {{PROMISE_CONCLUSIONS_EVIDENCE_REVIEWER_AND_LIMITS}}
- Evidence report: {{CENTRAL_EVIDENCE_REPORT_SECTION_LINKS_OR_REASON_NO_DURABLE_RECORD_IS_NEEDED}}
- Phase / capability status: {{PHASE_AND_CAPABILITY_STATUS}}

<!-- Insert additional STAGES as needed -->
