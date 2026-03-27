# Templates Directory

This directory contains templates for design docs, plans, PRD documents, and work backlogs.

## Files

### Design Templates

- `design.md` — Template for generated design docs in `docs/designs/`.

### Plan Templates

- `plan-prd-decompose.md` — Plan for reverse-engineering an existing codebase into a PRD set and rebuild backlog.
- `plan-prd.md` — Plan for generating a PRD set and implementation backlog from a new idea or design.
- `plan-prd-change.md` — Plan for additive changes, enhancements, revisions, or removals in the active PRD namespace.

### PRD Templates — Fixed Core

- `prd-index.md` — Template for `00-index.md`.
- `prd-overview.md` — Template for `01-product-overview.md`.
- `prd-architecture.md` — Template for `02-architecture-overview.md`.
- `prd-risk-register.md` — Template for `03-open-questions-and-risk-register.md`.
- `prd-glossary.md` — Template for `04-glossary.md`.

### PRD Templates — Adaptive

- `prd-subsystem.md` — Template for subsystem docs (`05-*` and above).
- `prd-reference.md` — Template for reference-only docs (`05-*` and above).

### PRD Templates — Change Docs

- `prd-change-addition.md` — Template for net-new capability additions and enhancements.
- `prd-change-revision.md` — Template for revisions, deprecations, and removals.

### Work Backlog Templates

- `work-backlog.md` — Single-file backlog.
- `work-backlog-index.md` — Index for a split backlog.
- `work-backlog-phase.md` — Individual phase file for a split backlog.

## Agent Instructions

- Use these templates as the starting point when generating any design, plan, PRD, or work document.
- Use `design.md` together with `docs/.references/design-workflow.md` and `docs/.references/design-contract.md` for request-to-design work.
- Do not modify template files — copy the structure into the target directory.
- Refer to `docs/.references/design-contract.md` for design-doc structure and to `docs/.references/output-contract.md` for plan, PRD, and work-doc structure.
- For additive changes, enhancements, revisions, or removals, also consult `docs/.references/prd-change-management.md` before choosing a change template.
