---
title: "Phase 5: Coordinate Facts Corrections"
kind: "work"
status: "completed"
coordinate: "W28 R0 P5"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 5: Coordinate Facts Corrections

## Purpose

Correct three gaps that review found in completed, committed P2: a missing per-Wave `archived` fact, coordinate facts that ignored plan directories, and parity text that did not name `wave-model.md`.

Revises: [P2](02-cli-snapshot-facts-and-rule.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure. P2 was complete: done, closed out, and committed in `b7eb5dcd`. The fix does not reverse an approach, redo two or more completed Phases, or need its own design, so no revision Wave test passes.

Plan-only revisions such as W18 R15 and W19 R0 were missing from the revision lists. That is the collision the coordinate facts exist to prevent.

## Human Experience Outcome

- **Impact and governing promise:** `direct`, through agent output. A coordinate tells the reader the kind of change, so the facts behind a new `R` or `W` must count every existing coordinate.
- **Intended human outcome:** an agent that reads the snapshot sees every existing revision of a Wave, including plan-only ones, and whether the whole Wave is archived.
- **Human-facing surface:** the `make-docs run work backlog snapshot` output and its MCP projection.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing and a built-CLI snapshot of this repository.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SNAPSHOT-29 and R-BACKLOG-RULES-11 to R-BACKLOG-RULES-12.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Run the focused coordinate-fact tests, the backlog and registry tests, the build, and a built-CLI snapshot. |
| Performance Testing | not-needed-now | One extra directory listing per plan root. No target can change a current decision. |
| Guided Progress Review | not-needed-now | Fixtures and the real snapshot settle the facts. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md) (R-COORD-21)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- Owner review of P2 on 2026-11-18, relayed by the coordinator.

## Stage 1 - Corrections

### Tasks

- [x] t1: Update PRD 51 R-BACKLOG-SNAPSHOT-29 so that coordinate facts use the union of work and plan W/R directories, live and archived, and so that each Wave reports `archived`.
- [x] t2: In `snapshot.ts`, discover dated W/R plan directories under `docs/plans/` and `.make-docs/archive/plans/` for coordinate facts only. Add `archived` and `planPaths` to each Wave entry in `schemas.ts`. A Wave is archived only when every work and plan directory for it is archived.
- [x] t3: In `catalog.ts`, make the `parityMapping` of `BACKLOG-RULE-017` and `BACKLOG-RULE-018` name `wave-model.md` and its section URI. Confirm that `BACKLOG-AGENT-018` keeps its `oneSidedReason`.
- [x] t4: Add tests for a plan-only revision, a plan-only Wave, the per-Wave `archived` rule, and both parity mappings. Regenerate the backlog-review Skill bundles and the MCP App widget.

### Acceptance criteria

- A32: A work W1 R0 with plans W1 R0 and W1 R1 reports W1 revisions `[0,1]` and `nextRevision` 2. A plan-only W4 R0 raises `highestWave` to 4 and creates no work record.
- A33: A Wave whose work and plans are all archived reports `archived: true`. A Wave with any live work or plan directory reports `false`.
- A34: Both catalog parity mappings name `wave-model.md`. `BACKLOG-AGENT-018` keeps its instruction location and its one-sided reason.
- A35: The built-CLI snapshot of this repository lists W18 R15 and W19 R0, which exist only as plans, and keeps its diagnostic count unchanged.

### Dependencies

- P2 is complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed (23 focused tests, 399 backlog and registry tests, the build, and a built-CLI snapshot). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: The revision lists now match what an agent would find by scanning `docs/plans/` and `docs/work/`. No owner question was needed, because this is a clear revision Phase and the agent may decide it alone.
- Optional experience handoff: not applicable until P4.
- Explicit human acceptance gate: none.
- Evidence report: [P5 Coordinate Facts Corrections](evidence.md#p5-coordinate-facts-corrections).
- Phase / capability status: Phase complete on commit. Capability partial: Skills text (P3) and validation and review (P4) remain.
