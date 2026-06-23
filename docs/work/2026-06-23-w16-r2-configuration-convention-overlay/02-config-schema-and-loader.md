# Config Schema and Loader

## Objective

Implement optional `.make-docs/config.yaml` parsing, defaults, and diagnostics without changing canonical routing behavior.

## Tasks

- Define TypeScript types for the config schema.
- Provide shipped defaults for display labels, coordinate labels, and persona entries.
- Parse `.make-docs/config.yaml` when present.
- Reject invalid structural rename attempts with actionable diagnostics.
- Preserve absent-config behavior.
- Keep config separate from manifest schema and provider/cache state.
- Add tests for missing config, valid config, malformed YAML, unknown keys, invalid structural keys, invalid primitive values, and duplicate persona slugs.

## Acceptance Criteria

- Missing config produces current behavior.
- Valid config changes only rendered labels or persona data.
- Invalid config reports the file and key path.
- No routing, catalog, manifest, or metadata reader uses display labels as identifiers.
