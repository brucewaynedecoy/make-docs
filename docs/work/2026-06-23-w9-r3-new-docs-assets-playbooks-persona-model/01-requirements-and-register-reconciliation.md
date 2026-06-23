# Phase 01: Requirements and Register Reconciliation

## Purpose

Finalize the PRD and risk-register changes required before implementation touches source or template files.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)

## Tasks

- [ ] `W9R3-P1-T1` Confirm PRD 22 is linked from [../../prd/00-index.md](../../prd/00-index.md), audience paths, source anchors, and intended follow-on.
- [ ] `W9R3-P1-T2` Ensure baseline docs cite PRD 22 where they mention `docs/assets/**`, guides, playbooks, archive placement, or persona targeting.
- [ ] `W9R3-P1-T3` Update `Q-009`, `Q-014`, `R-011`, `R-012`, and `R-013` so their decision/follow-up text matches PRD 22.
- [ ] `W9R3-P1-T4` Extend dogfood, parity, package, and path risks with guide/playbook/archive migration surfaces.

## Acceptance Criteria

- PRD 22 is discoverable and cited by every affected active PRD.
- The risk register no longer describes persona schema as undefined.
- The W16 `docs/library/playbooks/**` decision remains historically accurate while naming the v2 canonical target.
- No active PRD treats `docs/assets/**` as both reader-facing storage and make-docs tool-resource storage.

## Validation

- Run `git diff --check`.
- Run focused Markdown link checks for touched PRD files.
- Reindex jdocmunch after reconciliation.
