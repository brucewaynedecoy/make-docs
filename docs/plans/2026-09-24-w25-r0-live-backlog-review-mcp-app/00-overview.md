---
title: "W25 R0 Live Backlog Review MCP App Plan"
kind: "plan"
status: "draft"
coordinate: "W25 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "The plan updates PRD 51 and creates a dependency-ordered work backlog."
  coordinate_handoff: "Carry W25 R0 into PRD 51 source lineage and the downstream work backlog."
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "none"
  reason: "The requested package follows the design, plan, PRD, and work order before implementation."
---

# W25 R0 Live Backlog Review MCP App Plan

## Purpose

Plan the live Backlog Review defined in the [W25 R0 design](../../designs/2026-09-24-live-backlog-review-mcp-app.md). The live MCP App is the default on compatible hosts. The accepted static report remains available only after an explicit user request.

This package is planning authority. It does not authorize implementation, staging, commit, publication, or release work.

## Objective

Completion requires:

- one accepted live, static, chat, and fallback delivery contract;
- one compatible-host proof for MCP Apps resources, `tools/call`, and `ui/message`;
- one shared validated report model for live and static renderers;
- two registry operations, `backlog.review.open` and `backlog.review.refresh`;
- one versioned `ui://make-docs/backlog-review/v1.html` resource;
- local search, sort, filter, disclosure, theme, print, data, and download behavior;
- controlled refresh and agent-message paths;
- reuse of the existing exact cache lookup and best-effort cache write;
- a task-request action that asks the active agent to use host task support;
- live and static meaning parity;
- package and installed-output parity; and
- bounded `PERF-002` characterization plus Human Experience Review.

## Human Experience Propagation

| Promise | Owner | Surface | Phase | Evidence |
| --- | --- | --- | --- | --- |
| Compatible hosts open a live review by default. | PRD 51 | Skill result and MCP App | P1-P5 | Contract, host proof, and Guided Progress Review |
| Static HTML is created only after an explicit request. | PRD 51 | Skill delivery router | P1, P3, P7 | Route fixtures and installed proof |
| Live and static views have the same meaning. | PRD 51 | Shared model and both renderers | P3, P7 | Golden parity fixtures and Human Experience Review |
| Refresh names unchanged or changed facts without hiding limits. | PRD 51 | Refresh control and agent handoff | P4, P6 | Operation and interaction tests |
| Agent actions use exact wave identity and controlled messages. | PRD 51 | Wave actions | P5, P6 | Safe-message fixtures and host review |
| Store failure does not block a current review. | PRD 51 and PRD 38 | Refresh and cache path | P4, P6, P7 | Store-state fallback tests |

## Performance Evidence Plan

- Profile: `PERF-002`.
- Base action: `create`.
- Applicability: `characterize-now`.
- Scope: one cold live open, one unchanged refresh, and one refresh after one controlled record change on the accepted 70-record fixture.
- Measures: elapsed time, app resource and report-model size, cache counts, changed-record counts, live/static parity, environment, limits, and uncertainty.
- Stop rule: stop after the three observations and at most one correction cycle unless the measurement is invalid.
- Gate effect: speed is informational. Correctness, privacy, accessibility, package parity, and safe failure are blocking.

## Coordinate Decision

- Coordinate: `W25 R0`.
- Classification: `new-wave`.
- Evidence: This work adds a live delivery, protocol resource, server actions, and agent-message boundary. It follows W23 R0 but does not correct its accepted static capability.

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Live Backlog Review behavior and delivery routes | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 owns Backlog Review. |
| Backlog Review navigation in the active PRD map | `update-existing` | [PRD index](../../prd/00-index.md) | The current summary and source anchors must name the live delivery. |
| General MCP profiles and server selection | `link-only` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and W24 R0 | W24 owns the shared profile foundation. |
| Existing cache schema and Store boundary | `link-only` | [PRD 38](../../prd/38-global-store-and-project-state.md) | W25 reuses the accepted rebuildable cache and adds no activity state. |
| First-party Skill package rules | `link-only` | [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | Current asset and installed-output rules already apply. |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-live-delivery-contract.md](01-authority-and-live-delivery-contract.md) | Settle live default, explicit static, fallback, model, and action contracts. |
| [02-host-and-transport-proof.md](02-host-and-transport-proof.md) | Prove the MCP Apps resource, bridge, capability, and selected transport path. |
| [03-shared-model-and-dual-renderer.md](03-shared-model-and-dual-renderer.md) | Add one shared model and prove live/static meaning parity. |
| [04-backlog-profile-tools-and-ui-resource.md](04-backlog-profile-tools-and-ui-resource.md) | Register the two operations, tools, access, profile membership, and UI resource. |
| [05-live-widget-and-local-interaction.md](05-live-widget-and-local-interaction.md) | Build the live widget and its local controls. |
| [06-refresh-cache-and-agent-actions.md](06-refresh-cache-and-agent-actions.md) | Add refresh, cache reuse, controlled agent messages, and task requests. |
| [07-parity-performance-and-acceptance.md](07-parity-performance-and-acceptance.md) | Prove package parity, installed behavior, performance, accessibility, and Human Experience outcomes. |

