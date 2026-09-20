---
title: "Phase 4: Single-File Interactive Report"
kind: "work"
status: "draft"
coordinate: "W23 R0 P4"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 4: Single-File Interactive Report

## Purpose

Build the optional self-contained HTML report inside the first-party Skill.

## Overview

This phase turns the shared report model into an offline operations ledger with fast filtering, search, source detail, and responsive access without adding a hosted or third-party visualization dependency.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. The optional HTML report remains concise, traceable, safe, accessible, and usable as one offline file.
- Intended human outcome: A maintainer can scan the portfolio, focus on attention items, expand one wave, and follow its evidence without losing context.
- Human-facing surface or indirect effect: Saved interactive HTML report and print view.
- Implementation work: Template, safe data embedding, controls, responsive layout, accessibility, print, and browser checks.
- Evidence source or testing type selected under current authority: Automated rendering and safety checks, browser automation, Guided Progress Review, and Human Experience Review.
- Executor: Report implementation agent and review agent.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md) and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Render fixtures, safe-content cases, data parity, controls, and package contents. |
| Performance Testing | `not-needed-now` | No accepted report-size or interaction-time target exists. |
| Guided Progress Review | Required | Owner review can change visual hierarchy, density, interactions, and labels. |
| Unassisted Goal Testing | `not-needed-now` | The current work is guided prototype and product review; no independent discoverability gate exists. |

- Base maintenance action: `create`
- Performance applicability: `not-needed-now`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: none`

## Stage 1 - Template and safe export

### Tasks

- [ ] t1: Add the Skill-owned HTML template with inline CSS, JavaScript, icons, and data slot.
- [ ] t2: Implement safe serialization and rendering for all project-derived text and links.
- [ ] t3: Add user-selected output path handling without Store state or hidden saved copies.
- [ ] t4: Include every live and archived record. Add default `In Scope`, the six fixed status filters, `Archived`, trailing `All`, search, three bidirectional sort methods with the accepted coordinate and path tie order, hybrid summary disclosure, source navigation, and print controls. Hide a non-aggregate filter only when the full unfiltered report has no match.
- [ ] t5: Verify that the file makes no network request and loads no remote asset.

### Acceptance criteria

- A26: One saved `.html` file contains the complete report and works with network access denied.
- A27: Project text that contains markup, scripts, quotes, or control characters renders as inert text.
- A28: Every interactive control has an accessible name, keyboard path, visible focus, and accurate state. Status filters expose the same semantic color on hover, focus, and selection. Summary disclosure does not intercept the wave-name source link or expanded detail. The summary surface remains keyboard-operable with an accurate open or closed state.
- A29: Chat and HTML consume the same report model and preserve the same material meanings.

### Dependencies

- P3 shared report model stable.

## Stage 2 - Responsive design and review

### Tasks

- [ ] t6: Implement the operations-ledger layout with the four fixed portfolio tallies, one phase-track visual, a clear attention queue, restrained supporting detail, and fixed wave status colors without a separate wave legend.
- [ ] t7: Add desktop, tablet, mobile, print, high-zoom, and reduced-motion styles.
- [ ] t8: Add browser checks for scope and exact-status filtering, search plus filter behavior, all three sort methods and directions, stable coordinate and path tie order, hidden empty-status buttons, hybrid disclosure, source links, print, and empty or conflict-heavy states.
- [ ] t9: Capture and inspect desktop and mobile screenshots.
- [ ] t10: Run Guided Progress Review with the owner and revise the template without changing the report contract.

### Acceptance criteria

- A30: The wide layout shows the attention queue and wave ledger without obscuring either.
- A31: The narrow layout stacks the same content in a useful reading order with no horizontal page overflow.
- A32: Status, conflict, inference, and recommendation meanings do not depend on color alone. Badge text gives the status reason while its color and exact filter membership come only from `waveStatus`. Tally labels and values preserve their fixed meaning when the detailed list is summarized or filtered.
- A33: Reduced-motion preference removes nonessential transitions and expansion remains understandable.
- A34: Print output retains the current filters, source detail, and readable phase states.
- A35: Desktop and mobile screenshot review finds no clipped critical text, hidden action, or unreadable contrast.
- A36: The owner can request visual changes without requiring a schema or deterministic-operation change unless the meaning itself changes.

### Dependencies

- A26-A29 complete.

### Closeout Notes

- Four testing decisions: Automated required; Performance not-needed-now; Guided required; Unassisted not-needed-now.
- Performance evidence: none.
- Human Experience Review: Record per-promise observations, conclusions, evidence, reviewer, and limits for the rendered report.
- Optional experience handoff: Open the report, filter to Attention, expand one wave, and optionally report what feels unclear.
- Explicit human acceptance gate: none.
- Evidence report: Add after evidence exists.
- Phase / capability status: P4 can close after browser and guided review; installed-package acceptance remains open.
