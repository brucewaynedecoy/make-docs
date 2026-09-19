# Plan and Work Guardrails

## Supersession Notes

Add W10 R7 guardrails to active plans and work backlogs that still name Rust ownership, same-name npm/Rust behavior, PATH-order runtime selection, or MCP as optional/deferred future work.

## Required Wording

Guardrails must say:

- W10 R7 supersedes future-facing Rust/PATH-order runtime assumptions.
- TypeScript is the v2 runtime authority.
- MCP is required for v2 and TypeScript-owned.
- W16 R3 remains completed operation-boundary evidence, but future deterministic work must modularize operation domains rather than extending a monolithic file.

## Historical References

Do not rewrite completed historical evidence solely to remove old wording. If an active future-facing document still instructs workers to implement Rust parity or treat MCP as optional, add a W10 R7 supersession note or update the wording in place.

## Acceptance Criteria

- W10 R6, W16 R3, W17 R2, W18 R1, W18 R2, and W18 R3 future-facing work surfaces point to W10 R7 where runtime assumptions matter.
- No future implementer is asked to decide whether MCP ships, whether Rust is required, or whether W16 R3 should be reopened.