## Dependencies

- Package review can start now. Implementation needs separate owner authority.
- P1 is the W25 contract gate.
- P2 can test a bounded host path before W24 closes. It cannot create a second profile system.
- P3 depends on P1.
- P4 depends on accepted W24 R0 MCP profile authority and P1-P2.
- P5 depends on P3-P4.
- P6 depends on P2, P4, and P5.
- P7 depends on P1-P6 and one identified package candidate.
- W25 preserves W23 snapshot, cache, status, layout, and static-report authority unless this package changes it explicitly.

## Output Contract

- Design: `docs/designs/2026-09-24-live-backlog-review-mcp-app.md`.
- Plan: this directory with `00-overview.md` and seven phase files.
- Product authority: PRD 51 plus narrow navigation updates in the PRD index.
- Work backlog: `docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/` with `00-index.md` and seven phase files.
- No implementation source, shipped Skill asset, MCP server, Store, installation, branch, staging, commit, publication, or release change is part of this package-writing pass.

## Worker Ownership

| Role | Responsibility | Main write scope |
| --- | --- | --- |
| Contract owner | Delivery, model, action, and fallback contracts | PRD, types, fixtures |
| Host proof owner | MCP Apps resource, bridge, capability, and transport proof | Bounded proof and tests |
| Model owner | Shared report model and live/static parity | Backlog Review model and renderers |
| MCP surface owner | Operations, registry, access, profile membership, and resource registration | CLI MCP and operation registry |
| Widget owner | Live UI and local interaction | Backlog Review app assets |
| Agent action owner | Refresh, cache flow, controlled messages, and task requests | Skill and app action paths |
| Validation owner | Package, installed, accessibility, performance, and Human Experience proof | Tests and evidence |

Each worker must preserve other work and must not revert concurrent edits.

## MCP Strategy

Use the shared operation registry. Derive MCP tools from the same handlers used by other surfaces. Use the W24 `backlog` profile. Keep stdio. Add Streamable HTTP only when the selected compatible host needs it.

Use the official MCP Apps resource and bridge contracts. The UI resource uses `text/html;profile=mcp-app`. UI tool calls use `tools/call`. Follow-up requests use `ui/message`. The implementation detects capabilities instead of host names.

## Validation

- Validate all design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before implementation consumes the package.
- Prove default-live and explicit-static routing.
- Prove no static file is written during live open or fallback.
- Prove open and refresh tools without the UI.
- Prove `backlog` profile membership and `all` union membership.
- Prove access declarations and Store-free fallback.
- Prove live/static/chat meaning parity from the same model.
- Prove local UI actions make no server call.
- Prove controlled `ui/message` payloads contain no project-authored prompt instructions.
- Prove a task request asks the active agent and does not create a task from the widget.
- Prove keyboard, focus, narrow-screen, reduced-motion, print, and safe-content behavior.
- Run finite `PERF-002` evidence and record limits.
- Complete Human Experience Review before P7 closes.

## Intended Follow-On

- Route: `prd-generation`
- Next step: maintain PRD 51 from this plan, then use its current requirements for the W25 work backlog and phase execution.
- Next Prompt: [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md)
- Why: The plan updates PRD 51 and creates a dependency-ordered work backlog.
- Coordinate Handoff: Carry W25 R0 into PRD 51 source lineage and the downstream work backlog.
