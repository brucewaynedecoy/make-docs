---
title: "Phase 5: Live Widget and Local Interaction"
kind: "work"
status: "completed"
coordinate: "W25 R0 P5"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 5: Live Widget and Local Interaction

## Purpose

Build the live widget without changing the accepted Backlog Review meaning or layout.

## Overview

P5 ports the accepted report presentation to the MCP App resource. It keeps display-only controls local and adds clear live state.

The user authorized the preflight fixes and P5 implementation on 2026-10-04. Work uses branch `w25-r0-p1-live-delivery-contract` at clean base `19c19f42d90d836ed7c1a5e23f7abf1230bee1c2`. W25 P1-P4 are closed. P3's retained baseline HTML, report, and full live payload are verified exact. Compare the new view with that [baseline evidence](evidence.md#p3-output-review).

P5 owns presentation, local controls, and visible feedback states. P6 owns refresh tool calls, controlled agent messages, and task actions. P5 feedback does not execute those actions or hide report content. No production host, installed, or broader support claim follows from a local browser view. The initial implementation authority did not include closeout, history, staging, or commit. The user separately authorized P5 closeout and a local commit on 2026-10-06. Installation, push, Store writes, host changes, branch changes, and P6 work remain outside that authority.

## Human Experience Outcome

- Impact and promise: Direct. The live page stays familiar, readable, responsive, and under user control.
- Intended outcome: A maintainer can inspect the backlog and use all display controls without network or agent work.
- Surface: Full MCP App widget in light, dark, narrow, wide, and print views.
- Implementation work: Reuse the unchanged V1 report, P1 envelope, P3 presentation meaning, and P4 registered resource.
- Evidence: Focused behavior and browser checks, exact baseline comparison, and required agent Human Experience Review. Optional owner Guided Progress Review is advisory.
- Executor: Widget and browser agents under current P5 authority; coordinator for independent review.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Rendering, local controls, safe content, and accessibility need repeatable checks. |
| Performance Testing | `not-needed-now` | P7 owns live payload and startup characterization. No numeric speed claim is accepted here. |
| Guided Progress Review | Advisory | Offer a short owner comparison after real output exists. A response does not gate completion. |
| Unassisted Goal Testing | `not-needed-now` | The current decision is presentation parity, not independent discovery. |

### Automated Implementation Testing

- Testing type: Automated Implementation Testing.
- Decision informed: Whether P5 preserves report meaning, presentation, local behavior, and safe interaction.
- Reason now: The source widget changes from the P4 shell to the complete report view.
- Product maturity: Source widget implementation before installed acceptance and P6 agent flow.
- Scope: Shared-model rendering, exact P3 baseline comparison, wide/narrow/light/dark/print views, keyboard and focus, reduced motion, hostile text, lazy Data, user-started download, and zero local-control tool/message calls. Feedback states keep report content visible and run no P6 action.
- Executor: Widget code agent for focused checks; browser agent for the bounded real-browser matrix; coordinator for independent review.
- Gate effect: `blocking-claim-only` for A33-A40 correctness and presentation claims.
- Effort budget: One focused widget suite, one nearest resource/asset/presentation pass, and one browser matrix limited to wide/narrow light/dark views plus print and reduced motion. Exercise one normal-use control path on mixed and small synthetic reports. Reuse unchanged P1-P4 checks.
- Stop condition: Focused checks, the affected boundary, and the bounded browser review pass with no unresolved material finding.
- Evidence retained: Exact commands, source/hash identities, outcomes, material failures, P3 comparison, and only captures needed to show the accepted views. Use the existing [central evidence](evidence.md).
- Rerun trigger: A failure, material widget/shared-boundary change, expired evidence, or an accepted new support claim. Rerun only affected cases or views. Expand only when that signal needs it.

### Performance Testing

