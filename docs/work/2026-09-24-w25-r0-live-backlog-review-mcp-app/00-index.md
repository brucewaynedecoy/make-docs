---
title: "W25 R0 Live Backlog Review MCP App Work Backlog"
kind: "work"
status: "active"
coordinate: "W25 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from PRD 51 and the W25 R0 plan."
  coordinate_handoff: "W25 R0 P1-P5 and W24 R0 P1-P4 are closed. The user authorized P5 closeout and a local commit on 2026-10-06. P5 source/finite browser evidence supports t1-t6/A33-A40. P6 is next eligible and needs separate implementation authority; P7 remains pending."
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W25 R0 Live Backlog Review MCP App Work Backlog

## Purpose

Provide the implementation queue for [PRD 51](../../prd/51-backlog-review-and-reporting.md), the [W25 R0 design](../../designs/2026-09-24-live-backlog-review-mcp-app.md), and the [W25 R0 plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-overview.md).

The user authorized P1 implementation on 2026-09-30. The user then authorized P1 closeout and a local commit on that date. This includes staging the reviewed P1 file set. P2 and later phases, push, publication, installation, and release remain outside that authority.

The user separately authorized P2 implementation on 2026-09-30. It uses the current branch after P1 commit `2a8fc509`. The user then authorized P2 closeout and a local commit on that date. This includes staging the reviewed P2 file set. P3 and later phases, push, publication, installation, and release remain outside that authority.

The user separately authorized P3 implementation on 2026-09-30. Its tested source checkpoint uses the current branch after P2 commit `0c112e57`. The user then authorized P3 closeout and a local commit on that date. This includes staging the reviewed P3 file set. These records belong to the P3 phase closeout commit. P3 keeps the unchanged V1 report and separate P1 live envelope. P4 and later phases, branch changes, push, publication, installation, and release remain outside that authority.

The user separately authorized P4 implementation on 2026-10-04. Its tested source checkpoint uses the current branch at `bdd21481`. Accepted W24 authority is merged at `26bdf1ce`, from W24 completion `b4c253c1`. The user then authorized P4 closeout and a local commit on 2026-10-04, including staging the reviewed P4 file set. P4 is closed with A25-A32 evidence. These records belong to the P4 phase closeout commit. Its scope is shared tool/resource integration and useful no-UI results. P5 is next eligible and needs separate implementation authority. Later phases, branch changes, push, publication, installation, release, Store writes, and host changes remain outside this authority.

The user separately authorized P5 preflight fixes and implementation on 2026-10-04. Its tested pre-commit checkpoint uses the current branch based on P4 commit `19c19f42`. On 2026-10-06, the owner approved live-only footer placement and exact five labels, then separately asked to close P5 and commit it. P5 is closed within source and finite browser scope. t1-t6/A33-A40, final 73-record changed proof, and 405 unique selected cases across finite runs support the closeout. These records belong to the P5 phase closeout commit. Root owns staging the reviewed file set and the local commit. P6/P7, installation, Store writes, host changes, branch changes, push, publication, and release remain outside this authority.

## Human Experience Trace

| Promise | Source | Owner | Phase | Evidence | Gate |
| --- | --- | --- | --- | --- | --- |
| Compatible hosts open a live Backlog Review by default. | Design and plan | PRD 51 | P1-P5 | Contracts, bounded host proof, source tests, required agent review; owner feedback is advisory | A1-A8, A9-A16, A25-A40 |
| Static HTML is written only after an explicit request. | Same | PRD 51 | P1, P3, P7 | Route fixtures and installed proof | A1-A4, A17-A24, A51-A60 |
| Live, static, and chat fallback keep the same report meaning. | Same | PRD 51 | P3, P7 | Golden parity fixtures and Human Experience Review | A17-A24 and A51-A60 |
| Refresh says whether facts changed and preserves safe fallback. | Same | PRD 51 and PRD 38 | P4, P6, P7 | Operation, Store-state, and browser tests | A25-A32, A41-A50, A51-A60 |
| Agent actions use exact wave identity and user intent. | Same | PRD 51 | P1, P6, P7 | Message fixtures and guided host review | A5-A8, A41-A50, A51-A60 |
| Local report controls stay fast and do not call the server. | Same | PRD 51 | P5 | Browser instrumentation and accessibility review | A33-A40 |

