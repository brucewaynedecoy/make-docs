---
title: "W25 R0 P5 Live Widget and Local Interaction"
kind: "plan"
status: "draft"
coordinate: "W25 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P5 Live Widget and Local Interaction

## Purpose

Build the live widget while preserving the accepted Backlog Review design and keeping display-only actions local.

## Outcome

P5 delivers the live page with the accepted title, project summary, tallies, Attention, Next, Backlog Work and Data tabs, wave list, legend, and footer.

## Scope

- Reuse the accepted light, dark, responsive, and print presentation.
- Keep Attention before Next.
- Keep Work and Data under Backlog.
- Keep fixed status colors and accepted phase-state colors.
- Keep search, clear, status filters, sort, disclosure, theme, print, Data, and download local.
- Add live connection, refresh, changed-state, and action feedback without hiding report content.
- Preserve keyboard, focus, reduced-motion, and narrow-screen behavior.

## Verification

- Local controls produce no server call.
- Wide, narrow, print, light, and dark results preserve accepted spacing and order.
- All controls have accessible names and visible focus.
- Hostile report text stays inert.
- A missing bridge yields readable report content and a clear limit.

## Dependencies

- P3 shared model.
- P4 resource registration.