- Testing type: Performance Testing.
- Decision informed: No current numeric latency or payload decision.
- Reason now: `not-needed-now`; P7 owns package and live startup characterization.
- Product maturity: Source widget before the installed acceptance candidate.
- Scope: No new measurement run, canonical profile, or performance obligation.
- Executor: None.
- Gate effect: `not-applicable`.
- Effort budget: Zero runs.
- Stop condition: Record the boundary and retain existing evidence limits.
- Evidence retained: This decision and the valid P3-P4 baseline limits.
- Rerun trigger: An accepted hard target, a material current speed finding, or P7 characterization authority.

### Guided Progress Review

- Testing type: Guided Progress Review.
- Decision informed: Whether the owner sees and understands the preserved report view and local controls.
- Reason now: Advisory comparison is useful after the visible widget output exists.
- Product maturity: Source widget in a safe synthetic review view.
- Scope: One optional goal: choose a wave from Attention and Next, then open its details. Prepare one public path and at most three steps. Do not request writes, tasks, setup, or repeated automated assertions.
- Executor: Owner or maintainer if they choose to take part; coordinator prepares the handoff.
- Gate effect: `advisory`.
- Effort budget: One optional invitation after actual output exists. No repeated request or required reply.
- Stop condition: Record actual feedback, decline, or environment limit. If no reply arrives after a reasonable chance, continue without a response gate. No reply is not a decline.
- Evidence retained: Goal, public path, short steps, actual response or no response, and any resulting change in the central evidence.
- Rerun trigger: Material new visible progress, a current owner question, or an explicit request.

### Unassisted Goal Testing

- Testing type: Unassisted Goal Testing.
- Decision informed: No current independent-use or discovery decision.
- Reason now: `not-needed-now`; parity, controls, and safe feedback can be reviewed with the current targeted evidence.
- Product maturity: Source widget before the complete live agent flow.
- Scope: No unassisted scenario or new deferred obligation.
- Executor: None.
- Gate effect: `not-applicable`.
- Effort budget: Zero runs.
- Stop condition: Record the reason and preserve the current claim limit.
- Evidence retained: This decision and the bounded automated and agent review evidence.
- Rerun trigger: A material current human question that other evidence cannot answer, or explicit product or release authority.

