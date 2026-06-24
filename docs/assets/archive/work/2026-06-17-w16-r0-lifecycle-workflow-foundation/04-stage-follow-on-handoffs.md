# Phase 04: Stage Follow-On Handoffs

## Purpose

Give plans, PRDs, and work backlogs the same `## Intended Follow-On` handoff that
design docs already carry, so the design -> plan -> PRD -> work -> implement
chain stops breaking at each seam.

## Overview

The anchor is the global map; these handoffs are the per-document forward
pointers. Each names the advisable next workflow as a default, while staying
overridable and non-gating.

## Source PRD Docs

- [14-add-lifecycle-workflow-foundation.md](../../../../prd/14-add-lifecycle-workflow-foundation.md)
- [02-architecture-overview.md](../../../../prd/02-architecture-overview.md)

## Stage 1 - Add the handoffs

### Tasks

- [x] t1: Extend `planning-workflow.md` and the `plan-overview.md` template so a plan's `00-overview.md` records an `## Intended Follow-On` recommending PRD generation as the next step.
- [x] t2: Extend `output-contract.md` and the PRD index template so the PRD set records an `## Intended Follow-On` recommending work-backlog generation as the next step.
- [x] t3: Extend the work backlog contract and the `work-index.md` template so a backlog records an `## Intended Follow-On` recommending the implementation loop as the next step.
- [x] t4: For each handoff, include a Route, a Next step, a Why, and a coordinate handoff, and word it advisory-default-but-overridable using the design contract's phrasing ("authoritative unless the user explicitly overrides it"); ensure it is not a gate or precondition.

### Acceptance criteria

- The plan, PRD, and work templates and their contracts define the follow-on with the advisory-default-but-overridable framing.
- No hard gating is introduced; no stage "fails" for lacking a follow-on.
- No placeholders remain.

### Dependencies

- Phase 02 — the handoffs complement the lifecycle anchor.