## Phase Map

| Phase | Status | File | Required result |
| --- | --- | --- | --- |
| P1 | Closed: source contracts | [Authority and Live Delivery Contract](01-authority-and-live-delivery-contract.md) | Tested pure delivery, model, action, and fallback contracts. Live integration remains later work. |
| P2 | Closed: bounded host proof | [Host and Transport Proof](02-host-and-transport-proof.md) | Claude Desktop `2.16120.0` passed the unshipped resource, tool, fixed message, capability, stdio, and fallback proof. Temporary host setup was restored. Production integration remains later work. |
| P3 | Closed: shared source model | [Shared Model and Dual Renderer](03-shared-model-and-dual-renderer.md) | Unchanged V1 with the separate P1 envelope, shared static rendering, concise chat/live payloads, and exact meaning parity. User-authorized closeout and local commit. No production live widget is claimed. |
| P4 | Closed: source tools and resource | [Backlog Profile Tools and UI Resource](04-backlog-profile-tools-and-ui-resource.md) | Two shared read-only operations, derived tools, useful no-UI results, and one versioned UI resource in the accepted W24 profiles. A25-A32 pass. User-authorized closeout and local commit. Product widget behavior remains later work. |
| P5 | Closed: source widget and local controls | [Live Widget and Local Interaction](05-live-widget-and-local-interaction.md) | Owner-approved live footer, larger-input repair, and affected actual-source proof pass. t1-t6/A33-A40 have bounded evidence. User-authorized closeout and local commit. P6 action execution remains later work. |
| P6 | Not started | [Refresh Cache and Agent Actions](06-refresh-cache-and-agent-actions.md) | Safe refresh, cache reuse, agent review, and explicit task-request flow. |
| P7 | Not started | [Parity Performance and Acceptance](07-parity-performance-and-acceptance.md) | One accepted package candidate with installed, performance, accessibility, and Human Experience evidence. |

## Usage Notes

- Read phases in order.
- Do not start any phase without separate owner authority.
- W24 R0 supplied accepted MCP profile authority. Its closed P1-P4 work is merged into this branch at `26bdf1ce`. P4 implementation uses that existing registry and profile model.
- P2 may run a bounded proof before W24 closes. It cannot create a parallel registry or profile system.
- Keep the static report as an explicit option. Do not create it during live open or fallback.
- Keep the snapshot Store-free. Keep cache writes best-effort and after full model validation.
- Keep project text inert. UI messages use fixed actions and exact record references.
- Keep task creation in the active agent and host. The widget only sends an explicit request.
- Recheck branch, HEAD, dirty files, profile authority, package state, and concurrent work before each phase.
- Never create or switch a branch or worktree without explicit user permission.
- Create one central `evidence.md` only after evidence exists.
- [Evidence report](evidence.md): P1 contracts, the bounded P2 host proof, P3 shared-model checks, the [2026-10-04 merge handoff](evidence.md#2026-10-04-w24-merge-handoff), [P4 implementation state](evidence.md#p4-implementation-state), and [P5 acceptance](evidence.md#p5-task-and-acceptance-results), with exact limits.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: W25 R0 P6 is next eligible and needs separate implementation authority. W25 R0 P1-P5 and W24 R0 P1-P4 are closed. P5's local commit is authorized. P7 remains pending.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md)
- Why: The backlog is the implementation queue derived from PRD 51 and the W25 R0 plan.
- Coordinate Handoff: W25 R0 P1-P5 and W24 R0 P1-P4 are closed. The [2026-10-06 footer finding](evidence.md#p5-owner-status-ui-finding--2026-10-06) is resolved within final source/browser proof. The user authorized P5 closeout and a local commit. P6 is next eligible and needs separate implementation authority; P7 remains pending.
