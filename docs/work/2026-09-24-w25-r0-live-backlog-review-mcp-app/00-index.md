---
title: "W25 R0 Live Backlog Review MCP App Work Backlog"
kind: "work"
status: "active"
coordinate: "W25 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from PRD 51 and the W25 R0 plan."
  coordinate_handoff: "P1-P6 are historical closed work. P7 retains A51-A60 history and open checks. P8-P13 own the remaining repair, acceptance, cleanup, and closeout. W26 R0 supplies the shared access path. Commit and release need separate authority."
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W25 R0 Live Backlog Review MCP App Work Backlog

## Current State

The owner rejected the current live app for release on 2026-10-08. The repair-1 version 2.0.4 has bounded Codex proof for the 73-record display, Data, Explain, read-only Work, and Refresh. A cache lookup returned `store-denied`; which enabled connection produced it is unknown. The visible report treated unsupported task counts as zero. Final-installed accessibility remains open. This evidence does not pass ordinary setup, cache reuse, or release readiness. P7 and W25 remain active. [P8](08-evidence-and-scope-correction.md#a51a60-claim-ledger) records the current checkout, connection and candidate boundary, file ownership, A51–A60 claim scope, and a combined W25/W26 estimate. Its four tasks are checked. P8 is active and ready for review, but its gate decision is pending. P9–P13 have not started. [W26 R0 P1](../2026-10-09-w26-r0-shared-access-and-data-foundation/01-access-trace-and-design.md) must trace which connection produced the refusal before access policy or setup changes.

The owner authorized the [P7 recovery plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/07-parity-performance-and-acceptance.md) on 2026-10-08. The separate local P7 recovery summary holds exact package and host receipts. P8 classified those claims in its ledger. Earlier phase permissions and results remain historical.

## Purpose

Provide the implementation queue for [PRD 51](../../prd/51-backlog-review-and-reporting.md), the [W25 R0 design](../../designs/2026-09-24-live-backlog-review-mcp-app.md), and the [W25 R0 plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-overview.md).

The user authorized P1 implementation on 2026-09-30. The user then authorized P1 closeout and a local commit on that date. This includes staging the reviewed P1 file set. P2 and later phases, push, publication, installation, and release remain outside that authority.

The user separately authorized P2 implementation on 2026-09-30. It uses the current branch after P1 commit `2a8fc509`. The user then authorized P2 closeout and a local commit on that date. This includes staging the reviewed P2 file set. P3 and later phases, push, publication, installation, and release remain outside that authority.

The user separately authorized P3 implementation on 2026-09-30. Its tested source checkpoint uses the current branch after P2 commit `0c112e57`. The user then authorized P3 closeout and a local commit on that date. This includes staging the reviewed P3 file set. These records belong to the P3 phase closeout commit. P3 keeps the unchanged V1 report and separate P1 live envelope. P4 and later phases, branch changes, push, publication, installation, and release remain outside that authority.

The user separately authorized P4 implementation on 2026-10-04. Its tested source checkpoint uses the current branch at `bdd21481`. Accepted W24 authority is merged at `26bdf1ce`, from W24 completion `b4c253c1`. The user then authorized P4 closeout and a local commit on 2026-10-04, including staging the reviewed P4 file set. P4 is closed with A25-A32 evidence. These records belong to the P4 phase closeout commit. Its scope is shared tool/resource integration and useful no-UI results. P5 is next eligible and needs separate implementation authority. Later phases, branch changes, push, publication, installation, release, Store writes, and host changes remain outside this authority.

The user separately authorized P5 preflight fixes and implementation on 2026-10-04. Its tested pre-commit checkpoint uses the current branch based on P4 commit `19c19f42`. On 2026-10-06, the owner approved live-only footer placement and exact five labels, then separately asked to close P5 and commit it. P5 is closed within source and finite browser scope. t1-t6/A33-A40, final 73-record changed proof, and 405 unique selected cases across finite runs support the closeout. These records belong to the P5 phase closeout commit. Root owns staging the reviewed file set and the local commit. P6/P7, installation, Store writes, host changes, branch changes, push, publication, and release remain outside this authority.

The user separately authorized P6 implementation and then closeout/local commit on client date 2026-10-06. Its pre-commit base is `04edf4f61ee5af21c319dbc4698cc578fb5362c7`. Tyler approved the feedback-removed preview and directly requested the later wave-layout and Data-modal supplements. P6 is closed within source and bounded mock-host/static scope. t1-t6/A41-A50 and required agent reviews have evidence. The original e4/304-case checkpoint and final 3bde/137-case affected set stay distinct. The Data modal meets the tested 66 percent visible-height floors with honest bounds. These records belong to the P6 closeout commit. Root owns staging and the authorized local commit. P7, push, release, installation, Store/host changes, and branch changes remain outside this authority.

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
| P6 | Closed: bounded source refresh and actions | [Refresh Cache and Agent Actions](06-refresh-cache-and-agent-actions.md) | t1-t6/A41-A50, exact active-agent context, optional cache, controlled requests, and user-requested layout/modal have bounded proof. User-authorized closeout/local commit. Real-host, installed, and PERF-002 acceptance remain P7. |
| P7 | Active: recovery and installed proof | [Parity Performance and Acceptance](07-parity-performance-and-acceptance.md) | One exact installed version displays the report, refreshes, and sends Explain/Work to the connected agent. Native display, Data, Explain, and Work are proved. A56 is waived. Native refresh and changed-state are proved. Final-installed accessibility evidence stays open. |
| P8 | Active: ready for review; gate decision pending | [Evidence and Scope Correction](08-evidence-and-scope-correction.md) | Four tasks checked. Inventory and claim correction are recorded. The connection behind `store-denied` is unknown and passes to W26 P1. |
| P9 | Blocked on P8 and W26 gates | [Source and App Remediation](09-source-and-app-remediation.md) | Complete original W25 removal/repair, approved cache integration, report delivery, same-chat actions, and approved unknown-count display. |
| P10 | Blocked on P9 | [Candidate and Connection](10-candidate-and-connection.md) | Present one exact candidate, connection diff, and rollback packet for separate approval. |
| P11 | Blocked on P10 and W26 P3 | [Installed Acceptance](11-installed-acceptance.md) | Prove the actual host, cache lifecycle, actions, parity, accessibility, and Human Experience results; link A51–A60 to P7. |
| P12 | Blocked on P11 disposition | [Recovery Cleanup](12-recovery-cleanup.md) | Review and remove only approved exact recovery paths after active dependency checks. |
| P13 | Blocked on P11/P12 disposition | [Closeout and Commit Disposition](13-closeout-and-commit-disposition.md) | Reconcile one summary, unresolved obligations, release hold, and a separately reviewed commit allowlist. |

## Usage Notes

- Read P1–P6 as closed history. P7 retains acceptance history; read P8–P13 in dependency order for remaining work.
- The Bear F1–F3 and W1–W6 labels are mapping labels only. Make Docs phase and task coordinates use W26 R0 P1–P3 and W25 R0 P8–P13.
- Do not treat prior private-candidate or native-open proof as normal Store setup, cache reuse, final accessibility, or release acceptance.
- Do not start any phase without separate owner authority.
- W24 R0 supplied accepted MCP profile authority. Its closed P1-P4 work is merged into this branch at `26bdf1ce`. P4 implementation uses that existing registry and profile model.
- P2 may run a bounded proof before W24 closes. It cannot create a parallel registry or profile system.
- Keep the static report as an explicit option. Do not create it during live open or fallback.
- Keep the snapshot Store-free. Keep cache writes best-effort and after full model validation.
- Keep project text inert. UI messages use fixed actions and exact record references.
- Explain and Work send fixed requests to the connected agent chat. Neither requests another task. Task-creation support cannot disable Work.
- Recheck branch, HEAD, dirty files, profile authority, package state, and concurrent work before each phase.
- Never create or switch a branch or worktree without explicit user permission.
- Create one central `evidence.md` only after evidence exists.
- [Evidence report](evidence.md): P1 contracts, the bounded P2 host proof, P3 shared-model checks, the [2026-10-04 merge handoff](evidence.md#2026-10-04-w24-merge-handoff), [P4 implementation state](evidence.md#p4-implementation-state), and [P5 acceptance](evidence.md#p5-task-and-acceptance-results), with exact limits.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: complete P8 inventory and W26 R0 P1 access design under their reviewed scopes. Then use P9–P13 to repair, qualify, clean up, and seek closeout. Preserve the working launch path until an approved replacement passes.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md)
- Why: The backlog is the implementation queue derived from PRD 51 and the W25 R0 plan.
- Coordinate Handoff: P1–P6 remain historical. P7 retains A51–A60 and the W25-only A56 waiver. P8–P13 own remaining W25 work; W26 R0 P1–P3 own the shared access dependency. Branch/worktree changes, staging, commit, push, publication, and release need separate authority.
