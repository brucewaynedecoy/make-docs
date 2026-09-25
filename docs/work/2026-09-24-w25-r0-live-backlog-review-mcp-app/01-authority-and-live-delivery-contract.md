---
title: "Phase 1: Authority and Live Delivery Contract"
kind: "work"
status: "draft"
coordinate: "W25 R0 P1"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 1: Authority and Live Delivery Contract

## Purpose

Settle the product contract before implementation changes the Skill, report model, or MCP surface.

## Overview

P1 defines the default live route, explicit static route, chat fallback, model identity, refresh state, exact record actions, and natural limit explanations.

## Human Experience Outcome

- Impact and promise: Direct. A person gets one clear default and keeps control over file creation and agent actions.
- Intended outcome: The live view opens when supported. Static output and separate tasks happen only after an explicit request.
- Surface: Skill result, fallback response, report actions, and generated files.
- Evidence: Automated contract fixtures, Guided Progress Review, and Human Experience Review.
- Executor: Contract and Skill agents after separate phase authority.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Delivery, consent, identity, action, and failure contracts need exact fixtures. |
| Performance Testing | `not-needed-now` | P1 defines behavior and does not run the live path. |
| Guided Progress Review | Required | The owner must review the consent and fallback language. |
| Unassisted Goal Testing | `not-needed-now` | P1 does not claim independent discoverability. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: not applicable.
- Evidence handoff: future central evidence report.
- Gate effect: A1-A8 block later phases.

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

## Stage 1 - Delivery and consent

### Tasks

- [ ] t1: Define `live`, `static`, and `chat-fallback` delivery results and capability selection.
- [ ] t2: Require an explicit user request before static file generation.
- [ ] t3: Define natural explanations for unsupported UI, transport, Store, and host-task states.

### Acceptance criteria

- A1: A compatible host selects live by default through capability detection.
- A2: Static output is created only after an explicit request and never as a live-open side effect.
- A3: A missing live capability still produces a complete concise chat review and offers the static option.
- A4: The Skill never silently produces both delivery modes.

## Stage 2 - Identity and actions

### Tasks

- [ ] t4: Define model, snapshot, session, project, and record identities.
- [ ] t5: Define fixed UI action identifiers and allowed message fields.
- [ ] t6: Define the boundary between source facts, cache fragments, agent judgment, and local UI state.

### Acceptance criteria

- A5: Every wave action resolves to one exact included record and one current snapshot identity.
- A6: Stale, missing, or ambiguous references fail safely and explain the next action.
- A7: Project-authored text cannot become an action identifier or agent instruction.
- A8: Contract and Human Experience review approve the consent, failure, and control language.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | Backlog Review Skill references own the delivery guidance. |
| History coverage | `create-on-closeout` | P1 is a material contract gate. |
| PRD reconciliation | `update-existing` | PRD 51 owns the requirements. |
