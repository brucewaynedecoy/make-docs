# PRD Directory

This directory contains product requirement documents that describe what the product is and how it works.

## Purpose

PRDs are **descriptive** — they document what the product is and how it works. A PRD namespace may describe an existing codebase, define what should be built from a new idea or design, or evolve incrementally through additive change docs and revision docs.

## Naming Convention

Files must use the pattern: `NN-<slug>.md`

- NN is a zero-padded two-digit number.
- Fixed core: `00-index.md`, `01-product-overview.md`, `02-architecture-overview.md`, `03-open-questions-and-risk-register.md`, `04-glossary.md`.
- Adaptive baseline docs and change docs start at `05` and go up to `99`.
- Examples: `05-feature-map.md`, `08-enhance-auth-recovery.md`

## Management

- Only one active PRD namespace exists at a time under `docs/prd/`.
- The active namespace may evolve in place through appended change docs.
- Older PRD namespaces are archived under `docs/prd/archive/YYYY-MM-DD/`.

## PRD Template Files

Use the following templates from `docs/.templates/` when generating PRD documents:

### Fixed Core

- `00-index.md` — use `docs/.templates/prd-index.md`
- `01-product-overview.md` — use `docs/.templates/prd-overview.md`
- `02-architecture-overview.md` — use `docs/.templates/prd-architecture.md`
- `03-open-questions-and-risk-register.md` — use `docs/.templates/prd-risk-register.md`
- `04-glossary.md` — use `docs/.templates/prd-glossary.md`

### Adaptive

- **Subsystem doc** — use `docs/.templates/prd-subsystem.md`
- **Reference doc** — use `docs/.templates/prd-reference.md`

### Change Docs

- **Addition or enhancement doc** — use `docs/.templates/prd-change-addition.md`
- **Revision or removal doc** — use `docs/.templates/prd-change-revision.md`

## Reference Documents

Before generating or validating PRD documents, consult:

- `docs/.references/output-contract.md` — required paths, section headings, PRD tree rules, and archive rules.
- `docs/.references/execution-workflow.md` — step-by-step workflow for generating or evolving the active PRD namespace.
- `docs/.references/prd-change-management.md` — rules for evolving the active PRD namespace without replacing it.

## Agent Instructions

- Do not independently author full PRD namespaces — plan it and then orchestrate one or more teams of agents to generate the individual baseline or change docs required for the namespace.
- When creating a stub PRD doc, auto-increment the NN prefix from the highest existing number.
- Validate generated PRD documents against the section contracts in `docs/.references/output-contract.md`.
- For additive changes, enhancements, revisions, or removals, consult `docs/.references/prd-change-management.md` and use the matching change template.
