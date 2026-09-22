---
title: "Phase 6: Report Item Traceability and Navigation"
kind: "work"
status: "completed"
coordinate: "W23 R0 P6"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 6: Report Item Traceability and Navigation

## Purpose

Make every recommended Next action and wave-specific Attention finding visibly and interactively traceable to its exact wave.

## Overview

This phase closes a gap found in owner review of the 70-record report. The model already gives every Next item a `recordPath`, but the presentation can hide that relationship. P6 adds exact cross-record validation, visible coordinate labels, consistent backlog-wide labels, click-to-filter navigation, and a conditional search-clear control.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. A person can see which wave a Next or Attention item affects and can reach that wave without guessing.
- Intended human outcome: A maintainer understands what each action applies to, can focus the Backlog with one action, and can undo the search with one clear control.
- Human-facing surface or indirect effect: Chat Next and Attention sections, HTML Next and Attention lists, Backlog filter and search state, and the search-clear button.
- Implementation work: Cross-record report validation, Skill guidance, chat parity, HTML navigation, accessible controls, fixtures, and review.
- Evidence source or testing type selected under current authority: Automated contract and renderer checks, Guided Progress Review, browser interaction checks, and Human Experience Review.
- Executor: Contract, Skill, report, and validation agents within the accepted phase scope after separate implementation authority.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md), the [P6 plan](../../plans/2026-09-18-w23-r0-backlog-review-and-reporting/06-report-item-traceability-and-navigation.md), and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Contract, exact-reference, chat, HTML state, keyboard, clear-control, print, and safe-content checks. |
| Performance Testing | `not-needed-now` | The change adds bounded local interactions and no accepted latency, throughput, or resource target. |
| Guided Progress Review | Required | The owner identified the gap in a real report and can review the corrected presentation before P7. |
| Unassisted Goal Testing | `not-needed-now` | The current question is a focused maintainer interaction, not an independent discoverability claim. |

