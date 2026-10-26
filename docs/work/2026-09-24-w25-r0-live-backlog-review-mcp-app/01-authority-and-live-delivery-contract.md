---
title: "Phase 1: Authority and Live Delivery Contract"
kind: "work"
status: "completed"
coordinate: "W25 R0 P1"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 1: Authority and Live Delivery Contract

## Purpose

Define the product contract before later phases connect the live Skill, report model, or MCP surface.

## Overview

P1 defines the default live route, explicit static route, chat fallback, model identity, refresh state, exact record actions, and natural limit explanations.

The user authorized P1 implementation on 2026-09-30. The user then authorized P1 closeout and a local commit on that date. Work uses branch `w25-r0-p1-live-delivery-contract`. Pure definitions and source guidance are the P1 result. Host proof, report delivery, live tools, and widget integration remain outside this phase.

## Human Experience Outcome

- Impact and promise: Direct. A person gets one clear default and keeps control over file creation and agent actions.
- Intended outcome: The contract selects live when supported. Static output and separate tasks require explicit requests. A route result does not prove a live display.
- Surface: Contract definitions and source Skill guidance. Later phases connect the runtime surfaces.
- Implementation work: Strict pure schemas and helpers, exact message rules, and plain consent and fallback examples.
- Evidence: Automated contract fixtures and required agent Human Experience Review. Guided owner review is advisory.
- Executor: Contract and source-guide agents under the user's P1 authority.
- Deferral: None.

[PRD 51](../../prd/51-backlog-review-and-reporting.md) owns these outcomes. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) owns the review standard.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Delivery, consent, identity, action, and failure contracts need exact fixtures. |
| Performance Testing | `not-needed-now` | P1 defines behavior and does not run the live path. |
| Guided Progress Review | Advisory | Prepare a short optional review of the consent and fallback examples. Owner feedback or a declined review can be recorded. No response is required. |
| Unassisted Goal Testing | `not-needed-now` | P1 does not claim independent discoverability. |

- Base action: `update-existing` for source guidance and PRD 51; `create` for pure contract definitions and focused fixtures.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: not applicable.
- Evidence handoff: [P1 evidence](evidence.md#p1-acceptance-cases) and [agent Human Experience Review](evidence.md#p1-agent-human-experience-review).
- Gate effect: A1-A8 block later phases.

Automated Implementation Testing can block the P1 correctness claim. Its scope is delivery, identity, action, refresh, and V1 compatibility. Run the new contract suite, then the existing backlog contract, Skill, and cache suites. Stop when these pass. Rerun only affected checks after a material change or failure. Retain the command results in the central evidence report.

Guided Progress Review has no blocking effect. The small goal is to understand consent and fallback before a live app exists. Read the delivery and limit examples in the source review method. Notice that missing live support creates no file and starts no task. Optional feedback can identify unclear words. No cleanup is needed. P1 has no independent-use or performance claim, so those testing types remain `not-needed-now`.

Human Experience Review is required agent work. It is not a fifth testing type. Record each promise's observation, conclusion, evidence limit, and next useful action. PRD 50 keeps owner review advisory. There is no explicit human acceptance gate for P1.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 38](../../prd/38-global-store-and-project-state.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: W25 design requires a live default and an explicit static route`
- [D-044](../../prd/03-open-questions-and-risk-register.md#d-044-local-history-router-gives-retired-paths): The local nested history router names retired paths. Use the current history contract. Repair remains separate from P1.

## Stage 1 - Delivery and consent

### Tasks

- [x] t1: Define `live`, `static`, and `chat-fallback` delivery results and capability selection.
- [x] t2: Require an explicit user request before static file generation.
- [x] t3: Define natural explanations for unsupported UI, transport, Store, and host-task states.

### Acceptance criteria

- A1: A compatible host selects live by default through capability detection.
- A2: Static output is created only after an explicit request and never as a live-open side effect.
- A3: A missing live capability still produces a complete concise chat review and offers the static option.
- A4: The Skill never silently produces both delivery modes.

## Stage 2 - Identity and actions

### Tasks

- [x] t4: Define model, snapshot, session, project, and record identities.
- [x] t5: Define fixed UI action identifiers and allowed message fields.
- [x] t6: Define the boundary between source facts, cache fragments, agent judgment, and local UI state.

### Acceptance criteria

- A5: Every wave action resolves to one exact included record and one current snapshot identity.
- A6: Stale, missing, or ambiguous references fail safely and explain the next action.
- A7: Project-authored text cannot become an action identifier or agent instruction.
- A8: Contract checks and required agent Human Experience Review support the consent, failure, and control language. Owner feedback is advisory.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | Backlog Review Skill references own the delivery guidance. |
| History coverage | `create` | The P1 history record retains the tested contract result. |
| PRD reconciliation | `update-existing` | PRD 51 owns the requirements. |

## Contract Result

- Delivery: `selectBacklogDelivery` returns exactly one route. Static requires `staticRequested`. Live requires `appResource`, `toolCalls`, and `agentMessages`. `separateTasks` is optional.
- Identity: `createBacklogLiveEnvelope` wraps unchanged `BacklogReportV1` with project, snapshot, model, and session IDs. Generation timestamps do not change snapshot or model identity. Source evidence times remain facts.
- Actions: `resolveBacklogLiveAction` checks fixed actions against the envelope and a current snapshot. It rejects stale IDs and missing, conflicting, or ambiguous record references. Strict schemas accept no instruction field.
- Refresh: `createBacklogRefreshResult` returns `unchanged`, `changed`, or `unavailable`. A changed result carries exact added, changed, and removed paths. It retains the old model with `needs-review` state. Source failure retains it as `last-known`.
- Boundaries: Pure helpers read no files, call no tools, and use no Store operation. Cache identity and writes remain unchanged. Installed Skill copies and project setup remain outside P1.

## Closeout Notes

- Phase status: Closed for source contracts under the user's 2026-09-30 closeout authority. All six tasks and A1-A8 have evidence in the [central report](evidence.md#p1-acceptance-cases).
- Commit authority: The user authorized staging the reviewed P1 file set and creating a local commit. Push, installation, publication, and release remain outside that authority. The test record retains the pre-commit checkpoint based on `0ed2501d`.
- Automated checks: 41 new tests and 76 existing tests pass. Type checks and all 53 repository default checks pass. The [check record](evidence.md#p1-checks) names the tested source and limits.
- Human Experience Review: Required agent review is complete for the P1 wording. Its [per-promise record](evidence.md#p1-agent-human-experience-review) gives observations, conclusions, limits, and next actions.
- Guided owner review: Advisory, `feedback-recorded`. The owner said “Clear; no change” for chat fallback, direct static requests, and unsupported task-host wording. The [review record](evidence.md#p1-optional-experience-handoff) limits this evidence to those words. No live host or UI proof is inferred. No human acceptance gate exists.
- Performance Testing and Unassisted Goal Testing: `not-needed-now`. P1 makes no live speed or independent-use claim.
- History: [P1 contract closeout](../../../.make-docs/archive/history/2026-09-30-w25-r0-p1-live-delivery-contract.md).
- Scope limit: No live app, transport, installed Skill parity, task creation, or later-phase implementation is proved. P2 needs separate authority.
- Follow-up: D-044 keeps the local history-router mismatch visible. Its separate repair does not block this contract result.
