# Phase 01: Requirements and Register Reconciliation

## Purpose

Finalize the PRD and risk-register changes required before implementation touches source or template files.

## Source PRDs

- [../../prd/22-project-documentation-asset-model.md](../../prd/22-project-documentation-asset-model.md#requirements)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md)

## Tasks

- [x] t1: Confirm PRD 22 is linked from [../../prd/00-index.md](../../prd/00-index.md), audience paths, source anchors, and intended follow-on. (`W9R3-P1-T1`)
- [x] t2: Ensure baseline docs cite PRD 22 where they mention `docs/assets/**`, guides, playbooks, archive placement, or persona targeting. (`W9R3-P1-T2`)
- [x] t3: Update `Q-009`, `Q-014`, `R-011`, `R-012`, and `R-013` so their decision/follow-up text matches PRD 22. (`W9R3-P1-T3`)
- [x] t4: Extend dogfood, parity, package, and path risks with guide/playbook/archive migration surfaces. (`W9R3-P1-T4`)

## Acceptance Criteria

- PRD 22 is discoverable and cited by every affected active PRD.
- The risk register no longer describes persona schema as undefined.
- The W16 `docs/library/playbooks/**` decision remains historically accurate while naming the v2 canonical target.
- No active PRD treats `docs/assets/**` as both reader-facing storage and make-docs tool-resource storage.

## Validation

- Run `git diff --check`.
- Run focused Markdown link checks for touched PRD files.
- Reindex jdocmunch after reconciliation.

## Implementation Notes

Phase 1 reconciled the live PRD set before source or template migration. Touched PRD paths: `docs/prd/01-product-overview.md` and `docs/prd/03-open-questions-and-risk-register.md`. PRD 22 was already discoverable from [../../prd/00-index.md](../../prd/00-index.md) reading order, document map, source anchors, audience paths, and intended follow-on. Baseline PRDs 02, 05, 06, 09, 10, 14, 19, and 21 already cited PRD 22 for the reader-facing asset, playbook, archive, persona, template, and package implications; this phase added the missing product-overview citation in [../../prd/01-product-overview.md](../../prd/01-product-overview.md) and narrowed stale risk-register wording in [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) so `docs/assets/**` no longer reads as both reader-facing storage and make-docs tool-resource storage.

`Q-009` remains closed by PRD 22's persona schema. `Q-014` remains closed with W16 `docs/library/playbooks/**` recorded as transitional. `R-011` is narrowed to implementation/configuration drift, `R-012` remains closed by the playbook-content versus invocation boundary, and `R-013` now names the PRD 21/PRD 22 namespace split explicitly. Dogfood, path, packed-template, and parity risks already include reader-facing guide/playbook and archive migration proof surfaces.

Developer-guide verdict: `none`; this phase reconciled active requirements but did not create durable maintainer procedure beyond the PRD/register contract. User-guide verdict: `none`; no shipped user workflow changed. PRD verdict: `baseline-change-note` plus `risk-register-update`; no new PRD doc was needed because PRD 22 already owns the requirement surface. Manual/UAT remains deferred until the full W9 R3 wave is complete.
