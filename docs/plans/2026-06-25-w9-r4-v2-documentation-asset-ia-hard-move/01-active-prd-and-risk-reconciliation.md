# Active PRD and Risk Reconciliation

## Purpose

Make the accepted pivot authoritative in the active PRD set before implementation planning proceeds.

## Scope

Update PRDs in place because the affected surfaces are future-facing or still being reworked. Do not add a new numbered PRD change doc for the pivot.

## Required Updates

- Update [PRD 21](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md) so `.make-docs/**` owns contracts, references, scripts, templates, agentics, config, manifest, runtime provenance, and instruction routers without keeping a separate future top-level prompt family unless a later design reintroduces one.
- Update [PRD 22](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) so `docs/assets/**` contains `archive`, `artifacts`, `breadcrumbs`, `guides`, and `playbooks`.
- Update [PRD 00](../../prd/00-index.md) so the document map and intended follow-on point to W9 R4 and the corrected asset IA.
- Update [PRD 03](../../prd/03-open-questions-and-risk-register.md) so R-013 records that the mapping decision is settled while relocation and validation remain open implementation work.

## Non-Goals

- Do not rewrite historical PRD evidence only because it mentions paths that existed when the evidence was written.
- Do not move files during PRD reconciliation.
- Do not create or archive PRD namespace entries.

## Validation

- PRD 21 and PRD 22 cite the W9 R4 design and plan as source anchors.
- Future-facing PRD text names `docs/assets/artifacts/**`, `docs/assets/archive/**`, and `docs/assets/breadcrumbs/**`.
- Future-facing PRD text does not name top-level `docs/archive/**` as a shipped v2 target.
