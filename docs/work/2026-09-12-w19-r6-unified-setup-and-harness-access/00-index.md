---
title: "W19 R6 Unified Setup and Harness Access Work"
kind: "work"
status: "active"
coordinate: "W19 R6"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the accepted design, plan, and current PRDs."
  coordinate_handoff: "Keep P1 incomplete and carry W19 R6 P2 into corrective implementation, evidence, and later commits."
source:
  type: "prd"
  path: "../../prd/07-cli-command-surface-and-lifecycle.md"
---

# W19 R6 Unified Setup and Harness Access Work

## Purpose

Finish the unified setup and harness-access contract through the existing P1 foundation and one corrective P2 phase. P1 is an incomplete acceptance attempt and code candidate. It is not an accepted feature. P2 owns the missing production path and installed proof.

## Human Experience Trace

| Promise | Source design and plan | Owning PRDs | Work phase | Evidence | Implementation gate | Obligation |
| --- | --- | --- | --- | --- | --- | --- |
| Explain system, project, and Store effects before approval. | [Design](../../designs/2026-09-12-unified-setup-and-harness-access.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md) | PRDs 07, 28, 39 | [Phase 2](02-corrective-production-path-and-acceptance.md) | Installed terminal review and transcript assertions | Exact grouped review passes | None |
| Complete missing system setup inline. | Same | PRDs 07, 24, 28, 39 | Phase 2 | Production-path failure and resume matrix | Separate machine and project proof passes | None |
| Keep resource reads Store-free. | Same | PRDs 25 and 39 | Phase 2 | Store-absent, locked, denied, and no-session tests | All cases pass through source and packed CLI | None |
| Remove fresh document selection and preserve old partial projects. | Same | PRDs 07 and 39 | Phase 2 | Fresh and legacy installed inventories | No silent expansion | None |
| Show only proved native methods. | Same | PRDs 20, 28, 43, and 44 | Phase 2 | Central registry plus real Codex and Claude Code conformance | Exact seven-part tuples pass | None |
| Keep repeat setup safe and visible. | Same | PRDs 24, 28, and 39 | Phase 2 | Idempotence, drift, and blocker-action tests | No unreviewed writes or rerun loop | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-unified-setup-and-harness-access.md](01-unified-setup-and-harness-access.md) | Retain the P1 foundation code and failed acceptance record. This phase is incomplete and not accepted. |
| [02-corrective-production-path-and-acceptance.md](02-corrective-production-path-and-acceptance.md) | Reconcile authority, complete the production path, and pass installed conformance and Human Experience acceptance. |
| [evidence.md](evidence.md) | Record the P1 evidence limit, P2 trace, and final acceptance proof. |

## Usage Notes

- Use the [design](../../designs/2026-09-12-unified-setup-and-harness-access.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md), and linked current PRDs as authority.
- Read P1 as prior implementation evidence. Execute P2 in stage order.
- Preserve unrelated worktree edits. At the live implementation baseline, `wizard.ts` and `wizard.test.ts` were clean.
- Keep system and project effects separate in code, tests, evidence, and review.
- Do not add Pi support, broad CLI cleanup, a local Store, a service process, or a new project undo path.
- Automated Implementation Testing and Guided Progress Review are selected. Performance Testing and Unassisted Goal Testing are `not-needed-now` for the reasons in Phase 2.
- Human Experience Review is the acceptance lens. It is not a fifth testing type.

## Guide Coverage

- User: [Setting Up Projects and Harness Access](../../assets/user/cli-setting-up-projects-and-harness-access.md).
- Maintainer: [Maintaining Setup and Harness Access](../../assets/maintainer/cli-maintaining-setup-and-harness-access.md).
- Evidence and current limits: [W19 R6 evidence](evidence.md).

## Implementation Gate

Status: `p1-incomplete; p2-authorized-not-started`.

P1 produced useful foundation code and automated checks. It did not deliver a selectable production connection method, central support loading, real harness proof, or installed Human Experience acceptance. It is not accepted feature delivery.

The owner authorizes later P2 implementation and real disposable Codex and Claude Code lab runs. This planning update does not start either action.

This package does not authorize staging, commits, package installation, publication, release, or a change to a real harness.

## Intended Follow-On

This handoff is advisory-default-but-overridable. It does not authorize the remaining external actions.

- Route: `implementation-loop`
- Next step: Implement [Phase 2](02-corrective-production-path-and-acceptance.md) in its three stage order.
- Why: P2 closes the production-path defects before it asks for installed acceptance.
- Coordinate Handoff: Use `W19 R6 P2` for corrective implementation, evidence, and later commits.
