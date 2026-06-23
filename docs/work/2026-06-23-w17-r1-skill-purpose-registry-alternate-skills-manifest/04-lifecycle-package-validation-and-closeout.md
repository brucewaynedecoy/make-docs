# P4 Lifecycle Package Validation and Closeout

## Tasks

- [ ] Update audit, backup, uninstall, and migration behavior so selected skill provenance is reviewable.
- [ ] Add fixture coverage for default installs, first-party explicit installs, alternate file-manifest installs, rejected unpinned URL manifests, and remote-pinned manifests if implemented.
- [ ] Update package validation and smoke-pack expectations for the evolved registry schema.
- [ ] Confirm no-default-skills behavior with bare install and saved-selection sync coverage.
- [ ] Update closeout records, PRD/risk entries, and package docs with implementation evidence.

## Acceptance Criteria

- Bare installs produce no skill files.
- Audit, backup, uninstall, and migration do not silently expand selected skills.
- Package validation proves the evolved registry and schema ship together.
- Risk entries remain open or are updated only with concrete implementation evidence.

## Validation Notes

Run targeted CLI tests plus `npm run smoke:pack` when shipped package files change.
