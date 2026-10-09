---
title: "W25 R0 Live Backlog Review MCP App Plan"
kind: "plan"
status: "active"
coordinate: "W25 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "The plan updates PRD 51 and creates a dependency-ordered work backlog."
  coordinate_handoff: "P1-P6 remain historical. P7 retains A51-A60. P8-P13 own remaining W25 repair and closeout. W26 R0 supplies the shared access path."
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "active-implementation-revisit"
  reason: "The owner rejected the live release result, so W25 design, plan, PRD, and work authority must be corrected while P7 remains active."
---

# W25 R0 Live Backlog Review MCP App Plan

## Purpose

Plan the live Backlog Review defined in the [W25 R0 design](../../designs/2026-09-24-live-backlog-review-mcp-app.md). The live MCP App is the default on compatible hosts. The accepted static report remains available only after an explicit user request.

This package records the plan. The owner separately authorizes its 2026-10-08 bounded recovery implementation. Staging, commit, publication, and release remain separate actions.

## Objective

Completion requires:

- one accepted live, static, chat, and fallback delivery contract;
- one compatible-host proof for MCP Apps resources, `tools/call`, and `ui/message`;
- one shared validated report model for live and static renderers;
- two registry operations, `backlog.review.open` and `backlog.review.refresh`;
- one versioned `ui://make-docs/backlog-review/v1.html` resource;
- local search, sort, filter, disclosure, theme, print, data, and download behavior;
- controlled refresh and agent-message paths;
- normal supported access to the existing exact Store cache lookup and best-effort write, with only returned valid hits reused;
- Explain and Work requests to the original connected agent chat, with no separate-task creation;
- live and static meaning parity;
- package and installed-output parity; and
- the recorded W25-only A56 performance waiver, with no speed or scale claim, plus required installed accessibility and Human Experience Review.

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

