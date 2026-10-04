---
title: "W25 R0 P4 Backlog Profile Tools and UI Resource"
kind: "plan"
status: "complete"
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

The user authorized implementation on 2026-10-04. Its tested source checkpoint uses branch `w25-r0-p1-live-delivery-contract`, based on `bdd21481`. Accepted W24 authority is merged at `26bdf1ce`. The user then authorized closeout and a local commit on 2026-10-04, including the reviewed P4 file set. P4 is closed with A25-A32 evidence. These records belong to the phase closeout commit. P4 proves source tool/resource contracts and useful no-UI output. Product widget controls, host behavior, and refresh review flow remain P5-P7 work. P5 is next eligible and needs separate implementation authority. Installation, push, publication, release, Store writes, host changes, and branch changes remain outside this authority.

## Scope

- Add shared operation handlers with no transport logic.
- Derive `make_docs_backlog_review_open` and `make_docs_backlog_review_refresh` from the registry.
- Register `ui://make-docs/backlog-review/v1.html`.
- Add both tools and the resource to `backlog` and `all` through the W24 profile model.
- Keep snapshot and cache behavior in their existing operations.
- Keep tools useful when no UI renders their results.
- Keep required Store admission as the default. Optional outer admission is limited to read-only Store-read composites and grants no Store permission.
- Pair the versioned MCP App URI with a strict result schema. Preserve concise model data and complete client data without generic full-report narration.

## Verification

- Operation-core, CLI projection where applicable, and MCP results agree.
- Access tests prove open is Store-free and refresh uses Store read only through the accepted gate.
- Profile tests prove complete assignment, `all` union membership, and no permission change.
- Resource tests prove MIME type, versioned URI, narrow policy, and safe embedding.
- Required agent Human Experience Review inspects actual tool output, source guidance, and honest limits. It is separate from the four testing types and creates no owner response gate.
- Use the [P4 common testing decision record](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/04-backlog-profile-tools-and-ui-resource.md#current-testing-decisions). Run affected behavior first, then the nearest boundary and smallest relevant regressions. Use finite scope and affected reruns after a failure or material edit.
- Retain actual results in the existing [central evidence report](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md). Reuse valid P1-P3 and W24 proof within their limits. Performance Testing, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now`.

## Dependencies

- P1-P3.
- Accepted W24 R0 profile, descriptor, and server-factory authority. This dependency is satisfied by merge `26bdf1ce`, from W24 completion `b4c253c1`.