Required agent Human Experience Review is separate from these four types. Review the actual view and each accepted promise. Record the reviewer, observation, conclusion, limit, and next useful action. Reuse suitable browser and baseline evidence. No owner response is required.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: the live widget must preserve the accepted W23 report presentation`

## Stage 1 - Presentation parity

### Tasks

- [x] t1: Render the accepted report structure from the shared model.
- [x] t2: Preserve light, dark, responsive, and print variables and spacing.
- [x] t3: Add live, refresh, changed, and action feedback states without hiding content.

t3's scoped footer finding is resolved by the owner's approved placement/words and final actual-source proof below. No other task was reopened.

### Acceptance criteria

- A33: Attention remains before Next and Work/Data remain under Backlog.
- A34: Status colors, phase tracks, rules, spacing, typography, and wave details preserve the accepted meaning.
- A35: Wide, narrow, light, dark, and print views remain readable and ordered.
- A36: Missing bridge support leaves readable report content and a clear limit.

### Dependencies

- Closed P1-P4 source contracts and resource registration.
- Verified retained P3 HTML/report/live-payload baseline.

## Stage 2 - Local controls and accessibility

### Tasks

- [x] t4: Implement search, clear, filters, sort, disclosure, theme, print, Data, and download as local actions.
- [x] t5: Preserve lazy Data formatting and user-started JSON creation.
- [x] t6: Add keyboard, focus, reduced-motion, and safe-text tests.

### Acceptance criteria

- A37: Display-only actions make no MCP tool call and send no agent message.
- A38: Data formatting and download work only after the user starts them.
- A39: Every control has an accessible name, keyboard operation, and visible focus.
- A40: Automated checks and required agent Human Experience Review find no material presentation or control regression. Optional Guided Progress Review is advisory and does not gate completion.

### Dependencies

- Stage 1 shared-model presentation and safe feedback states.
- P1 identity and data boundaries; P6 action execution remains later work.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | Five upstream Skill guides now state local widget behavior and its P6/host/installed limits. Installed copies and the accepted static template are unchanged. |
| History coverage | `create` | The user authorized closeout on 2026-10-06. One [phase history](../../../.make-docs/archive/history/2026-10-06-w25-r0-p5-live-widget-and-local-interaction.md) records this closeout. No prior P5 history existed. |
| PRD reconciliation | `link-only` | Current PRD 51 already owns presentation, local controls, consent, and source/host limits. No product rule changed. |
| Testing and evidence coverage | `update-existing` | The common decisions and central report retain 405 unique cases across finite runs, required agent review, scoped owner approval, findings, and limits. No code or browser rerun is needed for closeout. |
| Installed and system-resource coverage | `none` | P5 changes shipped source only. No installation or system contract change is authorized or needed for this source closeout. |

## Current Implementation State

- P5 is closed on 2026-10-06 within the source and finite browser scope. t1-t6 and A33-A40 have evidence. The owner approved the footer placement and exact five labels. The actual-source remedy and 73-record changed refresh pass. See [resolved finding](evidence.md#p5-owner-status-ui-finding--2026-10-06).
- Current proof covers 405 unique selected cases across finite runs: revised widget48, affected304, and defaults53. The final48 and overlapping159 pass; unaffected earlier cases are reused. Required agent review is complete within the recorded limits.
- The owner's earlier “Clear; no change” covered only the choose-wave/details path. It did not accept the notice's UI, content, or placement. No new general owner response gate is created.
- The user authorized closeout and a local commit on 2026-10-06. These records belong to the P5 phase closeout commit. The tested pre-commit checkpoint remains based on `19c19f42`, with final resource hash `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a`. Root owns staging the reviewed file set and committing it.
- P6 and P7 remain pending. P6 needs its own implementation authority. Installation, Store write, host change, branch change, push, publication, and release remain outside this closeout.

## Owner Status UI Finding — 2026-10-06

The owner said “Overall I think it passes.” The rest of the report looks fine to the owner. At the initial review, the multiple statuses above the masthead were unaccepted. Their UI, content, and placement had not been reviewed with the owner. This opened a material finding in t3 and the A40 whole-surface claim.

The owner's next direction was: “Status message should be in the footer. Remove the ‘Open the project’ link from the footer and show a permanent ‘Status: <status>’.” The owner then answered “Yes, approved” to the preview placement and exact five labels on 2026-10-06. Remove notices above the live masthead. Replace only the live footer's `Open the project` link with permanent plain `Status: <status>`. Use `Ready`, `Checking source facts`, `Needs review`, `Last reviewed report — source unavailable`, and `Last reviewed report — update failed`. Preserve the static report footer and the masthead link.

The approved [footer preview](http://127.0.0.1:52444/?state=current) used the retained 2026-10-04 report with 73 records and simulated statuses. It was not a fresh 2026-10-06 review. Scoped light/dark/narrow and paired-view checks passed. This preview approval establishes placement and words, not actual-source completion.

The approved source remedy passes. Final [browser review](evidence/p5/footer-browser-review.md) confirms the footer, report boundary, rare states, local controls, size, and valid 73-record changed result. The browser crypto adapter's 32-hash limit was repaired under unchanged schema/hash rules. Final source hash is `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a`. t3 and A40 are resolved within this proof. The existing technical proof and unrelated work remain valid. The user's separate 2026-10-06 closeout instruction now closes P5. This creates no general owner response gate.

One changed-tab inspection log remains unattributed. It has no source URL or stack. Canonical widget and parent code contain no MutationObserver, and no material visible/control fault accompanied it. Fresh normal-tab logs are empty before and after normal use. This is a recorded limit, not a speculative source defect. Production-host and installed proof remain later work.
