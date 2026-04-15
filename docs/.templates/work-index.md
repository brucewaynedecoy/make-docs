# {{TITLE}}

> In v2, work backlogs are directories. This template is the shape of the `00-index.md` entry-point file. Phase detail lives in sibling `0N-<phase>.md` files (see `work-phase.md`). See `docs/.references/wave-model.md` for W/R semantics.

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
