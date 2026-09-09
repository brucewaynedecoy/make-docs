---
title: "Project Assets and Persona Discovery"
kind: "work"
status: "completed"
coordinate: "W19 R4"
source:
  type: "prd"
  path: "docs/prd/22-project-documentation-asset-model.md"
follow_on:
  route: "implementation-loop"
  next_prompt: "make-docs://system/reference/execution-workflow.md"
  why: "The reviewed backlog is the implementation queue for the current asset, Persona, and migration requirements."
  coordinate_handoff: "Execute the authorized W19 R4 P1; keep W20 R0 and W21 R0 paused. Require evidence and phase acceptance before closure."
---

# Project Assets and Persona Discovery

## Purpose

Implement the current asset, Persona, configuration, and migration requirements in one phase. This backlog follows the [design](../../designs/2026-09-09-project-assets-and-persona-discovery.md) and [plan](../../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md). Product authority remains in the PRDs linked by the phase.

The owner accepted the package and authorized W19 R4 implementation after package commit `532b29cf`. **Implementation started on 2026-09-09.** Tasks remain unchecked until their required evidence is complete. W20 R0 and W21 R0 remain paused.

The [evidence and experience report](./evidence.md) retains the fresh-context test and the verified real migration. The prior package passed all 1,077 tests. Owner review then found missed current Persona names in guide resources and related contracts. The correction, new package, installed refresh and final current-guide audit are complete. The corrected build passed 1,087 tests; final defaults passed 50/50. The owner accepted the corrected phase on 2026-09-09 and requested closeout and commit. This closeout records phase completion. The implementation commit is authorized and remains the next action.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-assets-and-persona-cutover.md](01-assets-and-persona-cutover.md) | One phase: effective audience/discovery rules, reviewed layout operations, then package and dogfood proof. |

## Usage Notes

- R3 closed at commit `dabd0b36`. Reuse its Store-owned operation and recovery service. Do not reopen R3 or create a second migration journal.
- Keep [W20 R0](../2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md) and [W21 R0](../../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md) paused through this interrupt.
- Execute the phase's stages in order. Task IDs continue across the phase. A passed test is evidence for its named case, not for an untested case or for owner acceptance.
- Read current PRDs before implementation. The design records choices and the plan records sequencing; neither replaces the PRD contract.
- Confirmed drift is [D-032](../../prd/03-open-questions-and-risk-register.md#d-032-project-asset-consolidation-and-persona-discovery-remain-incomplete). Do not close it until the finite matrix and full active-tree disposition are proved.
- No new deferred-obligation or `NUAT-###` identity is created by this package. Use the existing register and PRD 46 if later evidence requires one. Formal Unassisted Goal Testing is `not-needed-now` for the bounded fresh-context agent check; it is not a claim that an agent check proves qualified human testing.
- The added reservation of `archive`, `artifacts`, `library`, and `playbooks` as Persona slugs is a concrete proposed detail for this package review. `project` is reserved by the approved direction. Existing conflicting custom entries need reviewed retained-content mapping.
- Ordinary asset work without the CLI remains possible in an initialized or cloned project with bootstrap routers. Required CLI-managed migration state has no local fallback.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: Create the owner-requested implementation commit from the accepted closeout. Keep W20 R0 and W21 R0 paused pending separate resume instructions.
- Why: The backlog turns current product requirements into a finite implementation queue with visible completion evidence.
- Coordinate Handoff: Use W19 R4 P1 for implementation evidence, phase history, and later commits. Keep R3 closed and W20 R0/W21 R0 paused. Drafting this package does not start the phase.

Closeout: [W19 R4 P1 history](../../../.make-docs/archive/history/2026-09-09-w19-r4-p1-project-assets-and-persona-discovery.md). The package remains in place; no archive move was requested.
