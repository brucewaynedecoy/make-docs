# Synthetic Release Result Review Design

## Context

A synthetic installed-output fixture returns a technically complete result. Its default output still forces a release operator to decode internal relationships, cannot distinguish current state from history, and gives no usable recovery step after invalid resume input.

## Human Experience Intent

Impact: `direct`

Affected humans: Release operators.

Human goal or effect: Understand the release relationship and current state, then recover from invalid resume input without private implementation knowledge.

Experience promises:

- [HX-REL-01] Show the related product and release in human terms before raw identifiers.
- [HX-STATE-01] Make current state distinct from revision history.
- [HX-REC-01] Explain how to recover after invalid resume input.

Complexity kept out of the human path:

- Relationship IDs, revision keys, and retry tokens stay in optional detail output.

Evidence required:

- Inspect one fixture transcript that contains the relationship, current and historical state, and invalid-input error.

## Decision

Keep the technically passing fixture output as failure-revealing evidence. Do not accept the three affected experience claims.
