<!-- make-docs:begin -->
# Designs Router

This directory is an output target for design docs.

## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-04-16-authentication-flow.md`

## Agent Instructions

- Before writing, use a valid local `.make-docs/system/references/design-workflow.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/design-workflow.md`; use a valid local `.make-docs/system/contracts/design-contract.md` body or run `make-docs resource read make-docs://system/contract/design-contract.md`; and use a valid local `.make-docs/system/templates/design.md` body or run `make-docs resource read make-docs://system/template/design.md`.
- Use `.make-docs/system/contracts/design-contract.md` or its `make-docs://system/contract/design-contract.md` fallback as the authority for lineage, required headings, and follow-on links.
- Always apply date-slug naming.
- Do not backdate designs — use today's date.
- Designs are living documents — update them when decisions change.
- Use `docs/designs/2026-06-25-v2-documentation-asset-ia-hard-move.md` as the superseding authority for v2 asset-IA path assumptions in earlier designs. Preserve old path text only when it is explicitly historical lineage.
- Link to related plans, PRD docs, or work items where relevant.
- Archived designs live in `.make-docs/archive/designs/`. Before first use, run `make-docs project surface ensure archive`. Never archive unless the user explicitly asks.
<!-- make-docs:end -->
