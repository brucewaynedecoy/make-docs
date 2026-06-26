# P4 Lifecycle Package Validation and Closeout

## Tasks

- [x] t1: Update audit, backup, uninstall, and migration behavior so selected skill provenance is reviewable.
- [x] t2: Add fixture coverage for default installs, first-party explicit installs, alternate file-manifest installs, rejected unpinned URL manifests, and remote-pinned manifests if implemented.
- [x] t3: Update package validation and smoke-pack expectations for the evolved registry schema.
- [x] t4: Confirm no-default-skills behavior with bare install and saved-selection sync coverage.
- [x] t5: Update closeout records, PRD/risk entries, and package docs with implementation evidence.

## Acceptance Criteria

- Bare installs produce no skill files.
- Audit, backup, uninstall, and migration do not silently expand selected skills.
- Package validation proves the evolved registry and schema ship together.
- Risk entries remain open or are updated only with concrete implementation evidence.

## Validation Notes

Run targeted CLI tests plus `npm run smoke:pack` when shipped package files change.

## Implementation Notes

- Audit reports now include a `skillSelectionReview` block with skill enablement, scope, resolved selected skills, saved skills manifest metadata, and selected-skill provenance.
- Backup, uninstall, and compatibility review output now renders the saved skills manifest, selected skills, and provenance so alternate-manifest installs are visible before lifecycle mutation.
- Lifecycle audit/removal now reloads saved local-manifest registries for selected skill assets instead of expanding against the built-in first-party registry.
- Remote-pinned manifest installation remains unimplemented; unpinned remote manifests and unpinned remote skill payloads continue to stop before mutation.
- Package docs now describe explicit selected-skill behavior instead of the older required/default `archive-docs` wording.

## Coverage Decisions

- Bare default and saved-selection no-skill behavior is covered by the full CLI suite, default validation, and smoke-pack install/reconfigure paths.
- Explicit first-party selected-skill behavior is covered by existing install, audit, backup, uninstall, and smoke-pack skills coverage.
- Alternate local-manifest lifecycle behavior is covered by a dedicated lifecycle fixture that installs from a local manifest, audits provenance, validates compatibility evidence, and proves backup/uninstall do not expand against the built-in registry.
- Rejected unpinned remote manifest and remote skill-payload policy coverage remains in the Phase 3 CLI tests.
- PRD 27 and risk-register entries were updated with implementation evidence; Q-001 and lifecycle-removability risks remain open where the broader remote/bundled delivery decision is still unresolved.
- UAT: completed after the full W17 R1 wave was complete. A hermetic local-manifest scenario installed only `acme-release`, preserved saved manifest provenance, surfaced that provenance in backup/uninstall review, and removed `acme-release` without expanding to `archive-docs`.

## Validation Evidence

- `npm test -w packages/cli -- lifecycle audit compatibility --reporter=dot`
- `npm test -w packages/cli -- wizard --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Manual UAT: local alternate skills manifest install, backup, and uninstall in an isolated temp project
