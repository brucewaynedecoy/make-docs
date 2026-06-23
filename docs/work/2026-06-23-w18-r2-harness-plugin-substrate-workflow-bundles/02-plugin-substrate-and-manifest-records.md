# P2 Plugin Substrate and Manifest Records

## Goal

Implement plugin artifact modeling, shared payload storage, generated harness exposure, and structured ownership metadata.

## Tasks

- [ ] Add a plugin artifact kind or equivalent internal model distinct from skills and playbooks.
- [ ] Add plugin id, title, summary, status, source manifest, ref/version, digest, provenance, trust policy, supported harness, scope, and support-status fields.
- [ ] Resolve selected project-scope plugin payloads under `.make-docs/agentics/plugins/<plugin-id>/`.
- [ ] Resolve selected global-scope plugin payloads under the home-scoped `.make-docs/agentics/plugins/<plugin-id>/`.
- [ ] Generate Codex and Claude Code exposure files or adapters from canonical plugin payloads.
- [ ] Record canonical payload files and generated exposure files as separate ownership records.
- [ ] Add dry-run output that displays payload and exposure paths separately.
- [ ] Add fixtures for clean plugin payloads, generated exposures, modified payloads, modified exposures, and user-authored harness files.

## Acceptance Criteria

- Plugin payloads are not duplicated as authoritative copies in harness directories.
- Generated exposure mode defaults to `generated-stub` or an equivalent generated-adapter value.
- Manifest and dry-run output make canonical payloads, generated exposures, skills, and ordinary managed files distinguishable.
- Symlink behavior is not required for any passing test.

## Validation Notes

Cover both project and global scopes and both current harnesses: Codex and Claude Code.
