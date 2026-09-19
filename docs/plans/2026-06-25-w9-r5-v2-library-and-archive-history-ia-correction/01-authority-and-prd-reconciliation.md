# Authority and PRD Reconciliation

## Purpose

Define the authority pass that makes W9 R5 the current asset-IA correction before package or dogfood mutation.

## Scope

- Add W9 R5 design authority.
- Reconcile active PRDs in place.
- Update active plan/work routers and unresolved backlog prefaces so downstream workers apply W9 R5 before older W9 R4 path assumptions.
- Preserve completed W9 R4 records as historical evidence.

## Required Updates

- PRD 22 must name `docs/assets/library/**` and `docs/assets/archive/history/**` as the effective managed project asset paths.
- PRD 03 must revise R-004/R-013 and, if useful, Q-014 to explain the corrective path move.
- PRDs 02, 09, 19, and 24 must stop naming `docs/assets/guides/**` or `docs/assets/breadcrumbs/**` as future/current shipped targets.
- Plan/work root routers must point pre-W9 R5 consumers to this plan/work bundle.

## Validation

- Search active `docs/prd/**`, active plan/work routers, and unresolved future work indexes for old future-facing targets.
- Confirm old references remain only where factual historical evidence is intentional.
