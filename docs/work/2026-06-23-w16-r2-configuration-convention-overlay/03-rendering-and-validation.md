# Rendering and Validation

## Objective

Apply configuration only at user-visible rendering points and validate generated docs against canonical metadata contracts.

## Tasks

- Thread config into CLI summary rendering without altering action planning.
- Thread config into wizard and skills UI labels after canonical selections resolve.
- Add generator fixtures proving configured labels appear in prose while frontmatter fields remain canonical.
- Add validator coverage for YAML/body drift caused by configured labels.
- Add persona validation for default personas, custom personas, unknown frontmatter slugs, duplicate slugs, invalid primitives, and path/frontmatter drift.
- Add tests proving route identifiers, prompt paths, skill names, contract names, and harness names stay canonical.

## Acceptance Criteria

- Rendering changes are visible in prose and CLI output only.
- Generated docs keep canonical YAML metadata.
- Validators catch config-driven conflicts without treating configured labels as schema names.
- Persona frontmatter uses slugs, not display labels.
