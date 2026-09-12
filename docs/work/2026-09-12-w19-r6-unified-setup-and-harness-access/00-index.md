---
title: "W19 R6 Unified Setup and Harness Access Work"
kind: "work"
status: "active"
coordinate: "W19 R6"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the accepted design, plan, and current PRDs."
  coordinate_handoff: "Carry W19 R6 into phase history and commits, with P1 for this phase."
source:
  type: "prd"
  path: "../../prd/07-cli-command-surface-and-lifecycle.md"
---

# W19 R6 Unified Setup and Harness Access Work

## Purpose

Implement the unified setup and harness-access contract through one phase. Read the phase stages in order. Do not start implementation without explicit owner authority.

## Human Experience Trace

| Promise | Source design and plan | Owning PRDs | Work phase | Evidence | Implementation gate | Obligation |
| --- | --- | --- | --- | --- | --- | --- |
| Explain system, project, and Store effects before approval. | [Design](../../designs/2026-09-12-unified-setup-and-harness-access.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md) | PRDs 07, 28, 39 | [Phase 1](01-unified-setup-and-harness-access.md) | Terminal review and transcript assertions | Exact grouped review passes | None |
| Complete missing system setup inline. | Same | PRDs 05, 07, 28, 38 | Phase 1 | Failure and resume matrix | Separate receipt proof passes | None |
| Keep resource reads Store-free. | Same | PRDs 17, 25, 39 | Phase 1 | Store-absent, locked, denied, and no-session tests | All four cases pass | None |
| Remove fresh document selection and preserve old partial projects. | Same | PRDs 05, 07 | Phase 1 | Fresh and legacy inventories | No silent expansion | None |
| Show only proved native methods. | Same | PRDs 20, 28, 30 | Phase 1 | Real Codex and Claude Code conformance | Exact tuples pass | None |
| Keep repeat setup safe and visible. | Same | PRDs 24, 28, 38 | Phase 1 | Idempotence and drift tests | No unreviewed writes | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-unified-setup-and-harness-access.md](01-unified-setup-and-harness-access.md) | Add the access model, unified flow, native adapters, compatibility, and complete proof. |

## Usage Notes

- Use the [design](../../designs/2026-09-12-unified-setup-and-harness-access.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md), and linked current PRDs as authority.
- Keep task order inside Phase 1 unless a dependency note permits parallel work.
- Preserve unrelated worktree edits. Reconcile existing `wizard.ts` and `wizard.test.ts` edits before changing them.
- Keep system and project effects separate in code, tests, evidence, and review.
- Do not add Pi support, broad CLI cleanup, a local Store, a service process, or a new project undo path.
- Automated Implementation Testing and Guided Progress Review are selected. Performance Testing and Unassisted Goal Testing are `not-needed-now` for the reasons in Phase 1.
- Human Experience Review is the acceptance lens. It is not a fifth testing type.

## Implementation Gate

Status: `not-authorized`.

This package does not authorize code changes, harness configuration changes, staging, commits, package installation, publication, or release.

## Intended Follow-On

This handoff is advisory-default-but-overridable. It is not an implementation authorization.

- Route: `implementation-loop`
- Next step: Start Phase 1 only after the owner explicitly authorizes implementation.
- Why: One phase is the smallest complete release unit for this setup change.
- Coordinate Handoff: Use `W19 R6 P1` for phase history and related commits.
