---
title: "W25 R0 P1 Authority and Live Delivery Contract"
kind: "plan"
status: "draft"
coordinate: "W25 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P1 Authority and Live Delivery Contract

## Purpose

Settle the live default, explicit static route, fallback behavior, shared model boundary, and allowed UI-to-agent actions before implementation.

## Outcome

P1 produces accepted contracts and fixtures for delivery selection, model identity, refresh state, controlled messages, cache reuse, and static output consent.

## Scope

- Define `live`, `static`, and `chat-fallback` delivery results.
- Require capability detection instead of host-name checks.
- Require an explicit user request before any static report is written.
- Define the live session identity, snapshot identity, record reference, action identifiers, and refresh result.
- Define the boundary between local UI state, report data, source facts, cache fragments, and agent judgment.
- Define natural fallback explanations for missing UI, transport, Store, or host task support.

## Verification

- Contract fixtures select live when required capabilities exist.
- Static generation fixtures require an explicit request.
- Fallback fixtures finish a chat review and offer, but do not create, a static report.
- Action fixtures reject missing, stale, or ambiguous record references.
- Project-authored text cannot become an action identifier or agent instruction.

## Dependencies

- Accepted W23 R0 Backlog Review authority.
- Current PRD 51, PRD 38, PRD 39, and Human Experience authority.
