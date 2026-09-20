# Active PRD and Risk Reconciliation

## Purpose

Register the `.make-docs/` tool directory and system/custom tier contract in the active PRD set.

## Required PRD Changes

- Add `docs/prd/21-project-tool-directory-and-resource-tiers.md`.
- Update the PRD index, architecture, installation/manifest, template, dogfood, packaging, W10 materialization, compatibility, source-of-truth, and conformance docs as needed.
- Update existing risk-register entries D-008, D-007, D-014, Q-005, Q-007, Q-012, R-003, R-004, R-006, R-007, and R-014 without duplicating IDs.

## Acceptance Criteria

- PRD 21 is discoverable from the active index.
- Existing docs distinguish `.make-docs/` runtime/tool resources from reader-facing `docs/assets/**`.
- Risk entries preserve existing IDs and describe the migration boundary.
