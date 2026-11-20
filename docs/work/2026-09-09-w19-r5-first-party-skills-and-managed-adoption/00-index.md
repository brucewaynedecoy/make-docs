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
| [Phase 2: Adoption With Existing Native Links](02-adoption-with-existing-native-links.md) | Revision Phase for P1: let reviewed adoption keep existing native Skill links (D-053). |
| [Central evidence report](evidence.md) | Read actual A1–A19 results, package identities, and the review limits and owner acceptance gate. |

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

## Change History

### 2026-11-18 — W19 R5 P2

- Kind: `revision-phase`
- Affected scope: New P2 t1–t3 and A15–A17, revising completed P1.
- Previous scope: P1 delivered reviewed adoption of existing first-party Skill copies. Its apply step rejected projects whose native Skill links already existed, with "Invalid predeclared native copy fallback."
- Replacement scope: P2 declares a copy fallback only for a native link that the plan creates. Existing links stay links, and replaced bytes are backed up.
- Rationale: The defect blocked the W28 R0 Skill sync of this repository and also affects released 2.0.8. It changes one P1 result and passes no revision Wave test.
- PRD decision: `none` — PRD 28 R-SKILL-ADOPT-2 and R-SKILL-ADOPT-3 already require adoption to review and reconcile file and link identities.
- Owner approval: Tyler, 2026-11-18 11:00 PM CST, relayed by the coordinator. He chose a revision Phase over a new W19 R9.
- Source: [Phase 2: Adoption With Existing Native Links](02-adoption-with-existing-native-links.md)

### 2026-11-19 — W19 R5 P2

- Kind: `edit`
- Affected scope: P2 t4 and A18.
- Previous scope: P2 declared a copy fallback only when the native link path was missing before the plan. An outdated native folder that adoption removes and then replaces with a link lost its fallback, so a refused link could not fall back to a copy.
- Replacement scope: P2 keeps a fallback for every planned missing-to-link step and drops it only for links that already match. Tests cover a refused link, which uses the copy mirror, and an allowed link.
- Rationale: CodeRabbit review of PR #65 (Major). This completes P2's own A17 promise inside its unmerged PR, so it is recorded as an edit of P2 rather than a new revision Phase.
- PRD decision: `none` — PRD 28 already requires the copy-mirror fallback.
- Owner approval: Tyler, 2026-11-19 12:05 AM CST, relayed by the coordinator.
- Source: [Phase 2: Adoption With Existing Native Links](02-adoption-with-existing-native-links.md)

### 2026-11-20 — W19 R5 P2

- Kind: `edit`
- Affected scope: P2 t5 and A19.
- Previous scope: P2 ended with the copy-fallback fix and its checks on a base without W28 R0. D-053 lived only on the W28 R0 branch, and P2 recorded no package candidate digest.
- Replacement scope: P2 merges `main` with W28 R0, repeats the checks and the throwaway adoption, closes D-053 in PRD 03, and records the 2.0.9 candidate digest as its last change.
- Rationale: PR #64 merged W28 R0 into `main` on 2026-11-20, which brought D-053 and the 2.0.9 candidate digest into `main`. P2 changes the package, so the reviewed digest must match its content.
- PRD decision: `update-existing` — PRD 03 closes D-053. PRD 28 R-SKILL-ADOPT-2 and R-SKILL-ADOPT-3 do not change.
- Owner approval: Tyler, relayed by the coordinator on 2026-11-20: merge `main` in, close D-053, and record the digest last.
- Source: [Phase 2: Adoption With Existing Native Links](02-adoption-with-existing-native-links.md)
