---
title: "Phase 2: Host and Transport Proof"
kind: "work"
status: "draft"
coordinate: "W25 R0 P2"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 2: Host and Transport Proof

## Purpose

Prove the minimum MCP Apps path in one compatible host.

## Overview

P2 is a bounded technical proof. It confirms the resource, bridge, capability, and transport behavior before the product path depends on them.

## Human Experience Outcome

- Impact and promise: Direct. The live view must open and report a useful limit when it cannot open.
- Intended outcome: The user sees a working bounded page, one tool call, and one agent message without transport details.
- Surface: Test resource, tool action, message action, and fallback response.
- Evidence: Automated protocol tests, one guided compatible-host review, and Human Experience Review.
- Executor: Host-proof agent after separate phase authority.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Resource and bridge contracts need repeatable tests. |
| Performance Testing | `not-needed-now` | P2 proves function, not product speed. |
| Guided Progress Review | Required | A real compatible host must display and operate the proof. |
| Unassisted Goal Testing | `not-needed-now` | The proof is a maintainer test. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: one resource open, one tool call, one message, and one fallback observation.
- Evidence handoff: future central evidence report.
- Gate effect: A9-A16 block P4 and P6.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: the host and transport path needs direct proof before product implementation`

## Stage 1 - Resource and bridge

### Tasks

- [ ] t1: Register one versioned test resource with the MCP Apps MIME type.
- [ ] t2: Return it from one test tool through `_meta.ui.resourceUri`.
- [ ] t3: Prove one `tools/call` and one controlled `ui/message`.

### Acceptance criteria

- A9: One compatible host displays the versioned resource.
- A10: The widget receives and renders one bounded tool result.
- A11: The active conversation receives one fixed follow-up message.
- A12: Hostile data stays inert in the resource and message.

## Stage 2 - Capability and transport

### Tasks

- [ ] t4: Record required host capabilities and their absence states.
- [ ] t5: Confirm stdio or prove one bounded Streamable HTTP adapter over the same server factory.
- [ ] t6: Remove proof-only code or promote it through accepted shared boundaries.

### Acceptance criteria

- A13: Capability selection does not use a host product name.
- A14: Unsupported capability or transport returns a typed fallback signal.
- A15: The proof creates no second registry, permission model, or business-logic path.
- A16: Guided and Human Experience review accept the open, action, and fallback behavior.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | MCP and Backlog Review references need the supported host result. |
| History coverage | `create-on-closeout` | The host proof is a meaningful architecture checkpoint. |
| PRD reconciliation | `link-only` | P1 already establishes product authority. |
