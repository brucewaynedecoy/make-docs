---
title: "Phase 4: Single-File Interactive Report"
kind: "work"
status: "complete"
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

- [x] t1: Add the Skill-owned HTML template with inline CSS, JavaScript, icons, and data slot.
- [x] t2: Implement safe serialization and rendering for all project-derived text and links.
- [x] t3: Add user-selected output path handling without Store state or hidden saved copies.
- [x] t4: Include every live and archived record. Add default `In Scope`, the six fixed status filters, `Archived`, trailing `All`, search, three bidirectional sort methods with the accepted coordinate and path tie order, hybrid summary disclosure, source navigation, and print controls. Hide a non-aggregate filter only when the full unfiltered report has no match.
- [x] t5: Verify that the file makes no network request and loads no remote asset.

### Acceptance criteria

- A26: One saved `.html` file contains the complete report and works with network access denied.
- A27: Project text that contains markup, scripts, quotes, or control characters renders as inert text.
- A28: Every interactive control has an accessible name, keyboard path, visible focus, and accurate state. Status filters expose the same semantic color on hover, focus, and selection. Summary disclosure does not intercept the wave-name source link or expanded detail. The summary surface remains keyboard-operable with an accurate open or closed state.
- A29: Chat and HTML consume the same report model and preserve the same material meanings. The shared model carries a nullable, source-backed project lead. The renderer does not create or replace that prose.

### Dependencies

- P3 shared report model stable.

## Stage 2 - Responsive design and review

### Tasks

- [x] t6: Implement the operations-ledger layout with the four fixed portfolio tallies, one phase-track visual, a clear attention queue, restrained supporting detail, and fixed wave status colors without a separate wave legend.
- [x] t7: Add desktop, tablet, mobile, print, high-zoom, and reduced-motion styles.
- [x] t8: Add browser checks for scope and exact-status filtering, search plus filter behavior, all three sort methods and directions, stable coordinate and path tie order, hidden empty-status buttons, hybrid disclosure, source links, print, and empty or conflict-heavy states.
- [x] t9: Capture and inspect desktop and mobile screenshots.
- [x] t10: Run Guided Progress Review with the owner and revise the template without changing the report contract.

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

## Stage 3 - Real-report correction

### Tasks

- [x] t11: Derive each wave display name from the sourced coordinate and title. Remove only the standard coordinate prefix and `Work Backlog` or `Work` suffix. Use the work-directory slug only when no supported title exists.
- [x] t12: Restore the fixed three-column expanded detail with concise facts, inference, and recommended action. Keep claim evidence in the embedded report data without printing long evidence-link lists in the panel.
- [x] t13: Restore visible blue, amber, and red attention icons through a deterministic status-to-severity mapping. Remove the obsolete evidence-boundary footer text.
- [x] t14: Run the focused contract and Skill tests. Re-render the same 70-record review data through the corrected template.
- [x] t16: Add deterministic project-lead context collection, the shared nullable lead model, constrained Skill guidance, renderer behavior, and focused regression tests.
- [x] t17: Re-render the real report with a project-level two-to-three-sentence lead and complete owner review of the corrected introduction.
- [x] t18: Move the owner-approved dark-mode palette, strong-rule treatment, and project-link accent from the fixed review report into the shared template. Keep light mode and layout unchanged. Re-render the corrected real report without changing its embedded data.
- [x] t15: Complete owner review of the corrected real-report output.

### Dependencies

- The owner review of the first real 70-record report found the P4 regressions.

## Accepted P5 Performance And Data Decision

State: accepted for W23 R0 and reconciled into current PRD, plan, and work authority. P5 has not started.

- The deterministic 70-record snapshot completed in 1.191 seconds. Its JSON output was 5,777,895 bytes.
- The fixed renderer completed in 0.080 seconds. The reviewed report JSON was 4,503,721 bytes and contained 5,278 report-layer evidence references.
- The observed 13-minute duration is therefore in the agent review and report-model assembly path, not in repository scanning or HTML rendering.
- Accepted decision: always run the fast deterministic snapshot. Add an optional rebuildable per-record review cache in the Global Store. Key each entry by checkout identity, record path, deterministic record digest, snapshot schema version, rule catalog version, and Skill version. Reuse only exact matches. Rebuild portfolio tallies, attention, and order from the current full snapshot.
- Store-free rule: when the Store is unavailable or not configured, perform the full stateless review. Do not block the report.
- Placement rule: do not add a project-local operational cache under `.make-docs/`. Existing Store authority forbids a project-local operational copy.
- Portability and data rule: keep the report as one self-contained HTML file. Do not require a JSON companion file. Add an accessible in-report data view and a user-started JSON download of the same embedded normalized report model.
- Authority: [P5 plan](../../plans/2026-09-18-w23-r0-backlog-review-and-reporting/05-incremental-review-cache-and-data-access.md), [P5 work record](05-incremental-review-cache-and-data-access.md), [PRD 51](../../prd/51-backlog-review-and-reporting.md), and [PRD 38](../../prd/38-global-store-and-project-state.md).

### Closeout Notes

- Four testing decisions: Automated required; Performance not-needed-now; Guided required; Unassisted not-needed-now.
- Performance evidence: none.
- Human Experience Review: Satisfied after the owner reviewed the corrected real report and accepted the final source-backed project lead, wave presentation, attention icons, expanded detail, evidence display, and dark-mode treatment. The owner also removed the status-badge borders as a final small refinement.
- Required experience handoff: Completed through owner review of the corrected real-report output.
- Explicit human acceptance gate: Satisfied by the owner's P4 closeout direction on 2026-09-21.
- Evidence report: [P4 implementation and review evidence](evidence.md#p4-single-file-interactive-report).
- Phase / capability status: P4 is complete. P5 and P6 have not started. P5 still requires separate phase-start authority.
