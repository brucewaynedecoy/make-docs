# Plugin Substrate and Manifest Records

## Objective

Define plugin artifact shape, canonical storage, native harness exposure or plugin-specific adapters, and manifest ownership records.

## Scope

- Add a plugin artifact kind distinct from skills, playbooks, lifecycle artifacts, and workflow bundles.
- Use `.make-docs/agentics/plugins/<plugin-id>/` as the canonical payload home for selected project-scope plugins.
- Use the user's home-scoped `.make-docs/agentics/plugins/<plugin-id>/` for selected global-scope plugins.
- Expose plugin payloads into Codex and Claude Code through W17 R3 native harness exposure, or through plugin-specific generated adapters where a harness requires an adapter, rather than duplicating authoritative payloads into harness directories.
- Record canonical payload paths, native exposure paths, adapter paths, link/copy mode, source manifest, source ref or version, digest, provenance, trust policy, support status, scope, and exposure mode in structured ownership records.

## Dependencies

- PRD 21 for `.make-docs/**` tool-directory tiers.
- PRD 24 for canonical-routing-first configuration.
- PRD 28 for shared selected-agentics payloads and native harness exposure.
- PRD 29 for the playbook content/execution boundary.

## Acceptance Criteria

- Plugin payloads, native exposure paths, copy mirrors, symlink records, and generated adapters can be audited separately.
- Manifest state can distinguish plugin payloads, plugin exposure files, skill payloads, symlink exposures, copy mirrors, legacy generated stubs, ordinary managed files, and user-authored harness files.
- Exposure mode inherits W17 R3: symlink preferred, managed copy mirror fallback, and generated adapters only where the plugin-specific harness contract requires them.
- Symlinks are preferred but are not required for correctness because copy mirrors are the managed fallback.

## Validation Notes

Implementation should add fixtures for project/global selected plugins, symlinked Codex/Claude Code exposures, copy-mirror fallback, plugin-specific generated adapters, missing ownership records, modified copy mirrors or adapters, modified canonical payloads, and user-authored harness files with matching names.
