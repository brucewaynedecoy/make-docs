---
title: "Phase 2: Host and Transport Proof"
kind: "work"
status: "completed"
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

The user authorized P2 implementation and its temporary host test on 2026-09-30. Work uses the current branch `w25-r0-p1-live-delivery-contract`, based on P1 commit `2a8fc509`. The user then authorized closeout and commit. P2 is closed as a bounded source and host proof. Claude Desktop `2.16120.0` displayed the synthetic resource through stdio. Production live tools, UI delivery, and refresh remain planned work for later phases.

## Human Experience Outcome

- Impact and promise: Direct. The live view must open and report a useful limit when it cannot open.
- Intended outcome: The user sees a working bounded page, one tool call, and one agent message without transport details.
- Surface: Test resource, tool action, message action, and fallback response.
- Implementation work: One bounded versioned resource, tool result, read-only tool call, fixed agent message, capability check, and selected transport proof.
- Evidence: Automated protocol tests, required real-host proof, and required agent Human Experience Review. Guided owner feedback is advisory.
- Executor: Host-proof agent under the user's P2 authority.
- Deferral: None.

[PRD 51](../../prd/51-backlog-review-and-reporting.md) owns the host outcome. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) owns the review standard.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Resource and bridge contracts need repeatable tests. |
| Performance Testing | `not-needed-now` | P2 proves function, not product speed. |
| Guided Progress Review | Advisory | Offer the owner a short look at the proved result. A decline or no response does not block P2. Required real-host proof remains separate. |
| Unassisted Goal Testing | `not-needed-now` | The proof is a maintainer test. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: one resource open, one tool call, one message, and one fallback observation.
- Evidence handoff: [P2 evidence](evidence.md#p2-current-evidence) retains the actual source, host, fallback, and cleanup results.
- Gate effect: A9-A16 block P4 and P6.

Automated Implementation Testing and the required real-host proof inform the P2 correctness and supported-host claim. Product maturity is a bounded proof, before production live integration. Scope is resource registration, safe data, tool calls, fixed messages, capability absence, and the selected transport. The host-proof agent is the executor. The gate effect is `blocking-claim-only`. The budget is focused protocol checks plus one resource open, one tool call, one message, and one fallback observation. Stop when the bounded checks pass or a concrete host limit prevents proof. Retain actual results and limits. A material change or failed check triggers an affected rerun.

Guided Progress Review is advisory. The owner was offered one short review of the open, message, and fallback words. No response was supplied after more than 60 seconds. This does not block completion. No decline is inferred. The [optional handoff](evidence.md#p2-optional-experience-handoff) uses the retained captures. It does not replace or waive required real-host evidence.

Human Experience Review remains required agent work. It inspects the available real surface and records each promise's observation, conclusion, limit, and next useful action. It is not a fifth testing type. There is no explicit owner-response gate for P2. Performance Testing and Unassisted Goal Testing remain `not-needed-now` for this maintainer proof.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: one bounded stdio proof passed; host message acceptance created a draft before Send; product layout and production integration remain later work`

## Stage 1 - Resource and bridge

### Tasks

- [x] t1: Register one versioned test resource with the MCP Apps MIME type.
- [x] t2: Return it from one test tool through `_meta.ui.resourceUri`.
- [x] t3: Prove one `tools/call` and one controlled `ui/message`.

### Acceptance criteria

- A9: One compatible host displays the versioned resource.
- A10: The widget receives and renders one bounded tool result.
- A11: The active conversation receives one fixed follow-up message.
- A12: Hostile data stays inert in the resource and message.

## Stage 2 - Capability and transport

### Tasks

- [x] t4: Record required host capabilities and their absence states.
- [x] t5: Confirm stdio or prove one bounded Streamable HTTP adapter over the same server factory.
- [x] t6: Remove proof-only code or promote it through accepted shared boundaries.

### Acceptance criteria

- A13: Capability selection does not use a host product name.
- A14: Unsupported capability or transport returns a typed fallback signal.
- A15: The proof creates no second registry, permission model, or business-logic path.
- A16: Required real-host evidence and agent Human Experience Review support the open, action, and fallback behavior. Owner feedback is advisory.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | MCP and Backlog Review references need the supported host result. |
| History coverage | `create` | One completed bounded host proof is a meaningful architecture checkpoint. |
| PRD reconciliation | `link-only` | P1 already establishes product authority. |

## Current Proof Status

- [P2 evidence](evidence.md#p2-current-evidence) records the selected host, exact resource, actions, fixed-message receipt, fallback, checks, cleanup, and limits.
- All six tasks and A9-A16 have evidence. P2 is closed for the unshipped fixture in one Claude version through stdio.
- The shared static-resource seam remains generic. Proof registration stays in test fixtures. The default factory has no proof tool or UI extension. No parallel registry, permission model, or business-logic path was created.
- Host acceptance of the fixed message first created a draft. The approved host Send action and visible conversation receipt support delivery. No task was created.
- Required agent Human Experience Review passed within this bounded scope. Owner review was not supplied and remains advisory.
- The temporary Claude entry was removed. Prior settings were restored. The test server and fallback tab were closed.
- [P2 history](../../../.make-docs/archive/history/2026-09-30-w25-r0-p2-host-and-transport-proof.md) records this checkpoint. The user authorized P2 closeout and commit on 2026-09-30.
- Production live delivery, layout, and refresh remain later work. Streamable HTTP, broad host support, installed parity, and W24 profile acceptance are not proved. P3 needs separate implementation authority.
- The separate closeout request authorizes staging and commit of P2 work. Push, installation, publication, and release need separate authority.
