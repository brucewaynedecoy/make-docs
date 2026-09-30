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

P3 preserves the unchanged `BacklogReportV1`, reuses the separate P1 `BacklogLiveEnvelopeV1`, and provides shared boundaries for a static renderer, live payload builder, and parity fixtures. It preserves the accepted report layout and behavior. A production live widget remains later work.

The tested source checkpoint is based on `0c112e57`. The user authorized P3 closeout and a local commit on 2026-09-30. P3 is closed for shared source integration. These records belong to the P3 phase closeout commit. Tasks t1-t6 and A17-A24 pass within the [recorded evidence limits](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md#p3-tested-state). No fresh browser or live widget review is claimed. P4, installation, push, publication, and release remain outside that authority.

## Scope

- Keep `BacklogReportV1` unchanged.
- Use the separate P1 `BacklogLiveEnvelopeV1` for delivery and action identity. Keep its version separate from report schema version.
- Keep report facts, inference, recommendation, and local UI state separate.
- Refactor the accepted static template into shared model and renderer boundaries without visual regression.
- Define concise `structuredContent` and full client payload shapes.
- Preserve lazy Data formatting and user-started JSON download.

## Verification

- Both renderers accept the same model fixture.
- Titles, tallies, Attention, Next, statuses, reasons, tracks, details, and limits have the same meaning.
- Static output remains one safe offline file and is not created by the live renderer.
- A model version change is blocked unless a breaking need and migration fixture exist.
- Required agent Human Experience Review checks the built static output, model meaning, consent, and limits. Guided owner review is advisory and creates no response gate.
- Use the PRD 50 common decision record in the [P3 work record](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/03-shared-model-and-dual-renderer.md#current-testing-decisions). Run affected behavior first, then the nearest boundary and smallest relevant regression set. Use one finite pass and affected reruns after a failure or material edit.
- Retain actual findings in the existing [central evidence report](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md). Reuse valid P1 and P2 evidence. Performance Testing and Unassisted Goal Testing remain `not-needed-now`.

## Dependencies

- P1 contracts.
- Accepted W23 R0 template and model fixtures.
