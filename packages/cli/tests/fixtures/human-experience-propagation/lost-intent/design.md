---
title: "Migration result clarity"
kind: "design"
status: "accepted"
coordinate: "W20 R0 P3"
source:
  type: "manual-request"
  path: "migration-result-request.md"
follow_on:
  route: "baseline-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan.prompt.md"
  why: "The accepted migration result promise needs product authority and work."
  coordinate_handoff: "Carry W20 R0 P3 into the migration result plan."
---

# Migration Result Clarity

## Context

The migration result exposes counts and internal state but does not tell an operator whether all records were preserved.

## Human Experience Intent

Impact: `direct`

Affected humans: Migration operators.

Human goal or effect: Understand whether the migration preserved every record and what to do if it did not.

Experience promises:

- [HX-LOST-01] State whether all records were preserved and show the next safe action when any record needs review.

Complexity kept out of the human path:

- Checkpoint IDs and serializer fields remain available in detail output.

Evidence required:

- Inspect the installed migration result for full and partial preservation.

## Decision

Present record preservation and the next safe action before internal fields.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [Designs to Plan](make-docs://system/prompt/designs-to-plan.prompt.md)
- Why: The accepted migration result promise needs product authority and work.
- Coordinate Handoff: Carry W20 R0 P3 into the migration result plan.
