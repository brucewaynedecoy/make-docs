---
title: "First-Party Skills and Managed Adoption"
kind: "work"
status: "completed"
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

The owner accepted the R5 backlog and authorized implementation on 2026-09-09; package commit `9d87b06` remains its planning record. The owner accepted the completed standard-location correction and requested closeout and commit on 2026-09-09. W19 R5 is closed. The implementation commit is authorized and is the next action. Prior private-layout proof is retained but does not accept the corrected installation. Affected tasks are complete and D-005 is resolved by final delivery evidence. W19 R3/R4 remain closed; W20/W21 remain paused.

## Standard-Layout Correction

Wrong-private-layout cutover is forward-resume-only: review must state before apply that rollback would recreate the forbidden private layer and is not offered. Ordinary adoption already using standard locations keeps normal resume/rollback. Older saved operations that would write a retired private root refuse safely; never execute them to restore that layer. This correction adds no new URL-backed installation mode.

The coordinator retained a private `.make-docs/agentics/skills/` installation layer from earlier authority. That was our error, not an owner clarification of an approved outcome. The owner reported that a prior Skill installation had already been removed for this same mistake. The correction stays within W19 R5: one phase, three stages, existing task and acceptance IDs. Earlier private-layout test results are superseded for installation acceptance. They do not prove the standard layout.

Current target paths depend on scope and selected harnesses. The [phase matrix](01-skills-and-managed-adoption.md#standard-layout-correction) is binding. D-005 and affected implementation tasks are resolved by the final corrected proof; no previous private-layout proof accepts this correction.

## Phase Map

| File | Purpose |
| --- | --- |
| [Phase 1: Skills and Managed Adoption](01-skills-and-managed-adoption.md) | Promote and package Skills, add reviewed adoption, then prove the shipped product and real maintainer adoption. |
| [Central evidence report](evidence.md) | Read actual A1–A14 results, package identities, and the review limits and owner acceptance gate. |

## Usage Notes

- Complete the three stages in order within the single phase. Stage gates require evidence; they do not create extra phases.
- Keep the seven Skills independently usable. Preserve explicit-request policies and the existing workflow authority.
- Use public installed CLI commands for maintainer setup and adoption after the package has passed isolated checks. Do not copy upstream files into the dogfood instance by hand.
- Required installation and adoption state belongs in the global Store. Work evidence is a project breadcrumb, not a local operation plan, receipt, queue, or fallback.
- [D-005](../../prd/03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations) is resolved by standard-layout delivery and the safe real upgrade. The bundled first-party decision is settled in Q-001.
- Formal Unassisted Goal Testing and new deferred-obligation IDs are `not-needed-now` at drafting. Revisit the testing decision against the actual implementation; do not invent IDs or imply a test ran.

## Intended Follow-On

This handoff is advisory-default-but-overridable. The owner satisfied the backlog acceptance gate on 2026-09-09 and authorized implementation.

- Route: `implementation-loop`; owner backlog acceptance is recorded.
- Next step: Create the owner-requested implementation commit from this accepted closeout. Keep W20 and W21 paused pending separate resume instructions.
- Why: The backlog turns the accepted direction and current PRDs into a bounded implementation queue.
- Coordinate Handoff: Use W19 R5 P1 for phase evidence, history, and a later authorized commit. Do not resume W20 or W21, publish, or commit from this handoff alone.

Closeout: [W19 R5 P1 history](../../../.make-docs/archive/history/2026-09-09-w19-r5-p1-skills-and-managed-adoption.md). The package stays in place; no archive move was requested.
