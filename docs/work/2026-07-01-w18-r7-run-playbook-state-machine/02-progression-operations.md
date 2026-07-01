---
title: "Phase 2: Progression Operations"
kind: "work"
status: "active"
coordinate: "W18 R7 P2"
source:
  type: "prd"
  path: "docs/prd/35-revise-run-playbook-state-machine.md"
---

# Phase 2: Progression Operations

## Purpose

Implement the progression engine the current create-and-read-only runner lacks: the seven operations that carry a run from start to a terminal status. This phase depends on the Phase 1 storage seam and run-state record.

## Overview

Implement `playbook.start`, `playbook.status`, `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` as Make Docs operations addressed by stable registry identifiers, surfaced on the CLI under `run playbook` and as MCP tools, with a strict read-versus-mutate classification. The internal engine structure is an implementer freedom provided the operations keep their required semantics (D9).

## Source PRD Docs

- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)

## Stage 1 - Read Operations

### Tasks

- [ ] t1: Implement `playbook.status` to read the current run state from the global store without mutating (R-OP-1).
- [ ] t2: Implement `playbook.next` to compute the next executable step from the current state plus the parsed Playbook model, respecting dependencies, gates, and the routing model, with zero side effects (R-OP-1, R-OP-3).
- [ ] t3: Consume the validated Playbook model from the W18 R6 library for all dependency, gate, and routing reads; never re-parse Playbook Markdown in the engine (R-SCOPE-1).

### Acceptance criteria

- `playbook.next` is side-effect free and never writes run state.
- Read operations compute from the run state plus the parsed Playbook model only.
- The engine consumes the single Playbook model and re-parses nothing.

### Dependencies

- Phase 1 run-state record and storage seam.

## Stage 2 - Mutating Operations

### Tasks

- [ ] t4: Implement `playbook.start` (read then write) to create a run from a validated Playbook model, capturing the source digest, capability snapshot, dependency availability snapshot, and initial cursor (R-OP-1, R-OP-2).
- [ ] t5: Implement `playbook.advance` (write) to record completion or failure of the current step, capture its evidence, transition status, and compute the next cursor (R-OP-1).
- [ ] t6: Implement `playbook.gate` (write) to record a gate decision with its evidence and either unblock or stop (R-OP-1).
- [ ] t7: Implement `playbook.close` (write) to finalize a run with a terminal status and closeout evidence (R-OP-1).
- [ ] t8: Enforce that only `playbook.advance`, `playbook.gate`, and `playbook.close` transition state, that only `playbook.start` creates it, and that no other operation writes run state (R-OP-3).
- [ ] t9: Route every mutating operation through the uniform operation-core safety gating (R-OP-1).

### Acceptance criteria

- The full operation set `playbook.start`/`status`/`next`/`advance`/`gate`/`resume`/`close` exists; `next`, `advance`, `gate`, `resume`, and `close` are the capabilities the prior implementation lacked and are now implemented.
- The read-versus-mutate classification holds exactly as specified and mutating operations honor the operation-core safety gating.
- Captured step evidence is sufficient for audit and resume; its exact format is an implementer decision recorded with the code.

### Dependencies

- Stage 1 read operations.
- Phase 3 supplies `playbook.resume` semantics; wire its operation shell here and its digest check there.

## Stage 3 - Registry, CLI, and MCP Surfaces

### Tasks

- [ ] t10: Register each operation under its stable operation-registry identifier and surface the set on the CLI under `run playbook`, consuming the registry and command tree owned by the CLI command reorganization lineage without redefining them (R-OP-1, R-SCOPE-1).
- [ ] t11: Expose the same operations as MCP tools with CLI/MCP behavior parity per the operation-boundary rules in PRD 25 (R-OP-1).
- [ ] t12: Ensure Playbook steps and downstream surfaces reference the operations by registry identifier, never by hardcoded command strings (R-SCOPE-1).

### Acceptance criteria

- Every progression operation is addressable by a stable registry identifier and behaves identically from the CLI and MCP.
- No hardcoded CLI command strings stand in for operation identifiers.

### Dependencies

- Stages 1 and 2.
- The operation registry from the CLI command reorganization lineage.
