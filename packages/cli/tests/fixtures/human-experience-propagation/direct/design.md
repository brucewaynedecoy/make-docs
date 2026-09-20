---
title: "Release result orientation"
kind: "design"
status: "accepted"
coordinate: "W20 R0 P3"
source:
  type: "manual-request"
  path: "release-request.md"
follow_on:
  route: "baseline-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan.prompt.md"
  why: "The accepted release promise needs product authority and work."
  coordinate_handoff: "Carry W20 R0 P3 into the release plan."
---

# Release Result Orientation

## Context

The release command prints a build ID and several internal states. A release operator cannot tell which product was released or what to do next.

## Human Experience Intent

Impact: `direct`

Affected humans: Release operators.

Human goal or effect: Confirm which product was released and find the next safe action without decoding internal identifiers.

Experience promises:

- [HX-DIR-01] Show the product name, release state, and next safe action before internal build identifiers.

Complexity kept out of the human path:

- Build IDs and receipt fields remain available in detail output.

Evidence required:

- Inspect the installed release result for success, partial success, and failure.

## Decision

Render the product name and plain release state first. Keep the exact receipt in a detail view.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [Designs to Plan](make-docs://system/prompt/designs-to-plan.prompt.md)
- Why: The accepted release promise needs product authority and work.
- Coordinate Handoff: Carry W20 R0 P3 into the release plan.
