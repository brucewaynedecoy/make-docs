---
title: "W25 R0 P3 Shared Model and Dual Renderer"
kind: "plan"
status: "draft"
coordinate: "W25 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P3 Shared Model and Dual Renderer

## Purpose

Make the live MCP App and explicit static report consume one validated report model.

## Outcome

P3 provides a versioned model, a static renderer, a live payload builder, and parity fixtures. It preserves the accepted report layout and behavior.

## Scope

- Extend `BacklogReportV1` additively when possible.
- Add session and action data only where the live path needs it.
- Keep report facts, inference, recommendation, and local UI state separate.
- Refactor the accepted static template into shared model and renderer boundaries without visual regression.
- Define concise `structuredContent` and full client payload shapes.
- Preserve lazy Data formatting and user-started JSON download.

## Verification

- Both renderers accept the same model fixture.
- Titles, tallies, Attention, Next, statuses, reasons, tracks, details, and limits have the same meaning.
- Static output remains one safe offline file and is not created by the live renderer.
- A model version change is blocked unless a breaking need and migration fixture exist.

## Dependencies

- P1 contracts.
- Accepted W23 R0 template and model fixtures.