- Base maintenance action: `create`
- Performance applicability: `not-needed-now`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: central [evidence report](evidence.md) after evidence exists
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: owner review found a Next item whose affected wave was not visible`

## Stage 1 - Contract and twin guidance

### Tasks

- [x] t1: Add exact report-record cross-reference validation for every Next item and every non-null Attention item.
- [x] t2: Preserve `recordPath` as the reference identity and derive the visible sourced coordinate from the matched report record.
- [x] t3: Update deterministic contract checks and the agentic Skill twin together. Require null Attention paths to mean backlog-wide findings.
- [x] t4: Update chat guidance and fixtures so Next and wave-specific Attention items show the coordinate, while null Attention items use `Backlog finding`.

### Acceptance criteria

- A45: Every Next item has one `recordPath` that resolves to exactly one included report record. Missing or dangling references fail validation.
- A46: Every Attention item either has one exact included `recordPath` or uses null to mean a backlog-wide finding. No other state passes validation.
- A47: Chat and HTML derive visible coordinates from matched report records. They do not depend on agent-written claim text to name the wave.
- A48: Backlog-wide Attention items use the fixed visible label `Backlog finding` and do not claim a wave destination.

### Dependencies

- P1-P5 complete.
- Current PRD 51 and accepted report model reread during preflight.

## Stage 2 - Interactive backlog focus

### Tasks

- [x] t5: Render every wave-specific Next and Attention item as one accessible click or tap target with a visible coordinate.
- [x] t6: On activation, select `All`, activate Backlog Work, set search to the wave coordinate, refresh results, and bring the filtered result into view when needed.
- [x] t7: Add the conditional icon-only `Clear search` control. Preserve the active filter when it clears search.
- [x] t8: Preserve independent wave source links, row disclosure, Data state, print reading order, reduced motion, and inert project text.

### Acceptance criteria

- A49: Activating a wave-specific Next or Attention item selects `All`, activates Work, places the exact coordinate in search, and displays the matching wave result.
- A50: The search-clear control is absent when search is empty, visible when search has a value, keyboard accessible, named `Clear search`, and preserves the selected filter when used.
- A51: Backlog-wide findings remain non-interactive. Wave source links and wave disclosure keep their existing independent behavior.

### Dependencies

- A45-A48 complete.

## Stage 3 - Validation and review

### Tasks

- [x] t9: Run focused and full automated checks for model validation, twin parity, chat meaning, HTML interaction state, safe content, print, and package declarations.
- [x] t10: Render the retained 70-record report model and review the corrected W19 R6 recommendation on desktop and a narrow screen.
- [x] t11: Run keyboard, visible-focus, reduced-motion, and search-clear checks. Complete Guided Progress Review and Human Experience Review.
- [x] t12: Move Attention before Next and replace section-specific spacing with an order-independent second-visible-section rule.

### Acceptance criteria

- A52: Automated and human-centered evidence supports the visible traceability and navigation promises without changing report facts, statuses, cache behavior, or print content. HTML and print place Attention before Next, while wide, narrow, and single-section states preserve the approved spacing between major sections.

### Dependencies

- A49-A51 complete.

### Closeout Notes

- Four testing decisions: Automated required; Performance not-needed-now; Guided required; Unassisted not-needed-now.
- Performance evidence: none.
- Human Experience Review: Required for visible mapping, action feedback, reversibility, and keyboard use.
- Owner review found that the first P6 draft gave Next and Attention items different text hierarchies. The corrected renderer uses the same marker, compact scope metadata, and main claim heading structure for both lists. Skill guidance also tells agents not to repeat an item's own wave coordinate only to identify it.
- Owner review then placed Attention before Next. The renderer applies the 42-pixel vertical gap to the second visible section instead of a named section. This preserves the tuned outer spacing and avoids a false top gap when one section is absent.
- Optional experience handoff: Activate one Next item, activate one wave-specific Attention item, clear search, and confirm one `Backlog finding` stays non-interactive.
- Explicit human acceptance gate: none.
- Evidence report: [P6 result in the central report](evidence.md#p6-report-item-traceability-and-navigation).
- History: [P6 closeout record](../../../.make-docs/archive/history/2026-09-22-w23-r0-p6-report-item-traceability-and-navigation.md).
- Phase / capability status: P6 closes only the accepted traceability, navigation, and owner-requested section-order scope. P7 remains the final package parity and acceptance phase.
- Authority status: The owner approved P6 preflight and implementation, reviewed the generated report, requested the final layout corrections, and directed P6 closeout and local commit on 2026-09-22. Tasks t1 through t12 and A45-A52 are complete. P7 remains a separate action.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and system-resource coverage | `update-existing` | The existing backlog-review Skill, report model, review method, HTML guide, examples, renderer, and template own the changed behavior. No new guide is needed. |
| History coverage | `create` | The P6 closeout is a meaningful phase checkpoint and uses one new session history record. |
| PRD reconciliation | `update-existing` | PRD 51 already owns the capability and now contains the current traceability requirements and requirement history. No new PRD is needed. |
| Automated Implementation Testing | Required and passed | Focused contract and Skill checks, the full CLI suite, default consistency, type checking, package build, and diff checks cover the changed behavior. |
| Performance Testing | `not-needed-now` | P6 adds bounded local controls and has no accepted latency, throughput, or resource target. |
| Guided Progress Review | Required and passed | The owner reviewed the retained report and directed the hierarchy, labeling, order, and spacing corrections before closeout. |
| Unassisted Goal Testing | `not-needed-now` | The work corrects an expert review surface and does not make a current unassisted-discoverability claim. |

No new maintainer or user guide is needed. The Skill references and report template are the existing owning surfaces. No deferred obligation remains. The central evidence report retains the tested revision, browser observations, Human Experience Review, limits, and P7 handoff.
