---
title: "{{TITLE}}"
kind: "work"
status: "active"
coordinate: "W{{W}} R{{R}}"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the plan and PRD contract."
  coordinate_handoff: "Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase."
# source:
#   type: "prd"
#   path: "{{SOURCE_PATH}}"
---

# {{TITLE}}

> In v2, work backlogs are directories. This template is the shape of the `00-index.md` entry-point file. Phase detail lives in sibling `0N-<phase>.md` files (see `work-phase.md`). See `.make-docs/references/system/wave-model.md` for W/R semantics.

## Purpose

Describe what this work directory covers and how to navigate its phase files.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-{{PHASE_SLUG}}.md](./01-{{PHASE_SLUG}}.md) | {{PHASE_ONE_PURPOSE}} |
| [02-{{PHASE_SLUG}}.md](./02-{{PHASE_SLUG}}.md) | {{PHASE_TWO_PURPOSE}} |

## Usage Notes

- Read phases in order unless otherwise noted.
- Keep phase files dependency-ordered.
- Every phase file must include `## Source PRD Docs`.
- Link every phase back to the relevant PRD docs.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with the first applicable phase in this backlog and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the plan and PRD contract.
- Coordinate Handoff: Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase.
