---
title: "{{TITLE}}"
kind: "plan"
status: "draft"
coordinate: "W{{W}} R{{R}}"
follow_on:
  route: "prd-generation"
  next_prompt: "{{NEXT_PROMPT}}"
  why: "{{FOLLOW_ON_WHY}}"
  coordinate_handoff: "Carry W{{W}} R{{R}} into the downstream PRD and work backlog lineage."
# source:
#   type: "design"
#   path: "{{SOURCE_PATH}}"
---

# {{TITLE}}

## Purpose

State what this plan covers and why it exists in one short paragraph. Link back to the originating design or change request if applicable.

## Objective

List the concrete goals and the completion criteria for the plan. A reader should be able to tell when the plan is done.

## Human Experience Propagation

Use `.make-docs/system/contracts/human-experience-contract.md` as authority and `.make-docs/system/references/human-experience.md` for examples. Link to the source design. Do not copy the standard into this plan.

For `direct` or `indirect` impact, map each accepted promise:

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| {{PROMISE}} | {{PRD_AUTHORITY}} | {{SURFACE_OR_EFFECT}} | {{WORK_PHASE}} | {{EVIDENCE_OR_TESTING_TYPE}} | {{O_REF_OR_NONE}} |

For `none`, replace the table with the preserved human boundary and the evidence that will prove it unchanged.

## Performance Evidence Plan

For current performance candidates, read `make-docs://system/contract/performance-evidence-governance.md` with `make-docs resource read`. Record both decisions. Link one canonical profile for each executable candidate. Do not copy a product target into this plan.

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| {{PERFORMANCE_CANDIDATE_OR_NONE}} | `{{BASE_MAINTENANCE_ACTION}}` | `{{REQUIRED_NOW_CHARACTERIZE_NOW_DEFER_REQUIRED_NOT_NEEDED_OR_REJECT_UNSUPPORTED}}` | `{{TARGET_CLASS_OR_NONE}}` | {{PERF_O_OR_NONE}} | {{BUDGET_AND_STOP_REFERENCE_OR_NOT_APPLICABLE}} | {{ACTIVATION_POINT_OR_NONE}} |

## Coordinate Decision

- Coordinate: `W{{W}} R{{R}}`
- Classification: `new-wave` or `revision-wave` (the legacy value `revision` means `revision-wave`)
- Evidence: Name the explicit user guidance, the outcome test result for a new wave, or the revision Wave test that passed, with the design handoff, source lineage, and prior plan/work/history records used. Apply the `## Decision Procedure` in `.make-docs/system/references/wave-model.md`. An in-place amendment of a committed plan keeps this section and records the change in `## Change History`.

## Phase Map

List the phase detail files in this plan directory with a one-line description of each. Every plan has at least one phase file even when the work is small.

| File | Purpose |
| ---- | ------- |
| `01-{{UPPER_SNAKE}}.md` | {{PHASE_PURPOSE}} |
| `02-{{UPPER_SNAKE}}.md` | {{PHASE_PURPOSE}} |

## Dependencies

Call out external dependencies, upstream artifacts, or prerequisites that must be resolved before or during execution.

## Validation

Describe how success of the overall plan is verified once all phases complete. Reference the review pass or acceptance gate that closes the plan. Include observable proof for each accepted Human Experience promise or preserved `none` boundary.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Generate or update the PRD set from this plan.
- Why: The plan should become the product or documentation contract before work backlog generation.
- Coordinate Handoff: Carry `W{{W}} R{{R}}` into the downstream PRD and work backlog lineage, or explain the coordinate question that must be resolved before writing.

## Change History

<!-- Optional. Add this section only after this plan has been committed and its scope changes. One entry per coherent scope edit, newest last. Progress updates need no entry. See the `## Change History` section of `.make-docs/system/references/wave-model.md`. `PRD decision` is `update-existing`, `create`, `link-only`, or `none`. `Source` is a relative Markdown link to the governing design, plan, work, history, owner decision, or evidence. Remove this comment and the example entry when the section is not needed. -->

### {{DATE}} — {{COORDINATE}}

- Kind: `{{EDIT_REVISION_PHASE_PIVOT_REBUILD_OR_REVISION_WAVE}}`
- Affected scope: {{PHASES_OR_TASKS}}
- Previous scope: {{PREVIOUS_SCOPE}}
- Replacement scope: {{REPLACEMENT_SCOPE}}
- Rationale: {{RATIONALE}}
- PRD decision: `{{PRD_DECISION}}` — {{REASON_WHEN_NONE}}
- Owner approval: {{APPROVAL_SOURCE_OR_NOT_REQUIRED}}
- Source: {{RELATIVE_SOURCE_REFERENCE}}
