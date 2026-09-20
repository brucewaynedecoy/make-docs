---
title: "Private parser extraction"
kind: "design"
status: "accepted"
coordinate: "W20 R0 P3"
source:
  type: "manual-request"
  path: "parser-refactor-request.md"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The private refactor must preserve its stated public boundary."
  coordinate_handoff: "Carry W20 R0 P3 into the parser change plan."
---

# Private Parser Extraction

## Context

Two private functions duplicate token scanning.

## Human Experience Intent

Impact: `none`

Reason: The change extracts a private helper and does not change any public input, result, error, step, wait, cost, or operating limit.

Preserved experience: The public command accepts the same input and returns the same output, error text, exit status, and timing boundary.

Evidence required:

- Compare the public command fixtures before and after the private extraction.

## Decision

Extract one private token scanner without changing the public command path.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [Designs to Plan Change](make-docs://system/prompt/designs-to-plan-change.prompt.md)
- Why: The private refactor must preserve its stated public boundary.
- Coordinate Handoff: Carry W20 R0 P3 into the parser change plan.
