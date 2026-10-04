---
title: "Phase 4: Backlog Profile Tools and UI Resource"
kind: "work"
status: "complete"
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

The user authorized P4 implementation on 2026-10-04. Work uses the current branch `w25-r0-p1-live-delivery-contract`, based on `bdd21481497cd78d53baa445dff8c8bbc21c7211`. W25 P1-P3 are closed. Accepted W24 profile, descriptor, and server-factory authority was merged at `26bdf1ce`, from W24 completion `b4c253c1`. That dependency is satisfied.

P4 is closed. Its claim covers shared tool and resource contracts, access, profile membership, and useful results without UI. Tasks t1-t6 and A25-A32 have evidence. The user authorized closeout and a local commit on 2026-10-04, including staging the reviewed P4 file set. These records belong to the P4 phase closeout commit. Product widget controls, live host behavior, refresh review flow, and installed acceptance remain P5-P7 work. Push, publication, installation, release, Store writes, host changes, branch changes, and later phases remain outside this authority.

## Human Experience Outcome

- Impact and promise: Direct for tool results. The active agent can explain the reviewed report, current source facts, and access limits without a visible widget.
- Intended outcome: Useful open and refresh results keep report meaning and exact identities. Profile selection adds no permission or hidden write.
- Surface: MCP tool results, linked resource contract, current snapshot/cache results, and no-UI output.
- Implementation work: Reuse the existing report, snapshot, cache, access, registry, and W24 profile boundaries.
- Evidence: Core, registry, access, profile, resource, and tool-without-UI tests, plus required agent Human Experience Review.
- Executor: Operation and MCP surface agents under the user's P4 authority; coordinator for independent result review.
- Deferral: None.

[PRD 51](../../prd/51-backlog-review-and-reporting.md) owns this result. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) owns the required agent review. P4 does not establish a displayed production widget or a new host-support claim.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Registry, access, profile, resource, and parity contracts are exact. |
| Performance Testing | `not-needed-now` | P7 owns live open and refresh characterization. |
| Guided Progress Review | `not-needed-now` | P4 adds a source contract and tool output. P5 and P6 own the product controls and agent flow. |
| Unassisted Goal Testing | `not-needed-now` | P4 makes no independent-use or discoverability claim. |

- Base action: `create`.
- Performance applicability: `not-needed-now`.
- Canonical profile: none.
- Finite budget: one focused operation/access pass, the nearest profile/resource boundary, and the smallest relevant regressions. Rerun only affected checks after a failure or material edit.
- Evidence handoff: append actual P4 findings to the existing [central evidence report](evidence.md). Reuse valid P1-P3 and W24 evidence within their limits.
- Gate effect: A25-A32 block P5-P7.

Automated Implementation Testing informs the P4 correctness, access, and profile claims. It is required now because two public operations and one resource must reuse existing rules. Product maturity is source integration before the full live widget. Scope is strict inputs/results, shared operation parity, current snapshot/cache use, Store admission, no hidden writes, tool names, resource metadata, and exact profile membership. The code agent runs the checks. Gate effect is `blocking-claim-only`. The effort budget is one changed-behavior suite, the nearest registry/access/profile/resource boundary, and the smallest affected regression set. Stop when those checks pass and independent result review finds no material gap. Retain exact commands, tested source, observations, failures, results, and limits in the central evidence report. A failure or material shared-boundary edit triggers an affected rerun. Expand only for a failure signal, shared change, accepted support claim, or accepted risk. Do not repeat unchanged broad tests for reassurance.

Performance Testing is `not-needed-now`. It informs no current speed decision because P4 makes no latency or payload target claim. Product maturity is source integration. Scope is no performance run; executor is none. Gate effect is `not-applicable`. Effort budget is zero runs. Stop after recording this boundary. Retain this decision and earlier evidence limits. Recheck only if current authority adds a speed claim or a material new finding needs measurement. P7 owns live open and refresh characterization. No profile or deferred obligation is created here.

