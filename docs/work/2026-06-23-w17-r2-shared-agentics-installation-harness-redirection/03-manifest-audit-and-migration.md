# P3 Manifest Audit and Migration

## Tasks

- [x] Add structured agentic ownership records or an interim `skillFiles` representation that still distinguishes shared payloads from stubs.
- [x] Update dry-run output to identify shared payloads, generated stubs, and migrated old duplicated payloads.
- [x] Update audit, backup, and uninstall classification for shared payloads, stubs, old duplicated payloads, modified files, home-scoped files, and custom user skills.
- [x] Add migration behavior for clean manifest-owned duplicated installs.
- [x] Preserve modified, custom, malformed, and ambiguous states for review, backup-and-reinstall, or manual review.

## Acceptance Criteria

- Migration never infers ownership solely from a matching skill-name path.
- Backup and uninstall use one reviewed audit snapshot.
- Project and global scope are both covered.

## Validation Notes

Implemented an interim `agenticRole` classification on planned actions and audit metadata so `skillFiles` can still distinguish shared payloads, generated harness stubs, and legacy duplicated payloads until a richer manifest schema lands.

Validation completed:

- `npm test -w packages/cli -- install -t "migrates clean manifest-owned duplicated" --reporter=verbose`
- `npm test -w packages/cli -- install -t "skills-only sync cleans up deselected skill files" --reporter=verbose`
- `npm test -w packages/cli -- install -t "skills-only removal removes tracked skills" --reporter=verbose`
- `npm test -w packages/cli -- cli -t "skills sync output uses skills-specific language" --reporter=verbose`
- `npm test -w packages/cli -- install audit backup uninstall lifecycle skills-ui cli --reporter=dot`
- `npm run build -w packages/cli`
