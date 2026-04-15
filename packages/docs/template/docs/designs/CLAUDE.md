# Designs Router

This directory is an output target for design docs.

## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-03-04-authentication-flow.md`

## Archive

- `archive/` contains design documents for work that has already been planned and implemented. Never move design docs here unless explicitly asked by the user.
- When referencing an archived design, use its path under `archive/` — do not move it back.

## Agent Instructions

- Before writing, read `docs/.references/design-workflow.md`, `docs/.references/design-contract.md`, and `docs/.templates/design.md`.
- Use `docs/.references/design-contract.md` as the authority for lineage, required headings, and follow-on links.
- Always apply date-slug naming.
- Do not backdate designs — use today's date.
- Designs are living documents — update them when decisions change.
- Link to related plans, PRD docs, or work items where relevant.
