# Active PRD and Risk Reconciliation

## Purpose

Define the active PRD edits required for the v2 reader-facing docs asset model before implementation work begins.

## New PRD Change Doc

Create [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) because the design introduces new requirements across four axes:

- `docs/assets/library/**` and `docs/assets/playbooks/**` as the canonical reader-facing reusable documentation asset namespace after W9 R5.
- `docs/assets/archive/**` as managed archive storage after W9 R4, with future history/breadcrumb records under `docs/assets/archive/history/**` after W9 R5. Earlier W9 R3 wording that pointed future archive storage at top-level `docs/archive/**` is superseded.
- The persona primitive and configured persona schema.
- `persona` frontmatter as the machine-readable authority for persona-scoped guides and playbooks.

## Existing PRD Updates

Update these active docs:

- `00-index.md`: add PRD 22 to reading order, document map, source anchors, audience paths, and intended follow-on.
- `02-architecture-overview.md`: record the reader-facing asset namespace and persona frontmatter boundary.
- `03-open-questions-and-risk-register.md`: close or narrow `Q-009`, update `Q-014`, `R-011`, `R-012`, `R-013`, and extend path/parity risks to include guide/playbook/archive migration.
- `05-installation-profile-and-manifest-lifecycle.md`: note future manifest and validation implications for reader-facing assets without making directory placement authoritative.
- `06-template-contracts-and-generated-assets.md`: require template-first source for shipped guides/playbooks and preserve `docs/assets/**` as reader-facing, not tool-resource, storage.
- `09-dogfood-and-maintainer-operations.md`: add dogfood reseeding expectations for guides/playbooks and archive migration.
- `10-packaging-validation-and-release-reference.md`: add packed-template and smoke-pack validation for reader-facing asset migration.
- `14-add-lifecycle-workflow-foundation.md`: annotate the W16 `docs/library/playbooks/**` placement as migrated transitional evidence under the new canonical model.
- `19-revise-template-package-dogfood-source-of-truth-contract.md`: extend source-of-truth order to future reader-facing guide/playbook defaults.
- `21-revise-tool-directory-system-custom-resource-tiers.md`: cross-reference that `docs/assets/**` is now reserved for reader-facing assets while `.make-docs/**` remains the tool-resource namespace.

## Risk Register Updates

The reconciliation should update the following entries:

- `D-007`: add guide/playbook parity to dogfood freshness proof.
- `D-014`: extend the template-first rule to future reader-facing assets.
- `Q-005`: include reader-facing guide/playbook parity and archive migration in dogfood freshness proof.
- `Q-009`: close the persona schema decision by naming primitive values and configured persona fields.
- `Q-014`: keep the W16 resolution but add that `docs/library/playbooks/**` is migrated transitional evidence and future work uses `docs/assets/playbooks/**`.
- `R-003`: extend packed-template validation to guide/playbook/package-copy migration.
- `R-004`: add `docs/assets/library/**`, `docs/assets/playbooks/**`, `docs/assets/archive/**`, `docs/assets/archive/history/**`, and `docs/assets/artifacts/**` to duplicated path surfaces.
- `R-007`: add reader-facing asset parity to dogfood drift proof.
- `R-011`: narrow from undefined persona schema to implementation/configuration risk.
- `R-012`: cite the content-vs-invocation boundary from PRD 22.
- `R-013`: replace generic migration mappings with the concrete canonical target paths from PRD 22.

## Acceptance Criteria

- PRD 22 is discoverable from the PRD index and source anchors.
- Affected baseline PRDs point to PRD 22 for the reader-facing asset/persona requirements.
- The risk register describes what the design settles and what implementation/configuration work still owns.
- No active PRD implies that `docs/assets/**` is a catch-all for tool resources, runtime state, archive storage, or generated planning artifacts.
