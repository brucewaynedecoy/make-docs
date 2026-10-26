---
title: "Phase 6: Refresh Cache and Agent Actions"
kind: "work"
status: "completed"
coordinate: "W25 R0 P6"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 6: Refresh Cache and Agent Actions

> Historical closed phase. The results below keep their original scope. Current Explain and Work behavior is defined in [PRD 51](../../prd/51-backlog-review-and-reporting.md#live-mcp-app) and proved under the active [P7 work record](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/07-parity-performance-and-acceptance.md). Neither current wave action creates another task.

## Purpose

Connect the live view to current facts and controlled active-agent requests.

## Overview

P6 adds unchanged and changed refresh flows, exact cache reuse, best-effort cache refresh after validation, wave review requests, and a separate-task request.

The user authorized P6 implementation on 2026-10-06 at clean base `04edf4f61ee5af21c319dbc4698cc578fb5362c7` on `w25-r0-p1-live-delivery-contract`. The user then authorized P6 closeout and a local commit on the same client date. P6 is closed within source and bounded mock-host/static scope. t1-t6/A41-A50 retain their evidence. Tyler approved the exact `v1.2-feedback-removed` preview and directly requested the later wave-layout and Data-modal supplements. Required agent Human Experience Review is satisfied within recorded limits. These records belong to the P6 phase closeout commit. P7 needs its own implementation authority.

## Human Experience Outcome

- Impact and promise: Direct. A person can refresh, understand what changed, and request focused help without guessing what the action will do.
- Intended outcome: Refresh is honest and recoverable. Agent actions name the wave and wait for confirmed host results.
- Surface: Refresh control, changed-record state, wave actions, active conversation, and cache-limit messages.
- Evidence: Focused refresh/cache/message checks, required agent Human Experience Review, and the explicit live UI design gate. Guided Progress Review remains advisory.
- Executor: Refresh/Skill/code agents under current authority; coordinator/browser agent for approved integration; Tyler for the named design gate.
- Deferral: Durable task activity is outside W25.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Refresh, exact references, optional cache, response fences, and host receipts need repeatable proof. |
| Performance Testing | `not-needed-now` | P7 owns full refresh characterization; no numeric speed claim is accepted here. |
| Guided Progress Review | Advisory | Offer one short normal-use goal after an approved visible increment. This is separate from the explicit design gate below. |
| Unassisted Goal Testing | `not-needed-now` | Current correctness and controlled-action questions can be answered by focused proof. |

### Automated Implementation Testing

- Testing type: Automated Implementation Testing.
- Decision informed: Whether refresh, action validation, optional cache, and report replacement preserve the accepted boundaries.
- Reason now: P6 adds isolated source flow logic and a portable agent wrapper before gated live integration.
- Product maturity: Source implementation after closed P1-P5; no new installed or production-host claim.
- Scope: Current snapshot first; exact changed lists/cache identities; Store refusal/failure; whole-model validation before existing-gated write/open; fixed actions and trusted context; stale/racing results; host support/receipt versus creation; no project text as instructions.
- Executor: Code agent for focused/nearest checks; Skill agent for workflow parity; coordinator/browser agent for approved integration proof.
- Gate effect: `blocking-claim-only` for A41-A50 functional claims. Live UI activation also has the separate owner design gate.
- Effort budget: One focused controller/agent-helper pass, one nearest action/report/cache/Skill integration pass, and one bounded browser/transport path after preview approval. Reuse unchanged P1-P5 proof. Rerun only affected failures or material edits.
- Stop condition: The affected proof and justified nearest regression pass with no unresolved material finding, and required approved-UI proof exists.
- Evidence retained: Exact commands, tested identity/hashes, outcomes, findings, observations, and limits in the existing central evidence report.
- Rerun trigger: Failure, material shared change, expired evidence, accepted support claim, or approved new UI behavior that changes the boundary.

### Performance Testing

- Testing type: Performance Testing.
- Decision informed: No current quantitative speed or payload decision.
- Reason now: `not-needed-now`; P7 owns complete live refresh characterization.
- Product maturity: Source flow before the installed acceptance candidate.
- Scope: No new benchmark, profile, or performance obligation.
- Executor: None.
- Gate effect: `not-applicable`.
- Effort budget: Zero runs.
- Stop condition: Record this limit and reuse valid prior proof.
- Evidence retained: This decision and existing phase evidence limits.
- Rerun trigger: Accepted hard target, material speed finding, or P7 authority.

### Guided Progress Review

- Testing type: Guided Progress Review.
- Decision informed: Whether an approved visible increment helps the maintainer understand refresh and a focused request.
- Reason now: Offer meaningful progress after a real approved UI path exists.
- Product maturity: Maintainer source increment, not broad acceptance.
- Scope: One optional goal and one public path of at most three steps. It does not replace exact design approval or repeat automated assertions.
- Executor: Owner or maintainer if they opt in; coordinator prepares the safe starting state.
- Gate effect: `advisory`.
- Effort budget: One invitation; no repeated or required response.
- Stop condition: Record actual feedback, decline, or environment limit. No response is not a decline and creates no obligation.
- Evidence retained: Goal, steps, actual response or no response, and any bounded change.
- Rerun trigger: Meaningful new visible progress, material feedback, or explicit request.

### Unassisted Goal Testing

- Testing type: Unassisted Goal Testing.
- Decision informed: No current independent discovery decision.
- Reason now: `not-needed-now`; targeted flow, identity, and approved UI proof answer the current questions.
- Product maturity: Source flow before P7 acceptance.
- Scope: No unassisted scenario or deferred obligation.
- Executor: None.
- Gate effect: `not-applicable`.
- Effort budget: Zero runs.
- Stop condition: Record the reason and supported-scope limit.
- Evidence retained: This decision and bounded functional/agent review evidence.
- Rerun trigger: A material uncertainty that other proof cannot answer or explicit current testing authority.

Required agent Human Experience Review is separate. Review the built result per accepted promise. Record reviewer, observation, conclusion, limit, and next useful action. Suitable existing proof may be reused. Guided Progress Review is not a required sign-off.

## Explicit P6 Live UI Design Gate

- Source: Direct user instruction on 2026-10-06.
- Scope: Any new or updated P6 live UI element, wording, or behavior.
- Reviewer: Tyler.
- Surface: A concrete preview of exact controls, icons, accessible names, words, placement, behavior, and limit/result states.
- Acceptance question: Does Tyler approve this exact preview for live activation?
- Gate effect: `blocking-current-work` for live UI activation. The affected whole-surface A50 claim depends on that approval.
- Current result: On 2026-10-06, the owner said “Alright. The preview is now approved.” This accepts only the exact `v1.2-feedback-removed` preview at port 57749.
- Boundary: Matching source integration has passed the bounded browser, transport, and agent review. A50 has evidence within that scope. Any further new UI element, word, or behavior needs its own approved preview.

The approved direction keeps icon-only Review and New Task controls inside expanded wave details. Refresh sits beside top Mode and Print; all three top controls are icon-only. Preserve P5 footer labels/layout and the rest of the accepted report. The gate comes from this direct instruction, not a generalized Skill rule.

On 2026-10-06, the owner rejected the temporary preview's inline request feedback `Request failed. Ask in this chat.` inside wave details. All per-wave request feedback was removed in the accepted [v1.2 preview](http://127.0.0.1:57749/). No replacement location or words are approved or added. The replacement-footer wording question was not answered. Current preview approval adds no new footer copy. The earlier 207-case non-UI checkpoint remains historical evidence. The final source has separate [304-case and browser evidence](evidence.md#p6-implementation-and-acceptance-evidence--2026-10-06). Preview approval and actual-source proof remain distinct.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 38](../../prd/38-global-store-and-project-state.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none; durable task activity is outside W25 and no new obligation is created`
- `NUAT: not-needed-now`
- `Finding: the widget must ask the active agent rather than create a task directly`
- `Finding: expected action session identity must come from trusted open context, never the incoming action. The compatible helper/open-input solution needs proof before A46/A49 pass.`

## Stage 1 - Refresh and cache

### Tasks

- [x] t1: Connect refresh to `backlog.review.refresh` through `tools/call`.
- [x] t2: Handle unchanged, changed, Store-limited, and failed-write results.
- [x] t3: Reuse `work.backlog-cache.write` only after the rebuilt model validates.

### Acceptance criteria

- A41: Refresh always starts with a current deterministic snapshot.
- A42: An unchanged snapshot keeps the current model and does not request agent review.
- A43: A changed snapshot reports exact changed records and invalidates only nonmatching cache identities.
- A44: Store absence, denial, unsafe state, or outage completes a full stateless review.
- A45: Cache write is best-effort after validation and cannot invalidate the current report.

### Dependencies

- Closed P4/P5 source tools/widget and current P1/P3 report/identity contracts.
- Whole-model validation and existing Store write/allowWrite authority; optional cache failure must not block current review.
- Approved live UI preview before any UI activation.

## Stage 2 - Agent and task requests

### Tasks

- [x] t4: Add controlled wave review and refresh-review messages.
- [x] t5: Add the explicit `Start a new Codex task` request to the active agent.
- [x] t6: Refresh the live view only after the active agent validates the new model.

### Acceptance criteria

- A46: Messages use fixed action identifiers, project identity, record path, coordinate, and snapshot identity.
- A47: Project-authored text cannot become prompt instructions.
- A48: The widget does not create a task or claim that one started.
- A49: The active agent validates current state and host support before task creation, then reports the real result.
- A50: Required agent Human Experience Review supports refresh, failure, review-request, and task-request feedback within observed proof. Guided Progress Review is advisory. Tyler has approved every new or changed live UI element, word, and behavior in its concrete preview before activation.

### Dependencies

- Fresh current snapshot and `resolveBacklogLiveAction` validation against a trusted report/open context.
- Resolve the refresh request against the old retained session/model and exact snapshot/change fields. Validate the incoming whole rebuilt report against the latest checked project/snapshot before fresh open; its new IDs can differ from the old request IDs.
- Actual host support and direct named-chat request; receipt is not task creation.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | The upstream Skill now has tested current-source, open-confirmation, fixed-action, cache, chat-only authority, and notification-limit instructions. Installed copies stay outside P6. |
| History coverage | `create` | User-authorized closeout creates one [P6 history record](../../../.make-docs/archive/history/2026-10-06-w25-r0-p6-refresh-cache-and-agent-actions.md). No duplicate session history is created. |
| PRD reconciliation | `update-existing` | PRD 51 APP-2 records trusted fresh UUID input. The supplemental HTML-12/15 and APP-6 clauses record Data modal access and the 66 percent visible-height target. Prior contracts remain in Requirement History. No new PRD is created. |

## Current Implementation State

- P6 is closed under the user's 2026-10-06 closeout and local commit authority. t1-t6 and A41-A50 retain [acceptance evidence](evidence.md#p6-implementation-and-acceptance-evidence--2026-10-06). The [history record](../../../.make-docs/archive/history/2026-10-06-w25-r0-p6-refresh-cache-and-agent-actions.md) is the commit-body source.
- The exact `v1.2-feedback-removed` preview is approved. Actual-source controls, refresh/request paths, and required agent Human Experience Review pass within observed limits. No new footer wording or inline request feedback is added. Any further UI change needs its own approved preview.
- The original P6 checkpoint has 304 unique passing cases across finite runs and UI hash `e4c41748a6418243fcc137013dca7daa77d24f4522832518435348d1c5efc438`. The later [wave-layout](evidence.md#supplemental-wave-card-layout--2026-10-06) and [Data-modal](evidence.md#supplemental-data-modal--2026-10-06) requests have separate affected proof. Final live HTML is 444,492 bytes, SHA-256 `3bde35c0e2670c211097f6990cf711de2d03d6540cc0fd109d8c42ac4b822117`. Its 137 focused cases include eight new widget cases; repeated cases are not added to old totals. Type, build, asset drift, exact stdio resource, document, and bounded agent reviews pass.
- The active agent prepares a validated report and fresh UUID using the portable helper. Its candidate envelope is provisional. Retain authoritative context only after `confirmBacklogAgentOpen` confirms the actual own successful open result. Missing context rejects the action; incoming `action.sessionId` or received message cannot create expected context. The optional open-input UUID preserves report-only default behavior and V1 outputs.
- A validated `request-task` click authorizes only the named separate chat. Use the host's local current saved-project path. It grants no branch/worktree, implementation, staging, commit, push, installation, or other authority. Project prose remains data.
- Root stages the reviewed closeout files and creates the authorized local commit. Push, release, installation, host/Store changes, branch changes, and P7 remain outside this authority.
- No production-host display, real agent message, real created chat, Store write, installed parity, or broad accessibility/performance result is claimed. P7 owns its remaining acceptance matrix.
- Guided review is advisory. Preview approval and the later exact user requests are recorded consultation. The normal modal path is close Data, then Refresh. Async model arrival is technical compatibility proof, not a new user gate. Honest host-height and unassigned-log/download limits stay explicit. P7 retains real-host, installed, and PERF-002 work.
