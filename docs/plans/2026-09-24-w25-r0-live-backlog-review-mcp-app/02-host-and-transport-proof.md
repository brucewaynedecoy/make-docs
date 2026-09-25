---
title: "W25 R0 P2 Host and Transport Proof"
kind: "plan"
status: "draft"
coordinate: "W25 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P2 Host and Transport Proof

## Purpose

Prove the smallest compatible MCP Apps path before the product depends on it.

## Outcome

P2 proves resource registration, `tools/call`, `ui/message`, capability detection, and the selected local transport in one supported host. It records unsupported states and does not create a second MCP architecture.

## Scope

- Register one bounded versioned test resource with `text/html;profile=mcp-app`.
- Return the resource from one test tool through `_meta.ui.resourceUri`.
- Prove one read-only UI tool call.
- Prove one controlled follow-up message.
- Confirm whether stdio is sufficient for the selected host.
- If required, prove a bounded Streamable HTTP adapter over the same server factory and registry.
- Record capability and transport failure behavior.

## Verification

- The compatible host displays the resource and preserves safe text rendering.
- The UI receives one bounded tool result.
- The active conversation receives one bounded follow-up message.
- Unsupported capability or transport states return a clear fallback signal.
- No second tool registry, access model, or business-logic path exists.

## Dependencies

- P1 action and fallback contracts.
- Current W24 R0 profile design can remain draft for this bounded proof.
