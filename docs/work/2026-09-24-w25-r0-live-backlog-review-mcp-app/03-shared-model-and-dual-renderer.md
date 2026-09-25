---
title: "Phase 3: Shared Model and Dual Renderer"
kind: "work"
status: "draft"
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

## Human Experience Outcome

- Impact and promise: Direct. A user sees the same project state in each delivery mode.
- Intended outcome: Choosing live or static changes the container, not the meaning.
- Surface: Live view, static report, chat orientation, and Data view.
- Evidence: Model validation, golden parity fixtures, Guided Progress Review, and Human Experience Review.
- Executor: Model and renderer agents after separate phase authority.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Schema, migration, render, and parity need exact tests. |
| Performance Testing | `not-needed-now` | P7 owns live payload characterization. |
| Guided Progress Review | Required | The owner must compare live and static presentation. |
| Unassisted Goal Testing | `not-needed-now` | The phase makes no independent-use claim. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: not applicable.
- Evidence handoff: future central evidence report.
- Gate effect: A17-A24 block P5.

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

- [ ] t1: Extend V1 additively or document and test a required V2 migration.
- [ ] t2: Add bounded session and action data without mixing local UI state into authority.
- [ ] t3: Define concise model-visible and full client payload shapes.

### Acceptance criteria

- A17: One schema validates the model used by live, static, chat, and Data views.
- A18: Facts, inference, recommendation, cache data, and local UI state remain distinct.
- A19: A breaking model change requires a version, migration, and compatibility fixture.
- A20: Full client data is not treated as secret because client-only metadata is not secure storage.

## Stage 2 - Renderer parity

### Tasks

- [ ] t4: Refactor the accepted static renderer behind the shared model boundary.
- [ ] t5: Add the live payload builder.
- [ ] t6: Add golden meaning-parity fixtures and visual review inputs.

### Acceptance criteria

- A21: Both renderers preserve titles, tallies, Attention, Next, statuses, reasons, phase tracks, details, and limits.
- A22: Static output remains one safe offline file with lazy Data and user-started download.
- A23: Live rendering writes no static report file.
- A24: Guided and Human Experience review find no material meaning or layout regression.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | The Skill and report reference own the shared model and route. |
| History coverage | `create-on-closeout` | Model parity is a material checkpoint. |
| PRD reconciliation | `link-only` | P1 owns the PRD change. |
