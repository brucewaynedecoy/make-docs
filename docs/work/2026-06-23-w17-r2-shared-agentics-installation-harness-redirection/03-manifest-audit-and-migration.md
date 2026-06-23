# P3 Manifest Audit and Migration

## Tasks

- [ ] Add structured agentic ownership records or an interim `skillFiles` representation that still distinguishes shared payloads from stubs.
- [ ] Update dry-run output to identify shared payloads, generated stubs, and migrated old duplicated payloads.
- [ ] Update audit, backup, and uninstall classification for shared payloads, stubs, old duplicated payloads, modified files, home-scoped files, and custom user skills.
- [ ] Add migration behavior for clean manifest-owned duplicated installs.
- [ ] Preserve modified, custom, malformed, and ambiguous states for review, backup-and-reinstall, or manual review.

## Acceptance Criteria

- Migration never infers ownership solely from a matching skill-name path.
- Backup and uninstall use one reviewed audit snapshot.
- Project and global scope are both covered.

## Validation Notes

Use compatibility fixtures from PRD 18 and extend them for shared agentics state.