- Profile: [PERF-002 version 3](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/07-parity-performance-and-acceptance.md#perf-002-live-backlog-review-open-and-refresh).
- Base action: `update-existing`.
- Applicability: `characterize-now`.
- Outcome and scope: `waived` for A56, W25 R0 only. The owner delegated this choice. No qualified controlled actual-host replay seam was available.
- Evidence: Exact planned version-2 body is retained. The 73-record fixture remains lossless delivery input. Zero performance observations ran.
- Stop and expiry: No new measured run; waiver expires at W25 R0 closeout. Future performance claims require new authority and a finite budget.
- Gate effect: No speed or scale claim exists. Correctness, privacy, accessibility, package parity, consent, and safe failure keep their own proof needs. No owed work is created.

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
| [06-refresh-cache-and-agent-actions.md](06-refresh-cache-and-agent-actions.md) | Add refresh, cache reuse, and controlled connected-agent requests. |
| [07-parity-performance-and-acceptance.md](07-parity-performance-and-acceptance.md) | Prove package parity, installed behavior, performance, accessibility, and Human Experience outcomes. |
| [08-evidence-and-scope-correction.md](08-evidence-and-scope-correction.md) | Correct claim scope, change ownership, connection state, and release hold. |
| [09-source-and-app-remediation.md](09-source-and-app-remediation.md) | Integrate the approved shared path and finish W25 repair/removal work. |
| [10-candidate-and-connection.md](10-candidate-and-connection.md) | Review one exact candidate, connection diff, and rollback before replacement. |
| [11-installed-acceptance.md](11-installed-acceptance.md) | Prove the real host, cache, actions, parity, accessibility, and Human Experience outcomes. |
| [12-recovery-cleanup.md](12-recovery-cleanup.md) | Review and remove exact recovery files after dependency checks. |
| [13-closeout-and-commit-disposition.md](13-closeout-and-commit-disposition.md) | Reconcile one summary, obligations, release state, and commit allowlist. |

## 2026-10-09 Repair Route

The owner rejected the current app for release. P7 remains the A51–A60 evidence ledger. P8–P13 own the remaining W25 work without renumbering P1–P7. The existing P7 recovery limits remain historical. A new finite work limit must count the [W26 R0 foundation](../2026-10-09-w26-r0-shared-access-and-data-foundation/00-overview.md) that W25 consumes. The proposed 90-minute read-only design window and 12-hour combined recovery ceiling require exact scope review before execution.

The normal connection, Store cache miss/write/hit, visible unknown counts, final installed accessibility, and owner release decision remain open. Source, mock, private candidate, installed parity, and observed host evidence keep separate claim scopes. No private report file substitutes for a refused Store cache.

## Bear Proposal to Work Map

The Bear proposal `A26E70E0-D758-4BFC-9663-082EF11369BC` supplies the full scope. The coordinating plan `2EF0252A-EA60-4207-84FA-B62351245335` assigns package ownership. Bear labels do not name Make Docs coordinates.

| Step | One owning route | Current task or control |
| --- | --- | --- |
| 1. Boundary and evidence | W25 R0 | P8 t1–t3. |
| 2. Access trace and design | W26 R0 | P1 t1–t4. |
| 3. Shared identity/data rules | W26 R0 | P1 t3; P3 t1 proves the result. |
| 4. Original W25 scope | W25 R0 | P9 t1, t3–t5. |
| 5. Shared policy and setup | W26 R0 | P2 t1–t4; P3 t1–t4. |
| 5. W25 cache and app integration | W25 R0 | P9 t2–t3. |
| 6. Connection replacement | W25 R0 | P10 t1–t3. |
| 7. Installed acceptance | W25 R0 | P11 t1–t5; P7 keeps A51–A60. |
| 8. Exact cleanup | W25 R0 | P12 t1–t3. |
| 9. Closeout and commit | W25 R0 | P13 t1–t4. |
| 10. Small fact queries | Later Q package | Bear control; full Make Docs tasks after W25 stopping point. |
| 11. Review simplification | Later Q package | Bear control; full Make Docs tasks after W25 stopping point. |
| 12. Scoped writes | Later U package | Bear control; no W25 write scope. |
| 13. HTTP and dashboard | Later H package | Bear control; no W25 service scope. |
| 14. Optional page-to-agent | Later B package | Bear control; no W25 host bridge scope. |
| 15. Limits and approvals | Each owning phase | W26 P1/P2/P3 and W25 P8–P13 gate their own work. |

## Recovery Scope — 2026-10-08

The user authorizes implementation of the bounded recovery plan on the existing branch. This revisits P7 and corrects current product authority in PRD 51. P1-P6 remain historical closed records. This is a disclosed revisit of design, plan, and PRD within the active implementation phase. Keep their evidence only where code, input, and environment still apply.

Finish report delivery, remove the uncommitted resolver/task-prompt redesign, apply the two approved names, clean shipped Skill text and the resource description, relocate proof tools, and delete the HEAD comparison test before the final candidate build. Keep the accepted layout. Any further UI/UX change requires a proposal and explicit owner approval.

Use the [P7 recovery sequence and finite limits](07-parity-performance-and-acceptance.md). Use the [W25 work state](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md#current-state) for the current decision. The separate local P7 recovery summary holds exact receipts. Commit, push, publication, and release remain separate.

This paragraph records the earlier recovery authority. The 2026-10-09 owner rejection and [new repair route](#2026-10-09-repair-route) require reviewed scopes and gates for P8–P13 and W26 R0. The earlier time windows do not renew themselves.

## Dependencies

- The owner authorizes bounded P7 recovery implementation on 2026-10-08. Its finite limits and revised scope are recorded in the P7 plan.
- P1 is the W25 contract gate.
- P2 can test a bounded host path before W24 closes. It cannot create a second profile system.
- P3 depends on P1.
- P4 depends on accepted W24 R0 MCP profile authority and P1-P2.
- P5 depends on P3-P4.
- P6 depends on P2, P4, and P5.
- P7 depends on P1-P6 and one identified package candidate.
- P8 inventories the current P7 evidence and dirty work. W26 R0 P1 consumes that inventory.
- P9 waits for P8 and the approved W26 R0 P1 design. W25-only source work may run alongside W26 R0 P2–P3 when file ownership is clear. Its shared-path integration consumes passed W26 R0 P3 checks. P10 waits for P9 and separate connection approval.
- P11 waits for the exact P10 connection and required W26 R0 P3 proof. P12 needs a P11 disposition and exact cleanup approval. P13 needs the P11/P12 decisions.
- Q, U, H, and B remain later Bear planning labels. Their full Make Docs records follow the approved W25 stopping point and commit.
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
| Agent action owner | Refresh, cache flow, and controlled Explain/Work messages | Skill and app action paths |
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
- Prove Explain and Work reach the original connected agent and produce their agreed results. Neither requests another task.
- Prove keyboard, focus, narrow-screen, reduced-motion, print, and safe-content behavior.
- Preserve the terminal W25-only `PERF-002` A56 waiver and its unrun plan. Make no measured pass or speed/scale claim.
- Complete Human Experience Review before P7 closes.

## Intended Follow-On

- Route: `prd-generation`
- Next step: maintain PRD 51 from this plan, then use its current requirements for the W25 work backlog and phase execution.
- Next Prompt: [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md)
- Why: The plan updates PRD 51 and creates a dependency-ordered work backlog.
- Coordinate Handoff: Carry W25 R0 into PRD 51 source lineage and the downstream work backlog.
