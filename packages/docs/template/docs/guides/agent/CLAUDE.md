# Agent Session Guides

This directory is the output target for agent session summary breadcrumbs — point-in-time records written at the end of a work session.

## Naming Convention

Pattern: `YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`

- Example: `2026-04-15-w1-r0-p1-summary.md`
- Slug defaults to `summary`; use a more specific slug when the session focus is narrower. Defer to the contract for W/R/P resolution.

## Agent Instructions

- Before writing, read `docs/.references/agent-guide-contract.md` (authority).
- Use `docs/.templates/agent-guide.md` as the structural starting point.
- Use today's date. Never backdate.
- Create a new file per session — never append to a prior session's summary.
- Use relative Markdown links when referencing files touched during the session.
