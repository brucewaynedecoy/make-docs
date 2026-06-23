# Active PRD and Risk Reconciliation

## Objective

Reconcile the active PRD set so purpose-led skill selection and alternate manifests become product requirements without weakening the no-default-skills, selected-skill, audit, and no-scripts contracts already accepted.

## PRD Updates

- Add PRD 27 as a revision because alternate manifest schema, purpose ids, source policy, and selection provenance are new requirements beyond PRD 12.
- Update PRD 08 as the owning skills subsystem doc.
- Update PRD 12 to preserve no-default-skills and `selectedSkills` as the executable state while allowing purpose-led UI metadata.
- Update PRD 07 for CLI and skills command behavior, including effective-manifest `all` expansion.
- Update PRD 10 for registry schema, alternate manifest, remote-pinned, and package validation.
- Update PRD 16 for package-boundary and skills delivery implications.
- Update PRD 18 for audit, backup, uninstall, and migration behavior around alternate manifest provenance.
- Update PRD 24 for canonical purpose ids versus configured labels.
- Update PRDs 25 and 26 for MCP/shared-operation and no-scripts boundaries.

## Risk Register Updates

- D-005 and Q-001 remain open because this plan does not choose bundled-local versus remote-fetch delivery.
- Q-007 is narrowed: alternate manifests and remote skill sources require immutable refs plus integrity metadata before installation.
- Q-012 and Q-013 remain open for shared plugin/skill install and plugin exposure flows.
- R-001, R-002, and R-006 gain alternate-manifest and selection-provenance audit implications.
- R-008 and R-014 stay open because purpose metadata must not replace the CLI/shared-core no-scripts migration.

## Acceptance

- The active PRD set has a clear PRD 27 owner.
- No updated PRD suggests first-party skills become mandatory or default-installed.
- No updated PRD treats purpose ids or configured labels as substitutes for resolved `selectedSkills`.
- Open questions that remain unresolved are left open with a concrete narrowed scope where applicable.
