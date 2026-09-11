---
title: "{{TITLE}}"
kind: "work"
status: "active"
coordinate: "W{{W}} R{{R}}"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the plan and PRD contract."
  coordinate_handoff: "Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase."
# source:
#   type: "prd"
#   path: "{{SOURCE_PATH}}"
---

# {{TITLE}}

> In v2, work backlogs are directories. This template is the shape of the `00-index.md` entry-point file. Phase detail lives in sibling `0N-<phase>.md` files (see `work-phase.md`). See `.make-docs/system/references/wave-model.md` for W/R semantics.

## Purpose

Describe what this work directory covers and how to navigate its phase files.

## Human Experience Trace

Use `.make-docs/system/contracts/human-experience-contract.md` as authority. Retain the source design, plan, owning PRDs, dependency-ordered phase, evidence decision, implementation gate, and accepted obligation for each applicable promise.

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| {{IMPACT_OR_PROMISE}} | {{SOURCE_DESIGN_AND_PLAN}} | {{PRD_OR_BOUNDARY}} | {{WORK_PHASE}} | {{EVIDENCE_OR_TESTING_TYPE}} | {{IMPLEMENTATION_GATE}} | {{O_REF_OR_NONE}} |

For `none`, state the preserved human boundary and link the proof that it stays unchanged. Do not invent a human flow.

## Phase Map

| File | Purpose |
| --- | --- |
| {{PHASE_ONE_LINK}} | {{PHASE_ONE_PURPOSE}} |
| {{PHASE_TWO_LINK}} | {{PHASE_TWO_PURPOSE}} |

## Usage Notes

- Read phases in order unless otherwise noted.
- Keep phase files dependency-ordered.
- Every phase file must include `## Source PRD Docs`.
- Link every phase back to the relevant PRD docs.
- Keep each accepted Human Experience promise or preserved `none` boundary traceable through its owning phase, evidence decision, implementation gate, and any accepted obligation.
- When this backlog retains evidence for acceptance or review, create or update its central `evidence.md` report and add a relative link to it in this index. Follow the Acceptance-Case Evidence Retention section in `.make-docs/system/contracts/coverage-pass-contract.md`. The report explains the findings and links supporting evidence, including evidence already stored elsewhere. Do not create an empty report or link to a report that does not exist.
- When deferred obligations or Unassisted Goal Testing are in scope, inventory applicable `O-###`, activated `NUAT-###`, and finding links plus the expected phase versus capability status. Record `not-needed-now` without inventing an ID.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with the first applicable phase in this backlog and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the plan and PRD contract.
- Coordinate Handoff: Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase.
