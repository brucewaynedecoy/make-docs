---
title: "Phase 6: Refresh Cache and Agent Actions"
kind: "work"
status: "draft"
coordinate: "W25 R0 P6"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 6: Refresh Cache and Agent Actions

## Purpose

Connect the live view to current facts and controlled active-agent requests.

## Overview

P6 adds unchanged and changed refresh flows, exact cache reuse, best-effort cache refresh after validation, wave review requests, and a separate-task request.

## Human Experience Outcome

- Impact and promise: Direct. A person can refresh, understand what changed, and request focused help without guessing what the action will do.
- Intended outcome: Refresh is honest and recoverable. Agent actions name the wave and wait for confirmed host results.
- Surface: Refresh control, changed-record state, wave actions, active conversation, and cache-limit messages.
- Evidence: Automated Store and message tests, Guided Progress Review, and Human Experience Review.
- Executor: Refresh, Skill, widget, and validation agents after separate phase authority.
- Deferral: Durable task activity is outside W25.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Refresh, cache, message, and task-request states need exact fixtures. |
| Performance Testing | `not-needed-now` | P7 owns the complete refresh characterization. |
| Guided Progress Review | Required | The owner must inspect changed-state and task-request feedback. |
| Unassisted Goal Testing | `not-needed-now` | The actions are guided maintainer controls. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: not applicable.
- Evidence handoff: future central evidence report.
- Gate effect: A41-A50 block P7.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 38](../../prd/38-global-store-and-project-state.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)

## Source Obligations, Scenarios, And Findings

- `O: future durable task activity needs separate authority`
- `NUAT: not-needed-now`
- `Finding: the widget must ask the active agent rather than create a task directly`

## Stage 1 - Refresh and cache

### Tasks

- [ ] t1: Connect refresh to `backlog.review.refresh` through `tools/call`.
- [ ] t2: Handle unchanged, changed, Store-limited, and failed-write results.
- [ ] t3: Reuse `work.backlog-cache.write` only after the rebuilt model validates.

### Acceptance criteria

- A41: Refresh always starts with a current deterministic snapshot.
- A42: An unchanged snapshot keeps the current model and does not request agent review.
- A43: A changed snapshot reports exact changed records and invalidates only nonmatching cache identities.
- A44: Store absence, denial, unsafe state, or outage completes a full stateless review.
- A45: Cache write is best-effort after validation and cannot invalidate the current report.

## Stage 2 - Agent and task requests

### Tasks

- [ ] t4: Add controlled wave review and refresh-review messages.
- [ ] t5: Add the explicit `Start a new Codex task` request to the active agent.
- [ ] t6: Refresh the live view only after the active agent validates the new model.

### Acceptance criteria

- A46: Messages use fixed action identifiers, project identity, record path, coordinate, and snapshot identity.
- A47: Project-authored text cannot become prompt instructions.
- A48: The widget does not create a task or claim that one started.
- A49: The active agent validates current state and host support before task creation, then reports the real result.
- A50: Guided and Human Experience review accept refresh, failure, review-request, and task-request feedback.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | The Skill needs exact refresh and active-agent instructions. |
| History coverage | `create-on-closeout` | The agent-action boundary is a material checkpoint. |
| PRD reconciliation | `link-only` | P1 owns W25 PRD authority. |
