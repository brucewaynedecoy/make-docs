---
title: "Phase 5: Agent Twin and Config"
kind: "work"
status: "active"
coordinate: "W29 R0 P5"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 5: Agent Twin and Config

## Purpose

Give agents without the CLI the same work rules, and give projects one portable place for work settings.

## Overview

The upstream template gains `make-docs://system/reference/work-store.md`. The config validator accepts a `work` block. The tracker connection contract is written down in the same resource.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A project without the CLI keeps `docs/work/` as the authority and uses the same rules ([PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-STORE-6, R-WORK-QUEUE-11, R-WORK-TRACKER-1 to R-WORK-TRACKER-3).
- Intended human outcome: an agent with no CLI gives the same readiness answer as the CLI.
- Human-facing surface or indirect effect: the `work-store` reference and the `work` config block.
- Implementation work: upstream resource, config schema, package and dogfood projection.
- Evidence source or testing type selected under current authority: twin parity on the P1 fixtures and byte parity across template, package, and dogfood.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Config validation, resource byte parity, and twin parity. |
| Performance Testing | not-needed-now | No performance candidate in this phase. |
| Guided Progress Review | not-needed-now | The resource follows the accepted catalog. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Resource and config

### Tasks

- [ ] T1: Author `work-store.md` in `packages/docs/template/`. Cover readiness, claims, report, close, sync, conflicts, and the tracker connection contract for an agent that edits files directly.
- [ ] T2: State in the resource that it is the agent twin of the P4 operations, and that a change to either form needs a review of the other.
- [ ] T3: Add the `work` block to the config schema: `projection` (default `on`) and `tracker` (connection name and field map).
- [ ] T4: Reject state fields, IDs, digests, receipts, and secrets in the `work` block.
- [ ] T5: Project the resource into the package, then into this repo's dogfood copy.
- [ ] T6: Point routers that name work backlog rules at the new resource where an agent needs it.
- [ ] T7: State in the resource that quick items live only in the work store, how `make-docs://project/<project>/tasks/` and `.../backlog/` URIs name a project and its work, and that a checkout without the CLI or a Store reads `docs/work/` directly and has no quick items.
- [ ] T8: Validate `projectName` in config (PRD 24 R-CONFIG-STATE-9), and have setup propose the checkout folder name in the PRD 38 R-ID-8 form.
- [ ] T9: Add the sync rules that W29 R0 P3 added to PRD 52 (R-WORK-SYNC-14 to R-WORK-SYNC-16, and the first-sync, copies-off, and phase-title edits) to the rule catalog and to the `sync` and `first-import` sections of the agent form, with parity fixtures.
- [ ] T10: Give older backlogs explicit status lines, so the all-tasks-checked fallback of PRD 52 R-WORK-QUEUE-20 is needed less over time: for example a `make-docs project doctor` finding for a phase file with no status line, with a reviewed fix that adds the status line that its tasks show. Owner decision of 2026-11-23 on W29 R0 P4 review finding 7; not built in P4.

### Acceptance criteria

- A22: Template, provider inventory, and dogfood bytes match.
- A23: The agent twin and the CLI give the same answer on every P1 parity fixture.
- A24: Config validation accepts the `work` block and rejects state fields in it.

### Dependencies

- P1. Final text after P4 behavior is stable.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
