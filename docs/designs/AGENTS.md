# Designs Directory

This directory contains architectural decisions and design documents.

## Purpose

Designs capture **what** was decided and **why**. They record architectural choices, interface contracts, and implementation approaches along with the alternatives that were considered and rejected.

## Naming Convention

Pattern: `YYYY-MM-DD-<slug>.md`

- Prefix with the creation date (today's date, never backdated).
- Slug: lowercase, hyphens only, no special characters.
- Example: `2026-03-04-authentication-flow.md`

## References and Templates

- Use `docs/.templates/design.md` when generating a new design doc.
- Use `docs/.references/design-contract.md` for required sections and follow-on routing.
- Use `docs/.references/design-workflow.md` for request-to-design intake, create-vs-update rules, and lineage handling.
- Design documents are governed by `docs/.references/design-contract.md`, not `docs/.references/output-contract.md`.

## Agent Instructions

- Always apply date-slug naming.
- Do not backdate designs — use today's date.
- Prefer updating an existing related design when the decision area clearly matches; otherwise create a new dated design doc.
- Designs are living documents — use the lineage rules in `docs/.references/design-contract.md` when a material update changes prior design intent.
- Link to related plans, PRD docs, or work items where relevant.
