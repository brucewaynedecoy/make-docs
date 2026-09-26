---
title: "Phase 4: Backlog Profile Tools and UI Resource"
kind: "work"
status: "draft"
coordinate: "W25 R0 P4"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 4: Backlog Profile Tools and UI Resource

## Purpose

Add the two live-review operations and one UI resource through the accepted shared registry and profile model.

## Overview

P4 adds `backlog.review.open` and `backlog.review.refresh`. It derives their tools and exposes the versioned UI resource in `backlog` and `all`.

## Human Experience Outcome

- Impact and promise: Direct. The live review opens and refreshes through stable, honest actions.
- Intended outcome: A user gets one live page and one refresh action without seeing duplicate tools or permission surprises.
- Surface: MCP tool results, resource open, refresh result, and fallback output.
- Evidence: Core, registry, access, profile, resource, and tool-without-UI tests.
- Executor: Operation and MCP surface agents after separate phase authority.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Registry, access, profile, resource, and parity contracts are exact. |
| Performance Testing | `not-needed-now` | P7 owns live open and refresh characterization. |
| Guided Progress Review | `not-needed-now` | P5 and P6 own the visible experience. |
| Unassisted Goal Testing | `not-needed-now` | P4 is an internal surface phase. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: not applicable.
- Evidence handoff: future central evidence report.
- Gate effect: A25-A32 block P5-P7.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 38](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: W25 depends on accepted W24 profile authority before profile registration`

## Stage 1 - Operations and access

### Tasks

- [ ] t1: Add shared handlers for `backlog.review.open` and `backlog.review.refresh`.
- [ ] t2: Declare project, Store, and host access through the existing access model.
- [ ] t3: Reuse snapshot and cache services without adding transport logic.

### Acceptance criteria

- A25: `backlog.review.open` accepts only a validated report model and returns a useful non-UI result.
- A26: `backlog.review.refresh` runs a current snapshot and exact cache lookup without writing agent conclusions.
- A27: Open declares Store-none. Refresh uses Store-read only through the accepted gate.
- A28: CLI, MCP, and handlers contain no duplicate backlog business logic.

## Stage 2 - Profiles and resource

### Tasks

- [ ] t4: Derive both MCP tool names from the registry.
- [ ] t5: Register `ui://make-docs/backlog-review/v1.html` and link it with `_meta.ui.resourceUri`.
- [ ] t6: Assign the tools and resource to `backlog` and the exact `all` union.

### Acceptance criteria

- A29: Tool names are `make_docs_backlog_review_open` and `make_docs_backlog_review_refresh`.
- A30: The resource uses `text/html;profile=mcp-app`, a versioned URI, and a narrow content policy.
- A31: Profile tests prove assignment completeness, `all` union membership, and unchanged permissions.
- A32: Existing snapshot and cache tools remain the only owners of their business logic.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | MCP and Skill references need the new operations and resource. |
| History coverage | `create-on-closeout` | The public surface is a material checkpoint. |
| PRD reconciliation | `link-only` | P1 and W24 own the required PRD updates. |
