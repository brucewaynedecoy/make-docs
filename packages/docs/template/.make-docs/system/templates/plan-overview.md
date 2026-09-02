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

## Coordinate Decision

- Coordinate: `W{{W}} R{{R}}`
- Classification: `new-wave` or `revision`
- Evidence: Explain the explicit user guidance, design handoff, source lineage, prior plan/work/history records, or highest-wave fallback used to choose this coordinate.

## Phase Map

List the phase detail files in this plan directory with a one-line description of each. Every plan has at least one phase file even when the work is small.

| File | Purpose |
| ---- | ------- |
| `01-{{UPPER_SNAKE}}.md` | {{PHASE_PURPOSE}} |
| `02-{{UPPER_SNAKE}}.md` | {{PHASE_PURPOSE}} |

## Dependencies

Call out external dependencies, upstream artifacts, or prerequisites that must be resolved before or during execution.

## Validation

Describe how success of the overall plan is verified once all phases complete. Reference the review pass or acceptance gate that closes the plan.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Generate or update the PRD set from this plan.
- Why: The plan should become the product or documentation contract before work backlog generation.
- Coordinate Handoff: Carry `W{{W}} R{{R}}` into the downstream PRD and work backlog lineage, or explain the coordinate question that must be resolved before writing.
