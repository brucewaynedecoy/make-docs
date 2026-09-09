---
title: "First-Party Skills and Managed Adoption"
kind: "work"
status: "active"
coordinate: "W19 R5"
source:
  type: "prd"
  path: "docs/prd/08-skills-catalog-and-distribution.md"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "Implement the accepted backlog through one phase with three ordered stages."
  coordinate_handoff: "Carry W19 R5 into phase history and commits, adding P1 for this phase."
---

# First-Party Skills and Managed Adoption

## Purpose

Embed all seven first-party Skills directly from their sole `packages/skills/<name>/` sources in the CLI build. Package compiled output without replicated Skill trees under `packages/cli` or `packages/docs`. Let maintainers move reviewed existing copies into managed ownership through the CLI and global Store. This backlog follows the [design](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md), [plan](../../plans/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-overview.md), and updated [product authorities](../../prd/08-skills-catalog-and-distribution.md).

The owner accepted this corrected package and backlog on 2026-09-09 and authorized implementation. All 14 implementation tasks remain pending at the package commit. W19 R3 and R4 remain closed. W20 and W21 remain paused.

## Phase Map

| File | Purpose |
| --- | --- |
| [Phase 1: Skills and Managed Adoption](01-skills-and-managed-adoption.md) | Promote and package Skills, add reviewed adoption, then prove the shipped product and real maintainer adoption. |
| [Central evidence report](evidence.md) | Track package checks and the planned A1–A14 acceptance cases. No implementation result is claimed. |

## Usage Notes

- Complete the three stages in order within the single phase. Stage gates require evidence; they do not create extra phases.
- Keep the seven Skills independently usable. Preserve explicit-request policies and the existing workflow authority.
- Use public installed CLI commands for maintainer setup and adoption after the package has passed isolated checks. Do not copy upstream files into the dogfood instance by hand.
- Required installation and adoption state belongs in the global Store. Work evidence is a project breadcrumb, not a local operation plan, receipt, queue, or fallback.
- [D-005](../../prd/03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations) remains open for delivery and lifecycle proof. The bundled first-party decision is settled in Q-001.
- Formal Unassisted Goal Testing and new deferred-obligation IDs are `not-needed-now` at drafting. Revisit the testing decision against the actual implementation; do not invent IDs or imply a test ran.

## Intended Follow-On

This handoff is advisory-default-but-overridable. The owner satisfied the backlog acceptance gate on 2026-09-09 and authorized implementation.

- Route: `implementation-loop`; owner backlog acceptance is recorded.
- Next step: After the authorized package commit, implement Phase 1 in stage order.
- Why: The backlog turns the accepted direction and current PRDs into a bounded implementation queue.
- Coordinate Handoff: Use W19 R5 P1 for phase evidence, history, and a later authorized commit. Do not resume W20 or W21, publish, or commit from this handoff alone.
