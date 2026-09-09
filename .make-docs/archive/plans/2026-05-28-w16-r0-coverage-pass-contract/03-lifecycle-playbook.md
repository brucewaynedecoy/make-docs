# Phase 03 — Lifecycle Playbook (Build-Stack, Agent/Maintainer Persona)

## Purpose

Author make-docs's own dogfooded lifecycle playbook: the human-facing
narrative map of the arc, written for the agent persona, that cites
the anchor. This is the first instance of the persona-scoped *playbook* output
type.

## What to build

- A playbook at `docs/library/playbooks/<persona>/make-docs-lifecycle.md`
  (persona = agent), with a `persona:` frontmatter
  field.
- Per-stage sections in a uniform shape: Purpose · Inputs · Decision points ·
  Suggested assists (skills, references, templates, prompts — never required) ·
  Exit criteria · Handoff.
- Narrates inputs → Segment 1 → Segment 2 (loop plus coverage band) →
  Segment 3, in the anchor's neutral vocabulary.
- Frames itself as a *map, not automation*: no enforced order, no gating.

## Key decisions

- A playbook is persona-scoped procedural content; the make-docs lifecycle
  playbook is the dogfooded instance of that output type.
- Build-stack (how to build) versus run-stack (how a deployed agent operates):
  this is a build-stack playbook.
- It lives under `docs/library/playbooks/`. Guides moving to
  `docs/library/guides/` is part of the broader restructure (a later wave); for
  this wave, create the playbook home and note the pending guides move (Q-3 in
  the overview).

## Acceptance criteria

- The playbook exists with a `persona:` frontmatter field and the uniform
  per-stage shape.
- It cites the anchor for ordering, uses neutral vocabulary, and declares
  itself non-prescriptive.
- It is discoverable from the README and the `docs/` router. No placeholders
  remain.

## Dependencies

Cites the anchor (02) and the coverage-pass contract (01).
