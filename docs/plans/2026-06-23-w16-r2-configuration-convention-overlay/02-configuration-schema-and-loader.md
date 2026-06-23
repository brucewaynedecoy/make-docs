# Configuration Schema and Loader

## Scope

Define the implementation contract for optional `.make-docs/config.yaml` support without implementing it in this planning pass.

## Schema Requirements

- The config file is optional.
- Missing config uses shipped defaults.
- The top-level schema must separate display labels, persona entries, and generated prose defaults.
- Persona entries use `slug`, `label`, `description`, and `primitive`.
- `primitive` values remain `agent`, `maintainer`, and `user`.
- Unknown display-label keys are accepted only where the schema declares extensible display text.
- Attempts to rename canonical structure are invalid.

## Loader Requirements

- Load config after resolving the target project root and before rendering user-visible text.
- Route all file selection, metadata validation, manifest handling, package-copy behavior, and provider/cache behavior through canonical identifiers.
- Pass config to rendering functions as context, not as routing authority.
- Treat parse, schema, and invalid structural-rename errors as diagnostics with actionable file and key paths.

## Preservation Requirements

- Install and reconfigure preserve existing project-owned config unless a later plan defines an explicit user-approved replacement flow.
- Backup and audit classify config separately from make-docs-owned manifest, conflict, provider, and cache state.
- Provider refresh, package sync, and cache recovery must not overwrite local convention choices.

## Explicit Non-Scope

- No structural filename or directory changes.
- No renaming of frontmatter fields, `kind` values, route identifiers, lifecycle slugs, prompt paths, skill names, or contract names.
- No new public command shape for editing config until the CLI/MCP boundary design settles command ownership.
