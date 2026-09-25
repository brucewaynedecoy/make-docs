---
title: "Phase 5: Live Widget and Local Interaction"
kind: "work"
status: "draft"
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

## Human Experience Outcome

- Impact and promise: Direct. The live page stays familiar, readable, responsive, and under user control.
- Intended outcome: A maintainer can inspect the backlog and use all display controls without network or agent work.
- Surface: Full MCP App widget in light, dark, narrow, wide, and print views.
- Evidence: Automated browser checks, Guided Progress Review, and Human Experience Review.
- Executor: Widget and validation agents after separate phase authority.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Rendering, local state, safe content, and accessibility need repeatable checks. |
| Performance Testing | `not-needed-now` | P7 owns live payload and startup characterization. |
| Guided Progress Review | Required | The accepted presentation needs direct owner comparison. |
| Unassisted Goal Testing | `not-needed-now` | The current goal is parity, not independent discovery. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: not applicable.
- Evidence handoff: future central evidence report.
- Gate effect: A33-A40 block P6-P7.

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

- [ ] t1: Render the accepted report structure from the shared model.
- [ ] t2: Preserve light, dark, responsive, and print variables and spacing.
- [ ] t3: Add live, refresh, changed, and action feedback states without hiding content.

### Acceptance criteria

- A33: Attention remains before Next and Work/Data remain under Backlog.
- A34: Status colors, phase tracks, rules, spacing, typography, and wave details preserve the accepted meaning.
- A35: Wide, narrow, light, dark, and print views remain readable and ordered.
- A36: Missing bridge support leaves readable report content and a clear limit.

## Stage 2 - Local controls and accessibility

### Tasks

- [ ] t4: Implement search, clear, filters, sort, disclosure, theme, print, Data, and download as local actions.
- [ ] t5: Preserve lazy Data formatting and user-started JSON creation.
- [ ] t6: Add keyboard, focus, reduced-motion, and safe-text tests.

### Acceptance criteria

- A37: Display-only actions make no MCP tool call and send no agent message.
- A38: Data formatting and download work only after the user starts them.
- A39: Every control has an accessible name, keyboard operation, and visible focus.
- A40: Automated, Guided, and Human Experience review find no material presentation or control regression.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | The Skill and report guide own widget behavior. |
| History coverage | `create-on-closeout` | The live presentation is a material checkpoint. |
| PRD reconciliation | `link-only` | P1 owns product authority. |
