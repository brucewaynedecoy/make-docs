# Phase 02 — Always-Read Lifecycle Anchor

## Purpose

Author a thin, authoritative reference (working name
`docs/assets/references/lifecycle.md`) that lays out make-docs's full lifecycle
arc and its *default* ordering, so an agent landing anywhere knows the whole
arc and the preferred next step — without being forced into it.

## What to build

- **The arc, as bands** (not a flat list):
  - Optional inputs: the `docs/artifacts/` seed (an input surface, not a
    stage).
  - Segment 1 — Plan (linear, gated, roughly one-time):
    Design → Plan → PRD → Work backlog.
  - Segment 2 — Build (looped per phase): Implement (including automated
    tests) → cross-cutting coverage-pass band → Commit / phase gate.
  - Segment 3 — Release & beyond (per release): Release / publish →
    Archival → Retrospective.
  - Cross-cutting: the coverage-pass band and the persona lens.
- **Default-ordering principle:** implementation normally *derives from a work
  backlog*, which derives from a PRD, which derives from a plan. Route through
  them by default.
- **Straddle rule** (authoritative, not absolute): default to the arc; allow
  skip / reorder / revisit when the user directs it or the situation warrants;
  and **surface any departure** rather than taking it silently. The failure
  mode to kill is the *silent* skip, not the skip.
- **Domain-neutral vocabulary:** "release / publish" means *make the work
  available to its audience* (deploy code, publish docs, push to source
  control, hand off a report) — no software-specific assumptions anywhere in
  the arc.
- **Always-read mechanism:** how the anchor enters the read path (a router
  pointer) without bloating every turn.

## Acceptance criteria

- The file exists and states the arc, the default ordering, the
  derive-from-backlog principle, the surface-departures straddle, and the
  neutral vocabulary.
- It is reachable from the root and `docs/` routers. It contains no hard
  "never skip" language and no placeholders.

## Dependencies

Cites the coverage-pass contract (01) for the band. Feeds the playbook (03)
and the stage follow-on handoffs (04).
