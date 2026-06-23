# P4 Package Validation and Closeout

## Tasks

- [ ] Add package and smoke-pack validation for shared payloads and generated stubs.
- [ ] Prove bare default install writes no selected agentic artifacts.
- [ ] Prove selected project-scope and global-scope skills install correctly.
- [ ] Prove modified or custom harness skills are preserved or reviewed.
- [ ] Update closeout records, PRDs, and risk entries only with implementation evidence.

## Acceptance Criteria

- `npm run smoke:pack` or equivalent package validation exercises shared agentics when shipped behavior changes.
- Cross-platform assumptions are documented and do not require symlink privileges.
- R-001, R-002, R-006, and Q-012 have implementation evidence before closure.

## Validation Notes

Run targeted CLI tests plus package validation before closing W17 R2.
