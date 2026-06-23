# Plugin Substrate and Manifest Records

## Objective

Define plugin artifact shape, canonical storage, generated harness exposure, and manifest ownership records.

## Scope

- Add a plugin artifact kind distinct from skills, playbooks, lifecycle artifacts, and workflow bundles.
- Use `.make-docs/agentics/plugins/<plugin-id>/` as the canonical payload home for selected project-scope plugins.
- Use the user's home-scoped `.make-docs/agentics/plugins/<plugin-id>/` for selected global-scope plugins.
- Generate harness exposure files for Codex and Claude Code from canonical plugin payloads rather than duplicating authoritative payloads into harness directories.
- Record canonical payload paths, generated exposure paths, source manifest, source ref or version, digest, provenance, trust policy, support status, scope, and exposure mode in structured ownership records.

## Dependencies

- PRD 21 for `.make-docs/**` tool-directory tiers.
- PRD 24 for canonical-routing-first configuration.
- PRD 28 for shared selected-agentics payloads and generated exposure.
- PRD 29 for the playbook content/execution boundary.

## Acceptance Criteria

- Plugin payloads and generated exposure files can be audited separately.
- Manifest state can distinguish plugin payloads, plugin exposure files, skill payloads, skill stubs, ordinary managed files, and user-authored harness files.
- Exposure mode defaults to `generated-stub` or an equivalent generated-adapter value.
- Symlinks are not required for correctness.

## Validation Notes

Implementation should add fixtures for project/global selected plugins, generated Codex/Claude Code exposures, missing ownership records, modified generated exposures, modified canonical payloads, and user-authored harness files with matching names.
