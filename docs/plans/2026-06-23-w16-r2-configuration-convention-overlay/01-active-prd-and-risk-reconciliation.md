# Active PRD and Risk Reconciliation

## New PRD

- Add [24 Revise Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md).
- Treat it as a W16 revision because it narrows earlier lifecycle terminology-overlay intent and follows W16 R1 generated metadata handoff work.

## Existing PRDs to Update

- [00-index.md](../../prd/00-index.md): add PRD 24 to reading order, document map, source anchors, audience paths, and intended follow-on.
- [02-architecture-overview.md](../../prd/02-architecture-overview.md): record `.make-docs/config.yaml` as optional project-owned configuration and presentation input, not routing authority.
- [05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md): require install, reconfigure, backup, audit, provider refresh, and recovery behavior to preserve project-owned config.
- [06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md): require template-first handling for any default config template and generated prose labels.
- [10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md): add package proof for config template parity and local config preservation.
- [14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md): clarify lifecycle labels can be presented differently but lifecycle contracts and handoffs remain canonical.
- [21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md): add local project config as a custom/project-owned `.make-docs/` surface.
- [22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md): add custom persona entries and relabeling without changing schema keys or primitive values.
- [23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md): make config overlays presentation-only for generated prose, never metadata keys or enum values.

## Risk Register Updates

- Q-011: answer the structural part. Configuration is presentation-only; canonical paths, metadata, and W/R/P lineage remain stable.
- Q-009 and R-011: persona config may add or relabel persona entries but must preserve slug, label, description, primitive, and accepted primitive values.
- R-010: configuration reduces software-biased output by allowing labels in prose and CLI output.
- R-004: config introduces new duplicated display-label surfaces that need focused validation.
- D-014 and R-003: default config templates must follow source-first package and dogfood parity.
- R-013: config backfill must be planned with relocation mappings.
- R-014: config validation must land in CLI/shared validation, not only scripts.
- Q-012: future shared agentic surfaces may render labels but must route through canonical identifiers.

## No-New-PRD Rationale Not Used

The design introduces a new active configuration boundary and partially closes Q-011, so an in-place-only reconciliation would hide changed requirements. PRD 24 is required.
