---
title: "W19 R3 Store-Owned Installation and Migration State Work Backlog"
kind: "work"
status: "active"
coordinate: "W19 R3"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
follow_on:
  route: "implementation-loop"
  next_prompt: "make-docs://system/reference/execution-workflow.md"
  why: "Apply the Store-only installation and migration contract after owner review and acceptance of this backlog."
  coordinate_handoff: "Carry W19 R3 P1 into implementation evidence. Keep W20 R0 paused until accepted interrupt completion."
---

# W19 R3 Store-Owned Installation and Migration State Work Backlog

## Purpose

Move every live Make Docs installation and migration record into the global Store. Transfer known legacy records through the CLI. Stop supported operations from recreating local operational files. Preserve project knowledge, settings, user content, and backup file copies.

This is an interrupt revision of W19 R1. W19 R2 already exists. The source lineage therefore uses W19 R3. The backlog has exactly one implementation phase with five ordered stages. A partial receipt move cannot close that phase.

**Review gate satisfied, 2026-09-09:** The user reviewed and accepted the design, plan, PRD changes, and this backlog. The user requested a package commit followed by an implementation plan. Implementation has not started. All 25 tasks remain open. This acceptance record does not authorize a live transfer.

Read the [design](../../designs/2026-09-09-store-owned-installation-and-migration-state.md), [plan](../../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-overview.md), and current [PRD 38](../../prd/38-global-store-and-project-state.md). Current PRDs own product requirements. The plan owns order. Historical W19 R1 work explains the defect but cannot override the current storage rule. [D-031](../../prd/03-open-questions-and-risk-register.md#d-031-migration-state-remains-in-the-project-despite-the-store-boundary) remains open.

## Phase Map

| Phase | File | Ordered stages | Required result |
| --- | --- | --- | --- |
| P1 | [Store State Cutover](01-store-state-cutover.md) | Store foundation; writer and manifest cutover; legacy transfer and compatible writers; verification, guidance, and dogfood; acceptance and closeout | All required tool state is Store-owned. Verified obsolete inputs are removed. Package and dogfood checks prove later operations keep local state absent. |

## Usage Notes

- All 25 tasks are open. Use their phase-local IDs across the five stages. Stages are not separate phases or independently complete product increments.
- Work from the accepted current checkout. Check branch, HEAD, dirty files, installed CLI, and Store health before implementation. Do not create or switch a branch or worktree without explicit user permission.
- The Store owns the installation manifest, applied hashes and ownership, operation progress, receipts, locks, conflict decisions, and recovery metadata. Local config holds declarative project identity and desired settings only.
- Local project history, plans, PRDs, work state, guides, artifacts, and backup file copies remain under their content contracts. A local history entry or backup description cannot drive installation recovery.
- Correct shipped instructions in `packages/docs/template/` first. Use the corrected CLI for the later reviewed dogfood transfer. Do not hand-edit installed system resources or remove `.make-docs/state/` to imitate success.
- The corrected CLI is the minimum supported writer after transfer. Test and state the limits of the prior package. Do not promise control of an obsolete executable that ignores the new rules.
- Use the finite verification set V1-V8 in the [phase plan](../../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md#verification-set). Reuse suitable evidence. Repeat tests only after relevant changes, failures, or a stated unresolved concern.
- Human Experience Review covers design promises HX-1 through HX-4. It is acceptance work over actual evidence, not a fifth testing type or a duplicate test run.
- No interrupt-specific `O-###`, `NUAT-###`, or `PERF-###` record is active at drafting. Existing O-001/O-002 concern other work. Do not create a record merely because this backlog is pending. Route any newly accepted future outcome through its owning contract.
- A failed boundary, data-preservation, or recovery check keeps P1 open. Do not replace it with local fallback, an unreviewed extra phase, or a deferred obligation that hides incomplete work.
- The user authorized a commit of the accepted package on 2026-09-09. Publication, release, and live transfer are outside that request. Personal memory edits are outside this work.

## W20 Pause and Return Point

[W20 R0](../2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md#interrupt-pause) is paused after accepted P2. P1 and P2 remain closed. P3 has not started. Preserve its task IDs and accepted evidence.

Complete and obtain owner acceptance of W19 R3 first. Then provide a handoff for the existing W20 P3 entry gate. Do not start W20 as a side effect of closing this interrupt. W21 remains downstream of W20 under its existing dependency.

## Draft Validation Baseline

Before backlog generation, PRD authority validation passed for 39 PRDs with no diagnostics. The defaults baseline was 45 of 46 tests. The existing `consistency.test.ts:669` check assumes D-001 through D-030 and fails on existing D-031. P1 t15 includes its correction. Do not treat that known failure as evidence that unrelated new failures are acceptable.

## Intended Follow-On

This handoff does not bypass the user's implementation gate.

- Route: `implementation-loop`

- Next Prompt: `make-docs://system/reference/execution-workflow.md`

- Why: Apply the Store-only installation and migration contract after owner review and acceptance of this backlog.

- Coordinate Handoff: Carry W19 R3 P1 into implementation evidence. Keep W20 R0 paused until accepted interrupt completion.

Next step: After the requested package commit, prepare the requested implementation plan for [P1 Stage 1](01-store-state-cutover.md#stage-1---store-foundation) and its dependent stages. The backlog was accepted on 2026-09-09. Implementation has not started. After accepted interrupt completion, return to W20 P3 planning without assuming permission to implement it.
