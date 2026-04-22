# Designs Router

This directory is an output target for design docs.

## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-04-16-authentication-flow.md`

## Agent Instructions

- Before writing, read `docs/assets/references/design-workflow.md`, `docs/assets/references/design-contract.md`, and `docs/assets/templates/design.md`.
- Use `docs/assets/references/design-contract.md` as the authority for lineage, required headings, and follow-on links.
- Always apply date-slug naming.
- Do not backdate designs — use today's date.
- Designs are living documents — update them when decisions change.
- Link to related plans, PRD docs, or work items where relevant.
- Archived designs live in `docs/assets/archive/designs/`; never archive unless the user explicitly asks. See `docs/assets/archive/AGENTS.md`.
