<!-- make-docs:begin -->
# Designs Router

This directory is an output target for design docs.

## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-04-16-authentication-flow.md`

## Agent Instructions

- Before writing, read `.make-docs/references/system/design-workflow.md`, `.make-docs/contracts/system/design-contract.md`, and `.make-docs/templates/system/design.md`.
- Use `.make-docs/contracts/system/design-contract.md` as the authority for lineage, required headings, and follow-on links.
- Always apply date-slug naming.
- Do not backdate designs — use today's date.
- Designs are living documents — update them when decisions change.
- Use `docs/designs/2026-06-25-v2-documentation-asset-ia-hard-move.md` as the superseding authority for v2 asset-IA path assumptions in earlier designs. Preserve old path text only when it is explicitly historical lineage.
- Link to related plans, PRD docs, or work items where relevant.
- Archived designs live in `docs/assets/archive/designs/`; never archive unless the user explicitly asks. See `docs/assets/archive/AGENTS.md`.
<!-- make-docs:end -->
