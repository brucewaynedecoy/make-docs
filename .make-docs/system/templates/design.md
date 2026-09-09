---
title: "{{TITLE}}"
kind: "design"
status: "draft"
follow_on:
  route: "{{FOLLOW_ON_ROUTE}}"
  next_prompt: "make-docs://system/prompt/{{PROMPT_FILE}}"
  why: "{{FOLLOW_ON_WHY}}"
  coordinate_handoff: "{{COORDINATE_HANDOFF}}"
# coordinate: "W{{W}} R{{R}}"
# source:
#   type: "manual-request"
#   path: "{{SOURCE_PATH}}"
# lifecycle:
#   default_arc: "design -> plan -> PRD -> work -> implementation"
#   departure: "source-to-design-straddle"
#   reason: "{{LIFECYCLE_REASON}}"
---

# {{TITLE}}

> Filename: `YYYY-MM-DD-<slug>.md`. See `.make-docs/system/contracts/design-contract.md` for naming and structural rules.

## Purpose

Explain what decision this document captures and why it exists.

## Context

Describe the problem, constraints, forces, and existing conditions that shape the decision.

## Human Experience Intent

<!-- Follow make-docs://system/contract/human-experience-contract.md. Choose direct or indirect for the full form below. For none, REPLACE these fields with Impact, Reason, Preserved experience, and Evidence required from the contract. Keep one section. Remove these instructions and resolve all placeholders. -->

Impact: `{{IMPACT}}`

Affected humans: {{AFFECTED_HUMANS}}

Human goal or effect: {{HUMAN_GOAL_OR_EFFECT}}

Experience promises:

- {{OBSERVABLE_EXPERIENCE_PROMISE}}

Complexity kept out of the human path:

- {{COMPLEXITY_NOT_REQUIRED_FOR_THE_GOAL}}

Evidence required:

- {{PLANNED_EVIDENCE}}

## Decision

Describe the chosen approach clearly enough that planning can proceed from it.

## Alternatives Considered

List the meaningful alternatives and why they were not chosen.

## Consequences

Describe outcomes, trade-offs, risks, and follow-on implications.

## Intended Follow-On

- Route: `baseline-plan` or `change-plan`
- Next Prompt: {{NEXT_PROMPT_LINK}}. Read `make-docs://system/prompt/{{PROMPT_FILE}}` with `make-docs resource read`.
- Why: Explain why this design should flow into that planning path.
- Coordinate Handoff: For `change-plan`, identify the related completed coordinate and recommended downstream W/R coordinate when known; otherwise state `unresolved; planner must resolve before writing.`
