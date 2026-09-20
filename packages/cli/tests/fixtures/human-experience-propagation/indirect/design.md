---
title: "Accepted job visibility"
kind: "design"
status: "accepted"
coordinate: "W20 R0 P3"
source:
  type: "manual-request"
  path: "queue-reliability-request.md"
follow_on:
  route: "baseline-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan.prompt.md"
  why: "The reliability effect needs an owning requirement and measured work."
  coordinate_handoff: "Carry W20 R0 P3 into the queue plan."
---

# Accepted Job Visibility

## Context

The normal job controls do not change. A lost queue wake-up can delay an accepted job until an operator starts it again.

## Human Experience Intent

Impact: `indirect`

Affected humans: Operators who rely on accepted jobs.

Human goal or effect: Operators can trust that accepted work will appear without manual replay.

Experience promises:

- [HX-IND-01] At least 99% of accepted jobs become visible in results within 30 seconds, including after one worker restart.

Complexity kept out of the human path:

- Queue wake-up and replay state remain internal diagnostics.

Evidence required:

- Measure accepted-to-visible time across a worker restart and tie the result to operator replay risk.

## Decision

Persist the wake-up before acceptance and replay it after a worker restart.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [Designs to Plan](make-docs://system/prompt/designs-to-plan.prompt.md)
- Why: The reliability effect needs an owning requirement and measured work.
- Coordinate Handoff: Carry W20 R0 P3 into the queue plan.