Guided Progress Review is `not-needed-now`. It informs no current product-control decision because P4 does not complete the widget or host flow. Product maturity is source tool/resource integration. Scope is no owner test or host setup; executor is none. Gate effect is `not-applicable`. Effort budget is zero runs. Stop after recording the boundary. Retain this decision and the useful tool-result evidence. Recheck when a completed product-control slice or a current question makes an optional guided review useful. No owner response gate is added.

Unassisted Goal Testing is `not-needed-now`. It informs no current independent-use decision because this phase makes no discovery or independent-use claim. Product maturity is source integration. Scope is no unassisted run; executor is none. Gate effect is `not-applicable`. Effort budget is zero runs. Stop after recording the reason. Retain this decision and reuse valid contract evidence. Recheck only for a material current human question that other evidence cannot answer, or explicit product or release authority. No scenario or deferred obligation is created.

Human Experience Review remains separate required agent work. Review the actual tool results, error/limit output, resource contract, access effects, and source guidance. Record per-promise observations, conclusions, reviewer, limits, and next actions in the central evidence report. Existing suitable proof can answer the review; it does not require a second test run. No owner response is required.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 38](../../prd/38-global-store-and-project-state.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: accepted W24 profile authority is present at 26bdf1ce; P4 must use its existing registry and profile model`

## Stage 1 - Operations and access

### Tasks

- [x] t1: Add shared handlers for `backlog.review.open` and `backlog.review.refresh`.
- [x] t2: Declare project, Store, and host access through the existing access model.
- [x] t3: Reuse snapshot and cache services without adding transport logic.

### Acceptance criteria

- A25: `backlog.review.open` accepts only a validated report model and returns a useful non-UI result.
- A26: `backlog.review.refresh` runs a current snapshot and exact cache lookup without writing agent conclusions.
- A27: Open declares Store-none. Refresh uses Store-read only through the accepted gate.
- A28: CLI, MCP, and handlers contain no duplicate backlog business logic.

### Dependencies

- Closed W25 P1-P3 contracts and shared report boundaries.
- Accepted W24 profile, descriptor, access, and server-factory authority merged at `26bdf1ce`.

## Stage 2 - Profiles and resource

### Tasks

- [x] t4: Derive both MCP tool names from the registry.
- [x] t5: Register `ui://make-docs/backlog-review/v1.html` and link it with `_meta.ui.resourceUri`.
- [x] t6: Assign the tools and resource to `backlog` and the exact `all` union.

### Acceptance criteria

- A29: Tool names are `make_docs_backlog_review_open` and `make_docs_backlog_review_refresh`.
- A30: The resource uses `text/html;profile=mcp-app`, a versioned URI, and a narrow content policy.
- A31: Profile tests prove assignment completeness, `all` union membership, and unchanged permissions.
- A32: Existing snapshot and cache tools remain the only owners of their business logic.

### Dependencies

- Stage 1 handlers and access declarations.
- The existing W24 `backlog` profile and exact `all` union.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | Upstream Skill and references explain the source tools, optional cache boundary, limited resource shell, and useful chat fallback. Installed copies stay outside P4. |
| History coverage | `create` | The [P4 history record](../../../.make-docs/archive/history/2026-10-04-w25-r0-p4-backlog-profile-tools-and-ui-resource.md) records the authorized phase closeout and local commit scope. |
| PRD reconciliation | `update-existing` | PRD 25 records optional outer Store admission. PRD 39 records its descriptor bounds and paired MCP App URI/result schema. PRD 51 remains the product owner with no requirement change. |

## Current Implementation State

- P4 is closed. Tasks t1-t6 and A25-A32 pass within the source tool/resource scope. The user authorized closeout and a local commit on 2026-10-04. These records belong to that phase closeout commit.
- The [central report](evidence.md) retains 34 focused cases, 454 affected cases, 53 default checks, type and build checks, asset drift checks, independent no-UI and built stdio review, and required agent Human Experience Review. The 541 selected cases passed across bounded runs and affected repairs.
- Source guidance keeps chat and explicit static review usable without the CLI or Store. Tool availability and built stdio delivery do not prove host display. The P4 shell has no product tool, message, or task controls.
- The required history is complete. P5 is the next eligible phase and needs separate implementation authority. P5-P7 product behavior, installation, push, publication, release, Store writes, host changes, and branch changes remain outside this authority.
