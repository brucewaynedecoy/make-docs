# Active PRD and Risk Reconciliation

## Purpose

Register the template/package/dogfood source-of-truth contract in the active PRD namespace without duplicating baseline docs or risk-register items.

## Required PRD Changes

- Add `docs/prd/06-template-contracts-and-generated-assets.md`.
- Update `docs/prd/00-index.md` reading order, document map, source anchors, audience paths, and intended follow-on.
- Annotate `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, and `docs/prd/10-packaging-validation-and-release-reference.md`.
- Update `docs/prd/03-open-questions-and-risk-register.md` entries D-006, D-007, D-014, Q-005, R-003, R-004, and R-007 rather than adding duplicate items.

## Acceptance Criteria

- PRD 19 states the effective requirement and impacted docs.
- Baseline docs point to PRD 19 from `### Change Notes`.
- The risk register keeps existing item IDs and narrows follow-up language around source-of-truth validation.
- The PRD index routes maintainers and agents through PRD 19 before implementation planning.
