---
title: "W25 R0 P4 Backlog Profile Tools and UI Resource"
kind: "plan"
status: "draft"
coordinate: "W25 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P4 Backlog Profile Tools and UI Resource

## Purpose

Add the live-review operations and UI resource to the shared registry and the W24 `backlog` MCP profile.

## Outcome

P4 delivers `backlog.review.open`, `backlog.review.refresh`, their derived tools, exact access declarations, the versioned UI resource, and profile membership.

## Scope

- Add shared operation handlers with no transport logic.
- Derive `make_docs_backlog_review_open` and `make_docs_backlog_review_refresh` from the registry.
- Register `ui://make-docs/backlog-review/v1.html`.
- Add both tools and the resource to `backlog` and `all` through the W24 profile model.
- Keep snapshot and cache behavior in their existing operations.
- Keep tools useful when no UI renders their results.

## Verification

- Operation-core, CLI projection where applicable, and MCP results agree.
- Access tests prove open is Store-free and refresh uses Store read only through the accepted gate.
- Profile tests prove complete assignment, `all` union membership, and no permission change.
- Resource tests prove MIME type, versioned URI, narrow policy, and safe embedding.

## Dependencies

- P1-P3.
- Accepted W24 R0 profile, descriptor, and server-factory authority.
