# Phase 02: Lifecycle Anchor

## Purpose

Author the always-read lifecycle anchor: a thin, authoritative reference that
lays out the full lifecycle arc and its default ordering, so an agent landing
anywhere knows the whole arc and the preferred next step — without being forced.

## Overview

The anchor is what makes the lifecycle nudge agents. It states the arc, the
default forward path, and the principle that implementation derives from a work
backlog, while keeping departures allowed and surfaced rather than forbidden.

## Source PRD Docs

- [historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`)
- [02-architecture-overview.md](../../../../prd/02-architecture-overview.md)

## Stage 1 - Author the anchor

### Tasks

- [x] t1: Create the lifecycle anchor reference (working name `docs/assets/references/lifecycle.md`) describing the arc as bands: optional `docs/artifacts/` inputs; Segment 1 (Design -> Plan -> PRD -> Work backlog); Segment 2 (Implement -> coverage-pass band -> Commit, looped per phase); Segment 3 (Release/publish -> Archival -> Retrospective).
- [x] t2: State the default-ordering principle: implementation normally derives from a work backlog, which derives from a PRD, which derives from a plan.
- [x] t3: Write the straddle rule — default to the arc; allow skip/reorder/revisit when the user directs it or the situation warrants; surface any departure rather than taking it silently; no hard "never skip" gate.
- [x] t4: Use domain-neutral vocabulary throughout, defining "release / publish" as making the work available to its audience (deploy code, publish docs, push to source control, hand off a report).
- [x] t5: Wire the anchor into the read path via a router pointer (root and `docs/` routers) without bloating every turn.

### Acceptance criteria

- The file states the arc, the default ordering, the derive-from-backlog principle, the surface-departures straddle, and the neutral vocabulary.
- It is reachable from the root and `docs/` routers.
- It contains no hard "never skip" language and no placeholders.

### Dependencies

- Phase 01 — the anchor cites the coverage-pass contract for the coverage band.
