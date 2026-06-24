# Phase 04 — Stage Follow-On Handoffs

## Purpose

Give plans, PRDs, and work backlogs the same `## Intended Follow-On` handoff
that design docs already carry, so the design → plan → PRD → work → implement
chain stops breaking at each seam.

## What to build

Extend the relevant contracts and templates so each stage's primary output
records a follow-on:

- **Plan** (`00-overview.md`) → recommended next: generate the PRD.
- **PRD** (`00-index.md`) → recommended next: generate the work backlog.
- **Work backlog** (`00-index.md`) → recommended next: the implementation
  loop.

Each handoff carries a Route, a Next step, a Why, and a coordinate handoff so
the next stage inherits the W/R/P position.

## Key decisions (wording)

- The follow-on names the *advisable* next workflow; it is the default the
  agent takes when not otherwise steered.
- It is explicitly overridable — the user wins. Reuse the design contract's
  phrasing: "authoritative unless the user explicitly overrides it."
- It is **not** a gate or a precondition. No stage "fails" for lacking a
  follow-on.

## Acceptance criteria

- The plan, PRD, and work templates plus their contracts define the follow-on
  with the advisory-default-but-overridable framing.
- No hard gating is introduced. No placeholders remain.

## Dependencies

Complements the anchor (02): the anchor is the global map; these handoffs are
the per-document forward pointers.
