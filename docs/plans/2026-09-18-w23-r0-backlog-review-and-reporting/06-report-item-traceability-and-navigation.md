---
title: "W23 R0 P6 Report Item Traceability and Navigation"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P6"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W23 R0 P6 Report Item Traceability and Navigation

## Purpose

Make every Next item and every wave-specific Attention item visibly traceable to one included wave. Let a person use those items to focus the Backlog without manually finding or entering the wave coordinate.

## Outcome

The shared report model rejects missing or dangling wave references. Chat and HTML show the affected wave coordinate outside agent-written claim text. Backlog-wide Attention items use the fixed label `Backlog finding`. In HTML, a wave-specific Next or Attention item selects `All`, places the wave coordinate in search, activates the Work view, and shows the matching wave. Search has an accessible clear button that appears only while search text is present.

## Scope

- Keep every Next item wave-specific. Its `recordPath` must resolve to exactly one included report record.
- Let an Attention item be wave-specific or backlog-specific. A non-null `recordPath` must resolve to exactly one included report record. A null `recordPath` means `Backlog finding`.
- Derive the visible coordinate from the matched report record. Do not require the agent to repeat the coordinate inside claim prose.
- Reject dangling Next and Attention references before chat or HTML rendering.
- Use the same traceability rule in deterministic validation and agentic Skill guidance.
- Show wave-specific Next and Attention items as accessible buttons or equivalent controls without turning backlog-wide findings into false wave links.
- On activation, select `All`, place the coordinate in search, activate Backlog Work, refresh the results, and bring the filtered result into view on narrow layouts.
- Add an icon-only search-clear button with an accessible name. Show it only when the search field has a value. Clearing search preserves the selected filter and returns to the normal result set.
- Preserve the independent wave-name source link, wave disclosure behavior, Data view, print layout, offline boundary, and safe text handling.
- Replace the old `Portfolio finding` presentation with `Backlog finding` in chat, HTML, fixtures, and guidance.
- Place Attention before Next in HTML and print. Apply the tuned gap to the second visible section instead of either named section, so hiding one section does not add an empty top gap.

## Design And Accessibility Rules

- The coordinate is structural information. Render it as a stable visible label, not as optional agent prose.
- Use one large click or tap target for each wave-specific list item. Keep its text legible in print even when interactive styling is removed.
- Keep a visible focus state. Give each control an accessible name that includes the destination coordinate.
- Do not nest the control inside another interactive element.
- A backlog-wide Attention item remains non-interactive unless a later feature gives it a real destination.
- The search-clear control uses a familiar close icon, a minimum useful pointer target, and the label `Clear search`.
- Respect reduced-motion preferences when the page moves to the filtered Backlog result.

## Validation

- Schema and renderer checks reject a Next item with no exact included record.
- Schema and renderer checks reject a non-null Attention path with no exact included record.
- Fixtures prove the null Attention path renders `Backlog finding` and is not clickable.
- Chat fixtures show a coordinate for every Next and wave-specific Attention item.
- HTML tests prove activation selects `All`, activates Work, sets the search value, updates filter state, and leaves exactly the target wave visible for unique coordinates.
- Search-clear tests prove conditional visibility, keyboard use, filter preservation, and result restoration.
- Desktop and narrow-screen review covers pointer, keyboard, visible focus, reduced motion, print, and independent wave links.
- Desktop and narrow-screen review confirms Attention appears before Next and keeps equal spacing from its neighboring major sections when both sections are visible or either section is absent.
- Human Experience Review checks that a person can identify the affected wave before acting and can understand what the action changed.

## Acceptance Boundary

This phase changes report-model validation, Skill guidance, chat presentation, and the HTML template. It does not change snapshot facts, wave status rules, cache identity, Store behavior, package publication, or release authority.

P7 remains the final package parity and capability-acceptance phase.
