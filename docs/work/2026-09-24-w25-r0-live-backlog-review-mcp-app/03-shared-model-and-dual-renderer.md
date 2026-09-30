---
title: "Phase 3: Shared Model and Dual Renderer"
kind: "work"
status: "completed"
coordinate: "W25 R0 P3"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 3: Shared Model and Dual Renderer

## Purpose

Build one validated model for live, static, chat, and data views.

## Overview

P3 prevents the MCP App from becoming a second report product. It keeps the accepted static report and adds a live payload over the same meaning.

The user authorized P3 implementation on 2026-09-30. The tested source checkpoint uses branch `w25-r0-p1-live-delivery-contract`, based on `0c112e57`. The user then authorized P3 closeout and a local commit on that date. P3 is closed for shared source integration. These records belong to the P3 phase closeout commit. It keeps `BacklogReportV1` unchanged and uses the separate P1 `BacklogLiveEnvelopeV1`. It adds shared model boundaries, static rendering, live payload construction, and parity evidence. It does not connect a production live widget or prove broader host support.

## Human Experience Outcome

- Impact and promise: Direct. A user sees the same project state in each delivery mode.
- Intended outcome: Choosing live or static changes the container, not the meaning.
- Surface: Shared report model, static report, concise chat orientation, full live payload, and Data view.
- Implementation work: Preserve the strict V1 report, wrap it with the separate P1 live envelope, reuse one normalized model, and test the static and live payload boundaries.
- Evidence: Model validation, golden parity fixtures, static visual review, and required agent Human Experience Review. Guided owner feedback is advisory.
- Executor: Model and renderer agents under the user's P3 authority; coordinator for independent static visual review.
- Deferral: None.

[PRD 51](../../prd/51-backlog-review-and-reporting.md) owns report meaning. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) owns the required agent review.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Unchanged V1 compatibility, rendering, live payloads, and meaning parity need exact tests. |
| Performance Testing | `not-needed-now` | P7 owns live payload characterization. |
| Guided Progress Review | Advisory | Offer one short review after real static output exists. No owner response is required for completion. |
| Unassisted Goal Testing | `not-needed-now` | The phase makes no independent-use claim. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: one focused shared-model and parity pass, the smallest affected regression set, and one independent static visual review. Rerun only affected checks after a failure or material edit.
- Evidence handoff: add actual P3 findings to the existing [central evidence report](evidence.md). Reuse valid P1 and P2 results.
- Gate effect: A17-A24 block P5.

Automated Implementation Testing informs the P3 correctness and compatibility claim. It is needed now because the shared boundaries must preserve report meaning and static behavior. Product maturity is source integration before production live delivery. Scope is unchanged V1 validation, the P1 envelope, concise and full payload shapes, static output, safe data, and golden parity. The model and renderer agents run the checks. Gate effect is `blocking-claim-only`. The effort budget is one changed-behavior suite, the nearest shared boundary, and the smallest affected regression set. Stop when these pass and independent static review finds no material gap. Retain exact commands, results, tested source, observations, and limits in the existing evidence report. A failed check or material boundary change triggers an affected rerun. Expand only after a failure signal, shared change, explicit support claim, or accepted risk. Do not rerun unchanged broad suites for reassurance.

Performance Testing is `not-needed-now`. It informs no P3 speed decision because this phase does not connect the production live path. Product maturity is shared source integration. Scope is no performance run; executor is none. Gate effect is `not-applicable`. Effort budget is zero runs. Stop after recording this boundary. Retain this decision and the valid earlier evidence limits. Recheck only if current authority adds a speed claim or the built result exposes a material performance question. P7 owns live payload characterization. No profile or deferred obligation is created here.

Guided Progress Review is advisory. It informs whether the report words and controls make the current result clear. It is useful after a real static output exists. Product maturity is a shared model with accepted static presentation and an unwired live payload. Scope is one small static-report goal through the existing public output path. The optional owner is the executor. Gate effect is `advisory`. Effort budget is one short review with one to five steps. Stop after the offer and any supplied feedback; a decline or no response does not block P3. Retain the goal, path, actual feedback if supplied, and any resulting change in the existing evidence report. A material wording or control change can trigger another optional review. Do not ask the owner to repeat automated parity assertions or certify completeness.

Unassisted Goal Testing is `not-needed-now`. It informs no current independent-use decision because P3 makes no discoverability or independent-use claim. Product maturity is source integration. Scope is no unassisted run; executor is none. Gate effect is `not-applicable`. Effort budget is zero runs. Stop after recording this boundary. Retain the reason and reuse valid accepted-layout and contract evidence. Recheck only if a material current human question needs an unassisted attempt or explicit authority requires one. No scenario or deferred obligation is created.

Human Experience Review remains required agent work, separate from the four testing types. The agents inspect the built static result, shared model, parity findings, consent boundaries, and visible limits. They record each promise's evidence, observation, conclusion, reviewer, limit, and next action. P3 has no owner-response gate. A real production live view remains later work.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: live and static delivery must not fork report meaning`

## Stage 1 - Shared model

### Tasks

- [x] t1: Keep `BacklogReportV1` unchanged and use the separate P1 `BacklogLiveEnvelopeV1` around the validated report.
- [x] t2: Add bounded session and action data without mixing local UI state into authority.
- [x] t3: Define concise model-visible and full client payload shapes.

### Acceptance criteria

- A17: One schema validates the model used by live, static, chat, and Data views.
- A18: Facts, inference, recommendation, cache data, and local UI state remain distinct.
- A19: A breaking model change requires a version, migration, and compatibility fixture.
- A20: Full client data is not treated as secret because client-only metadata is not secure storage.

## Stage 2 - Renderer parity

### Tasks

- [x] t4: Refactor the accepted static renderer behind the shared model boundary.
- [x] t5: Add the live payload builder.
- [x] t6: Add golden meaning-parity fixtures and visual review inputs.

### Acceptance criteria

- A21: Both renderers preserve titles, tallies, Attention, Next, statuses, reasons, phase tracks, details, and limits.
- A22: Static output remains one safe offline file with lazy Data and user-started download.
- A23: Live rendering writes no static report file.
- A24: Required agent Human Experience Review finds no material meaning or static-layout regression in the built result. Guided owner review remains advisory.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | The Skill and report reference own the shared model and route. |
| History coverage | `create` | One phase history records the tested source and supported review checkpoint. |
| PRD reconciliation | `link-only` | P1 owns the PRD change. |

## Current Implementation State

- P3 is closed for shared source integration. Tasks t1-t6 and A17-A24 pass within the recorded review limits. The user authorized closeout and a local commit on 2026-09-30.
- The [central report](evidence.md#p3-tested-state) records the final 147 affected tests, 53 default checks, type check, built-output comparison, and required agent review. It retains P1 and P2 evidence.
- The local-file browser limit prevents a fresh browser or screenshot claim. Final CSS is byte-identical to the accepted baseline. Markup and full report meaning remain equal within the recorded comparison.
- The user prefers computer use or the built-in browser for future local-file reviews. This preference changes no past evidence or current review gate.
- Optional owner feedback was “Clear; no change” on the earlier sample. It remains advisory and does not certify the final exact bytes.
- The [P3 history](../../../.make-docs/archive/history/2026-09-30-w25-r0-p3-shared-model-and-dual-renderer.md) records this checkpoint.
- Production live tools, widget interaction, refresh, and broader host support remain planned work. P3 creates no static file during live payload construction.
- Earlier P3 implementation authority did not include staging or commit. The new closeout authority includes staging the reviewed P3 file set and creating a local commit. Branch changes, installation, push, publication, release, and later-phase implementation remain outside that authority.
