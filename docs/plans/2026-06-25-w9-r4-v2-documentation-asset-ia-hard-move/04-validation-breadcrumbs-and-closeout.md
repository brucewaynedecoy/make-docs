# Validation Breadcrumbs and Closeout

## Purpose

Define the validation and closeout expectations for W9 R4.

## Validation Requirements

- Run targeted path-reference checks for top-level `docs/artifacts/**`, top-level `docs/archive/**`, `docs/assets/history/**`, and `docs/assets/breadcrumbs/**`.
- Run local Markdown link checks for touched docs.
- Run `git diff --check`.
- Run package/template validation once implementation changes touch template or CLI surfaces.
- Preserve historical references where they are factual evidence.

## Breadcrumb Handling

Use `docs/assets/breadcrumbs/**` for W9 R4 closeout after the migration work changes the live breadcrumb contract. The closeout record should explicitly state that existing `docs/assets/history/**` records were preserved as migration evidence.

## Closeout Criteria

- Active PRDs record the pivot.
- The W9 R4 work backlog is generated and dependency-ordered.
- Implementation phases have clear acceptance criteria and do not leave IA decisions to implementers.
- Final closeout records whether manual/UAT is worthwhile after implementation, not during planning.
