# P2 Plugin Substrate and Manifest Records

## Goal

Implement plugin artifact modeling, shared payload storage, native harness exposure or plugin-specific adapters, and structured ownership metadata.

## Tasks

- [x] Add a plugin artifact kind or equivalent internal model distinct from skills and playbooks.
- [x] Add plugin id, title, summary, status, source manifest, ref/version, digest, provenance, trust policy, supported harness, scope, and support-status fields.
- [x] Resolve selected project-scope plugin payloads under `.make-docs/agentics/plugins/<plugin-id>/`.
- [x] Resolve selected global-scope plugin payloads under the home-scoped `.make-docs/agentics/plugins/<plugin-id>/`.
- [x] Expose Codex and Claude Code plugin payloads through W17 R3 native harness exposure, or through plugin-specific generated adapters where a harness requires an adapter.
- [x] Record canonical payload files, symlink exposures, managed copy mirrors, and generated adapters as separate ownership records.
- [x] Add dry-run output that displays payload and exposure paths separately.
- [x] Add fixtures for clean plugin payloads, symlink exposures, copy-mirror fallback, plugin-specific generated adapters, modified payloads, modified exposures, and user-authored harness files.

## Acceptance Criteria

- Plugin payloads are not duplicated as authoritative copies in harness directories.
- Exposure mode inherits W17 R3: symlink preferred, managed copy-mirror fallback, and generated adapters only where the plugin-specific harness contract requires them.
- Manifest and dry-run output make canonical payloads, native exposures, generated adapters, skills, and ordinary managed files distinguishable.
- Symlink creation is exercised where available, but managed copy-mirror fallback keeps tests correct when symlink creation is unavailable.

## Validation Notes

Cover both project and global scopes and both current harnesses: Codex and Claude Code.

Validation completed:

- `npm test -w packages/cli -- --run tests/plugin-substrate.test.ts --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`

Manual UAT was deferred during phase execution. The final wave-level coverage decision is recorded in [2026-06-29-w18-r2-wave-closeout-and-manual-test-coverage.md](../../assets/archive/history/2026-06-29-w18-r2-wave-closeout-and-manual-test-coverage.md).
