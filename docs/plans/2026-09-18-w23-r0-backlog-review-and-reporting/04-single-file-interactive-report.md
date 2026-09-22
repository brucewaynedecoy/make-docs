---
title: "W23 R0 P4 Single-File Interactive Report"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P4"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W23 R0 P4 Single-File Interactive Report

## Purpose

Build the optional Skill-owned HTML report without adding a visualization dependency or changing the report meaning.

## Outcome

The Skill can save one offline HTML file at a user-selected path. The report supports quick orientation, filtering, search, wave detail, source navigation, print, keyboard use, and responsive layouts.

## Scope

- Create the reusable HTML template inside `packages/skills/backlog-review/`.
- Render the same report model used by chat.
- Embed CSS, JavaScript, icons, and safely encoded data.
- Make no network request and load no remote asset.
- Include every discovered live and archived record in the interactive wave list.
- Provide `In Scope`, the six fixed status filters, `Archived`, and `All` in that order. Default to `In Scope` and keep `All` present at the end.
- Use archive scope for `Archived`, non-archived `history` for `History`, and `waveStatus` for exact status filters. Use `statusReason` as the visible badge text.
- Add created-date, wave-coordinate, and last-updated sorting with ascending and descending directions. Default to last updated, newest first. Break equal primary values by wave coordinate, then record path, in ascending order.
- Make the collapsed summary a pointer disclosure surface while preserving the wave-name source link. Keep expanded detail outside that surface. Make the summary surface keyboard-operable with an accessible open or closed state.
- Show the four fixed portfolio tallies above the report. Calculate them from the full record set, not the detailed-wave subset.
- Preserve fact, inference, and recommendation labels.
- Add keyboard, focus, reduced-motion, contrast, responsive, print, and content-injection checks.
- Keep Sites use possible only when a user explicitly requests a separate site.

## Visual Direction

Use a calm operations-ledger design. Make the phase track the memorable element. Use strong alignment, a small cool palette, restrained borders, and no decorative card grid. Put the attention queue beside the wave ledger on wide screens and stack it above the ledger on narrow screens.

Use yellow for `attention`, blue for `current`, red for `conflict`, purple for `deferred`, green for `complete`, and light grey for `history`. Apply the same color identity to wave badges and the matching filter hover, focus, and selected states. Keep unselected filters neutral. Use the filter group instead of a separate wave status legend.

## Verification

- Desktop and mobile screenshots show no clipped or hidden critical information.
- Every control works by keyboard and has visible focus.
- Every exact status filter matches only its non-archived `waveStatus`. The aggregate scope filters, search, and sorting preserve stable membership and order.
- Filter availability is based on the full report, not the current search result.
- The four tally labels remain fixed and their values satisfy the report-model sum invariant.
- Reduced motion removes nonessential transitions.
- A denied network still leaves the complete report usable.
- Malicious project text renders as text and cannot execute.
- Chat and HTML preserve the same status, conflict, and recommendation meanings.
